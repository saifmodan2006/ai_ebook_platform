import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Book } from '../types/book';

interface DeleteConfirmModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  book,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !book) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150 font-sans">
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden transform transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
      >
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 space-y-2">
            <h3 id="delete-modal-title" className="text-base font-serif font-bold text-stone-900">
              Remove Monograph from Library?
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-stone-900">"{book.title}"</span>?
              This will remove the publication, chapters, and persona profile from your Firestore account.
            </p>

            <div className="mt-3 p-3 bg-stone-50 rounded-xl border border-stone-200/80 flex items-center gap-3">
              <div
                className="w-8 h-10 rounded-xs shrink-0 shadow-xs flex items-center justify-center text-[9px] font-mono font-bold text-white"
                style={{ background: book.theme.coverBg }}
              >
                eB
              </div>
              <div className="text-xs overflow-hidden">
                <div className="font-serif font-semibold text-stone-900 truncate">{book.title}</div>
                <div className="text-stone-500 font-mono text-[11px] truncate">
                  By {book.author} · {book.chapters.length} chapters
                </div>
              </div>
            </div>
          </div>
        </div>

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
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-3.5 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Publication</span>
          </button>
        </div>
      </div>
    </div>
  );
};
