import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Generate eBook Endpoint
app.post('/api/gemini/generate-ebook', async (req, res) => {
  try {
    const { topic, targetRole, industry, tone = 'Authoritative & Actionable', themeId = 'indigo' } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({
        error: 'GEMINI_API_KEY is not configured. Please use offline template generator or configure key.',
      });
    }

    const systemPrompt = `You are a world-class non-fiction author, ghostwriter, and publishing editor specializing in high-converting, authoritative business eBooks, engineering guides, and lead magnets.
Generate a structured 4-chapter eBook based on the user's prompt. The response MUST be valid JSON adhering strictly to the schema provided.
Ensure the book has:
1. An irresistible title and insightful subtitle.
2. An authoritative author name.
3. A focused demographic persona (target role, industry, pain point, transformation, ideal audience description).
4. Exactly 4 deeply practical chapters. Each chapter must have:
   - chapterNumber (1, 2, 3, 4)
   - title
   - pillBadge (a 1-word or 2-word badge like "Foundation", "Strategy", "Execution", "Mastery")
   - summaryBox (2-3 sentence executive summary)
   - 2 subheadings with rich, deep, substantive paragraph content (no superficial fluff)
   - a relevant pull quote with attribution
   - 3 actionable bullet points.`;

    const userPrompt = `Create a complete, high-impact 4-chapter eBook & lead magnet on the following topic:
Topic: ${topic || 'High-Growth AI Product Strategy'}
Target Role: ${targetRole || 'VP of Product / Tech Founders'}
Industry: ${industry || 'Tech & Software'}
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

// Setup Vite Dev Middleware or Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: Number(port) },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`PageCraft server running on http://localhost:${port}`);
  });
}

startServer();
