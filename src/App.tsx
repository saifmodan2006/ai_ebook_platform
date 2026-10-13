import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  BookOpen,
  Box,
  FileDown,
  LayoutGrid,
  List,
  Plus,
  Loader2,
  Trash2,
  Edit3,
  CloudCheck,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Upload,
  Sparkles,
} from 'lucide-react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch,
  getDoc,
} from 'firebase/firestore';
import { Book, ViewMode } from './types/book';
import { SAMPLE_BOOKS } from './utils/sampleBooks';
import { db, handleFirestoreError, OperationType } from './firebase';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import { Navbar } from './components/Navbar';
import { BookCard } from './components/BookCard';
import { ReaderView } from './components/ReaderView';
import { MockupStudio } from './components/MockupStudio';
import { PrintPreviewView } from './components/PrintPreviewView';
import { ExportCenterModal } from './components/ExportCenterModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { CreateBookModal } from './components/CreateBookModal';
import { BookEditorModal } from './components/BookEditorModal';
import { validateAndSanitizeBookJson } from './utils/bookValidator';

function MainStudioApp() {
  const { user, loading: authLoading } = useAuth();

  const [books, setBooks] = useState<Book[]>([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'saving' | 'error'>('synced');

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');

  // View States
  const [activeBook, setActiveBook] = useState<Book | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('library');

  // Modals & Dialogs
  const [exportModalBook, setExportModalBook] = useState<Book | null>(null);
  const [deleteTargetBook, setDeleteTargetBook] = useState<Book | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Import Validation Modal State
  const [importValidationError, setImportValidationError] = useState<string[] | null>(null);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  // Firestore Sync: Load and synchronize user's books in real-time
  useEffect(() => {
    if (!user) {
      setBooks([]);
      setBooksLoading(false);
      return;
    }

    const booksCollectionPath = `users/${user.uid}/books`;
    const booksColRef = collection(db, 'users', user.uid, 'books');
    const userDocRef = doc(db, 'users', user.uid);

    let isSubscribed = true;

    // Check initialization status first so we NEVER recreate sample books if user deleted them
    const initAndSubscribe = async () => {
      try {
        const userSnap = await getDoc(userDocRef);
        const hasSeeded = userSnap.exists() && userSnap.data()?.hasSeededSampleBooks === true;

        if (!hasSeeded) {
          // Check if collection is empty on first ever visit
          const batch = writeBatch(db);
          SAMPLE_BOOKS.forEach((sample) => {
            const bRef = doc(db, 'users', user.uid, 'books', sample.id);
            batch.set(bRef, sample);
          });
          batch.set(userDocRef, { hasSeededSampleBooks: true }, { merge: true });
          await batch.commit();
        }
      } catch (err) {
        console.warn('Initial seed verification note:', err);
      }

      if (!isSubscribed) return;

      const unsubscribe = onSnapshot(
        booksColRef,
        (snapshot) => {
          // Load whatever books currently exist in the user's Firestore collection.
          // If empty, set empty array — NEVER automatically respawn deleted books!
          const loadedBooks: Book[] = snapshot.docs.map((docSnap) => docSnap.data() as Book);
          setBooks(loadedBooks);
          setBooksLoading(false);
          setCloudSyncStatus('synced');
        },
        (error) => {
          setBooksLoading(false);
          setCloudSyncStatus('error');
          try {
            handleFirestoreError(error, OperationType.LIST, booksCollectionPath);
          } catch {
            // Handled
          }
        }
      );

      return unsubscribe;
    };

    const promise = initAndSubscribe();

    return () => {
      isSubscribed = false;
      promise.then((unsub) => {
        if (unsub) unsub();
      });
    };
  }, [user]);

  // Actions
  const handleOpenReader = (book: Book) => {
    setActiveBook(book);
    setViewMode('reader');
  };

  const handleOpenMockup = (book: Book) => {
    setActiveBook(book);
    setViewMode('mockup');
  };

  const handleOpenPrintPreview = (book: Book) => {
    setActiveBook(book);
    setViewMode('print-preview');
  };

  const handleOpenExport = (book: Book) => {
    setExportModalBook(book);
  };

  const handleDeleteRequest = (book: Book) => {
    setDeleteTargetBook(book);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetBook || !user) return;
    const docPath = `users/${user.uid}/books/${deleteTargetBook.id}`;
    setCloudSyncStatus('saving');
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'books', deleteTargetBook.id));
      if (activeBook?.id === deleteTargetBook.id) {
        setActiveBook(null);
        setViewMode('library');
      }
      setCloudSyncStatus('synced');
    } catch (err) {
      setCloudSyncStatus('error');
      try {
        handleFirestoreError(err, OperationType.DELETE, docPath);
      } catch {
        // Handled
      }
    } finally {
      setDeleteTargetBook(null);
    }
  };

  const handleBookCreated = async (newBook: Book) => {
    if (!user) return;
    const docPath = `users/${user.uid}/books/${newBook.id}`;
    setCloudSyncStatus('saving');
    try {
      await setDoc(doc(db, 'users', user.uid, 'books', newBook.id), newBook);
      setActiveBook(newBook);
      setCloudSyncStatus('synced');
    } catch (err) {
      setCloudSyncStatus('error');
      try {
        handleFirestoreError(err, OperationType.CREATE, docPath);
      } catch {
        // Handled
      }
    }
  };

  const handleSaveEditedBook = async (updated: Book) => {
    if (!user) return;
    const docPath = `users/${user.uid}/books/${updated.id}`;
    setCloudSyncStatus('saving');
    try {
      await setDoc(doc(db, 'users', user.uid, 'books', updated.id), updated, { merge: true });
      if (activeBook?.id === updated.id) {
        setActiveBook(updated);
      }
      setCloudSyncStatus('synced');
    } catch (err) {
      setCloudSyncStatus('error');
      try {
        handleFirestoreError(err, OperationType.UPDATE, docPath);
      } catch {
        // Handled
      }
    }
  };

  // Explicit Seed / Reset action with in-app confirmation
  const handleExecuteResetLibrary = async () => {
    if (!user) return;
    setIsResetConfirmOpen(false);
    setCloudSyncStatus('saving');

    try {
      const batch = writeBatch(db);
      books.forEach((b) => {
        batch.delete(doc(db, 'users', user.uid, 'books', b.id));
      });
      SAMPLE_BOOKS.forEach((sample) => {
        batch.set(doc(db, 'users', user.uid, 'books', sample.id), sample);
      });
      batch.set(doc(db, 'users', user.uid), { hasSeededSampleBooks: true }, { merge: true });
      await batch.commit();
      setCloudSyncStatus('synced');
    } catch (err) {
      setCloudSyncStatus('error');
      try {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/books`);
      } catch {
        // Handled
      }
    }
  };

  // Import JSON with Strict Schema Validation
  const handleImportJson = async (rawData: unknown) => {
    if (!user) return;

    if (rawData && typeof rawData === 'object' && '__error' in (rawData as any)) {
      setImportValidationError([(rawData as any).__error]);
      return;
    }

    const validation = validateAndSanitizeBookJson(rawData);

    if (!validation.valid || !validation.sanitizedBook) {
      setImportValidationError(validation.errors);
      return;
    }

    const bookToSave = validation.sanitizedBook;
    const docPath = `users/${user.uid}/books/${bookToSave.id}`;
    setCloudSyncStatus('saving');

    try {
      await setDoc(doc(db, 'users', user.uid, 'books', bookToSave.id), bookToSave);
      setImportSuccessMessage(`"${bookToSave.title}" was successfully verified and saved to your library.`);
      setCloudSyncStatus('synced');
      setTimeout(() => setImportSuccessMessage(null), 4000);
    } catch (err) {
      setCloudSyncStatus('error');
      try {
        handleFirestoreError(err, OperationType.CREATE, docPath);
      } catch {
        // Handled
      }
    }
  };

  // Filter books
  const filteredBooks = books.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.persona?.targetRole?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.tags && b.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesCategory =
      categoryFilter === 'all' || b.category.toLowerCase().includes(categoryFilter.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(books.map((b) => b.category).filter(Boolean)))];

  // 1. Loading Authentication State
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#faf9f5] flex flex-col items-center justify-center text-stone-900 space-y-3 font-sans">
        <Loader2 className="w-6 h-6 animate-spin text-stone-600" />
        <span className="text-xs font-mono text-stone-500 uppercase tracking-wider">
          Initializing PageCraft Publishing Studio...
        </span>
      </div>
    );
  }

  // 2. Strict Auth Gate: Access only after signed in
  if (!user) {
    return <AuthScreen />;
  }

  // 3. View: 3D Mockup Studio
  if (viewMode === 'mockup' && activeBook) {
    return (
      <MockupStudio
        book={activeBook}
        onBack={() => setViewMode('library')}
        onOpenReader={() => setViewMode('reader')}
        onOpenExport={() => handleOpenExport(activeBook)}
      />
    );
  }

  // 4. View: Reader View
  if (viewMode === 'reader' && activeBook) {
    return (
      <ReaderView
        book={activeBook}
        onBack={() => setViewMode('library')}
        onOpenMockup={() => setViewMode('mockup')}
        onOpenExport={() => handleOpenExport(activeBook)}
        onOpenPrintPreview={() => handleOpenPrintPreview(activeBook)}
      />
    );
  }

  // 5. View: Print Preview View
  if (viewMode === 'print-preview' && activeBook) {
    return (
      <PrintPreviewView
        book={activeBook}
        onExit={() => setViewMode('library')}
      />
    );
  }

  // 6. DEFAULT VIEW: Authenticated Library Workbench
  return (
    <div className="min-h-screen bg-[#faf9f5] text-stone-900 flex flex-col font-sans">
      {/* Masthead Navigation */}
      <Navbar
        books={books}
        onOpenCreate={() => setIsCreateOpen(true)}
        onImportJson={handleImportJson}
        onResetLibrary={() => setIsResetConfirmOpen(true)}
      />

      {/* Cloud Sync Status Strip */}
      <div className="bg-white/80 border-b border-stone-200/60 px-6 lg:px-10 py-1.5 flex items-center justify-between text-[11px] font-mono text-stone-500">
        <div className="flex items-center gap-2">
          {cloudSyncStatus === 'saving' ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin text-stone-600" />
              <span>Saving manuscript changes to Firestore...</span>
            </>
          ) : cloudSyncStatus === 'error' ? (
            <>
              <AlertCircle className="w-3 h-3 text-rose-600" />
              <span className="text-rose-700 font-medium">Sync issue detected with Firestore</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Cloud Firestore Active · Real-time persistence</span>
            </>
          )}
        </div>

        <span className="hidden sm:inline text-stone-400">
          User UID: {user.uid.slice(0, 8)}...
        </span>
      </div>

      {/* Import Notification Banner */}
      {importSuccessMessage && (
        <div className="mx-6 lg:mx-10 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{importSuccessMessage}</span>
        </div>
      )}

      {/* Editorial Workbench Masthead Strip */}
      <section className="bg-white border-b border-stone-200 px-6 lg:px-10 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <span className="text-xs font-mono uppercase tracking-widest text-stone-400 font-medium block">
              Editorial Studio Workbench
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
              Publications &amp; Manuscripts
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Curate, preview in 3D, and export multi-page A4 vector PDFs with demographic ICP alignment and modular chapter architecture.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <Plus className="w-4 h-4" />
              <span>New Publication</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 lg:px-10 py-8 space-y-6">
        {/* Search, Filter Segmented Tabs & View Mode */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white p-3 rounded-xl border border-stone-200 shadow-xs">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search manuscripts by title, author, target ICP, or tag..."
              className="w-full pl-9 pr-4 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white transition-all font-sans"
            />
          </div>

          {/* Filter Tabs & View Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Interactive Category Filter Tabs */}
            <div className="flex items-center gap-1 p-0.5 bg-stone-100 rounded-lg border border-stone-200/80 overflow-x-auto">
              {categories.slice(0, 4).map((c) => (
                <button
                  key={c}
                  onClick={() => setCategoryFilter(c)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    categoryFilter === c
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {c === 'all' ? 'All' : c.split('&')[0].trim()}
                </button>
              ))}
            </div>

            {/* Layout switch (Grid / List) */}
            <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200/80">
              <button
                onClick={() => setLayoutMode('grid')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  layoutMode === 'grid'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-400 hover:text-stone-800'
                }`}
                title="Grid layout"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setLayoutMode('list')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  layoutMode === 'list'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-400 hover:text-stone-800'
                }`}
                title="Catalog list layout"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Books List / Grid */}
        {booksLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-stone-400 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-stone-600" />
            <span className="text-xs font-mono">Synchronizing Firestore cloud library...</span>
          </div>
        ) : books.length === 0 ? (
          /* Empty Library State (Fixed: Never automatically respawns deleted demo books) */
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-4 max-w-lg mx-auto my-8">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-600 flex items-center justify-center mx-auto shadow-xs">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif font-bold text-stone-900 text-lg">Your Cloud Library is Clean</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                You have no active publications in your private Firestore library. Create your first eBook with our multi-stage pipeline or restore sample monographs.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <button
                onClick={() => setIsCreateOpen(true)}
                className="w-full sm:w-auto px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Create New Publication</span>
              </button>

              <button
                onClick={handleExecuteResetLibrary}
                className="w-full sm:w-auto px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
                <span>Load Sample eBooks</span>
              </button>
            </div>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-4">
            <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-500 flex items-center justify-center mx-auto">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-stone-900 text-base">No matching manuscripts</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              No publications match your current filter criteria.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('all');
              }}
              className="px-3.5 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-stone-800 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : layoutMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onOpenReader={handleOpenReader}
                onOpenMockup={handleOpenMockup}
                onOpenExport={handleOpenExport}
                onDeleteRequest={handleDeleteRequest}
                onEditRequest={(b) => setEditingBook(b)}
              />
            ))}
          </div>
        ) : (
          /* High-Density Catalog Ledger Table */
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs divide-y divide-stone-100">
            <div className="bg-stone-50/80 px-6 py-2.5 grid grid-cols-12 text-[11px] font-mono uppercase tracking-wider text-stone-400">
              <div className="col-span-5">Publication</div>
              <div className="col-span-3">Target ICP &amp; Sector</div>
              <div className="col-span-2 text-right">Cadence</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {filteredBooks.map((book) => (
              <div
                key={book.id}
                className="px-6 py-4 grid grid-cols-12 items-center gap-4 hover:bg-stone-50/60 transition-colors text-xs"
              >
                <div className="col-span-5 flex items-center gap-3">
                  <div
                    className="w-8 h-11 rounded-xs shrink-0 shadow-xs flex items-center justify-center text-white text-[9px] font-mono font-bold"
                    style={{ background: book.theme?.coverBg || '#312e81' }}
                  >
                    eB
                  </div>
                  <div className="truncate">
                    <h3 className="font-serif font-bold text-stone-900 text-sm truncate">
                      {book.title}
                    </h3>
                    <p className="text-stone-500 font-sans text-xs truncate">
                      {book.author} · {book.category}
                    </p>
                  </div>
                </div>

                <div className="col-span-3 truncate text-stone-600">
                  <span className="font-medium text-stone-800 block truncate">{book.persona?.targetRole || 'General'}</span>
                  <span className="text-[11px] text-stone-400 truncate block">{book.persona?.industry || 'Enterprise'}</span>
                </div>

                <div className="col-span-2 text-right font-mono text-stone-500 text-xs">
                  <span>{book.readTimeMinutes}m read</span>
                  <span className="block text-[11px] text-stone-400">{book.chapters.length} chapters</span>
                </div>

                <div className="col-span-2 flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => setEditingBook(book)}
                    className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                    title="Edit Manuscript"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenReader(book)}
                    className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                    title="Reader"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenMockup(book)}
                    className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                    title="3D Mockup"
                  >
                    <Box className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenExport(book)}
                    className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                    title="Export"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteRequest(book)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Import Validation Errors Dialog */}
      {importValidationError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs font-sans animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-stone-200 p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2.5 text-rose-700 font-semibold text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>Import Schema Validation Errors</span>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              The uploaded JSON file does not conform to the strict publication schema required by PageCraft:
            </p>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 max-h-48 overflow-y-auto space-y-1.5 font-mono text-[11px] text-rose-800">
              {importValidationError.map((err, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                  <span className="text-rose-400">•</span>
                  <span>{err}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setImportValidationError(null)}
                className="px-4 py-2 bg-stone-900 text-white text-xs font-medium rounded-lg hover:bg-stone-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs font-sans animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-stone-200 p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2.5 text-stone-900 font-serif font-bold text-base">
              <RotateCcw className="w-5 h-5 text-stone-500" />
              <span>Restore Showcase Publications?</span>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              This will overwrite your private library with the curated showcase publications across SaaS growth, engineering architecture, and executive productivity.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-3.5 py-1.5 bg-white border border-stone-200 text-stone-700 text-xs font-medium rounded-lg hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteResetLibrary}
                className="px-4 py-1.5 bg-stone-900 text-white text-xs font-medium rounded-lg hover:bg-stone-800 cursor-pointer shadow-xs"
              >
                Restore Showcase
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ExportCenterModal
        book={exportModalBook}
        isOpen={exportModalBook !== null}
        onClose={() => setExportModalBook(null)}
        onOpenPrintPreview={handleOpenPrintPreview}
      />

      <DeleteConfirmModal
        book={deleteTargetBook}
        isOpen={deleteTargetBook !== null}
        onClose={() => setDeleteTargetBook(null)}
        onConfirm={handleConfirmDelete}
      />

      <CreateBookModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onBookCreated={handleBookCreated}
      />

      <BookEditorModal
        book={editingBook}
        isOpen={editingBook !== null}
        onClose={() => setEditingBook(null)}
        onSave={handleSaveEditedBook}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainStudioApp />
    </AuthProvider>
  );
}
