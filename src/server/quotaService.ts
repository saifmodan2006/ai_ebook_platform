/**
 * Production-Grade Distributed Quota & Rate Limiting Service
 *
 * Designed for serverless deployments (Vercel, Cloud Functions) and containerized servers.
 * Supports:
 *  1. External Redis with atomic Lua script evaluation (Upstash REST / Vercel KV REST)
 *     for zero-cold-start, distributed atomic rate limiting across independent lambdas.
 *  2. Concurrency-safe in-memory transactional engine with per-user Async Mutex locks
 *     for local development, CI test suites, and high-performance single-node instances.
 *  3. Fail-safe degradation & strict quota protection:
 *     When Redis is unavailable, times out, or has invalid credentials in production,
 *     paid Gemini generation endpoints must NOT silently bypass distributed usage quotas.
 *     Instead, a controlled 503 response is returned unless an independently enforced,
 *     sufficiently restrictive fallback is explicitly configured.
 *  4. Zero-friction local development: When running locally without Redis credentials,
 *     the system automatically uses the in-memory transactional engine.
 */

export interface UserQuotaRecord {
  uid: string;
  burstCount: number;
  burstWindowStart: number;
  hourlyCount: number;
  hourWindowStart: number;
  dailyCount: number;
  dayWindowStart: number;
  totalLifetimeGenerations: number;
  lastRequestTimestamp: number;
}

export type QuotaErrorCode =
  | 'REDIS_UNAVAILABLE'
  | 'REDIS_TIMEOUT'
  | 'REDIS_AUTH_ERROR'
  | 'QUOTA_EXCEEDED'
  | 'RATE_LIMITED';

export interface QuotaCheckResult {
  allowed: boolean;
  serviceUnavailable?: boolean;
  reason?: string;
  retryAfterSec?: number;
  remainingHourly: number;
  resetHourlySec: number;
  backend: 'redis' | 'memory_transactional' | 'unavailable';
  errorCode?: QuotaErrorCode;
  errorDetails?: string;
}

export class QuotaBackendError extends Error {
  public readonly type: 'REDIS_UNAVAILABLE' | 'REDIS_TIMEOUT' | 'REDIS_AUTH_ERROR';

  constructor(
    message: string,
    type: 'REDIS_UNAVAILABLE' | 'REDIS_TIMEOUT' | 'REDIS_AUTH_ERROR'
  ) {
    super(message);
    this.name = 'QuotaBackendError';
    this.type = type;
  }
}

// Limits & Windows
export const BURST_LIMIT = 6; // Max 6 requests per 15 seconds
export const BURST_WINDOW_MS = 15 * 1000;

export const HOURLY_LIMIT = 30; // Max 30 requests per hour
export const HOURLY_WINDOW_MS = 60 * 60 * 1000;

export const DAILY_LIMIT = 100; // Max 100 requests per day
export const DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;

// Upstash / Vercel KV Redis REST configuration
export function getRedisConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (url && token) {
    return { url: url.replace(/\/$/, ''), token };
  }
  return null;
}

// Atomic Lua Script for Redis
// Executes atomic check-and-increment across all three windows (burst, hourly, daily)
export const REDIS_LUA_SCRIPT = `
local bKey = KEYS[1]
local hKey = KEYS[2]
local dKey = KEYS[3]

local bLimit = tonumber(ARGV[1])
local hLimit = tonumber(ARGV[2])
local dLimit = tonumber(ARGV[3])
local bTtl = tonumber(ARGV[4])
local hTtl = tonumber(ARGV[5])
local dTtl = tonumber(ARGV[6])

local bCount = tonumber(redis.call('GET', bKey) or '0')
local hCount = tonumber(redis.call('GET', hKey) or '0')
local dCount = tonumber(redis.call('GET', dKey) or '0')

if bCount >= bLimit then
  return {0, 'burst', bCount, hCount, dCount}
end
if hCount >= hLimit then
  return {0, 'hourly', bCount, hCount, dCount}
end
if dCount >= dLimit then
  return {0, 'daily', bCount, hCount, dCount}
end

local newB = redis.call('INCR', bKey)
if newB == 1 then redis.call('EXPIRE', bKey, bTtl) end

local newH = redis.call('INCR', hKey)
if newH == 1 then redis.call('EXPIRE', hKey, hTtl) end

local newD = redis.call('INCR', dKey)
if newD == 1 then redis.call('EXPIRE', dKey, dTtl) end

return {1, 'ok', newB, newH, newD}
`;

// ---------------------------------------------------------------------------
// In-Memory Transactional Engine with Per-User Async Mutex
// ---------------------------------------------------------------------------

class AsyncUserMutex {
  private locks = new Map<string, Promise<void>>();

  async runExclusive<T>(key: string, fn: () => Promise<T> | T): Promise<T> {
    const prevLock = this.locks.get(key) || Promise.resolve();
    let release: () => void;
    const nextLock = new Promise<void>((resolve) => {
      release = resolve;
    });

    this.locks.set(key, prevLock.then(() => nextLock));

    try {
      await prevLock;
      return await fn();
    } finally {
      release!();
      if (this.locks.get(key) === nextLock) {
        this.locks.delete(key);
      }
    }
  }
}

const userMutex = new AsyncUserMutex();
const inMemoryQuotas = new Map<string, UserQuotaRecord>();

/**
 * Executes quota check against external Upstash / Vercel KV Redis REST API.
 */
export async function checkRedisQuota(
  uid: string,
  config: { url: string; token: string },
  timeoutMs = 3500
): Promise<QuotaCheckResult> {
  const now = Date.now();
  const burstWindowId = Math.floor(now / BURST_WINDOW_MS);
  const hourWindowId = Math.floor(now / HOURLY_WINDOW_MS);
  const dayWindowId = Math.floor(now / DAILY_WINDOW_MS);

  const burstKey = `pagecraft:q:${uid}:b:${burstWindowId}`;
  const hourlyKey = `pagecraft:q:${uid}:h:${hourWindowId}`;
  const dailyKey = `pagecraft:q:${uid}:d:${dayWindowId}`;

  const payload = [
    'EVAL',
    REDIS_LUA_SCRIPT,
    3,
    burstKey,
    hourlyKey,
    dailyKey,
    BURST_LIMIT.toString(),
    HOURLY_LIMIT.toString(),
    DAILY_LIMIT.toString(),
    Math.ceil((BURST_WINDOW_MS / 1000) * 2).toString(),
    Math.ceil((HOURLY_WINDOW_MS / 1000) * 2).toString(),
    Math.ceil((DAILY_WINDOW_MS / 1000) * 2).toString(),
  ];

  let res: Response;
  try {
    res = await fetch(config.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (fetchErr: any) {
    if (
      fetchErr?.name === 'TimeoutError' ||
      fetchErr?.name === 'AbortError' ||
      /timeout|timed out/i.test(fetchErr?.message || '')
    ) {
      throw new QuotaBackendError(
        `Redis connection timed out after ${timeoutMs}ms: ${fetchErr?.message || 'Timeout'}`,
        'REDIS_TIMEOUT'
      );
    }
    throw new QuotaBackendError(
      `Redis network connection failed: ${fetchErr?.message || 'Unreachable'}`,
      'REDIS_UNAVAILABLE'
    );
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new QuotaBackendError(
        `Redis credentials rejected (HTTP ${res.status}): Invalid or unauthorized API token`,
        'REDIS_AUTH_ERROR'
      );
    }
    throw new QuotaBackendError(
      `Redis server returned HTTP error: ${res.status} ${res.statusText}`,
      'REDIS_UNAVAILABLE'
    );
  }

  let json: any;
  try {
    json = await res.json();
  } catch (parseErr: any) {
    throw new QuotaBackendError(
      `Invalid JSON received from Redis service: ${parseErr?.message}`,
      'REDIS_UNAVAILABLE'
    );
  }

  const resultData = json?.result;
  if (!Array.isArray(resultData)) {
    throw new QuotaBackendError(
      `Unexpected Redis response structure: ${JSON.stringify(json)}`,
      'REDIS_UNAVAILABLE'
    );
  }

  const [allowedFlag, statusReason, _bCount, hCount, _dCount] = resultData;
  const isAllowed = allowedFlag === 1;

  const currentHourCount = Number(hCount) || 0;
  const remainingHourly = Math.max(0, HOURLY_LIMIT - currentHourCount);
  const resetHourlySec = Math.ceil(((hourWindowId + 1) * HOURLY_WINDOW_MS - now) / 1000);

  if (isAllowed) {
    return {
      allowed: true,
      remainingHourly,
      resetHourlySec,
      backend: 'redis',
    };
  }

  if (statusReason === 'burst') {
    const retryAfterSec = Math.max(
      1,
      Math.ceil(((burstWindowId + 1) * BURST_WINDOW_MS - now) / 1000)
    );
    return {
      allowed: false,
      reason: `Too many rapid requests. Please pause for ${retryAfterSec} seconds.`,
      retryAfterSec,
      remainingHourly,
      resetHourlySec,
      backend: 'redis',
      errorCode: 'RATE_LIMITED',
    };
  }

  if (statusReason === 'hourly') {
    const retryAfterSec = resetHourlySec;
    const mins = Math.ceil(retryAfterSec / 60);
    return {
      allowed: false,
      reason: `Hourly AI generation quota reached (${HOURLY_LIMIT} requests/hour). Quota resets in ${mins} minute(s).`,
      retryAfterSec,
      remainingHourly: 0,
      resetHourlySec,
      backend: 'redis',
      errorCode: 'QUOTA_EXCEEDED',
    };
  }

  // Daily limit
  const resetDailySec = Math.ceil(((dayWindowId + 1) * DAILY_WINDOW_MS - now) / 1000);
  const hours = Math.ceil(resetDailySec / 3600);
  return {
    allowed: false,
    reason: `Daily fair-use AI quota reached (${DAILY_LIMIT} requests/day). Resets in ${hours} hour(s).`,
    retryAfterSec: resetDailySec,
    remainingHourly: 0,
    resetHourlySec,
    backend: 'redis',
    errorCode: 'QUOTA_EXCEEDED',
  };
}

/**
 * Concurrency-safe in-memory transactional quota check with per-user mutex.
 */
export function checkMemoryQuotaTransactional(uid: string): QuotaCheckResult {
  const now = Date.now();
  let record = inMemoryQuotas.get(uid);

  if (!record) {
    record = {
      uid,
      burstCount: 0,
      burstWindowStart: now,
      hourlyCount: 0,
      hourWindowStart: now,
      dailyCount: 0,
      dayWindowStart: now,
      totalLifetimeGenerations: 0,
      lastRequestTimestamp: now,
    };
  }

  // Reset burst window if expired
  if (now - record.burstWindowStart > BURST_WINDOW_MS) {
    record.burstCount = 0;
    record.burstWindowStart = now;
  }

  // Reset hourly window if expired
  if (now - record.hourWindowStart > HOURLY_WINDOW_MS) {
    record.hourlyCount = 0;
    record.hourWindowStart = now;
  }

  // Reset daily window if expired
  if (now - record.dayWindowStart > DAILY_WINDOW_MS) {
    record.dailyCount = 0;
    record.dayWindowStart = now;
  }

  // 1. Check Burst Limit
  if (record.burstCount >= BURST_LIMIT) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((record.burstWindowStart + BURST_WINDOW_MS - now) / 1000)
    );
    return {
      allowed: false,
      reason: `Too many rapid requests. Please pause for ${retryAfterSec} seconds.`,
      retryAfterSec,
      remainingHourly: Math.max(0, HOURLY_LIMIT - record.hourlyCount),
      resetHourlySec: Math.ceil((record.hourWindowStart + HOURLY_WINDOW_MS - now) / 1000),
      backend: 'memory_transactional',
      errorCode: 'RATE_LIMITED',
    };
  }

  // 2. Check Hourly Limit
  if (record.hourlyCount >= HOURLY_LIMIT) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((record.hourWindowStart + HOURLY_WINDOW_MS - now) / 1000)
    );
    const mins = Math.ceil(retryAfterSec / 60);
    return {
      allowed: false,
      reason: `Hourly AI generation quota reached (${HOURLY_LIMIT} requests/hour). Quota resets in ${mins} minute(s).`,
      retryAfterSec,
      remainingHourly: 0,
      resetHourlySec: retryAfterSec,
      backend: 'memory_transactional',
      errorCode: 'QUOTA_EXCEEDED',
    };
  }

  // 3. Check Daily Limit
  if (record.dailyCount >= DAILY_LIMIT) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((record.dayWindowStart + DAILY_WINDOW_MS - now) / 1000)
    );
    const hours = Math.ceil(retryAfterSec / 3600);
    return {
      allowed: false,
      reason: `Daily fair-use AI quota reached (${DAILY_LIMIT} requests/day). Resets in ${hours} hour(s).`,
      retryAfterSec,
      remainingHourly: 0,
      resetHourlySec: retryAfterSec,
      backend: 'memory_transactional',
      errorCode: 'QUOTA_EXCEEDED',
    };
  }

  // Consume token atomically inside mutex
  record.burstCount += 1;
  record.hourlyCount += 1;
  record.dailyCount += 1;
  record.totalLifetimeGenerations += 1;
  record.lastRequestTimestamp = now;

  inMemoryQuotas.set(uid, record);

  return {
    allowed: true,
    remainingHourly: Math.max(0, HOURLY_LIMIT - record.hourlyCount),
    resetHourlySec: Math.ceil((record.hourWindowStart + HOURLY_WINDOW_MS - now) / 1000),
    backend: 'memory_transactional',
  };
}

/**
 * Main quota entrypoint.
 * Automatically selects Redis when configured.
 *
 * Strict protection behavior:
 * - When Redis is unavailable, timed out, or has invalid credentials:
 *   Does NOT silently bypass distributed quotas. Returns a controlled 503 response
 *   unless an independently enforced, restrictive fallback is explicitly configured
 *   via ALLOW_INDEPENDENT_FALLBACK="true".
 * - In local development (without Redis credentials configured):
 *   Seamlessly operates using the in-memory transactional mutex engine.
 */
export async function checkAndConsumeUserQuota(uid: string): Promise<QuotaCheckResult> {
  const redisConfig = getRedisConfig();
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL === '1' ||
    Boolean(process.env.VERCEL_ENV);
  const isFallbackAllowed = process.env.ALLOW_INDEPENDENT_FALLBACK === 'true';

  if (redisConfig) {
    try {
      return await checkRedisQuota(uid, redisConfig);
    } catch (err: any) {
      const errorCode = err instanceof QuotaBackendError ? err.type : 'REDIS_UNAVAILABLE';
      console.warn(
        `[QuotaService] External Redis quota check failed (${errorCode}: ${err?.message || err}). Fallback allowed: ${isFallbackAllowed}`
      );

      if (isFallbackAllowed) {
        return await userMutex.runExclusive(uid, () => checkMemoryQuotaTransactional(uid));
      }

      return {
        allowed: false,
        serviceUnavailable: true,
        reason: `Distributed quota service is currently unavailable (${errorCode}). AI generation endpoints are paused to protect account quotas. Please retry shortly.`,
        retryAfterSec: 30,
        remainingHourly: 0,
        resetHourlySec: 60,
        backend: 'unavailable',
        errorCode,
        errorDetails: err?.message || String(err),
      };
    }
  }

  // If in production without Redis configured and no fallback allowed:
  if (isProduction && !isFallbackAllowed) {
    return {
      allowed: false,
      serviceUnavailable: true,
      reason:
        'Production distributed quota service is not configured (missing Redis credentials). Gemini generation endpoints are paused to safeguard account quotas.',
      retryAfterSec: 60,
      remainingHourly: 0,
      resetHourlySec: 60,
      backend: 'unavailable',
      errorCode: 'REDIS_UNAVAILABLE',
    };
  }

  // Local development, automated test runner, or instances with independent fallback:
  return await userMutex.runExclusive(uid, () => checkMemoryQuotaTransactional(uid));
}

/**
 * Diagnostic info for health check endpoint.
 */
export function getQuotaBackendInfo(): {
  backend: 'upstash_redis' | 'memory_transactional';
  redisConfigured: boolean;
  environment: string;
} {
  const redisConfig = getRedisConfig();
  return {
    backend: redisConfig ? 'upstash_redis' : 'memory_transactional',
    redisConfigured: Boolean(redisConfig),
    environment: process.env.NODE_ENV || 'development',
  };
}

/**
 * Resets quota counters for automated testing.
 */
export async function resetUserQuotaForTesting(uid: string): Promise<void> {
  await userMutex.runExclusive(uid, () => {
    inMemoryQuotas.delete(uid);
  });
}
