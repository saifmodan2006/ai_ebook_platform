import React, { useState } from 'react';
import {
  X,
  Sparkles,
  BookOpen,
  AlertCircle,
  Cpu,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Book } from '../types/book';
import { THEMES } from '../utils/themes';

interface CreateBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookCreated: (newBook: Book) => void;
}

export const CreateBookModal: React.FC<CreateBookModalProps> = ({
  isOpen,
  onClose,
  onBookCreated,
}) => {
  const [topic, setTopic] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [industry, setIndustry] = useState('');
  const [tone, setTone] = useState('Authoritative & Actionable');
  const [selectedThemeId, setSelectedThemeId] = useState('indigo');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const samplePrompts = [
    {
      topic: 'Autonomous AI Agents in Enterprise Workflows',
      role: 'VP of Engineering & Solution Architects',
      industry: 'Enterprise Cloud & DevOps',
    },
    {
      topic: 'The Modern Fractional CMO Blueprint',
      role: 'B2B Founders & Marketing Leaders',
      industry: 'Direct-To-Consumer & SaaS',
    },
    {
      topic: 'Zero-Trust Security for Distributed Organizations',
      role: 'Chief Information Security Officers (CISOs)',
      industry: 'Fintech & Cloud Systems',
    },
  ];

  const handleApplyPreset = (p: { topic: string; role: string; industry: string }) => {
    setTopic(p.topic);
    setTargetRole(p.role);
    setIndustry(p.industry);
  };

  const handleGenerate = async (useAiApi: boolean) => {
    if (!topic.trim()) {
      setErrorMessage('Please provide a publication topic or title.');
      return;
    }

    setErrorMessage(null);
    setIsGenerating(true);
    setGenerationStep('01. Architecting Demographic ICP & Positioning...');

    const chosenTheme = THEMES[selectedThemeId] || THEMES.indigo;
    const finalRole = targetRole.trim() || 'Senior Decision Makers & Team Leads';
    const finalIndustry = industry.trim() || 'Technology & Modern Business';

    if (useAiApi) {
      try {
        setGenerationStep('02. Synthesizing 4 Chapters via Gemini 3.8 Flash...');
        const res = await fetch('/api/gemini/generate-ebook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic,
            targetRole: finalRole,
            industry: finalIndustry,
            tone,
            themeId: selectedThemeId,
          }),
        });

        const data = await res.json();
        if (data.success && data.data) {
          const generated = data.data;
          const newBook: Book = {
            id: `book-${Date.now()}`,
            title: generated.title || topic,
            subtitle: generated.subtitle || `A Strategic Guide for ${finalRole}`,
            author: generated.author || 'PageCraft Editorial Board',
            createdAt: new Date().toISOString(),
            themeId: selectedThemeId,
            theme: chosenTheme,
            category: generated.category || finalIndustry,
            tags: generated.tags || ['Strategy', 'Playbook', 'Leadership'],
            readTimeMinutes: generated.readTimeMinutes || 18,
            persona: generated.persona,
            chapters: generated.chapters,
          };

          triggerConfetti();
          onBookCreated(newBook);
          onClose();
          return;
        } else {
          throw new Error(data.error || 'Server Gemini API fallback');
        }
      } catch (err: any) {
        console.warn('Falling back to strategic synthesis engine:', err.message);
        setGenerationStep('02. Synthesizing via Strategic Synthesis Engine...');
        await new Promise((r) => setTimeout(r, 600));
      }
    } else {
      await new Promise((r) => setTimeout(r, 800));
    }

    setGenerationStep('03. Binding Cover Palette & Executive Memoranda...');
    await new Promise((r) => setTimeout(r, 500));

    const fallbackBook: Book = {
      id: `book-${Date.now()}`,
      title: topic.length > 40 ? topic : `${topic}: The Strategic Blueprint`,
      subtitle: `Actionable Frameworks and Operational Playbooks for ${finalRole}`,
      author: 'Aria Sterling & PageCraft Editorial',
      createdAt: new Date().toISOString(),
      themeId: selectedThemeId,
      theme: chosenTheme,
      category: finalIndustry,
      tags: ['Executive Playbook', 'Strategy', 'Transformation'],
      readTimeMinutes: 16,
      persona: {
        targetRole: finalRole,
        industry: finalIndustry,
        mainPainPoint: `Struggling to reconcile rapid industry shifts with predictable operational execution and team alignment.`,
        coreTransformation: `Transition from ad-hoc reactive problem-solving to a formalized, repeatable framework that unlocks 10x ROI.`,
        idealAudienceDescription: `${finalRole} operating within ${finalIndustry} seeking capital-efficient scaling levers without compromising quality.`,
      },
      chapters: [
        {
          chapterNumber: 1,
          title: `Foundations of Modern ${topic.slice(0, 24)}`,
          pillBadge: 'Foundation',
          summaryBox: `Deconstruct the baseline principles and eliminate obsolete legacy assumptions to establish a high-leverage operational foundation.`,
          subheadings: [
            {
              title: 'Diagnosing the Structural Friction Points',
              content: `Organizations often mistake symptoms for root causes. When velocity slows down, leadership reflexively hires more personnel or purchases additional point solutions. True leverage begins with auditing your core information pipelines and eliminating artificial bottlenecks before scaling volume.`,
            },
            {
              title: 'The Shift to High-Leverage Systems',
              content: `Tactics decay rapidly as market conditions fluctuate, but robust architectural frameworks endure. By establishing unambiguous objective criteria, teams gain the psychological safety and operational autonomy needed to move decisively.`,
            },
          ],
          quote: {
            text: `Simplicity is the prerequisite for speed. Complexity is merely a refuge for unrefined thinking.`,
            attribution: 'Strategic Leadership Review',
          },
          bulletPoints: [
            'Audit current workflow dependencies and eliminate duplicate verification steps.',
            'Establish a centralized single source of operational truth for all stakeholders.',
            'Define unambiguous quantitative success thresholds for 30-day checkpoint milestones.',
          ],
        },
        {
          chapterNumber: 2,
          title: 'Strategic Implementation & Cadence',
          pillBadge: 'Execution',
          summaryBox: `Deploy lightweight iterative experiments that validate key assumptions with minimal capital expenditure.`,
          subheadings: [
            {
              title: 'The 14-Day Validation Sprint',
              content: `Rather than embarking on multi-quarter roadmaps based on speculative forecasts, divide strategic goals into discrete, verifiable sprints. Each sprint must deliver customer-facing or internal stakeholder utility that can be measured empirically.`,
            },
            {
              title: 'Cross-Functional Governance and Buy-In',
              content: `Initiatives fail not from technical deficiencies, but from fractured alignment. Cultivate stakeholder champions early by highlighting how the new framework reduces repetitive toil and protects their quarterly objectives.`,
            },
          ],
          quote: {
            text: `Execution is not about doing everything; it is about relentlessly protecting focus on the vital few initiatives.`,
            attribution: 'Executive Director Insights',
          },
          bulletPoints: [
            'Structure weekly synchronous check-ins limited to blocker resolution and metric tracking.',
            'Deploy pilot initiatives to a small, high-trust cohort before organization-wide rollout.',
            'Document every decision rationale openly in an asynchronous team knowledge base.',
          ],
        },
        {
          chapterNumber: 3,
          title: 'Measurement, Analytics & Governance',
          pillBadge: 'Optimization',
          summaryBox: `Build real-time observability telemetry to identify performance drift before it impacts key results.`,
          subheadings: [
            {
              title: 'Constructing the Leading Indicator Dashboard',
              content: `Lagging metrics (revenue, closed deals, retention) tell you what happened yesterday. Leading indicators (weekly active engagement, cycle time, qualitative sentiment) alert you to impending disruptions before they crystallize into crises.`,
            },
            {
              title: 'Algorithmic Feedback Loops',
              content: `Instrument telemetry across every touchpoint. When variance from baseline exceeds standard deviation limits, trigger automated retrospectives to inspect the underlying workflow.`,
            },
          ],
          quote: {
            text: `What gets measured with precision gets improved with certainty.`,
            attribution: 'Analytics Benchmark Group',
          },
          bulletPoints: [
            'Consolidate metrics into an executive dashboard updated automatically every 24 hours.',
            'Conduct quarterly risk assessments to evaluate tool fatigue and resource strain.',
            'Incentivize team members on efficiency metrics rather than raw activity volume.',
          ],
        },
        {
          chapterNumber: 4,
          title: 'Scale, Resilience & Sustainable Mastery',
          pillBadge: 'Mastery',
          summaryBox: `Institutionalize lessons learned into an enduring competitive moat that compounds value over time.`,
          subheadings: [
            {
              title: 'Building Anti-Fragile Operating Systems',
              content: `A resilient organization withstands shocks; an anti-fragile organization grows stronger because of them. Cultivate adaptive routines that treat anomalous outcomes as valuable training data for systemic refinement.`,
            },
            {
              title: 'The Long-Term Compounding Advantage',
              content: `When your team consistently executes high-leverage habits without executive micromanagement, your capacity to absorb new initiatives expands exponentially compared to competitors burdened by bureaucratic inertia.`,
            },
          ],
          quote: {
            text: `Excellence is not an accident; it is the compounding output of deliberate architectural discipline.`,
            attribution: 'PageCraft Strategic Insights',
          },
          bulletPoints: [
            'Codify operational playbooks into living documentation updated after every major project.',
            'Promote internal champions who demonstrate mastery of core principles to mentor new hires.',
            'Continuously prune low-value rituals to preserve cognitive capacity for high-impact innovation.',
          ],
        },
      ],
    };

    triggerConfetti();
    onBookCreated(fallbackBook);
    onClose();
  };

  const triggerConfetti = () => {
    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150 font-sans">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-book-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-stone-400 block">
              Manuscript Architect
            </span>
            <h2 id="create-book-title" className="text-base font-serif font-bold text-stone-900">
              Create 4-Chapter Publication
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Inspiration Presets */}
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-stone-400 block">
              Curated Monograph Presets
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="p-3 text-left rounded-xl border border-stone-200 hover:border-stone-400 bg-stone-50/60 hover:bg-stone-50 transition-colors text-xs space-y-1 cursor-pointer"
                >
                  <div className="font-serif font-semibold text-stone-900 line-clamp-1">{p.topic}</div>
                  <div className="text-[11px] text-stone-500 font-mono truncate">{p.role}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Working Title / Topic */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono uppercase tracking-wider text-stone-600 font-semibold">
              Manuscript Topic or Working Title *
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Modern AI Product Architecture, B2B Expansion Playbook..."
              className="w-full px-3.5 py-2.5 bg-stone-50/50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white transition-all font-serif"
            />
          </div>

          {/* Persona Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-mono uppercase tracking-wider text-stone-600 font-semibold">
                Target Role / ICP
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. VP of Growth, Staff Engineer, Founder"
                className="w-full px-3.5 py-2 bg-stone-50/50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono uppercase tracking-wider text-stone-600 font-semibold">
                Industry Sector
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Cloud Infrastructure, B2B SaaS, HealthTech"
                className="w-full px-3.5 py-2 bg-stone-50/50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Tone Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono uppercase tracking-wider text-stone-600 font-semibold">
              Editorial Cadence &amp; Tone
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                'Authoritative & Actionable',
                'Deeply Technical',
                'Inspirational & Bold',
                'Concise & Tactical',
              ].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={`py-2 px-2 text-xs rounded-lg border text-center transition-colors ${
                    tone === t
                      ? 'bg-stone-900 border-stone-900 text-white font-medium'
                      : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Binding Swatches */}
          <div className="space-y-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-stone-600 font-semibold">
              Visual Binding &amp; Cover Palette
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {Object.values(THEMES).map((thm) => (
                <button
                  key={thm.id}
                  type="button"
                  onClick={() => setSelectedThemeId(thm.id)}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    selectedThemeId === thm.id
                      ? 'border-stone-900 ring-1 ring-stone-900 bg-stone-50'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
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

          {/* Generation Progress Indicator */}
          {isGenerating && (
            <div className="p-4 rounded-xl bg-stone-100 border border-stone-200 text-xs text-stone-800 space-y-1 animate-pulse">
              <span className="font-mono uppercase text-[10px] text-stone-500 block">
                Synthesis Pipeline Active
              </span>
              <p className="font-medium text-stone-900">{generationStep}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-[11px] font-mono text-stone-500 text-center sm:text-left">
            Compiles 4 chapters, summary boxes, pull quotes &amp; actionable bullet points.
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleGenerate(false)}
              disabled={isGenerating}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 font-medium text-xs transition-colors cursor-pointer"
            >
              Instant Synthesis
            </button>

            <button
              type="button"
              onClick={() => handleGenerate(true)}
              disabled={isGenerating}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>{isGenerating ? 'Synthesizing...' : 'Generate with Gemini AI'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
