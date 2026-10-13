import React, { useState } from 'react';
import {
  X,
  Sparkles,
  BookOpen,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Layers,
  Wand2,
  Loader2,
  Sliders,
  FileText,
  Users,
  Compass,
  Palette,
  Edit3,
  Plus,
  Trash2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Book,
  BookOutline,
  Chapter,
  ContentComplexity,
  DemographicPersona,
  EbookPurpose,
  OutlineChapter,
} from '../types/book';
import { THEMES } from '../utils/themes';
import { apiGenerateChapter, apiGenerateFullEbook, apiGenerateOutline } from '../utils/apiClient';

interface CreateBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookCreated: (newBook: Book) => void;
}

type WizardStep = 'spec' | 'outline' | 'generating' | 'completed';

export const CreateBookModal: React.FC<CreateBookModalProps> = ({
  isOpen,
  onClose,
  onBookCreated,
}) => {
  // Wizard Navigation
  const [currentStep, setCurrentStep] = useState<WizardStep>('spec');

  // Input specifications
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [purpose, setPurpose] = useState<EbookPurpose>('business_guide');
  const [authorName, setAuthorName] = useState('PageCraft Editorial');
  const [targetRole, setTargetRole] = useState('VP of Product / Tech Founders');
  const [industry, setIndustry] = useState('Technology & Cloud Software');
  const [painPoint, setPainPoint] = useState('Difficulty scaling repeatable customer acquisition.');
  const [transformation, setTransformation] = useState('Establish an enduring, capital-efficient growth flywheel.');
  const [language, setLanguage] = useState('English');
  const [tone, setTone] = useState('Authoritative & Actionable');
  const [chapterCount, setChapterCount] = useState<number>(4);
  const [targetWordCount, setTargetWordCount] = useState<number>(800);
  const [complexity, setComplexity] = useState<ContentComplexity>('intermediate');
  const [sourceNotes, setSourceNotes] = useState('');
  const [selectedThemeId, setSelectedThemeId] = useState('indigo');

  // Outline Generation State
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [outline, setOutline] = useState<BookOutline | null>(null);
  const [chosenTitle, setChosenTitle] = useState('');
  const [chosenSubtitle, setChosenSubtitle] = useState('');
  const [editableChapters, setEditableChapters] = useState<OutlineChapter[]>([]);

  // Progressive Chapter Generation State
  const [currentGeneratingChapterIdx, setCurrentGeneratingChapterIdx] = useState<number>(0);
  const [generatedChapters, setGeneratedChapters] = useState<Chapter[]>([]);
  const [generationProgressMessage, setGenerationProgressMessage] = useState<string>('');
  const [createdBook, setCreatedBook] = useState<Book | null>(null);

  // Error State (Explicit errors, no silent fake fallbacks)
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#312e81', '#4338ca', '#f59e0b', '#10b981'],
      });
    } catch {
      // Ignored
    }
  };

  const handleApplyPreset = (p: {
    topic: string;
    role: string;
    industry: string;
    purpose: EbookPurpose;
    chapters: number;
  }) => {
    setTopic(p.topic);
    setTargetRole(p.role);
    setIndustry(p.industry);
    setPurpose(p.purpose);
    setChapterCount(p.chapters);
    setErrorMessage(null);
  };

  // STEP 1 -> STEP 2: Generate Outline
  const handleGenerateOutline = async () => {
    if (!topic.trim()) {
      setErrorMessage('Please specify a publication topic or subject.');
      return;
    }

    setErrorMessage(null);
    setIsGeneratingOutline(true);

    try {
      const generatedOutline = await apiGenerateOutline({
        topic: topic.trim(),
        description: description.trim(),
        purpose,
        targetAudience: `${targetRole} in ${industry}`,
        language,
        tone,
        chapterCount,
        targetWordCount,
        complexity,
        sourceNotes: sourceNotes.trim(),
      });

      setOutline(generatedOutline);
      setChosenTitle(generatedOutline.selectedTitle || topic);
      setChosenSubtitle(generatedOutline.selectedSubtitle || `A Strategic Guide for ${targetRole}`);
      setEditableChapters(generatedOutline.chapters || []);
      setCurrentStep('outline');
    } catch (err: any) {
      console.error('Outline generation failed:', err);
      setErrorMessage(
        err.message || 'Failed to generate book outline. Please verify your connection and server configuration.'
      );
    } finally {
      setIsGeneratingOutline(false);
    }
  };

  // Quick 1-Click Full Book Generation
  const handleFastGenerate = async () => {
    if (!topic.trim()) {
      setErrorMessage('Please specify a publication topic or subject.');
      return;
    }

    setErrorMessage(null);
    setIsGeneratingOutline(true);

    try {
      const response = await apiGenerateFullEbook({
        topic: topic.trim(),
        targetRole,
        industry,
        tone,
        themeId: selectedThemeId,
      });

      const chosenTheme = THEMES[selectedThemeId] || THEMES.indigo;
      const fullBook: Book = {
        id: `book-${Date.now()}`,
        title: response.title || topic,
        subtitle: response.subtitle || `Strategic Guide for ${targetRole}`,
        author: response.author || authorName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        themeId: selectedThemeId,
        theme: chosenTheme,
        category: response.category || industry,
        tags: response.tags || ['Strategy', 'Playbook', 'Leadership'],
        readTimeMinutes: response.readTimeMinutes || 18,
        persona: response.persona || {
          targetRole,
          industry,
          mainPainPoint: painPoint,
          coreTransformation: transformation,
          idealAudienceDescription: `${targetRole} in ${industry}`,
        },
        chapters: response.chapters,
        purpose,
        language,
        tone,
        complexity,
      };

      setCreatedBook(fullBook);
      onBookCreated(fullBook);
      triggerConfetti();
      setCurrentStep('completed');
    } catch (err: any) {
      console.error('Fast generation failed:', err);
      setErrorMessage(
        err.message || 'Generation failed. Server returned an error without template fallback.'
      );
    } finally {
      setIsGeneratingOutline(false);
    }
  };

  // STEP 2 -> STEP 3: Progressive Chapter Synthesis
  const handleStartChapterGeneration = async () => {
    if (editableChapters.length === 0) {
      setErrorMessage('Please ensure at least one chapter exists in your outline.');
      return;
    }

    setErrorMessage(null);
    setCurrentStep('generating');
    setGeneratedChapters([]);
    setCurrentGeneratingChapterIdx(0);

    const chosenTheme = THEMES[selectedThemeId] || THEMES.indigo;
    const persona: DemographicPersona = {
      targetRole: targetRole.trim() || 'Senior Decision Makers',
      industry: industry.trim() || 'Technology & Business',
      mainPainPoint: painPoint.trim() || 'Accelerating predictable execution.',
      coreTransformation: transformation.trim() || 'Formalizing high-leverage frameworks.',
      idealAudienceDescription: `${targetRole} in ${industry}`,
    };

    const synthesizedChapters: Chapter[] = [];

    try {
      for (let i = 0; i < editableChapters.length; i++) {
        const outCh = editableChapters[i];
        setCurrentGeneratingChapterIdx(i);
        setGenerationProgressMessage(
          `Synthesizing Chapter ${i + 1} of ${editableChapters.length}: "${outCh.title}"...`
        );

        // Previous context summary
        const prevSummary = synthesizedChapters
          .map((c) => `Ch ${c.chapterNumber}: ${c.title} (${c.summaryBox})`)
          .join('\n');

        const newChapter = await apiGenerateChapter({
          bookTitle: chosenTitle,
          bookSubtitle: chosenSubtitle,
          author: authorName,
          targetAudience: `${persona.targetRole} in ${persona.industry}`,
          tone,
          language,
          chapterNumber: outCh.chapterNumber,
          chapterTitle: outCh.title,
          pillBadge: outCh.pillBadge || 'Strategy',
          objective: outCh.objective,
          keySubtopics: outCh.keySubtopics,
          previousChaptersSummary: prevSummary,
          sourceNotes,
        });

        synthesizedChapters.push(newChapter);
        setGeneratedChapters([...synthesizedChapters]);
      }

      // Calculate read time
      const totalWords = synthesizedChapters.reduce((acc, ch) => {
        const words = ch.subheadings.reduce((sAcc, s) => sAcc + s.content.split(/\s+/).length, 0);
        return acc + words;
      }, 0);
      const readMins = Math.max(8, Math.ceil(totalWords / 160));

      const completeBook: Book = {
        id: `book-${Date.now()}`,
        title: chosenTitle,
        subtitle: chosenSubtitle,
        author: authorName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        themeId: selectedThemeId,
        theme: chosenTheme,
        category: industry,
        tags: [purpose.replace('_', ' '), 'Playbook', 'Strategy'],
        readTimeMinutes: readMins,
        persona,
        chapters: synthesizedChapters,
        purpose,
        language,
        tone,
        complexity,
        sourceNotes,
      };

      setCreatedBook(completeBook);
      onBookCreated(completeBook);
      triggerConfetti();
      setCurrentStep('completed');
    } catch (err: any) {
      console.error('Progressive synthesis interrupted:', err);
      setErrorMessage(
        err.message || 'Chapter generation failed. Real error shown to avoid silent corruption.'
      );
      setCurrentStep('outline'); // Return to outline with state preserved
    }
  };

  // Outline Editing Helpers
  const handleUpdateChapter = (idx: number, field: keyof OutlineChapter, value: any) => {
    const updated = [...editableChapters];
    updated[idx] = { ...updated[idx], [field]: value };
    setEditableChapters(updated);
  };

  const handleAddOutlineChapter = () => {
    const nextNum = editableChapters.length + 1;
    const newCh: OutlineChapter = {
      chapterNumber: nextNum,
      title: `Chapter ${nextNum}: New Strategic Milestone`,
      pillBadge: 'Execution',
      objective: 'Provide tactical frameworks and quantitative metrics for this milestone.',
      keySubtopics: ['Core Framework', 'Implementation Protocol'],
      estimatedWords: targetWordCount,
    };
    setEditableChapters([...editableChapters, newCh]);
  };

  const handleRemoveOutlineChapter = (idxToRemove: number) => {
    if (editableChapters.length <= 1) {
      setErrorMessage('Outline must retain at least one chapter.');
      return;
    }
    const filtered = editableChapters
      .filter((_, idx) => idx !== idxToRemove)
      .map((ch, idx) => ({ ...ch, chapterNumber: idx + 1 }));
    setEditableChapters(filtered);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150 font-sans">
      <div
        className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-wizard-title"
      >
        {/* Header Strip */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-stone-400 block font-medium">
                Publishing Architecture Pipeline
              </span>
              <h2 id="create-wizard-title" className="text-base font-serif font-bold text-stone-900">
                {currentStep === 'spec' && 'Stage 1: Publication Specification & ICP Targeting'}
                {currentStep === 'outline' && 'Stage 2: Outline Approval & Chapter Architecture'}
                {currentStep === 'generating' && 'Stage 3: Progressive Chapter Synthesis'}
                {currentStep === 'completed' && 'Publication Complete & Bound'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Wizard Progress Indicator */}
        <div className="px-6 py-2.5 bg-stone-100/70 border-b border-stone-200/80 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-6">
            <span
              className={`flex items-center gap-1.5 ${
                currentStep === 'spec' ? 'text-stone-900 font-bold' : 'text-stone-400'
              }`}
            >
              <span>1. Specification</span>
            </span>
            <span className="text-stone-300">→</span>
            <span
              className={`flex items-center gap-1.5 ${
                currentStep === 'outline' ? 'text-stone-900 font-bold' : 'text-stone-400'
              }`}
            >
              <span>2. Outline &amp; TOC</span>
            </span>
            <span className="text-stone-300">→</span>
            <span
              className={`flex items-center gap-1.5 ${
                currentStep === 'generating' ? 'text-stone-900 font-bold' : 'text-stone-400'
              }`}
            >
              <span>3. Synthesis</span>
            </span>
          </div>

          <span className="text-stone-400 text-[11px]">Powered by Gemini 3.8 Flash</span>
        </div>

        {/* Error Notification Banner (Strict transparency, no fake fallbacks) */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold block">Generation Notification</span>
                <p className="text-rose-700 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-500 hover:text-rose-700 font-bold text-sm"
            >
              ×
            </button>
          </div>
        )}

        {/* Body content based on step */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* ===================================================================
              STAGE 1: SPECIFICATION & STRATEGY
          =================================================================== */}
          {currentStep === 'spec' && (
            <div className="space-y-6">
              {/* Presets */}
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase tracking-wider text-stone-500 font-medium block">
                  Quick Publication Presets
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    {
                      topic: 'Autonomous AI Agents in Enterprise Workflows',
                      role: 'VP of Engineering & Solution Architects',
                      industry: 'Enterprise Cloud & DevOps',
                      purpose: 'technical_handbook' as EbookPurpose,
                      chapters: 5,
                    },
                    {
                      topic: 'The Modern Fractional CMO Growth Playbook',
                      role: 'B2B Tech Founders & Marketing VPs',
                      industry: 'SaaS & Modern Commerce',
                      purpose: 'lead_magnet' as EbookPurpose,
                      chapters: 4,
                    },
                    {
                      topic: 'Zero-Trust Architecture for Distributed Teams',
                      role: 'CISOs & Information Security Leads',
                      industry: 'Fintech & Cloud Systems',
                      purpose: 'business_guide' as EbookPurpose,
                      chapters: 4,
                    },
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className="p-3 text-left bg-stone-50 hover:bg-stone-100/90 border border-stone-200 rounded-xl transition-all cursor-pointer space-y-1"
                    >
                      <div className="text-xs font-semibold text-stone-900 truncate">{p.topic}</div>
                      <div className="text-[11px] text-stone-500 truncate">{p.role}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Core Topic & Purpose */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-stone-500 font-medium">
                    Publication Topic / Focus *
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Modern Customer Success Flywheels for Enterprise SaaS"
                    className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-sm focus:ring-1 focus:ring-stone-900 focus:outline-none font-serif text-stone-900 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-stone-500 font-medium">
                    Format &amp; Purpose
                  </label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value as EbookPurpose)}
                    className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-xs sm:text-sm focus:ring-1 focus:ring-stone-900 focus:outline-none bg-white font-sans"
                  >
                    <option value="business_guide">Business Strategic Guide</option>
                    <option value="lead_magnet">High-Converting Lead Magnet</option>
                    <option value="educational">Educational Monograph</option>
                    <option value="technical_handbook">Technical Handbook</option>
                    <option value="self_help">Practical Playbook / Self-Help</option>
                    <option value="fiction">Narrative Case Study</option>
                  </select>
                </div>
              </div>

              {/* Target Demographic Persona (ICP) */}
              <div className="p-4 bg-stone-50/70 border border-stone-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-stone-700 font-medium text-xs">
                  <Users className="w-3.5 h-3.5 text-stone-500" />
                  <span>Target Demographic Persona (Ideal Customer Profile)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-mono text-stone-500">Target Role</label>
                    <input
                      type="text"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-mono text-stone-500">Industry / Sector</label>
                    <input
                      type="text"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-mono text-stone-500">Core Pain Point</label>
                    <input
                      type="text"
                      value={painPoint}
                      onChange={(e) => setPainPoint(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-mono text-stone-500">Core Transformation</label>
                    <input
                      type="text"
                      value={transformation}
                      onChange={(e) => setTransformation(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Content Configuration Parameters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-stone-500 font-medium">
                    Chapters ({chapterCount})
                  </label>
                  <select
                    value={chapterCount}
                    onChange={(e) => setChapterCount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white"
                  >
                    <option value={3}>3 Chapters (Concise)</option>
                    <option value={4}>4 Chapters (Standard)</option>
                    <option value={5}>5 Chapters (In-Depth)</option>
                    <option value={6}>6 Chapters (Comprehensive)</option>
                    <option value={8}>8 Chapters (Full Monograph)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-stone-500 font-medium">
                    Tone &amp; Style
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white"
                  >
                    <option value="Authoritative & Actionable">Authoritative & Actionable</option>
                    <option value="Conversational & Engaging">Conversational & Engaging</option>
                    <option value="Academic & Rigorous">Academic & Rigorous</option>
                    <option value="Provocative & Visionary">Provocative & Visionary</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-stone-500 font-medium">
                    Complexity
                  </label>
                  <select
                    value={complexity}
                    onChange={(e) => setComplexity(e.target.value as ContentComplexity)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white"
                  >
                    <option value="beginner">Beginner / Introductory</option>
                    <option value="intermediate">Intermediate / Practitioner</option>
                    <option value="advanced">Advanced / Executive Specialist</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-stone-500 font-medium">
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Portuguese">Portuguese</option>
                    <option value="Japanese">Japanese</option>
                  </select>
                </div>
              </div>

              {/* Theme & Binding Selection */}
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase tracking-wider text-stone-500 font-medium block">
                  Document Binding &amp; Cover Palette
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {Object.values(THEMES).map((thm) => (
                    <button
                      key={thm.id}
                      type="button"
                      onClick={() => setSelectedThemeId(thm.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                        selectedThemeId === thm.id
                          ? 'border-stone-900 ring-2 ring-stone-900/10 bg-stone-50'
                          : 'border-stone-200 bg-white hover:border-stone-300'
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
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Research Notes / Source Material */}
              <div className="space-y-1">
                <label className="block text-xs font-mono uppercase tracking-wider text-stone-500 font-medium">
                  Author's Research Notes / Raw Source Material (Optional)
                </label>
                <textarea
                  rows={2}
                  value={sourceNotes}
                  onChange={(e) => setSourceNotes(e.target.value)}
                  placeholder="Paste transcripts, bullet points, client case studies, or thesis statements to ground the publication..."
                  className="w-full p-3 border border-stone-200 rounded-xl text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* ===================================================================
              STAGE 2: EDITABLE OUTLINE & TOC APPROVAL
          =================================================================== */}
          {currentStep === 'outline' && outline && (
            <div className="space-y-6">
              {/* Title & Subtitle Proposals */}
              <div className="space-y-3 p-4 bg-stone-50 rounded-2xl border border-stone-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-stone-500 font-semibold">
                    Step 1: Choose or Refine Working Title
                  </span>
                  <span className="text-[11px] font-mono text-stone-400">
                    {outline.suggestedTitles?.length || 0} proposals generated
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {outline.suggestedTitles?.map((prop, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setChosenTitle(prop.title);
                        setChosenSubtitle(prop.subtitle);
                      }}
                      className={`p-3 text-left rounded-xl border transition-all cursor-pointer space-y-1 ${
                        chosenTitle === prop.title
                          ? 'border-stone-900 ring-2 ring-stone-900/10 bg-white'
                          : 'border-stone-200 bg-white/70 hover:bg-white'
                      }`}
                    >
                      <div className="text-xs font-serif font-bold text-stone-900">{prop.title}</div>
                      <div className="text-[11px] text-stone-600 line-clamp-2">{prop.subtitle}</div>
                      <div className="text-[10px] text-stone-400 italic pt-1 border-t border-stone-100">
                        {prop.rationale}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Editable Title Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-stone-500">Selected Title</label>
                    <input
                      type="text"
                      value={chosenTitle}
                      onChange={(e) => setChosenTitle(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-serif font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-stone-500">Selected Subtitle</label>
                    <input
                      type="text"
                      value={chosenSubtitle}
                      onChange={(e) => setChosenSubtitle(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Editable Table of Contents */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-wider text-stone-500 font-semibold block">
                      Step 2: Table of Contents &amp; Chapter Architecture
                    </span>
                    <span className="text-xs text-stone-500">
                      Approve, edit, or reorder chapters before progressive synthesis begins.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddOutlineChapter}
                    className="text-xs font-mono text-stone-900 hover:text-stone-700 font-semibold flex items-center gap-1 cursor-pointer bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Chapter</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {editableChapters.map((ch, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-white border border-stone-200 rounded-xl space-y-2.5 shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="font-mono text-xs font-bold text-stone-400">
                            0{ch.chapterNumber}.
                          </span>
                          <input
                            type="text"
                            value={ch.title}
                            onChange={(e) => handleUpdateChapter(idx, 'title', e.target.value)}
                            className="flex-1 px-3 py-1 bg-stone-50 border border-stone-200 rounded-lg text-xs font-serif font-bold text-stone-900"
                          />
                        </div>

                        <input
                          type="text"
                          value={ch.pillBadge}
                          onChange={(e) => handleUpdateChapter(idx, 'pillBadge', e.target.value)}
                          placeholder="Stage badge"
                          className="w-28 px-2.5 py-1 bg-stone-50 border border-stone-200 rounded-lg text-[11px] font-mono text-center"
                        />

                        {editableChapters.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOutlineChapter(idx)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove chapter"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-1">
                        <textarea
                          rows={2}
                          value={ch.objective}
                          onChange={(e) => handleUpdateChapter(idx, 'objective', e.target.value)}
                          placeholder="Chapter transformation objective..."
                          className="w-full p-2 bg-stone-50/60 border border-stone-200 rounded-lg text-xs text-stone-700 font-sans"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              STAGE 3: PROGRESSIVE CHAPTER SYNTHESIS
          =================================================================== */}
          {currentStep === 'generating' && (
            <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-stone-900 text-white flex items-center justify-center shadow-lg animate-pulse">
                <Loader2 className="w-8 h-8 animate-spin text-amber-300" />
              </div>

              <div className="space-y-2 max-w-md">
                <span className="text-xs font-mono uppercase tracking-widest text-stone-400 font-medium">
                  Progressive Synthesis Pipeline
                </span>
                <h3 className="text-xl font-serif font-bold text-stone-900">
                  {generationProgressMessage || 'Synthesizing publication chapters...'}
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Generating deep subheadings, executive memoranda, pull quotes, and actionable checklists with contextual continuity.
                </p>
              </div>

              {/* Progress Tracker */}
              <div className="w-full max-w-md space-y-2 pt-4">
                <div className="flex items-center justify-between text-xs font-mono text-stone-500">
                  <span>
                    Chapter {generatedChapters.length} of {editableChapters.length} completed
                  </span>
                  <span>
                    {Math.round((generatedChapters.length / Math.max(1, editableChapters.length)) * 100)}%
                  </span>
                </div>

                <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-stone-900 h-2 transition-all duration-300 rounded-full"
                    style={{
                      width: `${(generatedChapters.length / Math.max(1, editableChapters.length)) * 100}%`,
                    }}
                  />
                </div>

                {/* Stream of completed chapters */}
                <div className="pt-4 space-y-1.5 text-left text-xs">
                  {generatedChapters.map((ch, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-900"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-medium truncate max-w-xs">
                          Ch 0{ch.chapterNumber}: {ch.title}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-emerald-700">Bound to Cloud</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              STAGE 4: COMPLETED PUBLICATION
          =================================================================== */}
          {currentStep === 'completed' && createdBook && (
            <div className="py-8 flex flex-col items-center justify-center space-y-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1.5 max-w-lg">
                <span className="text-xs font-mono uppercase tracking-widest text-emerald-700 font-bold">
                  Publication Verified &amp; Saved to Firestore
                </span>
                <h3 className="text-2xl font-serif font-bold text-stone-900">
                  {createdBook.title}
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-sans">
                  {createdBook.subtitle}
                </p>
              </div>

              <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl w-full max-w-md text-xs font-mono text-stone-600 flex items-center justify-around">
                <div>
                  <div className="text-stone-400 text-[10px]">Chapters</div>
                  <div className="text-sm font-bold text-stone-900">{createdBook.chapters.length}</div>
                </div>
                <div className="h-6 w-px bg-stone-200" />
                <div>
                  <div className="text-stone-400 text-[10px]">Read Time</div>
                  <div className="text-sm font-bold text-stone-900">{createdBook.readTimeMinutes} mins</div>
                </div>
                <div className="h-6 w-px bg-stone-200" />
                <div>
                  <div className="text-stone-400 text-[10px]">Cloud Sync</div>
                  <div className="text-sm font-bold text-emerald-700">Firestore Active</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-medium transition-colors shadow-xs cursor-pointer"
                >
                  Return to Studio Workbench
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          <div>
            {currentStep === 'outline' && (
              <button
                type="button"
                onClick={() => setCurrentStep('spec')}
                className="px-3.5 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Specifications</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {currentStep === 'spec' && (
              <>
                <button
                  type="button"
                  onClick={handleFastGenerate}
                  disabled={isGeneratingOutline}
                  className="px-3.5 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Direct 1-Click Synthesis"
                >
                  <Wand2 className="w-3.5 h-3.5 text-stone-500" />
                  <span>1-Click Synthesis</span>
                </button>

                <button
                  type="button"
                  onClick={handleGenerateOutline}
                  disabled={isGeneratingOutline}
                  className="px-4 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 active:scale-[0.99]"
                >
                  {isGeneratingOutline ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Formulating Outline...</span>
                    </>
                  ) : (
                    <>
                      <span>Generate Outline &amp; TOC</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </>
            )}

            {currentStep === 'outline' && (
              <button
                type="button"
                onClick={handleStartChapterGeneration}
                className="px-5 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-xs active:scale-[0.99]"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Synthesize {editableChapters.length} Chapters</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
