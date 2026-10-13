import React, { useState } from 'react';
import {
  FileDown,
  Printer,
  X,
  ZoomIn,
  ZoomOut,
  Info,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import { Book } from '../types/book';
import { downloadBookPdf } from '../utils/pdfGenerator';

interface PrintPreviewViewProps {
  book: Book;
  onExit: () => void;
}

export const PrintPreviewView: React.FC<PrintPreviewViewProps> = ({ book, onExit }) => {
  const [zoomLevel, setZoomLevel] = useState<number>(90);
  const [printNotice, setPrintNotice] = useState<string | null>(null);

  const handlePrintDialog = () => {
    try {
      window.print();
    } catch {
      setPrintNotice(
        'Browser iframe sandbox restricted direct window.print(). Please use "Download PDF File" for direct vector export.'
      );
      setTimeout(() => setPrintNotice(null), 5000);
    }
  };

  const handleDownloadPdf = () => {
    downloadBookPdf(book);
  };

  const totalPages = book.chapters.length + 2;

  return (
    <div className="fixed inset-0 z-50 bg-[#e5e2da] overflow-y-auto flex flex-col items-center select-none font-sans">
      {/* Floating Proofing Masthead */}
      <header className="sticky top-0 z-30 w-full bg-[#18181b] border-b border-stone-800 px-6 py-3 shadow-lg text-stone-100">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Document & Proofing Info */}
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs uppercase text-stone-400">
              Print Proofing
            </span>
            <span aria-hidden="true" className="text-stone-700">·</span>
            <span className="font-serif font-medium text-sm text-stone-100 truncate max-w-xs sm:max-w-md">
              {book.title}
            </span>
            <span className="text-[11px] font-mono text-stone-500 hidden md:inline">
              (A4 · {totalPages} Pages)
            </span>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-stone-900 border border-stone-800 rounded-lg p-0.5 text-xs text-stone-300">
            <button
              onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
              className="p-1 hover:text-white rounded"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs px-2 font-mono">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
              className="p-1 hover:text-white rounded"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="px-3.5 py-1.5 rounded-lg bg-stone-100 hover:bg-white text-stone-900 font-medium text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Download PDF File</span>
            </button>

            <button
              onClick={handlePrintDialog}
              className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 font-medium text-xs border border-stone-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Dialog</span>
            </button>

            <button
              onClick={onExit}
              className="p-1.5 text-stone-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Exit proofing view"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notice toast */}
        {printNotice && (
          <div className="max-w-xl mx-auto mt-2 p-2 bg-amber-950/80 border border-amber-800 rounded-lg text-amber-200 text-xs flex items-center gap-2">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>{printNotice}</span>
          </div>
        )}
      </header>

      {/* Paginated Sheets Canvas */}
      <main
        className="w-full flex-1 p-8 md:p-12 flex flex-col items-center gap-12"
        style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
      >
        {/* ========================================================= */}
        {/* SHEET 1: COVER PAGE */}
        {/* ========================================================= */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-stone-500">
            Sheet 01 / Monograph Cover (Full Color)
          </span>
          <section
            aria-label="Cover Page Proof"
            className="w-[210mm] min-h-[297mm] h-[297mm] bg-white shadow-xl relative overflow-hidden flex flex-col justify-between p-14 text-white shrink-0"
            style={{ background: book.theme.coverBg }}
          >
            {/* Spine Fold Indentation */}
            <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/40 via-black/10 to-transparent pointer-events-none" />
            {/* Hairline Border Frame */}
            <div className="absolute inset-4 border border-white/20 pointer-events-none rounded-sm" />

            <div className="relative z-10 space-y-6">
              <div className="text-xs font-mono uppercase tracking-widest text-white/80">
                {book.category} · Volume I
              </div>

              <div className="space-y-4 pt-4">
                <h1 className="text-4xl font-serif font-bold tracking-tight leading-tight text-white">
                  {book.title}
                </h1>
                <div
                  className="w-12 h-0.5"
                  style={{ background: book.theme.accentColor }}
                />
                <p className="text-base text-stone-200 font-light leading-relaxed max-w-lg">
                  {book.subtitle}
                </p>
              </div>
            </div>

            {/* Center Transformation Callout */}
            <div className="relative z-10 p-6 rounded-xl bg-black/25 backdrop-blur-xs border border-white/15 space-y-2">
              <span
                className="text-[10px] font-mono tracking-widest uppercase block"
                style={{ color: book.theme.accentColor }}
              >
                Target Strategic Transformation
              </span>
              <p className="text-sm font-serif italic text-stone-100 leading-relaxed">
                "{book.persona.coreTransformation}"
              </p>
            </div>

            {/* Bottom Metadata */}
            <div className="relative z-10 pt-6 border-t border-white/20 flex items-end justify-between text-xs">
              <div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-stone-300 block">
                  Author &amp; Compilation
                </span>
                <p className="text-lg font-serif font-semibold text-white mt-0.5">{book.author}</p>
                <p className="text-xs text-stone-300 mt-0.5">
                  Target ICP: {book.persona.targetRole}
                </p>
              </div>
              <div className="text-right text-stone-300 font-mono text-[11px] space-y-0.5">
                <div>4 Action Chapters</div>
                <div>Read Time: ~{book.readTimeMinutes} mins</div>
              </div>
            </div>
          </section>
        </div>

        {/* ========================================================= */}
        {/* SHEET 2: TABLE OF CONTENTS & PERSONA */}
        {/* ========================================================= */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-stone-500">
            Sheet 02 / Contents &amp; Strategic Alignment
          </span>
          <section
            aria-label="Table of Contents Proof"
            className="w-[210mm] min-h-[297mm] h-[297mm] bg-white shadow-xl p-14 flex flex-col justify-between shrink-0 text-stone-900"
          >
            <div>
              {/* Running Header */}
              <div className="flex items-center justify-between text-[11px] text-stone-400 border-b border-stone-200 pb-2 mb-8 font-mono">
                <span className="uppercase tracking-wider truncate max-w-sm">{book.title}</span>
                <span className="uppercase tracking-wider">Contents &amp; ICP</span>
              </div>

              <h2 className="text-2xl font-serif font-bold mb-6 text-stone-900">
                Table of Contents
              </h2>

              {/* TOC Entries */}
              <div className="space-y-3 mb-10 text-sm">
                <div className="flex items-baseline justify-between py-1.5 border-b border-stone-100">
                  <span className="font-medium text-stone-800">
                    Demographic Persona &amp; Strategic ICP
                  </span>
                  <span className="font-mono text-stone-400 text-xs">Page 2</span>
                </div>
                {book.chapters.map((ch, idx) => (
                  <div
                    key={ch.chapterNumber}
                    className="flex items-baseline justify-between py-1.5 border-b border-stone-100"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-stone-400">0{ch.chapterNumber}.</span>
                      <span className="font-medium text-stone-900">{ch.title}</span>
                      <span className="text-xs text-stone-400 font-mono">[{ch.pillBadge}]</span>
                    </div>
                    <span className="font-mono text-stone-400 text-xs">Page {idx + 3}</span>
                  </div>
                ))}
              </div>

              {/* Demographic Persona Summary Box */}
              <div className="rounded-xl border border-stone-200 p-6 bg-stone-50/80 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-stone-600 font-semibold">
                    Strategic Demographic Persona
                  </span>
                  <span className="text-[10px] font-mono text-stone-400">TARGET ICP</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-mono text-stone-400 block mb-0.5">Target Role</span>
                    <p className="font-medium text-stone-800">{book.persona.targetRole}</p>
                  </div>
                  <div>
                    <span className="font-mono text-stone-400 block mb-0.5">Industry Sector</span>
                    <p className="font-medium text-stone-800">{book.persona.industry}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="font-mono text-stone-400 block mb-0.5">Core Pain Point</span>
                    <p className="text-stone-700 leading-relaxed">{book.persona.mainPainPoint}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="font-mono text-stone-400 block mb-0.5">Target Transformation</span>
                    <p className="font-serif italic text-stone-900 leading-relaxed">
                      "{book.persona.coreTransformation}"
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="font-mono text-stone-400 block mb-0.5">Audience Profile</span>
                    <p className="text-stone-600 leading-relaxed">{book.persona.idealAudienceDescription}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Running Footer */}
            <div className="flex items-center justify-between text-[11px] text-stone-400 border-t border-stone-200 pt-3 font-mono">
              <span>PageCraft Publishing Studio</span>
              <span>Page 2</span>
            </div>
          </section>
        </div>

        {/* ========================================================= */}
        {/* SHEETS 3+: 4 FORMATTED CHAPTERS */}
        {/* ========================================================= */}
        {book.chapters.map((ch, idx) => (
          <div key={ch.chapterNumber} className="flex flex-col items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-stone-500">
              Sheet 0{idx + 3} / Chapter {ch.chapterNumber} Proof
            </span>
            <section
              aria-label={`Chapter ${ch.chapterNumber} Proof`}
              className="w-[210mm] min-h-[297mm] bg-white shadow-xl p-14 flex flex-col justify-between shrink-0 text-stone-900"
            >
              <div>
                {/* Running Header */}
                <div className="flex items-center justify-between text-[11px] text-stone-400 border-b border-stone-200 pb-2 mb-6 font-mono">
                  <span className="uppercase tracking-wider truncate max-w-sm">{book.title}</span>
                  <span className="uppercase tracking-wider">Chapter 0{ch.chapterNumber}</span>
                </div>

                <div className="mb-2 text-xs font-mono uppercase tracking-widest text-stone-400">
                  Chapter 0{ch.chapterNumber} · {ch.pillBadge}
                </div>

                <h2 className="text-2xl font-serif font-bold tracking-tight mb-4 text-stone-900">
                  {ch.title}
                </h2>

                {/* Summary Box */}
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 mb-6 space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider block text-stone-500">
                    Executive Summary
                  </span>
                  <p className="text-xs font-serif italic text-stone-800 leading-relaxed">
                    {ch.summaryBox}
                  </p>
                </div>

                {/* Subheadings */}
                <div className="space-y-4 mb-6">
                  {ch.subheadings.map((sub, sIdx) => (
                    <div key={sIdx} className="space-y-1.5">
                      <h3 className="text-sm font-serif font-bold text-stone-900">{sub.title}</h3>
                      <p className="text-xs text-stone-700 leading-relaxed text-justify">
                        {sub.content}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Pull Quote */}
                {ch.quote?.text && (
                  <div className="py-4 my-6 border-y border-stone-200 text-center space-y-1.5">
                    <blockquote className="text-sm font-serif italic text-stone-900 leading-relaxed">
                      "{ch.quote.text}"
                    </blockquote>
                    {ch.quote.attribution && (
                      <cite className="block text-[10px] font-mono text-stone-400 not-italic">
                        — {ch.quote.attribution}
                      </cite>
                    )}
                  </div>
                )}

                {/* Takeaways */}
                {ch.bulletPoints?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-stone-100">
                    <h4 className="text-xs font-mono uppercase tracking-wider mb-2 text-stone-500">
                      Key Takeaways
                    </h4>
                    <ul className="space-y-1.5 text-xs text-stone-700">
                      {ch.bulletPoints.map((bp, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-2">
                          <span className="font-mono text-stone-400 text-[10px] mt-0.5">
                            0{bIdx + 1}.
                          </span>
                          <span>{bp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Running Footer */}
              <div className="flex items-center justify-between text-[11px] text-stone-400 border-t border-stone-200 pt-3 mt-8 font-mono">
                <span>PageCraft Publishing Studio</span>
                <span>Page {idx + 3}</span>
              </div>
            </section>
          </div>
        ))}
      </main>
    </div>
  );
};
