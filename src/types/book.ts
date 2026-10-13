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
  pillBadge: string; // e.g. "Foundation", "Framework", "Implementation", "Scale"
  summaryBox: string; // Executive summary box
  subheadings: ChapterSubheading[];
  quote: {
    text: string;
    attribution: string;
  };
  bulletPoints: string[];
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

export interface Book {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  createdAt: string;
  themeId: string;
  theme: BookTheme;
  persona: DemographicPersona;
  chapters: Chapter[];
  readTimeMinutes: number;
  category: string;
  tags: string[];
}

export type ViewMode = 'library' | 'reader' | 'mockup' | 'print-preview' | 'editor';
