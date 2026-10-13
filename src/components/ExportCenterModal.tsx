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
  BookOpen,
  FileSpreadsheet,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Book } from '../types/book';
import { downloadBookPdf } from '../utils/pdfGenerator';
import {
  downloadMarkdown,
  downloadPlainText,
  downloadJsonBackup,
  downloadEpub,
  downloadDocx,
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
  const [isGeneratingEpub, setIsGeneratingEpub] = useState(false);
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);
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

  const handleDownloadEpub = async () => {
    setIsGeneratingEpub(true);
    try {
      await downloadEpub(book);
    } catch (err) {
      console.error('EPUB generation error:', err);
    } finally {
      setIsGeneratingEpub(false);
    }
  };

  const handleDownloadDocx = async () => {
    setIsGeneratingDocx(true);
    try {
      await downloadDocx(book);
    } catch (err) {
      console.error('DOCX generation error:', err);
    } finally {
      setIsGeneratingDocx(false);
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150 font-sans">
      <div
        className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
      >
        {/* Masthead Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-stone-400 block">
              Publishing Distribution Hub
            </span>
            <h2 id="export-modal-title" className="text-base font-serif font-bold text-stone-900">
              Export Monograph &amp; Universal Formats
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Book Summary Card */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-12 rounded-xs shadow-xs flex items-center justify-center text-white text-[10px] font-mono font-bold shrink-0"
                style={{ background: book.theme.coverBg }}
              >
                eB
              </div>
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-sm">{book.title}</h3>
                <p className="text-stone-500 font-sans text-xs">
                  {book.author} · {book.chapters.length} Chapters · {book.readTimeMinutes} min read
                </p>
              </div>
            </div>
            <div className="hidden sm:block text-right">
              <span className="text-[11px] font-mono uppercase tracking-wider text-stone-400 block">
                Format
              </span>
              <span className="text-xs font-mono font-bold text-stone-700">A4 Vector Document</span>
            </div>
          </div>

          {/* Primary Export Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Vector PDF */}
            <div className="p-4 rounded-xl border border-stone-200 bg-white hover:border-stone-300 transition-all space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center">
                    <FileDown className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono bg-stone-100 text-stone-600 px-2 py-0.5 rounded font-medium">
                    Vector A4
                  </span>
                </div>
                <h4 className="font-serif font-bold text-stone-900 text-sm">Direct Vector PDF</h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Full color cover, running headers, table of contents, and all chapters with vector typography.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Rendering...</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </>
                )}
              </button>
            </div>

            {/* 2. EPUB Standard */}
            <div className="p-4 rounded-xl border border-stone-200 bg-white hover:border-stone-300 transition-all space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-medium">
                    EPUB 3
                  </span>
                </div>
                <h4 className="font-serif font-bold text-stone-900 text-sm">EPUB eBook (.epub)</h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Universal reflowable eBook compatible with Apple Books, Kindle, Kobo, and e-readers.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadEpub}
                disabled={isGeneratingEpub}
                className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isGeneratingEpub ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Packaging EPUB...</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Download EPUB</span>
                  </>
                )}
              </button>
            </div>

            {/* 3. Microsoft Word DOCX */}
            <div className="p-4 rounded-xl border border-stone-200 bg-white hover:border-stone-300 transition-all space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
                    Word .docx
                  </span>
                </div>
                <h4 className="font-serif font-bold text-stone-900 text-sm">Microsoft Word (.docx)</h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Fully editable word document with heading styles, pull quotes, and callout sections.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadDocx}
                disabled={isGeneratingDocx}
                className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isGeneratingDocx ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Formatting Word...</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Download DOCX</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Secondary Formats & Proofing */}
          <div className="pt-2 border-t border-stone-200 space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-stone-400 block font-medium">
              Secondary Formats &amp; Print Proofing
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPrintPreview(book);
                }}
                className="p-3 text-left bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl transition-all cursor-pointer flex items-center gap-2.5"
              >
                <Printer className="w-4 h-4 text-stone-600" />
                <div className="overflow-hidden">
                  <div className="text-xs font-semibold text-stone-900 truncate">Print Proof</div>
                  <div className="text-[10px] text-stone-400 font-mono">Interactive</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => downloadMarkdown(book)}
                className="p-3 text-left bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl transition-all cursor-pointer flex items-center gap-2.5"
              >
                <FileCode className="w-4 h-4 text-stone-600" />
                <div className="overflow-hidden">
                  <div className="text-xs font-semibold text-stone-900 truncate">Markdown</div>
                  <div className="text-[10px] text-stone-400 font-mono">.md with YAML</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => downloadPlainText(book)}
                className="p-3 text-left bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl transition-all cursor-pointer flex items-center gap-2.5"
              >
                <FileText className="w-4 h-4 text-stone-600" />
                <div className="overflow-hidden">
                  <div className="text-xs font-semibold text-stone-900 truncate">Plain Text</div>
                  <div className="text-[10px] text-stone-400 font-mono">.txt ASCII</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => downloadJsonBackup(book)}
                className="p-3 text-left bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl transition-all cursor-pointer flex items-center gap-2.5"
              >
                <Database className="w-4 h-4 text-stone-600" />
                <div className="overflow-hidden">
                  <div className="text-xs font-semibold text-stone-900 truncate">JSON Backup</div>
                  <div className="text-[10px] text-stone-400 font-mono">Full Restore</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500 font-mono">
          <span>Vector and reflowable exports generate client-side</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-stone-300 text-stone-700 font-medium rounded-lg hover:bg-stone-50 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
