import React from 'react';
import {
  Upload,
  RotateCcw,
  LogOut,
  Plus,
  BookOpen,
} from 'lucide-react';
import { Book } from '../types/book';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  books: Book[];
  onOpenCreate: () => void;
  onImportJson: (imported: Book) => void;
  onResetLibrary: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  books,
  onOpenCreate,
  onImportJson,
  onResetLibrary,
}) => {
  const { user, logout } = useAuth();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.title && parsed.chapters) {
          onImportJson(parsed);
        } else {
          alert('Invalid eBook JSON structure: missing title or chapters.');
        }
      } catch {
        alert('Failed to parse uploaded JSON file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const totalChapters = books.reduce((acc, b) => acc + (b.chapters?.length || 0), 0);
  const totalReadTime = books.reduce((acc, b) => acc + (b.readTimeMinutes || 0), 0);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 px-6 lg:px-10 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <a href="#" className="flex items-baseline gap-2 group">
            <span className="font-serif font-bold text-xl tracking-tight text-stone-900 group-hover:text-stone-700 transition-colors">
              PageCraft
            </span>
            <span className="text-xs text-stone-500 font-sans tracking-wide">
              Publishing Studio
            </span>
          </a>
        </div>

        {/* Zone 2: Editorial Ledger / Metrics (Unboxed Text with Separators) */}
        <div className="hidden md:flex items-center gap-3 text-xs text-stone-500 font-mono">
          <span>{books.length} publications</span>
          <span aria-hidden="true" className="text-stone-300">·</span>
          <span>{totalChapters} chapters</span>
          <span aria-hidden="true" className="text-stone-300">·</span>
          <span>{totalReadTime}m total read</span>
        </div>

        {/* Zone 3: Actions & User Account */}
        <div className="flex items-center gap-2.5 shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            title="Import JSON backup"
          >
            <Upload className="w-3.5 h-3.5 text-stone-400" />
            <span className="hidden sm:inline">Import</span>
          </button>

          <button
            type="button"
            onClick={onResetLibrary}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
            title="Reset library to default publications"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onOpenCreate}
            className="px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-[0.99]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Publication</span>
          </button>

          {/* User Profile & Sign Out */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-7 h-7 rounded-full border border-stone-200 object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-stone-100 text-stone-700 font-semibold text-xs flex items-center justify-center border border-stone-200">
                  {(user.displayName || user.email || 'A')[0].toUpperCase()}
                </div>
              )}

              <button
                type="button"
                onClick={logout}
                className="p-1.5 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                title="Sign out of PageCraft"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
