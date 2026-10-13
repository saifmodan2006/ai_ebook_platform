import { Book, Chapter, DemographicPersona } from '../types/book';
import { THEMES } from './themes';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitizedBook?: Book;
}

export function validateAndSanitizeBookJson(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {
      valid: false,
      errors: ['The imported file does not contain a valid JSON object.'],
    };
  }

  const obj = data as Record<string, any>;

  // Title validation
  if (!obj.title || typeof obj.title !== 'string' || obj.title.trim().length === 0) {
    errors.push('Missing or invalid "title" (must be a non-empty string).');
  }

  // Author validation
  const author = typeof obj.author === 'string' && obj.author.trim() ? obj.author.trim() : 'Editorial Author';

  // Subtitle validation
  const subtitle = typeof obj.subtitle === 'string' ? obj.subtitle.trim() : '';

  // Chapters validation
  if (!Array.isArray(obj.chapters) || obj.chapters.length === 0) {
    errors.push('Missing or invalid "chapters" (must be an array with at least 1 chapter).');
  } else {
    obj.chapters.forEach((ch: any, idx: number) => {
      const chNum = idx + 1;
      if (!ch || typeof ch !== 'object') {
        errors.push(`Chapter ${chNum} is not a valid object.`);
        return;
      }
      if (!ch.title || typeof ch.title !== 'string') {
        errors.push(`Chapter ${chNum} is missing a valid "title".`);
      }
      if (!ch.summaryBox || typeof ch.summaryBox !== 'string') {
        errors.push(`Chapter ${chNum} is missing an executive "summaryBox".`);
      }
      if (!Array.isArray(ch.subheadings) || ch.subheadings.length === 0) {
        errors.push(`Chapter ${chNum} must contain at least 1 subheading.`);
      } else {
        ch.subheadings.forEach((sub: any, sIdx: number) => {
          if (!sub || typeof sub !== 'object' || !sub.title || !sub.content) {
            errors.push(`Chapter ${chNum}, Subheading ${sIdx + 1} must have a "title" and "content".`);
          }
        });
      }
    });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Construct sanitized book
  const sanitizedChapters: Chapter[] = obj.chapters.map((ch: any, idx: number) => ({
    chapterNumber: typeof ch.chapterNumber === 'number' ? ch.chapterNumber : idx + 1,
    title: String(ch.title || `Chapter ${idx + 1}`),
    pillBadge: String(ch.pillBadge || 'Strategy'),
    summaryBox: String(ch.summaryBox || ''),
    subheadings: (ch.subheadings || []).map((sub: any) => ({
      title: String(sub.title || 'Section'),
      content: String(sub.content || ''),
    })),
    quote: {
      text: ch.quote?.text ? String(ch.quote.text) : 'Execution compounds into enduring leverage.',
      attribution: ch.quote?.attribution ? String(ch.quote.attribution) : 'Publishing Editorial',
    },
    bulletPoints: Array.isArray(ch.bulletPoints) ? ch.bulletPoints.map(String) : [],
    wordCount: typeof ch.wordCount === 'number' ? ch.wordCount : undefined,
  }));

  const persona: DemographicPersona = {
    targetRole: obj.persona?.targetRole ? String(obj.persona.targetRole) : 'Industry Leaders',
    industry: obj.persona?.industry ? String(obj.persona.industry) : 'Business & Technology',
    mainPainPoint: obj.persona?.mainPainPoint ? String(obj.persona.mainPainPoint) : 'Navigating complex market execution.',
    coreTransformation: obj.persona?.coreTransformation ? String(obj.persona.coreTransformation) : 'Establishing repeatable high-leverage workflows.',
    idealAudienceDescription: obj.persona?.idealAudienceDescription ? String(obj.persona.idealAudienceDescription) : 'Decision makers seeking operational excellence.',
  };

  const themeId = obj.themeId && THEMES[obj.themeId] ? obj.themeId : 'indigo';
  const theme = THEMES[themeId] || THEMES.indigo;

  const sanitizedBook: Book = {
    id: typeof obj.id === 'string' && obj.id.trim() ? obj.id : `imported-${Date.now()}`,
    title: obj.title.trim(),
    subtitle,
    author,
    createdAt: obj.createdAt && typeof obj.createdAt === 'string' ? obj.createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    themeId,
    theme,
    persona,
    chapters: sanitizedChapters,
    readTimeMinutes: typeof obj.readTimeMinutes === 'number' ? obj.readTimeMinutes : Math.max(8, sanitizedChapters.length * 4),
    category: typeof obj.category === 'string' && obj.category.trim() ? obj.category : 'Business & Strategy',
    tags: Array.isArray(obj.tags) ? obj.tags.map(String) : ['Publishing', 'Manuscript'],
    purpose: obj.purpose || 'business_guide',
    language: obj.language || 'English',
    tone: obj.tone || 'Authoritative & Actionable',
    complexity: obj.complexity || 'intermediate',
    sourceNotes: obj.sourceNotes || '',
  };

  return {
    valid: true,
    errors: [],
    sanitizedBook,
  };
}
