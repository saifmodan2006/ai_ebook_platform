import { BookTheme } from '../types/book';

export const THEMES: Record<string, BookTheme> = {
  indigo: {
    id: 'indigo',
    name: 'Midnight Oxford',
    primaryColor: '#0f172a', // slate-900 (deep ink navy)
    secondaryColor: '#1e293b', // slate-800
    accentColor: '#d97706', // amber-600 (warm book foil gold)
    textColor: '#ffffff',
    coverBg: 'linear-gradient(145deg, #090d16 0%, #0f172a 55%, #1e293b 100%)',
    cardBg: '#090d16',
    badgeBg: '#f1f5f9',
    badgeText: '#0f172a',
  },
  emerald: {
    id: 'emerald',
    name: 'Curatorial Forest',
    primaryColor: '#062e24', // deep forest spruce
    secondaryColor: '#064e3b', // emerald-900
    accentColor: '#f59e0b', // amber-500
    textColor: '#ffffff',
    coverBg: 'linear-gradient(145deg, #021a14 0%, #062e24 55%, #064e3b 100%)',
    cardBg: '#021a14',
    badgeBg: '#fef3c7',
    badgeText: '#78350f',
  },
  crimson: {
    id: 'crimson',
    name: 'Burgundy Archive',
    primaryColor: '#3f0713', // deep claret
    secondaryColor: '#881337', // rose-900
    accentColor: '#eab308', // yellow-500
    textColor: '#ffffff',
    coverBg: 'linear-gradient(145deg, #28020a 0%, #3f0713 55%, #700c26 100%)',
    cardBg: '#28020a',
    badgeBg: '#fef08a',
    badgeText: '#713f12',
  },
  obsidian: {
    id: 'obsidian',
    name: 'Monochrome Atelier',
    primaryColor: '#18181b', // zinc-900
    secondaryColor: '#27272a', // zinc-800
    accentColor: '#38bdf8', // sky-400
    textColor: '#ffffff',
    coverBg: 'linear-gradient(145deg, #09090b 0%, #18181b 55%, #27272a 100%)',
    cardBg: '#09090b',
    badgeBg: '#e4e4e7',
    badgeText: '#18181b',
  },
  terracotta: {
    id: 'terracotta',
    name: 'Sienna & Travertine',
    primaryColor: '#431407', // warm burnt umber
    secondaryColor: '#7c2d12', // orange-900
    accentColor: '#facc15', // warm gold
    textColor: '#ffffff',
    coverBg: 'linear-gradient(145deg, #270b04 0%, #431407 55%, #7c2d12 100%)',
    cardBg: '#270b04',
    badgeBg: '#ffedd5',
    badgeText: '#7c2d12',
  },
  amethyst: {
    id: 'amethyst',
    name: 'Imperial Plum',
    primaryColor: '#3b0764', // purple-950
    secondaryColor: '#581c87', // purple-900
    accentColor: '#f472b6', // rose-400
    textColor: '#ffffff',
    coverBg: 'linear-gradient(145deg, #200238 0%, #3b0764 55%, #581c87 100%)',
    cardBg: '#200238',
    badgeBg: '#fae8ff',
    badgeText: '#581c87',
  },
};

export const DEFAULT_THEME = THEMES.indigo;
