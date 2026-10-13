import React, { useState } from 'react';
import {
  X,
  FileDown,
  Printer,
  FileText,
  FileCode,
  Database,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { Book } from '../types/book';
import { downloadBookPdf } from '../utils/pdfGenerator';
import {
  downloadMarkdown,
  downloadPlainText,
  downloadJsonBackup,
  generateMarkdown,
  generatePlainText,
} from '../utils/textExports';

interface ExportCenterModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenPrintPreview: (book: Book) => void;
}

export const ExportCenterModal: React.FC<ExportCenterModalProps> = ({
  book,
  isOpen,
  onClose,
  onOpenPrintPreview,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [previewTab, setPreviewTab] = useState<'none' | 'md' | 'txt' | 'json'>('none');

  if (!isOpen || !book) return null;

  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    setTimeout(() => {
      try {
        downloadBookPdf(book);
      } catch (err) {
        console.error('PDF generation error:', err);
      } finally {
        setIsGeneratingPdf(false);
      }
    }, 150);
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150 font-sans">
      <div
        className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
      >
        {/* Masthead Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-stone-400 block">
              Publishing Hub
            </span>
            <h2 id="export-modal-title" className="text-base font-serif font-bold text-stone-900">
              Export Monograph &amp; Assets
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Publication Metadata Strip */}
          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/60 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="font-serif font-semibold text-stone-900 block text-sm">{book.title}</span>
              <span className="text-stone-500 font-mono">By {book.author} · {book.chapters.length} Chapters</span>
            </div>
            <div className="text-right text-stone-500 font-mono text-[11px]">
              <div>Theme: {book.theme.name}</div>
              <div>ICP: {book.persona.targetRole}</div>
            </div>
          </div>

          {/* Primary Featured: Direct Formatted PDF (jsPDF) */}
          <div className="p-5 rounded-xl border border-stone-300 bg-white shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="font-semibold text-stone-900">DIRECT VECTOR PDF</span>
                  <span aria-hidden="true" className="text-stone-300">·</span>
                  <span className="text-emerald-700 font-medium">Bypasses Iframe Sandbox</span>
                </div>
                <h4 className="text-sm font-serif font-bold text-stone-900">
                  Publication-Ready Multi-Page A4 Document
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed max-w-lg">
                  Generates vector text and shapes in-browser via jsPDF. Includes a full-color theme cover page, running headers with page numbers, formatted Table of Contents, demographic ICP memorandum, and 4 formatted chapters.
                </p>
              </div>

              <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  className="px-4 py-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download Formatted PDF'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPrintPreview(book);
                  }}
                  className="px-4 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-stone-500" />
                  <span>Open Print Proof</span>
                </button>
              </div>
            </div>
          </div>

          {/* Secondary Formats Grid */}
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-stone-400 mb-3">
              Source Code &amp; Manuscript Formats
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Markdown Card */}
              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 flex flex-col justify-between space-y-3">
                <div>
                  <div className="font-semibold text-stone-900 mb-0.5">Markdown (.md)</div>
                  <p className="text-stone-500 leading-normal">
                    Complete manuscript with YAML frontmatter, headings, quotes, and takeaways.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 pt-2 border-t border-stone-200/60">
                  <button
                    onClick={() => downloadMarkdown(book)}
                    className="flex-1 py-1.5 px-2 bg-stone-200/80 hover:bg-stone-300 text-stone-800 rounded-md font-medium text-[11px] transition-colors flex items-center justify-center gap-1"
                  >
                    <FileDown className="w-3 h-3" />
                    Download
                  </button>
                  <button
                    onClick={() => handleCopy(generateMarkdown(book), 'md')}
                    className="p-1.5 text-stone-500 hover:text-stone-800 rounded-md hover:bg-stone-200/60 transition-colors"
                    title="Copy Markdown"
                  >
                    {copiedType === 'md' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => setPreviewTab(previewTab === 'md' ? 'none' : 'md')}
                    className="text-[11px] font-mono text-stone-500 hover:text-stone-900 px-1"
                  >
                    {previewTab === 'md' ? 'Hide' : 'View'}
                  </button>
                </div>
              </div>

              {/* Plain Text Card */}
              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 flex flex-col justify-between space-y-3">
                <div>
                  <div className="font-semibold text-stone-900 mb-0.5">Plain Text (.txt)</div>
                  <p className="text-stone-500 leading-normal">
                    Structured ASCII layout with chapter dividers, callouts, and numbered lists.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 pt-2 border-t border-stone-200/60">
                  <button
                    onClick={() => downloadPlainText(book)}
                    className="flex-1 py-1.5 px-2 bg-stone-200/80 hover:bg-stone-300 text-stone-800 rounded-md font-medium text-[11px] transition-colors flex items-center justify-center gap-1"
                  >
                    <FileDown className="w-3 h-3" />
                    Download
                  </button>
                  <button
                    onClick={() => handleCopy(generatePlainText(book), 'txt')}
                    className="p-1.5 text-stone-500 hover:text-stone-800 rounded-md hover:bg-stone-200/60 transition-colors"
                    title="Copy Text"
                  >
                    {copiedType === 'txt' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => setPreviewTab(previewTab === 'txt' ? 'none' : 'txt')}
                    className="text-[11px] font-mono text-stone-500 hover:text-stone-900 px-1"
                  >
                    {previewTab === 'txt' ? 'Hide' : 'View'}
                  </button>
                </div>
              </div>

              {/* JSON Backup Card */}
              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 flex flex-col justify-between space-y-3">
                <div>
                  <div className="font-semibold text-stone-900 mb-0.5">JSON Backup (.json)</div>
                  <p className="text-stone-500 leading-normal">
                    Complete schema backup including theme palettes, ICP persona, and chapters.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 pt-2 border-t border-stone-200/60">
                  <button
                    onClick={() => downloadJsonBackup(book)}
                    className="flex-1 py-1.5 px-2 bg-stone-200/80 hover:bg-stone-300 text-stone-800 rounded-md font-medium text-[11px] transition-colors flex items-center justify-center gap-1"
                  >
                    <FileDown className="w-3 h-3" />
                    Download
                  </button>
                  <button
                    onClick={() => handleCopy(JSON.stringify(book, null, 2), 'json')}
                    className="p-1.5 text-stone-500 hover:text-stone-800 rounded-md hover:bg-stone-200/60 transition-colors"
                    title="Copy JSON"
                  >
                    {copiedType === 'json' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => setPreviewTab(previewTab === 'json' ? 'none' : 'json')}
                    className="text-[11px] font-mono text-stone-500 hover:text-stone-900 px-1"
                  >
                    {previewTab === 'json' ? 'Hide' : 'View'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Collapsible Source Code Preview Pane */}
          {previewTab !== 'none' && (
            <div className="p-4 rounded-xl bg-stone-900 text-stone-200 font-mono text-xs overflow-x-auto max-h-60 space-y-2 border border-stone-800">
              <div className="flex items-center justify-between text-stone-400 pb-2 border-b border-stone-800 text-[11px]">
                <span>Preview: {previewTab.toUpperCase()} Output</span>
                <button onClick={() => setPreviewTab('none')} className="hover:text-white">
                  Close
                </button>
              </div>
              <pre className="whitespace-pre-wrap leading-relaxed">
                {previewTab === 'md'
                  ? generateMarkdown(book)
                  : previewTab === 'txt'
                  ? generatePlainText(book)
                  : JSON.stringify(book, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <span className="font-mono text-[11px]">Rendered locally in browser via jsPDF</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 font-medium text-xs transition-colors"
          >
            Close Hub
          </button>
        </div>
      </div>
    </div>
  );
};
