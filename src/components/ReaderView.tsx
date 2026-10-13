import React, { useState } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Box,
  FileDown,
  Printer,
  Menu,
  X,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { Book } from '../types/book';

interface ReaderViewProps {
  book: Book;
  onBack: () => void;
  onOpenMockup: () => void;
  onOpenExport: () => void;
  onOpenPrintPreview: () => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({
  book,
  onBack,
  onOpenMockup,
  onOpenExport,
  onOpenPrintPreview,
}) => {
  const [currentSection, setCurrentSection] = useState<'cover' | 'persona' | number>('cover');
  const [themeMode, setThemeMode] = useState<'archival' | 'clean' | 'slate' | 'obsidian'>('archival');
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans' | 'mono'>('serif');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Calculate progress
  const totalSections = book.chapters.length + 2;
  let sectionIndex = 0;
  if (currentSection === 'cover') sectionIndex = 0;
  else if (currentSection === 'persona') sectionIndex = 1;
  else if (typeof currentSection === 'number') sectionIndex = currentSection + 1;
  const progressPercent = Math.round(((sectionIndex + 1) / totalSections) * 100);

  const handleNext = () => {
    if (currentSection === 'cover') setCurrentSection('persona');
    else if (currentSection === 'persona') setCurrentSection(1);
    else if (typeof currentSection === 'number' && currentSection < book.chapters.length) {
      setCurrentSection(currentSection + 1);
    }
  };

  const handlePrev = () => {
    if (typeof currentSection === 'number') {
      if (currentSection === 1) setCurrentSection('persona');
      else setCurrentSection(currentSection - 1);
    } else if (currentSection === 'persona') {
      setCurrentSection('cover');
    }
  };

  // Theme styles
  const themeClasses = {
    archival: 'bg-[#faf7f0] text-stone-900 border-stone-200',
    clean: 'bg-white text-stone-900 border-stone-200',
    slate: 'bg-[#18181b] text-stone-200 border-stone-800',
    obsidian: 'bg-[#09090b] text-stone-300 border-stone-900',
  }[themeMode];

  const panelBg = {
    archival: 'bg-[#f4efe4] border-stone-300/70 text-stone-800',
    clean: 'bg-stone-50 border-stone-200 text-stone-800',
    slate: 'bg-stone-900 border-stone-800 text-stone-200',
    obsidian: 'bg-zinc-900 border-zinc-800 text-stone-300',
  }[themeMode];

  const fontClass = {
    serif: 'font-editorial',
    sans: 'font-ui',
    mono: 'font-code',
  }[fontFamily];

  const sizeClass = {
    sm: 'text-sm leading-relaxed',
    base: 'text-base leading-[1.8]',
    lg: 'text-lg leading-[1.85]',
    xl: 'text-xl leading-[1.9]',
  }[fontSize];

  return (
    <div className={`min-h-screen flex flex-col ${themeClasses} transition-colors duration-150`}>
      {/* Top Thin Progress Line */}
      <div className="fixed top-0 left-0 right-0 h-0.5 bg-black/5 dark:bg-white/5 z-50">
        <div
          className="h-full bg-stone-900 dark:bg-stone-200 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Reader Masthead Toolbar */}
      <header className="sticky top-0 z-30 h-14 border-b border-inherit px-6 flex items-center justify-between backdrop-blur-md bg-inherit/90">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 text-inherit opacity-70 hover:opacity-100 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-opacity flex items-center gap-1.5 text-xs cursor-pointer font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Library</span>
          </button>

          <span aria-hidden="true" className="opacity-30">·</span>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 text-inherit opacity-70 hover:opacity-100 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-opacity flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <Menu className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Index</span>
          </button>

          <span className="text-xs opacity-60 font-serif italic truncate max-w-[200px] sm:max-w-xs">
            {book.title}
          </span>
        </div>

        {/* Center Progress Text */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-mono opacity-50">
          <span>{progressPercent}% completed</span>
          <span>·</span>
          <span>{book.readTimeMinutes}m total</span>
        </div>

        {/* Right Typography & Theme Controls */}
        <div className="flex items-center gap-2">
          {/* Theme Palette Switches */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg border border-inherit bg-black/5 dark:bg-white/5">
            <button
              onClick={() => setThemeMode('archival')}
              className={`w-4 h-4 rounded-full bg-[#faf7f0] border border-stone-300 ${
                themeMode === 'archival' ? 'ring-2 ring-stone-900' : ''
              }`}
              title="Archival Paper"
            />
            <button
              onClick={() => setThemeMode('clean')}
              className={`w-4 h-4 rounded-full bg-white border border-stone-300 ${
                themeMode === 'clean' ? 'ring-2 ring-stone-900' : ''
              }`}
              title="Gallery Clean"
            />
            <button
              onClick={() => setThemeMode('slate')}
              className={`w-4 h-4 rounded-full bg-[#18181b] border border-stone-700 ${
                themeMode === 'slate' ? 'ring-2 ring-stone-400' : ''
              }`}
              title="Slate Dark"
            />
            <button
              onClick={() => setThemeMode('obsidian')}
              className={`w-4 h-4 rounded-full bg-[#09090b] border border-stone-800 ${
                themeMode === 'obsidian' ? 'ring-2 ring-stone-400' : ''
              }`}
              title="OLED Obsidian"
            />
          </div>

          {/* Typography Scale Buttons */}
          <div className="flex items-center gap-1 border border-inherit rounded-lg p-0.5 text-xs font-mono">
            <button
              onClick={() =>
                setFontSize((s) => (s === 'xl' ? 'lg' : s === 'lg' ? 'base' : s === 'base' ? 'sm' : 'sm'))
              }
              className="px-1.5 py-0.5 opacity-70 hover:opacity-100 rounded"
              title="Decrease font size"
            >
              A-
            </button>
            <button
              onClick={() =>
                setFontSize((s) => (s === 'sm' ? 'base' : s === 'base' ? 'lg' : s === 'lg' ? 'xl' : 'xl'))
              }
              className="px-1.5 py-0.5 opacity-70 hover:opacity-100 rounded"
              title="Increase font size"
            >
              A+
            </button>
            <button
              onClick={() =>
                setFontFamily((f) => (f === 'serif' ? 'sans' : f === 'sans' ? 'mono' : 'serif'))
              }
              className="px-1.5 py-0.5 uppercase opacity-70 hover:opacity-100 font-semibold text-[10px]"
              title="Toggle font face"
            >
              {fontFamily}
            </button>
          </div>

          <span aria-hidden="true" className="opacity-30">·</span>

          {/* Direct Workspace Links */}
          <button
            onClick={onOpenMockup}
            className="p-1.5 text-inherit opacity-70 hover:opacity-100 transition-opacity"
            title="Open 3D Mockup"
          >
            <Box className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenPrintPreview}
            className="p-1.5 text-inherit opacity-70 hover:opacity-100 transition-opacity"
            title="Open Print Proof"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenExport}
            className="px-2.5 py-1 rounded-md bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-medium text-xs transition-opacity opacity-90 hover:opacity-100"
          >
            Export
          </button>
        </div>
      </header>

      {/* Main Reading Frame */}
      <div className="flex-1 flex max-w-7xl mx-auto w-full relative">
        {/* Table of Contents Drawer */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-72 transform transition-transform duration-200 md:static md:translate-x-0 border-r border-inherit bg-inherit flex flex-col ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:w-64'
          }`}
        >
          <div className="p-4 border-b border-inherit flex items-center justify-between text-xs font-mono uppercase tracking-wider opacity-60">
            <span>Manuscript Index</span>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 overflow-y-auto space-y-1 text-xs flex-1">
            <button
              onClick={() => {
                setCurrentSection('cover');
                setSidebarOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                currentSection === 'cover'
                  ? 'bg-black/10 dark:bg-white/10 font-semibold'
                  : 'opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <span className="font-mono text-[10px] opacity-60">00</span>
              <span>Monograph Cover</span>
            </button>

            <button
              onClick={() => {
                setCurrentSection('persona');
                setSidebarOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                currentSection === 'persona'
                  ? 'bg-black/10 dark:bg-white/10 font-semibold'
                  : 'opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <span className="font-mono text-[10px] opacity-60">01</span>
              <span>Demographic ICP Brief</span>
            </button>

            <div className="pt-3 pb-1 px-3 text-[10px] uppercase font-mono tracking-wider opacity-40">
              Chapters
            </div>

            {book.chapters.map((ch) => (
              <button
                key={ch.chapterNumber}
                onClick={() => {
                  setCurrentSection(ch.chapterNumber);
                  setSidebarOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-start gap-2 ${
                  currentSection === ch.chapterNumber
                    ? 'bg-black/10 dark:bg-white/10 font-semibold'
                    : 'opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <span className="font-mono text-[10px] opacity-60 mt-0.5">
                  0{ch.chapterNumber + 1}
                </span>
                <div className="truncate">
                  <div className="truncate">{ch.title}</div>
                  <div className="text-[10px] opacity-50 font-mono">[{ch.pillBadge}]</div>
                </div>
              </button>
            ))}
          </div>

          <div className="p-4 border-t border-inherit text-[11px] font-mono opacity-50 flex items-center justify-between">
            <span>Read: ~{book.readTimeMinutes}m</span>
            <span>4 Chapters</span>
          </div>
        </aside>

        {/* Center Reader Prose Column (Max Width Constrained for Optimal Measure) */}
        <main className="flex-1 p-6 md:p-12 lg:p-16 max-w-2xl mx-auto overflow-y-auto w-full">
          {/* SECTION: COVER */}
          {currentSection === 'cover' && (
            <div className="space-y-10 animate-in fade-in duration-150">
              <div
                className="rounded-2xl p-10 sm:p-14 text-white relative overflow-hidden shadow-md"
                style={{ background: book.theme.coverBg }}
              >
                <div className="space-y-6">
                  <div className="text-xs uppercase tracking-widest font-mono text-white/80">
                    {book.category} · Volume I
                  </div>
                  <h1 className="text-3xl sm:text-5xl font-serif font-bold tracking-tight leading-tight text-white">
                    {book.title}
                  </h1>
                  <p className="text-base sm:text-lg text-white/85 font-light leading-relaxed">
                    {book.subtitle}
                  </p>
                </div>

                <div className="mt-12 pt-6 border-t border-white/20 flex flex-wrap items-end justify-between gap-4 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-white/60 block">
                      Author &amp; Compilation
                    </span>
                    <span className="text-sm font-serif font-medium text-white">{book.author}</span>
                  </div>
                  <div className="text-right text-white/80 font-mono text-[11px]">
                    <div>4 Formatted Chapters</div>
                    <div>Target ICP: {book.persona.targetRole}</div>
                  </div>
                </div>
              </div>

              {/* Publication Synopsis Memorandum */}
              <div className={`p-6 rounded-xl border ${panelBg} space-y-3`}>
                <div className="text-xs uppercase font-mono tracking-wider opacity-60">
                  Publication Synopsis
                </div>
                <p className="text-sm leading-relaxed opacity-90">
                  This work is tailored for <strong className="font-semibold">{book.persona.targetRole}</strong> operating within {book.persona.industry}. It directly addresses the structural problem: <span className="italic">"{book.persona.mainPainPoint}"</span>.
                </p>
                <p className="text-xs opacity-75 font-mono pt-1">
                  Estimated Reading Cadence: {book.readTimeMinutes} minutes · Vector PDF Ready
                </p>
              </div>
            </div>
          )}

          {/* SECTION: PERSONA ICP */}
          {currentSection === 'persona' && (
            <div className="space-y-8 animate-in fade-in duration-150">
              <div className="space-y-2 border-b border-inherit pb-6">
                <div className="text-xs uppercase font-mono tracking-wider opacity-50">
                  Strategic Profile
                </div>
                <h2 className="text-3xl font-serif font-semibold">Demographic Persona &amp; ICP</h2>
                <p className="text-xs opacity-70">
                  Baseline alignment specification for the intended readership.
                </p>
              </div>

              <div className={`p-6 rounded-xl border ${panelBg} space-y-5 text-sm`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-mono opacity-50 uppercase block mb-1">
                      Target Decision Maker
                    </span>
                    <p className="font-medium">{book.persona.targetRole}</p>
                  </div>
                  <div>
                    <span className="text-xs font-mono opacity-50 uppercase block mb-1">
                      Industry Sector
                    </span>
                    <p className="font-medium">{book.persona.industry}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-inherit">
                  <span className="text-xs font-mono opacity-50 uppercase block mb-1">
                    Primary Operational Pain Point
                  </span>
                  <p className="leading-relaxed opacity-90">{book.persona.mainPainPoint}</p>
                </div>

                <div className="pt-4 border-t border-inherit">
                  <span className="text-xs font-mono opacity-50 uppercase block mb-1">
                    Target Transformation Outcome
                  </span>
                  <p className="font-serif italic text-base leading-relaxed">
                    "{book.persona.coreTransformation}"
                  </p>
                </div>

                <div className="pt-4 border-t border-inherit">
                  <span className="text-xs font-mono opacity-50 uppercase block mb-1">
                    Ideal Readership Profile
                  </span>
                  <p className="leading-relaxed opacity-80">{book.persona.idealAudienceDescription}</p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: CHAPTERS (1 TO 4) */}
          {typeof currentSection === 'number' && (
            (() => {
              const chapter = book.chapters.find((ch) => ch.chapterNumber === currentSection);
              if (!chapter) return <div>Chapter unavailable.</div>;

              return (
                <article className={`space-y-10 animate-in fade-in duration-150 ${fontClass}`}>
                  {/* Chapter Header */}
                  <div className="space-y-3 border-b border-inherit pb-6">
                    <div className="text-xs font-mono uppercase tracking-widest opacity-50">
                      Chapter 0{chapter.chapterNumber} · {chapter.pillBadge}
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight leading-snug">
                      {chapter.title}
                    </h1>
                  </div>

                  {/* Executive Summary Memorandum (Subtle Box without Left Accent Line) */}
                  <div className={`p-5 rounded-xl border ${panelBg} space-y-1.5`}>
                    <div className="text-[11px] font-mono uppercase tracking-wider opacity-50">
                      Executive Summary
                    </div>
                    <p className="text-sm italic opacity-90 leading-relaxed font-serif">
                      {chapter.summaryBox}
                    </p>
                  </div>

                  {/* Chapter Subheadings & Prose (with Elegant Drop Cap on First Paragraph) */}
                  <div className="space-y-10">
                    {chapter.subheadings.map((sub, sIdx) => (
                      <section key={sIdx} className="space-y-3">
                        <h2 className="text-xl font-serif font-semibold tracking-tight">
                          {sub.title}
                        </h2>
                        <p
                          className={`${sizeClass} opacity-90 text-justify ${
                            sIdx === 0
                              ? 'first-letter:text-4xl first-letter:font-serif first-letter:font-bold first-letter:float-left first-letter:mr-2.5 first-letter:leading-none'
                              : ''
                          }`}
                        >
                          {sub.content}
                        </p>
                      </section>
                    ))}
                  </div>

                  {/* Pull Quote (Centered Serif Italic with Subtle Top/Bottom Hairlines) */}
                  {chapter.quote?.text && (
                    <div className="py-6 my-8 border-y border-inherit text-center space-y-2">
                      <blockquote className="text-xl sm:text-2xl font-serif italic leading-relaxed opacity-95">
                        "{chapter.quote.text}"
                      </blockquote>
                      {chapter.quote.attribution && (
                        <cite className="block text-xs font-mono tracking-wider opacity-60 not-italic">
                          — {chapter.quote.attribution}
                        </cite>
                      )}
                    </div>
                  )}

                  {/* Actionable Takeaways */}
                  {chapter.bulletPoints?.length > 0 && (
                    <div className={`p-6 rounded-xl border ${panelBg} space-y-4`}>
                      <div className="text-xs font-mono uppercase tracking-wider opacity-60">
                        Actionable Takeaways &amp; Checkpoints
                      </div>
                      <ul className="space-y-2.5 text-xs sm:text-sm">
                        {chapter.bulletPoints.map((bp, bIdx) => (
                          <li key={bIdx} className="flex items-start gap-2.5">
                            <span className="font-mono text-xs opacity-50 mt-0.5">0{bIdx + 1}.</span>
                            <span className="leading-relaxed opacity-90">{bp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </article>
              );
            })()
          )}

          {/* Section Navigation Footer */}
          <div className="mt-14 pt-6 border-t border-inherit flex items-center justify-between text-xs">
            <button
              onClick={handlePrev}
              disabled={currentSection === 'cover'}
              className="px-3.5 py-2 rounded-lg border border-inherit font-medium opacity-80 hover:opacity-100 disabled:opacity-20 disabled:pointer-events-none transition-opacity flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <span className="font-mono opacity-50">
              {sectionIndex + 1} / {totalSections}
            </span>

            <button
              onClick={handleNext}
              disabled={currentSection === book.chapters.length}
              className="px-3.5 py-2 rounded-lg bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-medium disabled:opacity-20 disabled:pointer-events-none transition-opacity flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};
