import React, { useState } from 'react';
import {
  X,
  Save,
  Palette,
  Users,
  Layers,
  Quote,
} from 'lucide-react';
import { Book, Chapter } from '../types/book';
import { THEMES } from '../utils/themes';

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
  if (!isOpen || !book) return null;

  const [activeTab, setActiveTab] = useState<'meta' | 'persona' | 'chapters'>('meta');
  const [title, setTitle] = useState(book.title);
  const [subtitle, setSubtitle] = useState(book.subtitle);
  const [author, setAuthor] = useState(book.author);
  const [category, setCategory] = useState(book.category);
  const [readTimeMinutes, setReadTimeMinutes] = useState(book.readTimeMinutes);
  const [themeId, setThemeId] = useState(book.themeId || 'indigo');

  // Persona
  const [targetRole, setTargetRole] = useState(book.persona.targetRole);
  const [industry, setIndustry] = useState(book.persona.industry);
  const [mainPainPoint, setMainPainPoint] = useState(book.persona.mainPainPoint);
  const [coreTransformation, setCoreTransformation] = useState(book.persona.coreTransformation);
  const [idealAudienceDescription, setIdealAudienceDescription] = useState(
    book.persona.idealAudienceDescription
  );

  // Chapters
  const [chapters, setChapters] = useState<Chapter[]>(JSON.parse(JSON.stringify(book.chapters)));
  const [selectedChapterIdx, setSelectedChapterIdx] = useState(0);

  const handleSave = () => {
    const updatedTheme = THEMES[themeId] || book.theme;
    const updatedBook: Book = {
      ...book,
      title,
      subtitle,
      author,
      category,
      readTimeMinutes,
      themeId,
      theme: updatedTheme,
      persona: {
        targetRole,
        industry,
        mainPainPoint,
        coreTransformation,
        idealAudienceDescription,
      },
      chapters,
    };
    onSave(updatedBook);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150 font-sans">
      <div
        className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-modal-title"
      >
        {/* Masthead Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-stone-400 block">
              Manuscript Editor
            </span>
            <h2 id="editor-modal-title" className="text-base font-serif font-bold text-stone-900">
              Edit Monograph Details &amp; Chapters
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-stone-200 flex items-center gap-2 bg-white">
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
            <span>4 Chapters Manuscript</span>
          </button>
        </div>

        {/* Editor Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: METADATA & PALETTE */}
          {activeTab === 'meta' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-stone-500">
                    Book Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-1 focus:ring-stone-900 focus:outline-none font-serif"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-stone-500">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-1 focus:ring-stone-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-stone-500">
                    Author(s)
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-1 focus:ring-stone-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-stone-500">
                    Category Tag
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-1 focus:ring-stone-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Theme Binding Swatches */}
              <div className="pt-4 border-t border-stone-200 space-y-2">
                <span className="block text-xs font-mono uppercase tracking-wider text-stone-500">
                  Cover &amp; Document Binding Theme
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {Object.values(THEMES).map((thm) => (
                    <button
                      key={thm.id}
                      type="button"
                      onClick={() => setThemeId(thm.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                        themeId === thm.id
                          ? 'border-stone-900 ring-1 ring-stone-900 bg-stone-50'
                          : 'border-stone-200 bg-white'
                      }`}
                    >
                      <div
                        className="w-5 h-7 rounded-xs shadow-xs shrink-0"
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

          {/* TAB 2: PERSONA ICP */}
          {activeTab === 'persona' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-stone-500">
                    Target Role / Title
                  </label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-1 focus:ring-stone-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-stone-500">
                    Industry Sector
                  </label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-1 focus:ring-stone-900 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-stone-500">
                    Core Operational Pain Point
                  </label>
                  <textarea
                    rows={2}
                    value={mainPainPoint}
                    onChange={(e) => setMainPainPoint(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-1 focus:ring-stone-900 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-stone-500">
                    Target Transformation Outcome
                  </label>
                  <textarea
                    rows={2}
                    value={coreTransformation}
                    onChange={(e) => setCoreTransformation(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-1 focus:ring-stone-900 focus:outline-none font-serif italic"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-stone-500">
                    Audience Description
                  </label>
                  <textarea
                    rows={2}
                    value={idealAudienceDescription}
                    onChange={(e) => setIdealAudienceDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-1 focus:ring-stone-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CHAPTERS */}
          {activeTab === 'chapters' && (
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Chapter Selector */}
              <div className="w-full sm:w-44 space-y-1.5 shrink-0">
                <span className="text-xs font-mono uppercase tracking-wider text-stone-400 block mb-2">
                  Select Chapter
                </span>
                {chapters.map((ch, idx) => (
                  <button
                    key={ch.chapterNumber}
                    onClick={() => setSelectedChapterIdx(idx)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                      selectedChapterIdx === idx
                        ? 'bg-stone-900 text-white font-medium shadow-xs'
                        : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <span>Chapter 0{ch.chapterNumber}</span>
                    <span className="text-[10px] font-mono opacity-70">[{ch.pillBadge}]</span>
                  </button>
                ))}
              </div>

              {/* Selected Chapter Editor */}
              {chapters[selectedChapterIdx] && (
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-xs font-mono uppercase tracking-wider text-stone-500">
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
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-1 focus:ring-stone-900 focus:outline-none font-serif"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-mono uppercase tracking-wider text-stone-500">
                        Badge Label
                      </label>
                      <input
                        type="text"
                        value={chapters[selectedChapterIdx].pillBadge}
                        onChange={(e) => {
                          const updated = [...chapters];
                          updated[selectedChapterIdx].pillBadge = e.target.value;
                          setChapters(updated);
                        }}
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-1 focus:ring-stone-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-mono uppercase tracking-wider text-stone-500">
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
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-1 focus:ring-stone-900 focus:outline-none font-serif italic"
                    />
                  </div>

                  {/* Pull Quote */}
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-stone-700">
                      <Quote className="w-3.5 h-3.5 text-stone-500" />
                      <span>Pull Quote &amp; Attribution</span>
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
                      placeholder="Attribution (e.g. Elena Vance)"
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
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
