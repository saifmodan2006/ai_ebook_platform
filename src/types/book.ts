export type EbookPurpose =
  | 'lead_magnet'
  | 'educational'
  | 'business_guide'
  | 'self_help'
  | 'technical_handbook'
  | 'fiction';

export type ContentComplexity = 'beginner' | 'intermediate' | 'advanced';

export interface DemographicPersona {
  targetRole: string;
  industry: string;
  mainPainPoint: string;
  coreTransformation: string;
  idealAudienceDescription: string;
}

export interface ChapterSubheading {
  title: string;
  content: string;
}

export interface Chapter {
  chapterNumber: number;
  title: string;
  pillBadge: string; // e.g. "Foundation", "Strategy", "Execution", "Mastery"
  summaryBox: string; // Executive summary memorandum
  subheadings: ChapterSubheading[];
  quote: {
    text: string;
    attribution: string;
  };
  bulletPoints: string[];
  wordCount?: number;
}

export interface OutlineChapter {
  chapterNumber: number;
  title: string;
  pillBadge: string;
  objective: string;
  keySubtopics: string[];
  estimatedWords: number;
}

export interface BookOutline {
  suggestedTitles: { title: string; subtitle: string; rationale: string }[];
  selectedTitle: string;
  selectedSubtitle: string;
  targetAudience: string;
  chapters: OutlineChapter[];
}

export interface CoverDesign {
  styleTemplate: 'minimal' | 'academic' | 'business' | 'bold' | 'artistic' | 'luxury';
  primaryColor: string;
  accentColor: string;
  titleFont: 'serif' | 'sans' | 'display';
  alignment: 'left' | 'center';
  bgPattern: 'clean' | 'frame' | 'geometric' | 'monogram';
  customImageUrl?: string;
}

export interface BookTheme {
  id: string;
  name: string;
  primaryColor: string; // hex
  secondaryColor: string; // hex
  accentColor: string; // hex
  textColor: string; // hex
  coverBg: string; // css gradient or hex
  cardBg: string;
  badgeBg: string;
  badgeText: string;
}

export interface ManuscriptSnapshot {
  id: string;
  timestamp: string;
  description: string;
  totalWords: number;
  chapters: Chapter[];
}

export interface Book {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  createdAt: string;
  updatedAt?: string;
  themeId: string;
  theme: BookTheme;
  persona: DemographicPersona;
  chapters: Chapter[];
  readTimeMinutes: number;
  category: string;
  tags: string[];
  purpose?: EbookPurpose;
  language?: string;
  tone?: string;
  complexity?: ContentComplexity;
  sourceNotes?: string;
  coverDesign?: CoverDesign;
  snapshots?: ManuscriptSnapshot[];
}

export type ViewMode =
  | 'library'
  | 'reader'
  | 'mockup'
  | 'print-preview'
  | 'editor'
  | 'cover-studio'
  | 'create-wizard';
