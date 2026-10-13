import { auth } from '../firebase';
import { BookOutline, Chapter, ContentComplexity, EbookPurpose } from '../types/book';

export interface GenerateOutlineParams {
  topic: string;
  description?: string;
  purpose?: EbookPurpose;
  targetAudience?: string;
  language?: string;
  tone?: string;
  chapterCount?: number;
  targetWordCount?: number;
  complexity?: ContentComplexity;
  sourceNotes?: string;
}

export interface GenerateChapterParams {
  bookTitle: string;
  bookSubtitle: string;
  author: string;
  targetAudience: string;
  tone?: string;
  language?: string;
  chapterNumber: number;
  chapterTitle: string;
  pillBadge: string;
  objective?: string;
  keySubtopics?: string[];
  previousChaptersSummary?: string;
  sourceNotes?: string;
}

export interface AssistSectionParams {
  action: 'expand' | 'simplify' | 'executive' | 'examples' | 'factcheck' | 'generate_quote';
  text: string;
  context?: string;
  language?: string;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
  } catch (err) {
    console.warn('Could not retrieve Firebase ID token:', err);
  }

  return headers;
}

async function handleApiResponse<T>(response: Response): Promise<T> {
  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Server returned ${response.status} ${response.statusText} with non-JSON response.`);
  }

  if (!response.ok || !data.success) {
    const errorMsg = data?.error || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data.data as T;
}

export async function apiGenerateOutline(params: GenerateOutlineParams): Promise<BookOutline> {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/gemini/generate-outline', {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });
  return handleApiResponse<BookOutline>(response);
}

export async function apiGenerateChapter(params: GenerateChapterParams): Promise<Chapter> {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/gemini/generate-chapter', {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });
  return handleApiResponse<Chapter>(response);
}

export async function apiAssistSection(params: AssistSectionParams): Promise<{ result: string }> {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/gemini/assist-section', {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });
  return handleApiResponse<{ result: string }>(response);
}

export async function apiGenerateFullEbook(params: {
  topic: string;
  targetRole?: string;
  industry?: string;
  tone?: string;
  themeId?: string;
}): Promise<any> {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/gemini/generate-ebook', {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });
  return handleApiResponse<any>(response);
}
