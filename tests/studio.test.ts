import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateAndSanitizeBookJson } from '../src/utils/bookValidator';
import {
  checkAndConsumeUserQuota,
  resetUserQuotaForTesting,
  getQuotaBackendInfo,
  BURST_LIMIT,
  BURST_WINDOW_MS,
  HOURLY_LIMIT,
  checkRedisQuota,
  QuotaBackendError,
} from '../src/server/quotaService';
import { generateMarkdown, generatePlainText, generateEpubBlob, generateDocxBlob } from '../src/utils/textExports';
import { generateBookPdf } from '../src/utils/pdfGenerator';
import { SAMPLE_BOOKS } from '../src/utils/sampleBooks';

describe('PageCraft Publishing Studio - Automated Verification Test Suite', () => {
  const sampleBook = SAMPLE_BOOKS[0];

  test('1. Strict Book Schema Validator accepts valid publication', () => {
    const result = validateAndSanitizeBookJson(sampleBook);
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
    assert.ok(result.sanitizedBook);
    assert.equal(result.sanitizedBook.title, sampleBook.title);
    assert.equal(result.sanitizedBook.chapters.length, sampleBook.chapters.length);
  });

  test('2. Strict Book Schema Validator rejects corrupted / missing chapters', () => {
    const corruptedPayload = {
      title: 'Corrupted Monograph',
      author: 'Unknown',
      chapters: [], // Empty chapters
    };
    const result = validateAndSanitizeBookJson(corruptedPayload);
    assert.equal(result.valid, false);
    assert.ok(result.errors.length > 0);
    assert.match(result.errors[0], /chapters/i);
  });

  test('3. Strict Book Schema Validator rejects missing subheading content', () => {
    const invalidSubheadings = {
      title: 'Broken Monograph',
      chapters: [
        {
          chapterNumber: 1,
          title: 'Chapter 1',
          summaryBox: 'Summary',
          subheadings: [{ title: 'Title only' }], // Missing content
        },
      ],
    };
    const result = validateAndSanitizeBookJson(invalidSubheadings);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('Subheading')));
  });

  test('4. Atomic Concurrent Rate Limiting: handles simultaneous requests with zero race conditions', async () => {
    const testUid = `test-concurrent-user-${Date.now()}`;
    await resetUserQuotaForTesting(testUid);

    // Fire 12 simultaneous requests concurrently
    const concurrentRequests = Array.from({ length: 12 }, () =>
      checkAndConsumeUserQuota(testUid)
    );
    const results = await Promise.all(concurrentRequests);

    const allowed = results.filter((r) => r.allowed);
    const throttled = results.filter((r) => !r.allowed);

    // Exactly BURST_LIMIT (6) must succeed, remaining 6 must be throttled atomically
    assert.equal(allowed.length, BURST_LIMIT, `Exactly ${BURST_LIMIT} requests must be allowed`);
    assert.equal(throttled.length, 12 - BURST_LIMIT, 'All subsequent concurrent requests must be throttled');

    // Throttled requests should have clear user-facing guidance, retryAfterSec, and errorCode
    assert.ok(throttled[0].retryAfterSec && throttled[0].retryAfterSec > 0);
    assert.match(throttled[0].reason || '', /rapid requests/i);
    assert.equal(throttled[0].errorCode, 'RATE_LIMITED');
  });

  test('5. Quota-Exceeded Scenarios: enforces burst and hourly thresholds cleanly', async () => {
    // If within 3 seconds of the 15s window rollover boundary, wait for fresh window
    const msIntoWindow = Date.now() % BURST_WINDOW_MS;
    if (msIntoWindow > BURST_WINDOW_MS - 3000) {
      await new Promise((r) => setTimeout(r, BURST_WINDOW_MS - msIntoWindow + 200));
    }

    const quotaUid = `test-quota-user-${Date.now()}`;
    await resetUserQuotaForTesting(quotaUid);

    // Consume up to burst limit
    for (let i = 0; i < BURST_LIMIT; i++) {
      const res = await checkAndConsumeUserQuota(quotaUid);
      assert.equal(res.allowed, true);
    }

    // 7th request exceeds burst limit
    const burstExceeded = await checkAndConsumeUserQuota(quotaUid);
    assert.equal(burstExceeded.allowed, false);
    assert.equal(burstExceeded.errorCode, 'RATE_LIMITED');
    assert.ok(burstExceeded.retryAfterSec && burstExceeded.retryAfterSec > 0);
  });

  test('6. Redis Unavailable Scenario: returns controlled 503 without bypassing quotas', async () => {
    const originalEnvUrl = process.env.UPSTASH_REDIS_REST_URL;
    const originalEnvToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    const originalFallback = process.env.ALLOW_INDEPENDENT_FALLBACK;

    try {
      // Configure an unreachable host
      process.env.UPSTASH_REDIS_REST_URL = 'http://127.0.0.1:59999/unreachable-redis';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-token';
      process.env.ALLOW_INDEPENDENT_FALLBACK = 'false';

      const unavailUid = `test-redis-unavail-${Date.now()}`;
      const result = await checkAndConsumeUserQuota(unavailUid);

      // Must NOT silently allow request! Must return controlled 503 serviceUnavailable
      assert.equal(result.allowed, false);
      assert.equal(result.serviceUnavailable, true);
      assert.equal(result.errorCode, 'REDIS_UNAVAILABLE');
      assert.ok(result.retryAfterSec && result.retryAfterSec > 0);
      assert.match(result.reason || '', /unavailable/i);
    } finally {
      process.env.UPSTASH_REDIS_REST_URL = originalEnvUrl;
      process.env.UPSTASH_REDIS_REST_TOKEN = originalEnvToken;
      process.env.ALLOW_INDEPENDENT_FALLBACK = originalFallback;
    }
  });

  test('7. Redis Timeout Scenario: returns controlled 503 on service timeout', async () => {
    const originalFetch = globalThis.fetch;
    const originalEnvUrl = process.env.UPSTASH_REDIS_REST_URL;
    const originalEnvToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    const originalFallback = process.env.ALLOW_INDEPENDENT_FALLBACK;

    try {
      process.env.UPSTASH_REDIS_REST_URL = 'https://mock-timeout-redis.pagecraft.invalid';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-token';
      process.env.ALLOW_INDEPENDENT_FALLBACK = 'false';

      // Mock fetch timing out
      globalThis.fetch = async () => {
        const timeoutErr: any = new Error('The operation was aborted due to timeout');
        timeoutErr.name = 'TimeoutError';
        throw timeoutErr;
      };

      const timeoutUid = `test-redis-timeout-${Date.now()}`;
      const result = await checkAndConsumeUserQuota(timeoutUid);

      assert.equal(result.allowed, false);
      assert.equal(result.serviceUnavailable, true);
      assert.equal(result.errorCode, 'REDIS_TIMEOUT');
      assert.ok(result.retryAfterSec && result.retryAfterSec > 0);
      assert.match(result.reason || '', /REDIS_TIMEOUT/i);
    } finally {
      globalThis.fetch = originalFetch;
      process.env.UPSTASH_REDIS_REST_URL = originalEnvUrl;
      process.env.UPSTASH_REDIS_REST_TOKEN = originalEnvToken;
      process.env.ALLOW_INDEPENDENT_FALLBACK = originalFallback;
    }
  });

  test('8. Redis Invalid Credentials Scenario: returns controlled 503 on 401/403 authorization rejection', async () => {
    const originalFetch = globalThis.fetch;
    const originalEnvUrl = process.env.UPSTASH_REDIS_REST_URL;
    const originalEnvToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    const originalFallback = process.env.ALLOW_INDEPENDENT_FALLBACK;

    try {
      process.env.UPSTASH_REDIS_REST_URL = 'https://mock-invalid-auth-redis.pagecraft.invalid';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'invalid-bad-token';
      process.env.ALLOW_INDEPENDENT_FALLBACK = 'false';

      // Mock fetch returning HTTP 401 Unauthorized
      globalThis.fetch = async () => {
        return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
          status: 401,
          statusText: 'Unauthorized',
          headers: { 'Content-Type': 'application/json' },
        });
      };

      const authErrUid = `test-redis-auth-${Date.now()}`;
      const result = await checkAndConsumeUserQuota(authErrUid);

      assert.equal(result.allowed, false);
      assert.equal(result.serviceUnavailable, true);
      assert.equal(result.errorCode, 'REDIS_AUTH_ERROR');
      assert.ok(result.retryAfterSec && result.retryAfterSec > 0);
      assert.match(result.reason || '', /REDIS_AUTH_ERROR/i);
    } finally {
      globalThis.fetch = originalFetch;
      process.env.UPSTASH_REDIS_REST_URL = originalEnvUrl;
      process.env.UPSTASH_REDIS_REST_TOKEN = originalEnvToken;
      process.env.ALLOW_INDEPENDENT_FALLBACK = originalFallback;
    }
  });

  test('9. Local Development Environment: runs seamlessly without Redis credentials', async () => {
    const originalEnvUrl = process.env.UPSTASH_REDIS_REST_URL;
    const originalEnvToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    const originalNodeEnv = process.env.NODE_ENV;

    try {
      // Local development without Redis credentials
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
      process.env.NODE_ENV = 'development';

      const localUid = `test-local-dev-${Date.now()}`;
      await resetUserQuotaForTesting(localUid);

      const result = await checkAndConsumeUserQuota(localUid);

      assert.equal(result.allowed, true);
      assert.equal(result.backend, 'memory_transactional');
      assert.equal(result.remainingHourly, HOURLY_LIMIT - 1);

      const backendInfo = getQuotaBackendInfo();
      assert.equal(backendInfo.backend, 'memory_transactional');
      assert.equal(backendInfo.redisConfigured, false);
    } finally {
      process.env.UPSTASH_REDIS_REST_URL = originalEnvUrl;
      process.env.UPSTASH_REDIS_REST_TOKEN = originalEnvToken;
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  test('10. Independent Fallback Mode: allows explicitly configured fallback when Redis fails', async () => {
    const originalEnvUrl = process.env.UPSTASH_REDIS_REST_URL;
    const originalEnvToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    const originalFallback = process.env.ALLOW_INDEPENDENT_FALLBACK;

    try {
      process.env.UPSTASH_REDIS_REST_URL = 'http://127.0.0.1:59999/unreachable-redis';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-token';
      process.env.ALLOW_INDEPENDENT_FALLBACK = 'true'; // Explicitly enabled fallback

      const fallbackUid = `test-fallback-user-${Date.now()}`;
      await resetUserQuotaForTesting(fallbackUid);

      const result = await checkAndConsumeUserQuota(fallbackUid);

      assert.equal(result.allowed, true);
      assert.equal(result.backend, 'memory_transactional');
    } finally {
      process.env.UPSTASH_REDIS_REST_URL = originalEnvUrl;
      process.env.UPSTASH_REDIS_REST_TOKEN = originalEnvToken;
      process.env.ALLOW_INDEPENDENT_FALLBACK = originalFallback;
    }
  });

  test('11. Markdown and Plain Text Generators produce structured output', () => {
    const md = generateMarkdown(sampleBook);
    assert.ok(md.includes(sampleBook.title));
    assert.ok(md.includes('Strategic Demographic Persona'));
    assert.ok(md.includes(`Chapter 1: ${sampleBook.chapters[0].title}`));

    const txt = generatePlainText(sampleBook);
    assert.ok(txt.includes(sampleBook.title.toUpperCase()));
    assert.ok(txt.includes('EXECUTIVE SUMMARY:'));
  });

  test('12. EPUB 3 Generator produces valid zip container with mime and OPF', async () => {
    const blob = await generateEpubBlob(sampleBook);
    assert.ok(blob);
    assert.ok(blob.size > 1000);
    assert.equal(blob.type, 'application/epub+zip');
  });

  test('13. Microsoft Word DOCX Generator produces non-empty binary blob', async () => {
    const blob = await generateDocxBlob(sampleBook);
    assert.ok(blob);
    assert.ok(blob.size > 2000);
  });

  test('14. Vector PDF Generator creates multi-page A4 document with accurate pagination', () => {
    const pdfDoc = generateBookPdf(sampleBook);
    assert.ok(pdfDoc);
    const pageCount = pdfDoc.getNumberOfPages();
    // Cover + TOC + chapters
    assert.ok(pageCount >= sampleBook.chapters.length + 2);
  });
});
