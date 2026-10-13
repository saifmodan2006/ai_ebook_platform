import React from 'react';
import {
  BookOpen,
  Box,
  FileDown,
  Trash2,
  Clock,
  Layers,
  Edit3,
} from 'lucide-react';
import { Book } from '../types/book';

interface BookCardProps {
  book: Book;
  onOpenReader: (book: Book) => void;
  onOpenMockup: (book: Book) => void;
  onOpenExport: (book: Book) => void;
  onDeleteRequest: (book: Book) => void;
  onEditRequest?: (book: Book) => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onOpenReader,
  onOpenMockup,
  onOpenExport,
  onDeleteRequest,
  onEditRequest,
}) => {
  return (
    <div className="group bg-white rounded-2xl border border-stone-200 hover:border-stone-400/80 transition-all duration-200 flex flex-col overflow-hidden shadow-xs hover:shadow-md">
      {/* Editorial Cover Canvas */}
      <div
        className="h-56 relative p-6 flex flex-col justify-between overflow-hidden cursor-pointer select-none"
        style={{ background: book.theme.coverBg }}
        onClick={() => onOpenReader(book)}
      >
        {/* Subtle Book Spine Hinge Shadow */}
        <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/40 via-black/10 to-transparent pointer-events-none" />
        {/* Archival Hairline Inset Frame */}
        <div className="absolute inset-3 border border-white/15 pointer-events-none rounded-sm" />

        {/* Top Monograph Category Line */}
        <div className="relative z-10 flex items-center justify-between text-[11px] text-white/80 font-mono tracking-wider uppercase">
          <span className="truncate max-w-[200px]">{book.category}</span>
          <span className="text-white/60 text-[10px]">{book.theme.name}</span>
        </div>

        {/* Middle Typography */}
        <div className="relative z-10 space-y-1.5 my-auto">
          <h3 className="font-serif font-bold text-lg text-white leading-snug line-clamp-2 drop-shadow-xs group-hover:text-stone-100 transition-colors">
            {book.title}
          </h3>
          <p className="text-xs text-white/80 line-clamp-2 font-sans font-light leading-relaxed">
            {book.subtitle}
          </p>
        </div>

        {/* Bottom Author & Chapters */}
        <div className="relative z-10 pt-2 border-t border-white/15 flex items-center justify-between text-xs text-white/85">
          <span className="font-medium truncate max-w-[160px]">{book.author}</span>
          <span className="font-mono text-[11px] text-white/70">
            {book.chapters.length} Chapters
          </span>
        </div>
      </div>

      {/* Card Details Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        {/* Target ICP Profile */}
        <div className="space-y-1">
          <div className="text-[11px] font-semibold text-stone-900 tracking-wide">
            Target ICP: {book.persona.targetRole}
          </div>
          <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
            {book.persona.coreTransformation}
          </p>
        </div>

        {/* Unboxed Metadata Strip */}
        <div className="flex items-center gap-2 text-xs text-stone-500 pt-1 border-t border-stone-100 font-mono">
          <span>{book.readTimeMinutes}m read</span>
          <span aria-hidden="true" className="text-stone-300">·</span>
          <span>{book.chapters.length} chapters</span>
          <span aria-hidden="true" className="text-stone-300">·</span>
          <span className="truncate max-w-[120px]">{book.persona.industry}</span>
        </div>

        {/* Quick Actions Bar */}
        <div className="pt-2 border-t border-stone-100 space-y-2">
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => onOpenReader(book)}
              className="py-2 px-2.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              title="Open in Reader"
            >
              <BookOpen className="w-3.5 h-3.5 text-stone-600" />
              <span>Reader</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenMockup(book)}
              className="py-2 px-2.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              title="3D Mockup View"
            >
              <Box className="w-3.5 h-3.5 text-stone-600" />
              <span>3D Mock</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenExport(book)}
              className="py-2 px-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              title="Export Center"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>

          {/* Secondary Actions */}
          <div className="flex items-center justify-between pt-1 text-xs">
            {onEditRequest ? (
              <button
                type="button"
                onClick={() => onEditRequest(book)}
                className="text-stone-500 hover:text-stone-900 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit Details</span>
              </button>
            ) : (
              <span className="text-stone-400">PageCraft Monograph</span>
            )}

            <button
              type="button"
              onClick={() => onDeleteRequest(book)}
              className="text-stone-400 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
              title="Delete eBook"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
