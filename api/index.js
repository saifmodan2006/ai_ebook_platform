// api/index.ts
import express from "express";
import dotenv from "dotenv";

// src/server/apiRouter.ts
import { Router } from "express";
import { GoogleGenAI, Type } from "@google/genai";
import fs from "node:fs";
import path from "node:path";

// src/server/quotaService.ts
var QuotaBackendError = class extends Error {
  constructor(message, type) {
    super(message);
    this.name = "QuotaBackendError";
    this.type = type;
  }
};
var BURST_LIMIT = 6;
var BURST_WINDOW_MS = 15 * 1e3;
var HOURLY_LIMIT = 30;
var HOURLY_WINDOW_MS = 60 * 60 * 1e3;
var DAILY_LIMIT = 100;
var DAILY_WINDOW_MS = 24 * 60 * 60 * 1e3;
function getRedisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (url && token) {
    return { url: url.replace(/\/$/, ""), token };
  }
  return null;
}
var REDIS_LUA_SCRIPT = `
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
var AsyncUserMutex = class {
  constructor() {
    this.locks = /* @__PURE__ */ new Map();
  }
  async runExclusive(key, fn) {
    const prevLock = this.locks.get(key) || Promise.resolve();
    let release;
    const nextLock = new Promise((resolve) => {
      release = resolve;
    });
    this.locks.set(key, prevLock.then(() => nextLock));
    try {
      await prevLock;
      return await fn();
    } finally {
      release();
      if (this.locks.get(key) === nextLock) {
        this.locks.delete(key);
      }
    }
  }
};
var userMutex = new AsyncUserMutex();
var inMemoryQuotas = /* @__PURE__ */ new Map();
async function checkRedisQuota(uid, config, timeoutMs = 3500) {
  const now = Date.now();
  const burstWindowId = Math.floor(now / BURST_WINDOW_MS);
  const hourWindowId = Math.floor(now / HOURLY_WINDOW_MS);
  const dayWindowId = Math.floor(now / DAILY_WINDOW_MS);
  const burstKey = `pagecraft:q:${uid}:b:${burstWindowId}`;
  const hourlyKey = `pagecraft:q:${uid}:h:${hourWindowId}`;
  const dailyKey = `pagecraft:q:${uid}:d:${dayWindowId}`;
  const payload = [
    "EVAL",
    REDIS_LUA_SCRIPT,
    3,
    burstKey,
    hourlyKey,
    dailyKey,
    BURST_LIMIT.toString(),
    HOURLY_LIMIT.toString(),
    DAILY_LIMIT.toString(),
    Math.ceil(BURST_WINDOW_MS / 1e3 * 2).toString(),
    Math.ceil(HOURLY_WINDOW_MS / 1e3 * 2).toString(),
    Math.ceil(DAILY_WINDOW_MS / 1e3 * 2).toString()
  ];
  let res;
  try {
    res = await fetch(config.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch (fetchErr) {
    if (fetchErr?.name === "TimeoutError" || fetchErr?.name === "AbortError" || /timeout|timed out/i.test(fetchErr?.message || "")) {
      throw new QuotaBackendError(
        `Redis connection timed out after ${timeoutMs}ms: ${fetchErr?.message || "Timeout"}`,
        "REDIS_TIMEOUT"
      );
    }
    throw new QuotaBackendError(
      `Redis network connection failed: ${fetchErr?.message || "Unreachable"}`,
      "REDIS_UNAVAILABLE"
    );
  }
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new QuotaBackendError(
        `Redis credentials rejected (HTTP ${res.status}): Invalid or unauthorized API token`,
        "REDIS_AUTH_ERROR"
      );
    }
    throw new QuotaBackendError(
      `Redis server returned HTTP error: ${res.status} ${res.statusText}`,
      "REDIS_UNAVAILABLE"
    );
  }
  let json;
  try {
    json = await res.json();
  } catch (parseErr) {
    throw new QuotaBackendError(
      `Invalid JSON received from Redis service: ${parseErr?.message}`,
      "REDIS_UNAVAILABLE"
    );
  }
  const resultData = json?.result;
  if (!Array.isArray(resultData)) {
    throw new QuotaBackendError(
      `Unexpected Redis response structure: ${JSON.stringify(json)}`,
      "REDIS_UNAVAILABLE"
    );
  }
  const [allowedFlag, statusReason, _bCount, hCount, _dCount] = resultData;
  const isAllowed = allowedFlag === 1;
  const currentHourCount = Number(hCount) || 0;
  const remainingHourly = Math.max(0, HOURLY_LIMIT - currentHourCount);
  const resetHourlySec = Math.ceil(((hourWindowId + 1) * HOURLY_WINDOW_MS - now) / 1e3);
  if (isAllowed) {
    return {
      allowed: true,
      remainingHourly,
      resetHourlySec,
      backend: "redis"
    };
  }
  if (statusReason === "burst") {
    const retryAfterSec = Math.max(
      1,
      Math.ceil(((burstWindowId + 1) * BURST_WINDOW_MS - now) / 1e3)
    );
    return {
      allowed: false,
      reason: `Too many rapid requests. Please pause for ${retryAfterSec} seconds.`,
      retryAfterSec,
      remainingHourly,
      resetHourlySec,
      backend: "redis",
      errorCode: "RATE_LIMITED"
    };
  }
  if (statusReason === "hourly") {
    const retryAfterSec = resetHourlySec;
    const mins = Math.ceil(retryAfterSec / 60);
    return {
      allowed: false,
      reason: `Hourly AI generation quota reached (${HOURLY_LIMIT} requests/hour). Quota resets in ${mins} minute(s).`,
      retryAfterSec,
      remainingHourly: 0,
      resetHourlySec,
      backend: "redis",
      errorCode: "QUOTA_EXCEEDED"
    };
  }
  const resetDailySec = Math.ceil(((dayWindowId + 1) * DAILY_WINDOW_MS - now) / 1e3);
  const hours = Math.ceil(resetDailySec / 3600);
  return {
    allowed: false,
    reason: `Daily fair-use AI quota reached (${DAILY_LIMIT} requests/day). Resets in ${hours} hour(s).`,
    retryAfterSec: resetDailySec,
    remainingHourly: 0,
    resetHourlySec,
    backend: "redis",
    errorCode: "QUOTA_EXCEEDED"
  };
}
function checkMemoryQuotaTransactional(uid) {
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
      lastRequestTimestamp: now
    };
  }
  if (now - record.burstWindowStart > BURST_WINDOW_MS) {
    record.burstCount = 0;
    record.burstWindowStart = now;
  }
  if (now - record.hourWindowStart > HOURLY_WINDOW_MS) {
    record.hourlyCount = 0;
    record.hourWindowStart = now;
  }
  if (now - record.dayWindowStart > DAILY_WINDOW_MS) {
    record.dailyCount = 0;
    record.dayWindowStart = now;
  }
  if (record.burstCount >= BURST_LIMIT) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((record.burstWindowStart + BURST_WINDOW_MS - now) / 1e3)
    );
    return {
      allowed: false,
      reason: `Too many rapid requests. Please pause for ${retryAfterSec} seconds.`,
      retryAfterSec,
      remainingHourly: Math.max(0, HOURLY_LIMIT - record.hourlyCount),
      resetHourlySec: Math.ceil((record.hourWindowStart + HOURLY_WINDOW_MS - now) / 1e3),
      backend: "memory_transactional",
      errorCode: "RATE_LIMITED"
    };
  }
  if (record.hourlyCount >= HOURLY_LIMIT) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((record.hourWindowStart + HOURLY_WINDOW_MS - now) / 1e3)
    );
    const mins = Math.ceil(retryAfterSec / 60);
    return {
      allowed: false,
      reason: `Hourly AI generation quota reached (${HOURLY_LIMIT} requests/hour). Quota resets in ${mins} minute(s).`,
      retryAfterSec,
      remainingHourly: 0,
      resetHourlySec: retryAfterSec,
      backend: "memory_transactional",
      errorCode: "QUOTA_EXCEEDED"
    };
  }
  if (record.dailyCount >= DAILY_LIMIT) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((record.dayWindowStart + DAILY_WINDOW_MS - now) / 1e3)
    );
    const hours = Math.ceil(retryAfterSec / 3600);
    return {
      allowed: false,
      reason: `Daily fair-use AI quota reached (${DAILY_LIMIT} requests/day). Resets in ${hours} hour(s).`,
      retryAfterSec,
      remainingHourly: 0,
      resetHourlySec: retryAfterSec,
      backend: "memory_transactional",
      errorCode: "QUOTA_EXCEEDED"
    };
  }
  record.burstCount += 1;
  record.hourlyCount += 1;
  record.dailyCount += 1;
  record.totalLifetimeGenerations += 1;
  record.lastRequestTimestamp = now;
  inMemoryQuotas.set(uid, record);
  return {
    allowed: true,
    remainingHourly: Math.max(0, HOURLY_LIMIT - record.hourlyCount),
    resetHourlySec: Math.ceil((record.hourWindowStart + HOURLY_WINDOW_MS - now) / 1e3),
    backend: "memory_transactional"
  };
}
async function checkAndConsumeUserQuota(uid) {
  const redisConfig = getRedisConfig();
  const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
  const isFallbackAllowed = process.env.ALLOW_INDEPENDENT_FALLBACK === "true";
  if (redisConfig) {
    try {
      return await checkRedisQuota(uid, redisConfig);
    } catch (err) {
      const errorCode = err instanceof QuotaBackendError ? err.type : "REDIS_UNAVAILABLE";
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
        backend: "unavailable",
        errorCode,
        errorDetails: err?.message || String(err)
      };
    }
  }
  if (isProduction && !isFallbackAllowed) {
    return {
      allowed: false,
      serviceUnavailable: true,
      reason: "Production distributed quota service is not configured (missing Redis credentials). Gemini generation endpoints are paused to safeguard account quotas.",
      retryAfterSec: 60,
      remainingHourly: 0,
      resetHourlySec: 60,
      backend: "unavailable",
      errorCode: "REDIS_UNAVAILABLE"
    };
  }
  return await userMutex.runExclusive(uid, () => checkMemoryQuotaTransactional(uid));
}
function getQuotaBackendInfo() {
  const redisConfig = getRedisConfig();
  return {
    backend: redisConfig ? "upstash_redis" : "memory_transactional",
    redisConfigured: Boolean(redisConfig),
    environment: process.env.NODE_ENV || "development"
  };
}

// src/server/apiRouter.ts
var router = Router();
function getFirebaseProjectId() {
  if (process.env.FIREBASE_PROJECT_ID) return process.env.FIREBASE_PROJECT_ID;
  if (process.env.VITE_FIREBASE_PROJECT_ID) return process.env.VITE_FIREBASE_PROJECT_ID;
  try {
    const configPath = path.resolve(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const parsed = JSON.parse(fs.readFileSync(configPath, "utf8"));
      if (parsed.projectId) return parsed.projectId;
    }
  } catch {
  }
  return "idyllic-striker-463908-b5";
}
var FIREBASE_PROJECT_ID = getFirebaseProjectId();
var adminAuthInstance = null;
async function getAdminAuth() {
  if (!adminAuthInstance) {
    try {
      const { getApps, initializeApp } = await import("firebase-admin/app");
      const { getAuth } = await import("firebase-admin/auth");
      const adminApp = getApps().length === 0 ? initializeApp({ projectId: FIREBASE_PROJECT_ID }) : getApps()[0];
      adminAuthInstance = getAuth(adminApp);
    } catch (err) {
      console.warn("[Firebase Admin] Dynamic import warning:", err?.message || err);
      return null;
    }
  }
  return adminAuthInstance;
}
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  return new GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
router.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
router.get(["/", "/health"], (_req, res) => {
  return res.json({
    status: "ok",
    service: "pagecraft-editorial-api",
    projectId: FIREBASE_PROJECT_ID,
    version: "2.2.0",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
    quotaBackend: getQuotaBackendInfo()
  });
});
async function requireAuthToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Authentication required. Missing Bearer authorization token."
    });
  }
  const token = authHeader.split("Bearer ")[1]?.trim();
  if (!token) {
    return res.status(401).json({
      error: "Authentication token is empty."
    });
  }
  if (process.env.NODE_ENV === "test" && token === "test-admin-token") {
    req.user = {
      uid: "test-user-id",
      email: "test@pagecraft.studio",
      emailVerified: true,
      name: "Test Author"
    };
    return next();
  }
  try {
    const auth = await getAdminAuth();
    if (auth) {
      try {
        const decodedToken = await auth.verifyIdToken(token);
        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          emailVerified: decodedToken.email_verified,
          name: decodedToken.name
        };
        return next();
      } catch (err) {
        console.warn("[requireAuthToken] Admin SDK verification rejection:", err?.message || err);
      }
    }
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
      const now = Math.floor(Date.now() / 1e3);
      if (payload.exp && payload.exp < now) {
        return res.status(401).json({
          success: false,
          error: "Authentication failed: Firebase ID token has expired.",
          code: "auth/id-token-expired"
        });
      }
      if (payload.sub || payload.user_id) {
        req.user = {
          uid: payload.sub || payload.user_id,
          email: payload.email,
          emailVerified: payload.email_verified,
          name: payload.name
        };
        return next();
      }
    }
    return res.status(401).json({
      success: false,
      error: "Authentication failed: Invalid or malformed Firebase ID token.",
      code: "auth/invalid-token"
    });
  } catch (err) {
    console.error("Cryptographic token verification failed:", err?.code, err?.message);
    return res.status(401).json({
      success: false,
      error: `Authentication failed: ${err?.message || "Invalid or expired Firebase ID token."}`,
      code: err?.code || "auth/invalid-token"
    });
  }
}
var ai = {
  get models() {
    return getGeminiClient().models;
  }
};
async function userQuotaLimiter(req, res, next) {
  const uid = req.user?.uid || req.ip || "anonymous";
  try {
    const result = await checkAndConsumeUserQuota(uid);
    res.setHeader("X-RateLimit-Limit", "30");
    res.setHeader("X-RateLimit-Remaining", result.remainingHourly.toString());
    res.setHeader("X-RateLimit-Reset", result.resetHourlySec.toString());
    res.setHeader("X-RateLimit-Backend", result.backend);
    if (result.serviceUnavailable) {
      if (result.retryAfterSec) {
        res.setHeader("Retry-After", result.retryAfterSec.toString());
      }
      return res.status(503).json({
        error: result.reason || "Distributed quota service is currently unavailable. Paid AI generation is paused to safeguard quotas.",
        code: result.errorCode || "QUOTA_SERVICE_UNAVAILABLE",
        retryAfterSec: result.retryAfterSec || 30
      });
    }
    if (!result.allowed) {
      if (result.retryAfterSec) {
        res.setHeader("Retry-After", result.retryAfterSec.toString());
      }
      return res.status(429).json({
        error: result.reason || "AI request rate limit exceeded. Please wait before retrying.",
        code: result.errorCode || "QUOTA_EXCEEDED",
        retryAfterSec: result.retryAfterSec
      });
    }
    next();
  } catch (err) {
    console.error("[userQuotaLimiter] Rate limiter unexpected error:", err?.message || err);
    return res.status(503).json({
      error: "Quota verification encountered an unexpected error. Generation paused to safeguard quotas.",
      code: "QUOTA_SERVICE_ERROR",
      retryAfterSec: 30
    });
  }
}
function requireApiKey(_req, res, next) {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({
      error: "GEMINI_API_KEY is not configured on the server. Please verify environment secrets."
    });
  }
  next();
}
router.use(requireAuthToken);
router.use(userQuotaLimiter);
router.use(requireApiKey);
router.post("/gemini/generate-outline", async (req, res) => {
  try {
    const {
      topic,
      description = "",
      purpose = "business_guide",
      targetAudience = "Professional decision makers",
      language = "English",
      tone = "Authoritative & Actionable",
      chapterCount = 4,
      targetWordCount = 800,
      complexity = "intermediate",
      sourceNotes = ""
    } = req.body;
    if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
      return res.status(400).json({ error: "Book topic or working title is required." });
    }
    const clampedChapters = Math.max(3, Math.min(12, Number(chapterCount) || 4));
    const systemPrompt = `You are an elite editorial publishing architect and non-fiction book packager.
Your task is to produce a structured, high-conversion book outline.
Requirements:
1. Provide 3 distinct title and subtitle proposals with a 1-sentence strategic rationale for each.
2. Formulate exactly ${clampedChapters} logical, progressive chapters.
3. For each chapter:
   - chapterNumber (1-indexed)
   - title (evocative, professional, non-generic)
   - pillBadge (1 or 2 words describing chapter stage, e.g. "Foundation", "Framework", "Execution", "Governance", "Scale")
   - objective (1-2 sentence core transformation for this chapter)
   - keySubtopics (array of 2-3 specific subheading themes)
   - estimatedWords (around ${targetWordCount})
4. All outputs must be in the specified language (${language}) and match the requested tone (${tone}).
5. Never hallucinate fake credentials. Ground all outlines in realistic, actionable domain frameworks.`;
    const userPrompt = `Generate a comprehensive book outline for:
Topic: ${topic}
Description / Notes: ${description}
Format/Purpose: ${purpose}
Target Audience / ICP: ${targetAudience}
Language: ${language}
Tone of Voice: ${tone}
Complexity Level: ${complexity}
Chapters: ${clampedChapters}
Target Words per Chapter: ${targetWordCount}
${sourceNotes ? `User Research & Notes: ${sourceNotes}` : ""}`;
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedTitles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  subtitle: { type: Type.STRING },
                  rationale: { type: Type.STRING }
                },
                required: ["title", "subtitle", "rationale"]
              }
            },
            selectedTitle: { type: Type.STRING },
            selectedSubtitle: { type: Type.STRING },
            targetAudience: { type: Type.STRING },
            chapters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  chapterNumber: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  pillBadge: { type: Type.STRING },
                  objective: { type: Type.STRING },
                  keySubtopics: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  estimatedWords: { type: Type.INTEGER }
                },
                required: ["chapterNumber", "title", "pillBadge", "objective", "keySubtopics", "estimatedWords"]
              }
            }
          },
          required: ["suggestedTitles", "selectedTitle", "selectedSubtitle", "targetAudience", "chapters"]
        }
      }
    });
    const parsed = JSON.parse(response.text || "{}");
    return res.json({ success: true, data: parsed });
  } catch (error) {
    console.error("Error generating outline via Gemini:", error);
    return res.status(500).json({
      error: error?.message || "Failed to generate book outline via Gemini API."
    });
  }
});
router.post("/gemini/generate-chapter", async (req, res) => {
  try {
    const {
      bookTitle,
      bookSubtitle,
      author,
      targetAudience,
      tone = "Authoritative & Actionable",
      language = "English",
      chapterNumber,
      chapterTitle,
      pillBadge = "Strategy",
      objective = "",
      keySubtopics = [],
      previousChaptersSummary = "",
      sourceNotes = ""
    } = req.body;
    if (!bookTitle || !chapterTitle || !chapterNumber) {
      return res.status(400).json({
        error: "Missing required chapter parameters: bookTitle, chapterTitle, and chapterNumber are required."
      });
    }
    const systemPrompt = `You are a master non-fiction writer and editor.
Write an in-depth, authoritative chapter for the book "${bookTitle}: ${bookSubtitle}".
Audience: ${targetAudience}
Tone: ${tone}
Language: ${language}

Strict Quality Invariants:
1. Provide a concise, high-impact summaryBox (2-3 sentences executive memorandum).
2. Write 2-3 substantive subheadings with detailed, nuanced paragraphs. No shallow fluff or repetitive filler. Each subheading must contain 2-4 comprehensive paragraphs.
3. Provide one authentic, memorable pull quote relevant to the topic with attribution. Do not fabricate quotes attributed to real historical people falsely; attribute to an industry leader or thematic role.
4. Provide 3-4 highly specific, actionable bullet points with practical implementation steps.
5. Ensure seamless narrative continuity with any previous chapters.`;
    const userPrompt = `Write Chapter ${chapterNumber}: "${chapterTitle}" (${pillBadge}).
Chapter Objective: ${objective || "Provide deep tactical and conceptual guidance on this topic."}
Subtopics to Cover: ${Array.isArray(keySubtopics) && keySubtopics.length > 0 ? keySubtopics.join(", ") : "Core principles, implementation tactics, and governance."}
${previousChaptersSummary ? `Context from Earlier Chapters: ${previousChaptersSummary}` : ""}
${sourceNotes ? `Author's Research Notes: ${sourceNotes}` : ""}`;
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            chapterNumber: { type: Type.INTEGER },
            title: { type: Type.STRING },
            pillBadge: { type: Type.STRING },
            summaryBox: { type: Type.STRING },
            subheadings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  content: { type: Type.STRING }
                },
                required: ["title", "content"]
              }
            },
            quote: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                attribution: { type: Type.STRING }
              },
              required: ["text", "attribution"]
            },
            bulletPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["chapterNumber", "title", "pillBadge", "summaryBox", "subheadings", "quote", "bulletPoints"]
        }
      }
    });
    const parsed = JSON.parse(response.text || "{}");
    return res.json({ success: true, data: parsed });
  } catch (error) {
    console.error("Error generating chapter via Gemini:", error);
    return res.status(500).json({
      error: error?.message || "Failed to generate chapter content via Gemini API."
    });
  }
});
router.post("/gemini/assist-section", async (req, res) => {
  try {
    const {
      action,
      text,
      context = "",
      language = "English"
    } = req.body;
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ error: "Text content is required for section assistant." });
    }
    const actionPrompts = {
      expand: `Expand the following text with concrete architectural details, deep rationale, and nuanced trade-off analysis while preserving the original voice. Language: ${language}.`,
      simplify: `Simplify and streamline the following text. Remove bureaucratic jargon, tighten sentence structure, and ensure maximum clarity. Language: ${language}.`,
      executive: `Rewrite the following text into a sharp, decisive executive summary memorandum with high authority and zero fluff. Language: ${language}.`,
      examples: `Add 2 realistic, high-impact real-world scenario examples or case studies to substantiate the following text. Language: ${language}.`,
      factcheck: `Review the following text for unsupported claims, vague generalizations, or statistical assertions. Highlight areas requiring verification and provide refined, defensible wording. Language: ${language}.`,
      generate_quote: `Generate an authoritative, memorable pull quote and attribution inspired by the core insight of the following text. Language: ${language}.`
    };
    const instruction = actionPrompts[action] || `Improve the following text for clarity, authority, and engagement. Language: ${language}.`;
    const userPrompt = `Instruction: ${instruction}
Context: ${context || "Non-fiction business and technical manuscript."}

Original Text:
"""
${text}
"""`;
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: userPrompt,
      config: {
        systemInstruction: "You are a senior publishing editor. Return your response in clean markdown or prose directly addressing the requested editorial action. Do not add conversational pleasantries."
      }
    });
    const result = response.text?.trim() || "";
    return res.json({ success: true, data: { result } });
  } catch (error) {
    console.error("Error in AI section assistant:", error);
    return res.status(500).json({
      error: error?.message || "Failed to process section assistant request."
    });
  }
});
router.post("/gemini/generate-ebook", async (req, res) => {
  try {
    const {
      topic,
      targetRole,
      industry,
      tone = "Authoritative & Actionable"
    } = req.body;
    if (!topic || typeof topic !== "string") {
      return res.status(400).json({ error: "Topic is required." });
    }
    const systemPrompt = `You are a world-class non-fiction author and publishing editor.
Generate a structured 4-chapter eBook based on the prompt. Adhere strictly to the JSON schema.`;
    const userPrompt = `Create a complete 4-chapter eBook on:
Topic: ${topic}
Target Role: ${targetRole || "Senior Decision Makers"}
Industry: ${industry || "Modern Business"}
Tone of Voice: ${tone}`;
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subtitle: { type: Type.STRING },
            author: { type: Type.STRING },
            category: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            readTimeMinutes: { type: Type.INTEGER },
            persona: {
              type: Type.OBJECT,
              properties: {
                targetRole: { type: Type.STRING },
                industry: { type: Type.STRING },
                mainPainPoint: { type: Type.STRING },
                coreTransformation: { type: Type.STRING },
                idealAudienceDescription: { type: Type.STRING }
              },
              required: ["targetRole", "industry", "mainPainPoint", "coreTransformation", "idealAudienceDescription"]
            },
            chapters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  chapterNumber: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  pillBadge: { type: Type.STRING },
                  summaryBox: { type: Type.STRING },
                  subheadings: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        content: { type: Type.STRING }
                      },
                      required: ["title", "content"]
                    }
                  },
                  quote: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      attribution: { type: Type.STRING }
                    },
                    required: ["text", "attribution"]
                  },
                  bulletPoints: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["chapterNumber", "title", "pillBadge", "summaryBox", "subheadings", "quote", "bulletPoints"]
              }
            }
          },
          required: ["title", "subtitle", "author", "category", "tags", "readTimeMinutes", "persona", "chapters"]
        }
      }
    });
    const parsed = JSON.parse(response.text || "{}");
    return res.json({ success: true, data: parsed });
  } catch (error) {
    console.error("Error generating eBook via Gemini:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Failed to generate eBook via Gemini API"
    });
  }
});
router.use((err, _req, res, _next) => {
  console.error("[API Router Unhandled Error]:", err);
  return res.status(500).json({
    success: false,
    error: err?.message || "Internal server error occurred.",
    service: "pagecraft-editorial-api"
  });
});
var apiRouter_default = router;

// api/index.ts
dotenv.config();
var app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/api", apiRouter_default);
app.use(apiRouter_default);
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: "API endpoint not found",
    service: "pagecraft-editorial-api"
  });
});
app.use((err, _req, res, _next) => {
  console.error("[Vercel Serverless Function Error]:", err);
  res.status(500).json({
    success: false,
    error: err?.message || "Internal server error occurred.",
    service: "pagecraft-editorial-api"
  });
});
var index_default = app;
export {
  index_default as default
};
