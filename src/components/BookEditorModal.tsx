import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Palette,
  Users,
  Layers,
  Quote,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Wand2,
  ListPlus,
  BarChart2,
  Loader2,
  BookOpen,
  Layout,
  AlignLeft,
  AlignCenter,
} from 'lucide-react';
import { Book, Chapter, CoverDesign } from '../types/book';
import { THEMES } from '../utils/themes';
import { apiAssistSection } from '../utils/apiClient';

interface BookEditorModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Book) => void;
}

export const BookEditorModal: React.FC<BookEditorModalProps> = ({
  book,
  isOpen,
  onClose,
  onSave,
}) => {
  // Always call all hooks unconditionally at top level (Fixes hook-order violation)
  const [activeTab, setActiveTab] = useState<'meta' | 'persona' | 'chapters' | 'cover' | 'audit'>('meta');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('');
  const [readTimeMinutes, setReadTimeMinutes] = useState(15);
  const [themeId, setThemeId] = useState('indigo');

  // Persona
  const [targetRole, setTargetRole] = useState('');
  const [industry, setIndustry] = useState('');
  const [mainPainPoint, setMainPainPoint] = useState('');
  const [coreTransformation, setCoreTransformation] = useState('');
  const [idealAudienceDescription, setIdealAudienceDescription] = useState('');

  // Cover Studio
  const [coverStyle, setCoverStyle] = useState<'minimal' | 'academic' | 'business' | 'bold' | 'luxury'>('business');
  const [coverAlignment, setCoverAlignment] = useState<'left' | 'center'>('left');
  const [coverPattern, setCoverPattern] = useState<'clean' | 'frame' | 'geometric'>('frame');

  // Chapters & Subheadings
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterIdx, setSelectedChapterIdx] = useState(0);

  // AI Section Assistant State
  const [assistantLoadingSubIdx, setAssistantLoadingSubIdx] = useState<number | null>(null);
  const [assistantActionName, setAssistantActionName] = useState<string>('');
  const [assistantError, setAssistantError] = useState<string | null>(null);

  // State initialization & sync whenever active book changes
  useEffect(() => {
    if (book) {
      setTitle(book.title || '');
      setSubtitle(book.subtitle || '');
      setAuthor(book.author || '');
      setCategory(book.category || 'Business & Strategy');
      setReadTimeMinutes(book.readTimeMinutes || 15);
      setThemeId(book.themeId || 'indigo');

      setTargetRole(book.persona?.targetRole || '');
      setIndustry(book.persona?.industry || '');
      setMainPainPoint(book.persona?.mainPainPoint || '');
      setCoreTransformation(book.persona?.coreTransformation || '');
      setIdealAudienceDescription(book.persona?.idealAudienceDescription || '');

      if (book.coverDesign) {
        setCoverStyle((book.coverDesign.styleTemplate as any) || 'business');
        setCoverAlignment(book.coverDesign.alignment || 'left');
        setCoverPattern((book.coverDesign.bgPattern as any) || 'frame');
      } else {
        setCoverStyle('business');
        setCoverAlignment('left');
        setCoverPattern('frame');
      }

      setChapters(
        book.chapters && book.chapters.length > 0
          ? JSON.parse(JSON.stringify(book.chapters))
          : [
              {
                chapterNumber: 1,
                title: 'Foundations',
                pillBadge: 'Foundation',
                summaryBox: 'Initial executive overview.',
                subheadings: [{ title: 'Overview', content: 'Detailed analysis here.' }],
                quote: { text: 'Execution compounds.', attribution: 'Editorial' },
                bulletPoints: ['Core initiative 1', 'Core initiative 2'],
              },
            ]
      );
      setSelectedChapterIdx(0);
      setAssistantError(null);
    }
  }, [book, isOpen]);

  if (!isOpen || !book) return null;

  // Handlers for Chapter Structure
  const handleAddChapter = () => {
    const nextNum = chapters.length + 1;
    const newChapter: Chapter = {
      chapterNumber: nextNum,
      title: `Chapter ${nextNum}: Strategic Implementation`,
      pillBadge: nextNum === 1 ? 'Foundation' : nextNum === 2 ? 'Strategy' : 'Execution',
      summaryBox: 'Executive memorandum summarizing strategic methodology.',
      subheadings: [
        {
          title: 'Core Methodological Framework',
          content: 'Synthesize actionable processes and establish empirical checkpoint metrics.',
        },
      ],
      quote: {
        text: 'Consistency and clear boundaries unlock compound velocity.',
        attribution: 'PageCraft Editorial',
      },
      bulletPoints: ['Audit operational workflows', 'Implement verification cadences'],
    };
    setChapters([...chapters, newChapter]);
    setSelectedChapterIdx(chapters.length);
  };

  const handleRemoveChapter = (idxToRemove: number) => {
    if (chapters.length <= 1) {
      alert('A manuscript must have at least one chapter.');
      return;
    }
    const filtered = chapters
      .filter((_, idx) => idx !== idxToRemove)
      .map((ch, idx) => ({ ...ch, chapterNumber: idx + 1 }));
    setChapters(filtered);
    setSelectedChapterIdx(Math.max(0, idxToRemove - 1));
  };

  const handleAddSubheading = (chIdx: number) => {
    const updated = [...chapters];
    const currentSubs = updated[chIdx].subheadings || [];
    updated[chIdx].subheadings = [
      ...currentSubs,
      {
        title: `Section ${currentSubs.length + 1}`,
        content: 'Provide comprehensive, nuanced analysis and actionable playbooks.',
      },
    ];
    setChapters(updated);
  };

  const handleRemoveSubheading = (chIdx: number, subIdx: number) => {
    const updated = [...chapters];
    updated[chIdx].subheadings = updated[chIdx].subheadings.filter((_, idx) => idx !== subIdx);
    setChapters(updated);
  };

  // AI Assistant for a section
  const handleAiAssist = async (
    chIdx: number,
    subIdx: number,
    action: 'expand' | 'simplify' | 'executive' | 'examples' | 'factcheck' | 'generate_quote'
  ) => {
    const targetSub = chapters[chIdx]?.subheadings?.[subIdx];
    if (!targetSub || !targetSub.content.trim()) {
      setAssistantError('Please enter some text in the section before using the AI assistant.');
      return;
    }

    setAssistantLoadingSubIdx(subIdx);
    setAssistantActionName(action);
    setAssistantError(null);

    try {
      const response = await apiAssistSection({
        action,
        text: targetSub.content,
        context: `Book: "${title}", Chapter: "${chapters[chIdx].title}", Audience: "${targetRole} in ${industry}"`,
        language: book.language || 'English',
      });

      if (response && response.result) {
        const updated = [...chapters];
        if (action === 'generate_quote') {
          updated[chIdx].quote = {
            text: response.result.replace(/^"|"$/g, '').trim(),
            attribution: `${author || 'Editorial'} & Research Board`,
          };
        } else {
          updated[chIdx].subheadings[subIdx].content = response.result;
        }
        setChapters(updated);
      }
    } catch (err: any) {
      setAssistantError(err.message || 'AI Assistant request could not be processed.');
    } finally {
      setAssistantLoadingSubIdx(null);
      setAssistantActionName('');
    }
  };

  // Save Book
  const handleSave = () => {
    const updatedTheme = THEMES[themeId] || book.theme;
    const totalWords = chapters.reduce((acc, ch) => {
      const subWords = ch.subheadings.reduce((sAcc, s) => sAcc + s.content.split(/\s+/).length, 0);
      return acc + subWords + (ch.summaryBox ? ch.summaryBox.split(/\s+/).length : 0);
    }, 0);

    const calculatedReadTime = Math.max(5, Math.ceil(totalWords / 160));

    const coverDesign: CoverDesign = {
      styleTemplate: coverStyle,
      primaryColor: updatedTheme.primaryColor,
      accentColor: updatedTheme.accentColor,
      titleFont: 'serif',
      alignment: coverAlignment,
      bgPattern: coverPattern,
    };

    const updatedBook: Book = {
      ...book,
      title: title.trim() || book.title,
      subtitle: subtitle.trim(),
      author: author.trim() || book.author,
      category: category.trim() || book.category,
      readTimeMinutes: calculatedReadTime || readTimeMinutes,
      themeId,
      theme: updatedTheme,
      coverDesign,
      persona: {
        targetRole: targetRole.trim(),
        industry: industry.trim(),
        mainPainPoint: mainPainPoint.trim(),
        coreTransformation: coreTransformation.trim(),
        idealAudienceDescription: idealAudienceDescription.trim(),
      },
      chapters,
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedBook);
    onClose();
  };

  // Metrics for Manuscript Quality Audit
  const totalWordCount = chapters.reduce((acc, ch) => {
    const subWords = ch.subheadings.reduce((sAcc, s) => sAcc + s.content.split(/\s+/).filter(Boolean).length, 0);
    return acc + subWords + (ch.summaryBox ? ch.summaryBox.split(/\s+/).filter(Boolean).length : 0);
  }, 0);

  const avgChapterWords = chapters.length > 0 ? Math.round(totalWordCount / chapters.length) : 0;
  const currentTheme = THEMES[themeId] || book.theme;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150 font-sans">
      <div
        className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-modal-title"
      >
        {/* Masthead Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-stone-400 block font-medium">
              Editorial Studio Workbench
            </span>
            <h2 id="editor-modal-title" className="text-base font-serif font-bold text-stone-900">
              Manuscript Editor &amp; Cover Studio
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-stone-200 flex flex-wrap items-center gap-2 bg-white">
          <button
            onClick={() => setActiveTab('meta')}
            className={`pb-3 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'meta'
                ? 'border-stone-900 text-stone-900 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Title &amp; Binding Palette</span>
          </button>

          <button
            onClick={() => setActiveTab('cover')}
            className={`pb-3 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'cover'
                ? 'border-stone-900 text-stone-900 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Cover Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('persona')}
            className={`pb-3 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'persona'
                ? 'border-stone-900 text-stone-900 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Demographic ICP</span>
          </button>

          <button
            onClick={() => setActiveTab('chapters')}
            className={`pb-3 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'chapters'
                ? 'border-stone-900 text-stone-900 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Chapters &amp; AI Writing Assistant ({chapters.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'audit'
                ? 'border-stone-900 text-stone-900 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Manuscript Quality Check</span>
          </button>
        </div>

        {/* Global Assistant Error Banner */}
        {assistantError && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{assistantError}</span>
            </div>
            <button
              onClick={() => setAssistantError(null)}
              className="text-rose-500 hover:text-rose-700 font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Editor Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: METADATA & PALETTE */}
          {activeTab === 'meta' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-stone-500 font-medium">
                    Publication Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-sm focus:ring-1 focus:ring-stone-900 focus:outline-none font-serif text-stone-900 font-semibold"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-stone-500 font-medium">
                    Subtitle &amp; Positioning Hook
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-xs sm:text-sm focus:ring-1 focus:ring-stone-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-stone-500 font-medium">
                    Author(s) / Organization
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-xs sm:text-sm focus:ring-1 focus:ring-stone-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-stone-500 font-medium">
                    Category Tag
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-xs sm:text-sm focus:ring-1 focus:ring-stone-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Theme Binding Swatches */}
              <div className="pt-4 border-t border-stone-200 space-y-2.5">
                <span className="block text-xs font-mono uppercase tracking-wider text-stone-500 font-medium">
                  Document Binding &amp; Cover Palette
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {Object.values(THEMES).map((thm) => (
                    <button
                      key={thm.id}
                      type="button"
                      onClick={() => setThemeId(thm.id)}
                      className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                        themeId === thm.id
                          ? 'border-stone-900 ring-2 ring-stone-900/10 bg-stone-50'
                          : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}
                    >
                      <div
                        className="w-6 h-8 rounded-xs shadow-xs shrink-0"
                        style={{ background: thm.coverBg }}
                      />
                      <div className="overflow-hidden">
                        <div className="text-xs font-serif font-semibold text-stone-900 truncate">
                          {thm.name}
                        </div>
                        <div className="text-[10px] font-mono text-stone-400">Palette</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: COVER DESIGN STUDIO */}
          {activeTab === 'cover' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Left Controls */}
              <div className="md:col-span-7 space-y-6">
                <div className="space-y-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-stone-500 font-medium block">
                    Cover Design Template
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: 'business', label: 'Executive Business', desc: 'Corner frame & contrast badge' },
                      { id: 'minimal', label: 'Swiss Minimalist', desc: 'Hairline grid & clean typography' },
                      { id: 'academic', label: 'Academic Monograph', desc: 'Top accent bar & structured rule' },
                      { id: 'luxury', label: 'Obsidian Foil', desc: 'Dark slate with metallic cyan/gold' },
                      { id: 'bold', label: 'Modern Geometric', desc: 'High-contrast angled dynamics' },
                    ].map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => setCoverStyle(tpl.id as any)}
                        className={`p-3 text-left rounded-xl border transition-all cursor-pointer space-y-1 ${
                          coverStyle === tpl.id
                            ? 'border-stone-900 ring-2 ring-stone-900/10 bg-stone-50'
                            : 'border-stone-200 bg-white hover:bg-stone-50/50'
                        }`}
                      >
                        <div className="text-xs font-serif font-bold text-stone-900">{tpl.label}</div>
                        <div className="text-[10px] text-stone-500 leading-tight">{tpl.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase tracking-wider text-stone-500 font-medium block">
                      Title Alignment
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCoverAlignment('left')}
                        className={`flex-1 py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer ${
                          coverAlignment === 'left'
                            ? 'bg-stone-900 text-white border-stone-900'
                            : 'bg-white text-stone-700 border-stone-200'
                        }`}
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                        <span>Left</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCoverAlignment('center')}
                        className={`flex-1 py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer ${
                          coverAlignment === 'center'
                            ? 'bg-stone-900 text-white border-stone-900'
                            : 'bg-white text-stone-700 border-stone-200'
                        }`}
                      >
                        <AlignCenter className="w-3.5 h-3.5" />
                        <span>Center</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase tracking-wider text-stone-500 font-medium block">
                      Background Pattern
                    </label>
                    <select
                      value={coverPattern}
                      onChange={(e) => setCoverPattern(e.target.value as any)}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs bg-white"
                    >
                      <option value="frame">Architectural Frame Rule</option>
                      <option value="geometric">Geometric Corner Accent</option>
                      <option value="clean">Clean Minimal Monolith</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Live Cover Mockup */}
              <div className="md:col-span-5 flex flex-col items-center justify-center">
                <span className="text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-2 font-medium">
                  Live Cover Preview
                </span>
                <div
                  className={`w-64 h-92 rounded-xl shadow-xl p-6 flex flex-col justify-between relative overflow-hidden select-none transition-all duration-300 ${
                    coverAlignment === 'center' ? 'text-center items-center' : 'text-left items-start'
                  }`}
                  style={{ background: currentTheme.coverBg }}
                >
                  {/* Subtle Spine Hinge */}
                  <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/40 to-transparent pointer-events-none" />

                  {/* Frame pattern */}
                  {coverPattern === 'frame' && (
                    <div className="absolute inset-3 border border-white/20 rounded pointer-events-none" />
                  )}

                  {/* Geometric corner pattern */}
                  {coverPattern === 'geometric' && (
                    <div
                      className="absolute -top-12 -right-12 w-28 h-28 opacity-25 rounded-full pointer-events-none"
                      style={{ background: currentTheme.accentColor }}
                    />
                  )}

                  {/* Top Badge */}
                  <div className="relative z-10">
                    <span
                      className="px-2.5 py-1 rounded-sm text-[9px] font-mono uppercase font-bold tracking-wider"
                      style={{
                        background: currentTheme.accentColor,
                        color: currentTheme.primaryColor,
                      }}
                    >
                      {category || 'Executive Monograph'}
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <div className="relative z-10 space-y-2 my-auto w-full">
                    <h3 className="font-serif font-bold text-lg text-white leading-tight drop-shadow-xs">
                      {title || 'Publication Title'}
                    </h3>
                    <p className="text-[11px] text-white/80 font-sans font-light leading-relaxed">
                      {subtitle || 'Strategic Guide and Implementation Playbook'}
                    </p>
                  </div>

                  {/* Bottom Author */}
                  <div className="relative z-10 w-full pt-2 border-t border-white/20 flex items-center justify-between text-[11px] text-white/90">
                    <span className="font-medium truncate max-w-[140px]">{author || 'Editorial'}</span>
                    <span className="font-mono text-[9px] text-white/70">{chapters.length} Chapters</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PERSONA ICP */}
          {activeTab === 'persona' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-stone-500 font-medium">
                    Target Role / Decision Maker
                  </label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-xs sm:text-sm focus:ring-1 focus:ring-stone-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-stone-500 font-medium">
                    Industry Sector
                  </label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-xs sm:text-sm focus:ring-1 focus:ring-stone-900 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-stone-500 font-medium">
                    Core Operational Pain Point
                  </label>
                  <textarea
                    rows={2}
                    value={mainPainPoint}
                    onChange={(e) => setMainPainPoint(e.target.value)}
                    className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-xs sm:text-sm focus:ring-1 focus:ring-stone-900 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-stone-500 font-medium">
                    Target Transformation Outcome
                  </label>
                  <textarea
                    rows={2}
                    value={coreTransformation}
                    onChange={(e) => setCoreTransformation(e.target.value)}
                    className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-xs sm:text-sm focus:ring-1 focus:ring-stone-900 focus:outline-none font-serif italic text-stone-800"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-stone-500 font-medium">
                    Audience Description &amp; Demographic Profile
                  </label>
                  <textarea
                    rows={2}
                    value={idealAudienceDescription}
                    onChange={(e) => setIdealAudienceDescription(e.target.value)}
                    className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-xs sm:text-sm focus:ring-1 focus:ring-stone-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CHAPTERS & AI ASSISTANT */}
          {activeTab === 'chapters' && (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Chapter Sidebar */}
              <div className="w-full lg:w-60 space-y-2 shrink-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono uppercase tracking-wider text-stone-400 font-medium">
                    Chapters ({chapters.length})
                  </span>
                  <button
                    onClick={handleAddChapter}
                    className="text-[11px] font-mono text-stone-900 hover:text-stone-600 font-semibold flex items-center gap-1 cursor-pointer bg-stone-100 hover:bg-stone-200 px-2 py-0.5 rounded"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                </div>

                <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
                  {chapters.map((ch, idx) => (
                    <div
                      key={idx}
                      className={`group flex items-center justify-between p-2 rounded-xl text-xs transition-all cursor-pointer ${
                        selectedChapterIdx === idx
                          ? 'bg-stone-900 text-white font-medium shadow-xs'
                          : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
                      }`}
                      onClick={() => setSelectedChapterIdx(idx)}
                    >
                      <div className="overflow-hidden pr-2">
                        <div className="truncate font-medium">
                          {idx + 1}. {ch.title}
                        </div>
                        <div className={`text-[10px] font-mono ${selectedChapterIdx === idx ? 'text-stone-300' : 'text-stone-400'}`}>
                          [{ch.pillBadge}] · {ch.subheadings?.length || 0} sects
                        </div>
                      </div>

                      {chapters.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveChapter(idx);
                          }}
                          className={`opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-50 hover:text-rose-600 transition-opacity ${
                            selectedChapterIdx === idx ? 'text-stone-400 hover:text-rose-300' : 'text-stone-400'
                          }`}
                          title="Remove chapter"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Chapter Content */}
              {chapters[selectedChapterIdx] && (
                <div className="flex-1 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-xs font-mono uppercase tracking-wider text-stone-500 font-medium">
                        Chapter Title
                      </label>
                      <input
                        type="text"
                        value={chapters[selectedChapterIdx].title}
                        onChange={(e) => {
                          const updated = [...chapters];
                          updated[selectedChapterIdx].title = e.target.value;
                          setChapters(updated);
                        }}
                        className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:ring-1 focus:ring-stone-900 focus:outline-none font-serif font-semibold text-stone-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-mono uppercase tracking-wider text-stone-500 font-medium">
                        Stage Badge
                      </label>
                      <input
                        type="text"
                        value={chapters[selectedChapterIdx].pillBadge}
                        onChange={(e) => {
                          const updated = [...chapters];
                          updated[selectedChapterIdx].pillBadge = e.target.value;
                          setChapters(updated);
                        }}
                        className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-xs sm:text-sm focus:ring-1 focus:ring-stone-900 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-mono uppercase tracking-wider text-stone-500 font-medium">
                      Executive Summary Box
                    </label>
                    <textarea
                      rows={2}
                      value={chapters[selectedChapterIdx].summaryBox}
                      onChange={(e) => {
                        const updated = [...chapters];
                        updated[selectedChapterIdx].summaryBox = e.target.value;
                        setChapters(updated);
                      }}
                      className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-xs sm:text-sm focus:ring-1 focus:ring-stone-900 focus:outline-none font-serif italic text-stone-800"
                    />
                  </div>

                  {/* Subheadings with AI Section Assistant */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-wider text-stone-500 font-medium">
                        Chapter Subheadings &amp; Deep Content ({chapters[selectedChapterIdx].subheadings?.length || 0})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddSubheading(selectedChapterIdx)}
                        className="text-[11px] font-mono text-stone-900 hover:text-stone-700 font-semibold flex items-center gap-1 cursor-pointer bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded-lg"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Subheading</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {chapters[selectedChapterIdx].subheadings?.map((sub, sIdx) => (
                        <div
                          key={sIdx}
                          className="p-4 bg-stone-50/80 rounded-2xl border border-stone-200/90 space-y-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <input
                              type="text"
                              value={sub.title}
                              onChange={(e) => {
                                const updated = [...chapters];
                                updated[selectedChapterIdx].subheadings[sIdx].title = e.target.value;
                                setChapters(updated);
                              }}
                              placeholder="Subheading title..."
                              className="flex-1 px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-serif font-bold text-stone-900"
                            />

                            {chapters[selectedChapterIdx].subheadings.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveSubheading(selectedChapterIdx, sIdx)}
                                className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Remove section"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <textarea
                            rows={4}
                            value={sub.content}
                            onChange={(e) => {
                              const updated = [...chapters];
                              updated[selectedChapterIdx].subheadings[sIdx].content = e.target.value;
                              setChapters(updated);
                            }}
                            placeholder="Write comprehensive, nuanced chapter paragraphs..."
                            className="w-full p-3 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 leading-relaxed focus:outline-none focus:ring-1 focus:ring-stone-900 font-sans"
                          />

                          {/* AI Writing Assistant Toolbar */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-stone-200/60 text-xs">
                            <div className="flex items-center gap-1.5 text-stone-400 font-mono text-[11px]">
                              <Sparkles className="w-3 h-3 text-amber-600" />
                              <span>AI Assistant:</span>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                              {assistantLoadingSubIdx === sIdx ? (
                                <div className="flex items-center gap-2 text-stone-700 bg-stone-100 px-3 py-1 rounded-lg text-xs font-mono">
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-600" />
                                  <span>Transforming section ({assistantActionName})...</span>
                                </div>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleAiAssist(selectedChapterIdx, sIdx, 'expand')}
                                    className="px-2.5 py-1 rounded-md bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 text-[11px] font-medium transition-colors cursor-pointer"
                                  >
                                    Expand with Depth
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAiAssist(selectedChapterIdx, sIdx, 'simplify')}
                                    className="px-2.5 py-1 rounded-md bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 text-[11px] font-medium transition-colors cursor-pointer"
                                  >
                                    Simplify &amp; Clarify
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAiAssist(selectedChapterIdx, sIdx, 'executive')}
                                    className="px-2.5 py-1 rounded-md bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 text-[11px] font-medium transition-colors cursor-pointer"
                                  >
                                    Executive Tone
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAiAssist(selectedChapterIdx, sIdx, 'examples')}
                                    className="px-2.5 py-1 rounded-md bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 text-[11px] font-medium transition-colors cursor-pointer"
                                  >
                                    Add Case Studies
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pull Quote & Bullet Points */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {/* Pull Quote */}
                    <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between font-semibold text-stone-700">
                        <div className="flex items-center gap-1.5">
                          <Quote className="w-3.5 h-3.5 text-stone-500" />
                          <span>Pull Quote &amp; Attribution</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAiAssist(selectedChapterIdx, 0, 'generate_quote')}
                          className="text-[10px] font-mono text-amber-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Wand2 className="w-3.5 h-3.5" />
                          <span>AI Quote</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Quote text..."
                        value={chapters[selectedChapterIdx].quote?.text || ''}
                        onChange={(e) => {
                          const updated = [...chapters];
                          if (!updated[selectedChapterIdx].quote) {
                            updated[selectedChapterIdx].quote = { text: '', attribution: '' };
                          }
                          updated[selectedChapterIdx].quote.text = e.target.value;
                          setChapters(updated);
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-md font-serif italic text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Attribution (e.g. Elena Vance, Senior Partner)"
                        value={chapters[selectedChapterIdx].quote?.attribution || ''}
                        onChange={(e) => {
                          const updated = [...chapters];
                          if (!updated[selectedChapterIdx].quote) {
                            updated[selectedChapterIdx].quote = { text: '', attribution: '' };
                          }
                          updated[selectedChapterIdx].quote.attribution = e.target.value;
                          setChapters(updated);
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-md text-xs"
                      />
                    </div>

                    {/* Bullet Points */}
                    <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between font-semibold text-stone-700">
                        <div className="flex items-center gap-1.5">
                          <ListPlus className="w-3.5 h-3.5 text-stone-500" />
                          <span>Actionable Bullet Points</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        {(chapters[selectedChapterIdx].bulletPoints || []).map((point, pIdx) => (
                          <div key={pIdx} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-stone-400 shrink-0" />
                            <input
                              type="text"
                              value={point}
                              onChange={(e) => {
                                const updated = [...chapters];
                                updated[selectedChapterIdx].bulletPoints[pIdx] = e.target.value;
                                setChapters(updated);
                              }}
                              className="flex-1 px-2.5 py-1 bg-white border border-stone-200 rounded-md text-xs"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MANUSCRIPT QUALITY & CONSISTENCY AUDITOR */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                <span className="text-xs font-mono uppercase tracking-wider text-stone-400 font-semibold block">
                  Manuscript Integrity Scorecard
                </span>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  Automatic structural audit of chapter balance, demographic alignment, and publishing readiness.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-white border border-stone-200 rounded-xl space-y-1">
                  <div className="text-xs font-mono uppercase text-stone-400">Total Word Count</div>
                  <div className="text-2xl font-serif font-bold text-stone-900">{totalWordCount} words</div>
                  <div className="text-xs text-stone-500">~{Math.ceil(totalWordCount / 160)} min estimated read time</div>
                </div>

                <div className="p-4 bg-white border border-stone-200 rounded-xl space-y-1">
                  <div className="text-xs font-mono uppercase text-stone-400">Total Chapters</div>
                  <div className="text-2xl font-serif font-bold text-stone-900">{chapters.length} chapters</div>
                  <div className="text-xs text-stone-500">Avg {avgChapterWords} words / chapter</div>
                </div>

                <div className="p-4 bg-white border border-stone-200 rounded-xl space-y-1">
                  <div className="text-xs font-mono uppercase text-stone-400">Demographic Persona</div>
                  <div className="text-sm font-semibold text-stone-900 truncate">{targetRole || 'Not specified'}</div>
                  <div className="text-xs text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Audience aligned</span>
                  </div>
                </div>
              </div>

              {/* Chapter Distribution Ledger */}
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase tracking-wider text-stone-500 font-medium block">
                  Chapter Word Balance
                </span>
                <div className="space-y-2 border border-stone-200 rounded-xl p-3 bg-white">
                  {chapters.map((ch, idx) => {
                    const chWords = ch.subheadings.reduce((sAcc, s) => sAcc + s.content.split(/\s+/).filter(Boolean).length, 0);
                    const percentage = totalWordCount > 0 ? Math.round((chWords / totalWordCount) * 100) : 0;
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-stone-700">
                          <span className="font-medium truncate max-w-xs">{idx + 1}. {ch.title}</span>
                          <span className="font-mono text-stone-400">{chWords} words ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-stone-800 h-1.5 rounded-full"
                            style={{ width: `${Math.min(100, Math.max(5, percentage))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.99]"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
