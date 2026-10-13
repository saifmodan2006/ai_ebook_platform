import { Router, Request, Response, NextFunction } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { checkAndConsumeUserQuota, getQuotaBackendInfo } from './quotaService';

const router = Router();

// Initialize Firebase Admin SDK for cryptographic token verification
const adminApp =
  getApps().length === 0
    ? initializeApp({ projectId: firebaseConfig.projectId })
    : getApps()[0];

const adminAuth = getAuth(adminApp);

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Extend Express Request with verified user
export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    emailVerified?: boolean;
    name?: string;
  };
}

// CORS Middleware
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health & Deployment Verification Endpoint
router.get('/health', (_req: Request, res: Response) => {
  return res.json({
    status: 'ok',
    service: 'pagecraft-editorial-api',
    projectId: firebaseConfig.projectId,
    version: '2.1.0',
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    quotaBackend: getQuotaBackendInfo(),
  });
});

// Cryptographic Firebase Token Verification Middleware
async function requireAuthToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required. Missing Bearer authorization token.',
    });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    return res.status(401).json({
      error: 'Authentication token is empty.',
    });
  }

  // Development and unit testing bypass header only in test mode
  if (process.env.NODE_ENV === 'test' && token === 'test-admin-token') {
    req.user = {
      uid: 'test-user-id',
      email: 'test@pagecraft.studio',
      emailVerified: true,
      name: 'Test Author',
    };
    return next();
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      name: decodedToken.name,
    };
    next();
  } catch (err: any) {
    console.error('Cryptographic token verification failed:', err?.code, err?.message);
    return res.status(401).json({
      error: `Authentication failed: ${err?.message || 'Invalid or expired Firebase ID token.'}`,
      code: err?.code || 'auth/invalid-token',
    });
  }
}

// Shared Per-User Quota and Rate Limiting Middleware
async function userQuotaLimiter(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const uid = req.user?.uid || req.ip || 'anonymous';
  try {
    const result = await checkAndConsumeUserQuota(uid);

    // Set standard rate limit headers
    res.setHeader('X-RateLimit-Limit', '30');
    res.setHeader('X-RateLimit-Remaining', result.remainingHourly.toString());
    res.setHeader('X-RateLimit-Reset', result.resetHourlySec.toString());
    res.setHeader('X-RateLimit-Backend', result.backend);

    // When Redis/quota service is unavailable in production or encounters errors:
    if (result.serviceUnavailable) {
      if (result.retryAfterSec) {
        res.setHeader('Retry-After', result.retryAfterSec.toString());
      }
      return res.status(503).json({
        error:
          result.reason ||
          'Distributed quota service is currently unavailable. Paid AI generation is paused to safeguard quotas.',
        code: result.errorCode || 'QUOTA_SERVICE_UNAVAILABLE',
        retryAfterSec: result.retryAfterSec || 30,
      });
    }

    if (!result.allowed) {
      if (result.retryAfterSec) {
        res.setHeader('Retry-After', result.retryAfterSec.toString());
      }
      return res.status(429).json({
        error: result.reason || 'AI request rate limit exceeded. Please wait before retrying.',
        code: result.errorCode || 'QUOTA_EXCEEDED',
        retryAfterSec: result.retryAfterSec,
      });
    }

    next();
  } catch (err: any) {
    console.error('[userQuotaLimiter] Rate limiter unexpected error:', err?.message || err);
    return res.status(503).json({
      error:
        'Quota verification encountered an unexpected error. Generation paused to safeguard quotas.',
      code: 'QUOTA_SERVICE_ERROR',
      retryAfterSec: 30,
    });
  }
}

// Ensure Gemini API key is configured
function requireApiKey(_req: Request, res: Response, next: NextFunction) {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({
      error:
        'GEMINI_API_KEY is not configured on the server. Please verify environment secrets.',
    });
  }
  next();
}

// Apply Middlewares to all AI routes
router.use(requireAuthToken);
router.use(userQuotaLimiter);
router.use(requireApiKey);

// ---------------------------------------------------------------------------
// 1. Generate Outline (Title options + Table of Contents)
// ---------------------------------------------------------------------------
router.post('/gemini/generate-outline', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      topic,
      description = '',
      purpose = 'business_guide',
      targetAudience = 'Professional decision makers',
      language = 'English',
      tone = 'Authoritative & Actionable',
      chapterCount = 4,
      targetWordCount = 800,
      complexity = 'intermediate',
      sourceNotes = '',
    } = req.body;

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return res.status(400).json({ error: 'Book topic or working title is required.' });
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
${sourceNotes ? `User Research & Notes: ${sourceNotes}` : ''}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
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
                  rationale: { type: Type.STRING },
                },
                required: ['title', 'subtitle', 'rationale'],
              },
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
                    items: { type: Type.STRING },
                  },
                  estimatedWords: { type: Type.INTEGER },
                },
                required: ['chapterNumber', 'title', 'pillBadge', 'objective', 'keySubtopics', 'estimatedWords'],
              },
            },
          },
          required: ['suggestedTitles', 'selectedTitle', 'selectedSubtitle', 'targetAudience', 'chapters'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error generating outline via Gemini:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate book outline via Gemini API.',
    });
  }
});

// ---------------------------------------------------------------------------
// 2. Generate Single Chapter Content
// ---------------------------------------------------------------------------
router.post('/gemini/generate-chapter', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      bookTitle,
      bookSubtitle,
      author,
      targetAudience,
      tone = 'Authoritative & Actionable',
      language = 'English',
      chapterNumber,
      chapterTitle,
      pillBadge = 'Strategy',
      objective = '',
      keySubtopics = [],
      previousChaptersSummary = '',
      sourceNotes = '',
    } = req.body;

    if (!bookTitle || !chapterTitle || !chapterNumber) {
      return res.status(400).json({
        error: 'Missing required chapter parameters: bookTitle, chapterTitle, and chapterNumber are required.',
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
Chapter Objective: ${objective || 'Provide deep tactical and conceptual guidance on this topic.'}
Subtopics to Cover: ${Array.isArray(keySubtopics) && keySubtopics.length > 0 ? keySubtopics.join(', ') : 'Core principles, implementation tactics, and governance.'}
${previousChaptersSummary ? `Context from Earlier Chapters: ${previousChaptersSummary}` : ''}
${sourceNotes ? `Author's Research Notes: ${sourceNotes}` : ''}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
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
                  content: { type: Type.STRING },
                },
                required: ['title', 'content'],
              },
            },
            quote: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                attribution: { type: Type.STRING },
              },
              required: ['text', 'attribution'],
            },
            bulletPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['chapterNumber', 'title', 'pillBadge', 'summaryBox', 'subheadings', 'quote', 'bulletPoints'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error generating chapter via Gemini:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate chapter content via Gemini API.',
    });
  }
});

// ---------------------------------------------------------------------------
// 3. AI Section Writing Assistant (Rewrite, Expand, Simplify, Checkpoint)
// ---------------------------------------------------------------------------
router.post('/gemini/assist-section', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      action,
      text,
      context = '',
      language = 'English',
    } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text content is required for section assistant.' });
    }

    const actionPrompts: Record<string, string> = {
      expand: `Expand the following text with concrete architectural details, deep rationale, and nuanced trade-off analysis while preserving the original voice. Language: ${language}.`,
      simplify: `Simplify and streamline the following text. Remove bureaucratic jargon, tighten sentence structure, and ensure maximum clarity. Language: ${language}.`,
      executive: `Rewrite the following text into a sharp, decisive executive summary memorandum with high authority and zero fluff. Language: ${language}.`,
      examples: `Add 2 realistic, high-impact real-world scenario examples or case studies to substantiate the following text. Language: ${language}.`,
      factcheck: `Review the following text for unsupported claims, vague generalizations, or statistical assertions. Highlight areas requiring verification and provide refined, defensible wording. Language: ${language}.`,
      generate_quote: `Generate an authoritative, memorable pull quote and attribution inspired by the core insight of the following text. Language: ${language}.`,
    };

    const instruction =
      actionPrompts[action] ||
      `Improve the following text for clarity, authority, and engagement. Language: ${language}.`;

    const userPrompt = `Instruction: ${instruction}
Context: ${context || 'Non-fiction business and technical manuscript.'}

Original Text:
"""
${text}
"""`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction:
          'You are a senior publishing editor. Return your response in clean markdown or prose directly addressing the requested editorial action. Do not add conversational pleasantries.',
      },
    });

    const result = response.text?.trim() || '';
    return res.json({ success: true, data: { result } });
  } catch (error: any) {
    console.error('Error in AI section assistant:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to process section assistant request.',
    });
  }
});

// ---------------------------------------------------------------------------
// 4. Full Book Generation (Backwards compatibility)
// ---------------------------------------------------------------------------
router.post('/gemini/generate-ebook', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      topic,
      targetRole,
      industry,
      tone = 'Authoritative & Actionable',
    } = req.body;

    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ error: 'Topic is required.' });
    }

    const systemPrompt = `You are a world-class non-fiction author and publishing editor.
Generate a structured 4-chapter eBook based on the prompt. Adhere strictly to the JSON schema.`;

    const userPrompt = `Create a complete 4-chapter eBook on:
Topic: ${topic}
Target Role: ${targetRole || 'Senior Decision Makers'}
Industry: ${industry || 'Modern Business'}
Tone of Voice: ${tone}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subtitle: { type: Type.STRING },
            author: { type: Type.STRING },
            category: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            readTimeMinutes: { type: Type.INTEGER },
            persona: {
              type: Type.OBJECT,
              properties: {
                targetRole: { type: Type.STRING },
                industry: { type: Type.STRING },
                mainPainPoint: { type: Type.STRING },
                coreTransformation: { type: Type.STRING },
                idealAudienceDescription: { type: Type.STRING },
              },
              required: ['targetRole', 'industry', 'mainPainPoint', 'coreTransformation', 'idealAudienceDescription'],
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
                        content: { type: Type.STRING },
                      },
                      required: ['title', 'content'],
                    },
                  },
                  quote: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      attribution: { type: Type.STRING },
                    },
                    required: ['text', 'attribution'],
                  },
                  bulletPoints: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['chapterNumber', 'title', 'pillBadge', 'summaryBox', 'subheadings', 'quote', 'bulletPoints'],
              },
            },
          },
          required: ['title', 'subtitle', 'author', 'category', 'tags', 'readTimeMinutes', 'persona', 'chapters'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error generating eBook via Gemini:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate eBook via Gemini API',
    });
  }
});

export default router;
