import React, { useState, useEffect, useRef } from 'react';
import { 
  X, ZoomIn, ZoomOut, Maximize2, Minimize2, Download, Printer, 
  Star, ChevronLeft, ChevronRight, BookOpen, Search, ShieldCheck, 
  Sparkles, FileText, CheckCircle2, Copy, Bookmark, ExternalLink,
  Sun, Moon, Compass, LayoutGrid, Lock
} from 'lucide-react';
import { CampusNote } from '../../../shared/types/index.js';
import { apiClient } from '../../services/api-client.js';
import confetti from 'canvas-confetti';

interface NotePageContent {
  pageNumber: number;
  chapterTitle: string;
  topicTitle: string;
  keyConcepts: string[];
  notesText: string;
  formulaOrCode?: {
    label: string;
    code: string;
  };
  professorTip?: string;
  practiceQuestion?: string;
}

interface NotePreviewData {
  noteId: string;
  title: string;
  subject: string;
  authorName: string;
  university: string;
  semester: string;
  branch: string;
  totalPages: number;
  price: number;
  stars: number;
  downloads: number;
  pages: NotePageContent[];
}

interface PdfViewerModalProps {
  note: CampusNote;
  onClose: () => void;
  onSendToPrint?: (details: { documentTitle: string; pages: number }) => void;
  onStartQuizWithNote?: (noteTitle: string, subject: string) => void;
  onRateNote?: (note: CampusNote) => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  note,
  onClose,
  onSendToPrint,
  onStartQuizWithNote,
  onRateNote
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [previewData, setPreviewData] = useState<NotePreviewData | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100); // 75, 100, 125, 150
  const [viewMode, setViewMode] = useState<'native_pdf' | 'interactive'>('native_pdf');
  const [readingTheme, setReadingTheme] = useState<'crisp' | 'sepia' | 'dark'>('crisp');
  const [showThumbnails, setShowThumbnails] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [downloading, setDownloading] = useState<boolean>(false);
  const [bookmarkedPages, setBookmarkedPages] = useState<number[]>([]);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(note.price > 0);
  const [unlocking, setUnlocking] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch structured content for the note
  useEffect(() => {
    let isMounted = true;
    const fetchPreview = async () => {
      if (note.price > 0 && isLocked) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await apiClient.getNotePreview(note.id);
        if (isMounted) {
          setPreviewData(data);
          setIsLocked(false);
        }
      } catch (err: any) {
        if (err.message?.includes('PREMIUM_NOTE_LOCKED') || err.message?.includes('402')) {
          if (isMounted) setIsLocked(true);
        } else {
          console.error('Failed to load note preview, falling back to basic data', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPreview();
    return () => {
      isMounted = false;
    };
  }, [note.id, isLocked]);

  // Keyboard navigation (Left/Right arrows, ESC to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        if (previewData && currentPage < previewData.pages.length) {
          setCurrentPage((prev) => prev + 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        if (currentPage > 1) {
          setCurrentPage((prev) => prev - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, previewData, onClose]);

  const totalPagesCount = note.page_count || previewData?.totalPages || previewData?.pages?.length || 1;
  const activePageData = previewData?.pages?.find((p) => p.pageNumber === currentPage) || previewData?.pages?.[0];

  const handleUnlock = async () => {
    try {
      setUnlocking(true);
      await apiClient.unlockNote(note.id);
      setIsLocked(false);
      const data = await apiClient.getNotePreview(note.id);
      setPreviewData(data);
      confetti({ particleCount: 50, spread: 60 });
    } catch (err: any) {
      alert(err.message || 'Failed to unlock note');
    } finally {
      setUnlocking(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await apiClient.downloadNote(note.id);
      
      // Trigger browser file download of the real PDF binary
      const pdfUrl = apiClient.getPdfUrl(note.id);
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = `${note.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } catch (err) {
      console.error('Download error', err);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrintClick = () => {
    if (onSendToPrint) {
      onSendToPrint({
        documentTitle: `${note.title}.pdf`,
        pages: note.page_count || totalPagesCount
      });
      onClose();
    }
  };

  const toggleBookmark = (pg: number) => {
    if (bookmarkedPages.includes(pg)) {
      setBookmarkedPages(bookmarkedPages.filter((p) => p !== pg));
    } else {
      setBookmarkedPages([...bookmarkedPages, pg]);
    }
  };

  const copyCodeToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Highlight search text helper
  const renderHighlighted = (text: string) => {
    if (!searchQuery.trim()) return text;
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === searchQuery.toLowerCase() ? (
            <mark key={i} className="bg-amber-300 dark:bg-amber-500 text-slate-900 px-0.5 rounded font-semibold">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  // Theme styles for paper
  const getPaperThemeClasses = () => {
    switch (readingTheme) {
      case 'sepia':
        return 'bg-[#fcf8ed] text-[#433422] border-[#ebdccb] selection:bg-[#ebdccb]';
      case 'dark':
        return 'bg-slate-900 text-slate-100 border-slate-700 selection:bg-orange-950/60';
      case 'crisp':
      default:
        return 'bg-white text-slate-900 border-slate-200 selection:bg-orange-100';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div 
        ref={containerRef}
        className={`bg-slate-900 border border-slate-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden transition-all duration-200 ${
          isFullscreen 
            ? 'fixed inset-0 rounded-none w-screen h-screen' 
            : 'w-full max-w-6xl h-[92vh]'
        }`}
      >
        {/* Top Header Bar */}
        <div className="bg-slate-950 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-orange-600/20 border border-orange-500/30 text-orange-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold truncate text-white" title={note.title}>
                  {note.title}
                </h2>
                {note.is_verified && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-full shrink-0">
                    <ShieldCheck className="w-3 h-3" /> Verified Topper Notes
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 truncate flex items-center gap-2 mt-0.5">
                <span>By {note.author_name}</span>
                <span>•</span>
                <span>{note.university}</span>
                <span>•</span>
                <span className="text-orange-400 font-medium">{note.subject}</span>
                <span>•</span>
                <span>{note.page_count} Pages</span>
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {/* Direct Print Order */}
            <button
              onClick={handlePrintClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm cursor-pointer hover:scale-105 active:scale-95"
              title="Pre-fill print configurator and deliver to campus hostel"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print via Print Hub</span>
              <span className="hidden sm:inline-block px-1.5 py-0.2 text-[10px] bg-white/20 rounded font-normal">
                @ ₹0.8/p
              </span>
            </button>

            {/* Download PDF */}
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition cursor-pointer"
              title="Download standard PDF file"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">{downloading ? 'Downloading...' : 'Save PDF'}</span>
            </button>

            {/* Rate */}
            {onRateNote && (
              <button
                onClick={() => onRateNote(note)}
                className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold border border-slate-700 transition cursor-pointer"
                title="Rate note"
              >
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{note.stars.toFixed(1)}</span>
              </button>
            )}

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-rose-950/60 hover:text-rose-400 transition"
              title="Close Preview (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Second Toolbar: View Modes, Navigation, Zoom, Search */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-2.5 text-xs text-slate-300 shrink-0">
          {/* View mode toggle */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('interactive')}
              className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                viewMode === 'interactive'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Interactive Reader
            </button>
            <button
              onClick={() => setViewMode('native_pdf')}
              className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                viewMode === 'native_pdf'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Native PDF Stream
            </button>
          </div>

          {/* Page Navigation (Only for Interactive mode) */}
          {viewMode === 'interactive' && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
                title="Previous Page (Left Arrow)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-xs">
                <span>Page</span>
                <input
                  type="number"
                  min={1}
                  max={totalPagesCount}
                  value={currentPage}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (val >= 1 && val <= totalPagesCount) {
                      setCurrentPage(val);
                    }
                  }}
                  className="w-8 text-center bg-transparent text-white font-bold outline-none"
                />
                <span className="text-slate-500">of {totalPagesCount}</span>
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPagesCount, p + 1))}
                disabled={currentPage >= totalPagesCount}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
                title="Next Page (Right Arrow)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowThumbnails(!showThumbnails)}
                className={`p-1.5 rounded transition ${
                  showThumbnails ? 'bg-orange-600/30 text-orange-400' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Toggle Pages Sidebar"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Interactive controls: Zoom, Themes, Search */}
          {viewMode === 'interactive' && (
            <div className="flex items-center gap-3">
              {/* Search in page */}
              <div className="relative hidden sm:block">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Find on page..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-2 py-1 rounded-md bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 w-32 focus:w-44 transition-all outline-none focus:border-orange-500"
                />
              </div>

              {/* Zoom */}
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(75, z - 15))}
                  className="p-0.5 text-slate-400 hover:text-white"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono text-slate-300 px-1">{zoomLevel}%</span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(175, z + 15))}
                  className="p-0.5 text-slate-400 hover:text-white"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Paper Theme */}
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded p-0.5">
                <button
                  onClick={() => setReadingTheme('crisp')}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    readingTheme === 'crisp' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Clean White Paper"
                >
                  White
                </button>
                <button
                  onClick={() => setReadingTheme('sepia')}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    readingTheme === 'sepia' ? 'bg-[#ebdccb] text-[#433422]' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Eye-care Sepia Mode"
                >
                  Sepia
                </button>
                <button
                  onClick={() => setReadingTheme('dark')}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    readingTheme === 'dark' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Dark Reading Mode"
                >
                  Dark
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Main Body Area: Thumbnails Sidebar + Document Viewport */}
        <div className="flex-1 flex overflow-hidden relative bg-slate-950">
          {/* Left Thumbnails Rail */}
          {viewMode === 'interactive' && showThumbnails && previewData && (
            <div className="w-56 border-r border-slate-800/80 bg-slate-950 overflow-y-auto p-3 space-y-3 shrink-0 hidden md:block select-none">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Page Index</span>
                <span className="text-[10px] text-orange-400">{previewData.pages.length} Pages</span>
              </div>

              {previewData.pages.map((pg) => {
                const isSelected = pg.pageNumber === currentPage;
                const isBookmarked = bookmarkedPages.includes(pg.pageNumber);

                return (
                  <button
                    key={pg.pageNumber}
                    onClick={() => setCurrentPage(pg.pageNumber)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'border-orange-500 bg-orange-950/40 text-white shadow-md'
                        : 'border-slate-800/80 bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-mono font-bold text-slate-300">
                        Pg {pg.pageNumber}
                      </span>
                      {isBookmarked && (
                        <Bookmark className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      )}
                    </div>
                    <div className="text-xs font-semibold text-slate-200 line-clamp-1 leading-snug">
                      {pg.topicTitle}
                    </div>
                    <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                      {pg.chapterTitle}
                    </div>

                    {/* Miniature Page Skeleton */}
                    <div className="mt-2 h-10 w-full rounded bg-slate-950/70 border border-slate-800 p-1 flex flex-col justify-between">
                      <div className="h-1 w-3/4 bg-slate-700 rounded-full" />
                      <div className="h-1 w-full bg-slate-800 rounded-full" />
                      <div className="h-1 w-2/3 bg-slate-800 rounded-full" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Central Viewer Viewport */}
          <div className="flex-1 overflow-auto p-4 md:p-8 flex justify-center items-start relative h-full">
            {isLocked ? (
              /* Premium Paywall Screen for Paid PDF */
              <div className="w-full max-w-lg mx-auto my-auto p-6 md:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20">
                  <Lock className="w-8 h-8" />
                </div>

                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-extrabold mb-2 border border-amber-500/30">
                    <Lock className="w-3.5 h-3.5" />
                    <span>PREMIUM NOTE • PREVIEW RESTRICTED</span>
                  </div>
                  <h2 className="text-xl font-extrabold text-white">
                    {note.title}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {note.subject} • {note.university} • {note.semester}
                  </p>
                </div>

                {/* Real Price Display */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Real Document Price
                  </span>
                  <div className="text-3xl font-black text-orange-500 mt-0.5">
                    ₹{note.price}
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-2 text-xs text-slate-400">
                    <span>{totalPagesCount} Complete Pages</span>
                    <span>•</span>
                    <span>⭐ {note.stars.toFixed(1)} Rating</span>
                    <span>•</span>
                    <span>By {note.author_name}</span>
                  </div>
                </div>

                {/* Lock explanation */}
                <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 text-left text-xs text-slate-300 space-y-1">
                  <p className="font-semibold text-white">
                    🔒 Paid Document Security Notice:
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Is document ka preview locked hai kyunki ye ek paid marketplace note hai (₹{note.price}). Payments system (UPI / QR / Cards) jald live hoga. Tab tak aap marketplace ke sabhi <strong>FREE</strong> notes ko bina kisi restriction ke open aur padh sakte hain!
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={handleUnlock}
                    disabled={unlocking}
                    className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {unlocking ? 'Unlocking...' : `Unlock Document for ₹${note.price} (Demo Test)`}
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  >
                    Close & Browse Free Notes
                  </button>
                </div>
              </div>
            ) : loading ? (
              <div className="py-24 text-center text-slate-400">
                <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm font-medium">Opening authentic PDF document...</p>
                <p className="text-xs text-slate-500 mt-1">Preparing verified notes and exam derivations</p>
              </div>
            ) : viewMode === 'native_pdf' ? (
              /* Native PDF Iframe stream */
              <div className="w-full h-full min-h-[75vh] flex flex-col rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
                <iframe
                  src={apiClient.getPdfUrl(note.id)}
                  title={note.title}
                  className="w-full h-full min-h-[75vh] flex-1 border-0"
                />
              </div>
            ) : activePageData ? (
              /* Interactive High-Fidelity Paper Page */
              <div 
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                className={`w-full max-w-3xl min-h-[900px] rounded-2xl border shadow-2xl p-8 md:p-12 transition-all flex flex-col justify-between ${getPaperThemeClasses()}`}
              >
                <div>
                  {/* Page Top Academic Header */}
                  <div className="border-b pb-4 mb-6 flex items-center justify-between border-current/15">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold text-xs">
                        CS
                      </div>
                      <div>
                        <span className="text-[11px] font-extrabold uppercase tracking-wider block opacity-75">
                          {previewData?.university} • {previewData?.branch} • {previewData?.semester}
                        </span>
                        <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                          {previewData?.subject}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleBookmark(currentPage)}
                        className="text-xs flex items-center gap-1 font-semibold opacity-70 hover:opacity-100 transition cursor-pointer"
                        title="Bookmark this page"
                      >
                        <Bookmark className={`w-4 h-4 ${bookmarkedPages.includes(currentPage) ? 'fill-amber-400 text-amber-500' : ''}`} />
                        <span>{bookmarkedPages.includes(currentPage) ? 'Bookmarked' : 'Bookmark'}</span>
                      </button>
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-black/5 dark:bg-white/10">
                        Page {currentPage} of {totalPagesCount}
                      </span>
                    </div>
                  </div>

                  {/* Chapter & Topic Titles */}
                  <div className="space-y-1 mb-6">
                    <span className="text-xs font-extrabold tracking-wide uppercase text-orange-600 dark:text-orange-400">
                      {renderHighlighted(activePageData.chapterTitle)}
                    </span>
                    <h1 className="text-xl md:text-2xl font-black leading-tight">
                      {renderHighlighted(activePageData.topicTitle)}
                    </h1>
                    <p className="text-xs opacity-65 flex items-center gap-2 pt-0.5">
                      <span>Author: {note.author_name}</span>
                      <span>•</span>
                      <span>Verified Topper Curriculum</span>
                    </p>
                  </div>

                  {/* Key Concepts Bullet Box */}
                  <div className="p-4 rounded-xl border mb-6 bg-current/3 border-current/10">
                    <h3 className="text-xs font-bold uppercase tracking-wider mb-2.5 flex items-center gap-1.5 opacity-90">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Key Exam Concepts & Summary
                    </h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {activePageData.keyConcepts.map((kc, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                          <span className="opacity-90 leading-relaxed">{renderHighlighted(kc)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Core Notes & Explanations */}
                  <div className="prose prose-sm max-w-none text-xs md:text-sm leading-relaxed opacity-95 space-y-3 mb-6 font-normal">
                    <p className="text-justify">{renderHighlighted(activePageData.notesText)}</p>
                  </div>

                  {/* Formula / Code Block */}
                  {activePageData.formulaOrCode && (
                    <div className="mb-6 rounded-xl border border-current/15 overflow-hidden bg-slate-950 text-slate-100 font-mono text-xs">
                      <div className="px-3.5 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-slate-300">
                        <span className="text-[11px] font-semibold text-orange-400 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          {activePageData.formulaOrCode.label}
                        </span>
                        <button
                          onClick={() => copyCodeToClipboard(activePageData.formulaOrCode!.code)}
                          className="flex items-center gap-1 text-[11px] hover:text-white transition cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedCode ? 'Copied!' : 'Copy'}</span>
                        </button>
                      </div>
                      <pre className="p-4 overflow-x-auto text-xs leading-relaxed text-slate-200">
                        <code>{activePageData.formulaOrCode.code}</code>
                      </pre>
                    </div>
                  )}

                  {/* Professor Exam Tip */}
                  {activePageData.professorTip && (
                    <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 mb-6 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                      <span className="text-base">💡</span>
                      <div>
                        <span className="font-extrabold uppercase text-[10px] tracking-wider block text-amber-700 dark:text-amber-300">
                          Faculty Exam Tip & Scoring Trick:
                        </span>
                        <p className="mt-0.5 leading-relaxed">{activePageData.professorTip}</p>
                      </div>
                    </div>
                  )}

                  {/* Practice Question */}
                  {activePageData.practiceQuestion && (
                    <div className="p-3 rounded-lg border border-current/10 bg-current/2 text-xs opacity-90 mb-4">
                      <span className="font-bold text-[11px] block opacity-75">
                        University Past Exam Numerical / Question:
                      </span>
                      <p className="mt-1 italic">"{activePageData.practiceQuestion}"</p>
                    </div>
                  )}
                </div>

                {/* Page Bottom Footer & Watermark */}
                <div className="pt-4 border-t border-current/15 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] opacity-60">
                  <span>CampusSathi AI • Peer-Reviewed College Marketplace</span>
                  <span>Watermarked: {note.university} Exam Prep</span>
                  <span>Page {currentPage} of {totalPagesCount}</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Bottom Status & Quick Action Bar */}
        <div className="bg-slate-950 border-t border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-300">
              <Download className="w-3.5 h-3.5 text-orange-400" />
              <span>{note.downloads} students downloaded</span>
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline text-slate-400">
              High-yield exam review notes
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onStartQuizWithNote && (
              <button
                onClick={() => {
                  onStartQuizWithNote(note.title, note.subject);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl bg-orange-600/20 text-orange-400 hover:bg-orange-600/30 border border-orange-500/30 font-semibold transition cursor-pointer"
              >
                Start AI Quiz on this Note 🎯
              </button>
            )}

            <button
              onClick={handlePrintClick}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Order Print (₹{( (note.page_count || totalPagesCount) * 0.8).toFixed(1)})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
