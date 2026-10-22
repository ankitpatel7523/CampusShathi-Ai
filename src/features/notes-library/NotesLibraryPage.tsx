import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Star, Download, Upload, ShieldCheck, Search, Filter, 
  Coins, Sparkles, CheckCircle2, MessageSquare, ThumbsUp, X,
  Eye, Printer, FileText, ArrowUpRight, Lock
} from 'lucide-react';
import { apiClient } from '../../services/api-client.js';
import { CampusNote } from '../../../shared/types/index.js';
import { PdfViewerModal } from './PdfViewerModal.js';
import confetti from 'canvas-confetti';

interface NotesLibraryPageProps {
  onSendToPrint?: (details: { documentTitle: string; pages: number }) => void;
  onStartQuizWithNote?: (noteTitle: string, subject: string) => void;
}

export const NotesLibraryPage: React.FC<NotesLibraryPageProps> = ({
  onSendToPrint,
  onStartQuizWithNote
}) => {
  const [notes, setNotes] = useState<CampusNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [sortBy, setSortBy] = useState('stars');
  
  // PDF Preview modal state
  const [previewNote, setPreviewNote] = useState<CampusNote | null>(null);

  // Premium Paid Note Paywall state (prevents preview for paid PDFs until unlocked)
  const [lockedPaidNote, setLockedPaidNote] = useState<CampusNote | null>(null);
  const [unlockedNoteIds, setUnlockedNoteIds] = useState<string[]>([]);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSubject, setUploadSubject] = useState('');
  const [uploadBranch, setUploadBranch] = useState('Computer Science');
  const [uploadSemester, setUploadSemester] = useState('Sem 4');
  const [uploadUniversity, setUploadUniversity] = useState('AKTU');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadPrice, setUploadPrice] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Real File Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-detect subject and title from chosen filename
  const processSelectedFile = (file: File) => {
    if (file.size > 35 * 1024 * 1024) {
      setFileError('File size exceeds 35MB limit. Please choose a smaller document.');
      return;
    }
    setFileError(null);
    setSelectedFile(file);

    // Auto-populate title if empty or default
    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').trim();
    if (!uploadTitle) {
      setUploadTitle(cleanName);
    }

    // Auto-guess subject from filename
    const lower = file.name.toLowerCase();
    if (!uploadSubject) {
      if (lower.includes('os') || lower.includes('operating')) setUploadSubject('Operating Systems');
      else if (lower.includes('dsa') || lower.includes('data structure') || lower.includes('algorithm')) setUploadSubject('Data Structures & Algorithms');
      else if (lower.includes('dbms') || lower.includes('database') || lower.includes('sql')) setUploadSubject('Database Management Systems');
      else if (lower.includes('network') || lower.includes('cn')) setUploadSubject('Computer Networks');
      else if (lower.includes('math') || lower.includes('discrete')) setUploadSubject('Engineering Mathematics');
      else if (lower.includes('ai') || lower.includes('machine learning')) setUploadSubject('Artificial Intelligence');
      else if (lower.includes('compiler')) setUploadSubject('Compiler Design');
      else if (lower.includes('web')) setUploadSubject('Web Development');
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processSelectedFile(droppedFile);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // Review modal state
  const [activeReviewNote, setActiveReviewNote] = useState<CampusNote | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getNotes({
        search: search || undefined,
        branch: selectedBranch !== 'all' ? selectedBranch : undefined,
        sortBy
      });
      setNotes(res.notes || []);
    } catch (err) {
      console.error('Failed to load notes', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [selectedBranch, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNotes();
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !uploadTitle) {
      setFileError('Please select a PDF or document file to upload.');
      return;
    }
    if (!uploadTitle || !uploadSubject) {
      return;
    }

    try {
      setUploading(true);
      setFileError(null);

      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      formData.append('title', uploadTitle);
      formData.append('description', uploadDesc);
      formData.append('subject', uploadSubject);
      formData.append('branch', uploadBranch);
      formData.append('semester', uploadSemester);
      formData.append('university', uploadUniversity);
      formData.append('price', String(uploadPrice));
      formData.append('shareToPublic', 'true');

      await apiClient.uploadNote(formData);

      confetti({ particleCount: 75, spread: 65, origin: { y: 0.6 } });
      setShowUploadModal(false);
      setSelectedFile(null);
      setUploadTitle('');
      setUploadSubject('');
      setUploadDesc('');
      fetchNotes();
    } catch (err: any) {
      setFileError(err.message || 'Failed to upload notes');
    } finally {
      setUploading(false);
    }
  };

  const handleRateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReviewNote) return;

    try {
      setSubmittingRating(true);
      await apiClient.rateNote(activeReviewNote.id, ratingValue, ratingComment);
      confetti({ particleCount: 40, spread: 50 });
      setActiveReviewNote(null);
      setRatingComment('');
      fetchNotes();
    } catch (err: any) {
      alert(err.message || 'Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleDownload = async (note: CampusNote) => {
    await apiClient.downloadNote(note.id);
    confetti({ particleCount: 30, spread: 45 });
    fetchNotes();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white p-6 md:p-8 shadow-lg shadow-orange-500/10">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>Campus Creator Economy ⭐</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Campus Notes Library & Marketplace
          </h1>
          <p className="mt-2 text-white/90 text-sm md:text-base leading-relaxed">
            Find verified topper notes, handwritten diagrams, and semester question banks. Share your notes to earn stars ⭐, prestige, and Campus Coins!
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-orange-600 font-bold hover:bg-orange-50 shadow transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <Upload className="w-4 h-4" />
              Upload Notes & Earn ⭐
            </button>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black/20 backdrop-blur-md text-xs font-medium">
              <Coins className="w-4 h-4 text-amber-300" />
              <span>Earn 50 Coins per upload</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by topic, subject (e.g. Operating Systems, Normalization, Graphs)..."
              className="w-full pl-10 pr-24 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-md transition-colors"
            >
              Search
            </button>
          </form>

          {/* Sort selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 flex items-center gap-1 font-medium whitespace-nowrap">
              <Filter className="w-3.5 h-3.5" /> Sort by:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="stars">Top Rated ⭐</option>
              <option value="downloads">Most Downloaded 📥</option>
              <option value="free">Free Notes First</option>
              <option value="recent">Recently Added</option>
            </select>
          </div>
        </div>

        {/* Branch pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {['all', 'Computer Science', 'Computer Science & IT', 'CSE / ECE', 'Mechanical', 'Civil'].map((branch) => (
            <button
              key={branch}
              onClick={() => setSelectedBranch(branch)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedBranch === branch
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {branch === 'all' ? 'All Branches' : branch}
            </button>
          ))}
        </div>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500">
          <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Fetching verified campus notes...</p>
        </div>
      ) : notes.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No notes found for this filter</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Be the first student to upload handwritten notes for this subject and become a Campus Star!
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg text-xs font-semibold hover:bg-orange-700 transition"
          >
            Upload Notes Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {notes.map((note) => (
            <div
              key={note.id}
              className="group bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 hover:border-orange-400/80 dark:hover:border-orange-500/50 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header tags */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60">
                    {note.subject}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {note.page_count} Pages
                    </span>
                    {note.is_verified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Verified
                      </span>
                    ) : null}
                  </div>
                </div>

                <h3 
                  onClick={() => (note.price > 0 && !unlockedNoteIds.includes(note.id)) ? setLockedPaidNote(note) : setPreviewNote(note)}
                  className="font-bold text-slate-900 dark:text-slate-100 text-base leading-snug group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors cursor-pointer flex items-center justify-between gap-1"
                  title={note.price > 0 && !unlockedNoteIds.includes(note.id) ? `Premium Note (₹${note.price}): Click to view price & details` : "Click to view real document in browser"}
                >
                  <span>{note.title}</span>
                  {note.price > 0 && !unlockedNoteIds.includes(note.id) ? (
                    <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 text-orange-500 transition-opacity shrink-0" />
                  )}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {note.description || 'Complete lecture and handwritten revision notes.'}
                </p>

                {/* Quick Document Preview Snippet Box (Restricted for Paid Notes) */}
                <div 
                  onClick={() => (note.price > 0 && !unlockedNoteIds.includes(note.id)) ? setLockedPaidNote(note) : setPreviewNote(note)}
                  className={`mt-3 p-2.5 rounded-lg border flex items-center justify-between gap-2 cursor-pointer transition ${
                    note.price > 0 && !unlockedNoteIds.includes(note.id)
                      ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 hover:bg-amber-100/60'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800 hover:bg-orange-50/50 hover:border-orange-200 dark:hover:border-orange-900/40'
                  }`}
                  title={note.price > 0 && !unlockedNoteIds.includes(note.id) ? `Premium Note: ₹${note.price} (Preview locked)` : "Click to open real PDF document in browser"}
                >
                  <div className="flex items-center gap-2 text-xs">
                    {note.price > 0 && !unlockedNoteIds.includes(note.id) ? (
                      <>
                        <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span className="font-semibold text-amber-900 dark:text-amber-200 text-[11px]">
                          🔒 Paid Note (₹{note.price}) • Preview Locked
                        </span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 text-orange-500 shrink-0" />
                        <span className="font-medium text-slate-700 dark:text-slate-300 text-[11px]">
                          Open Real Document ({note.page_count} Pages)
                        </span>
                      </>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                    note.price > 0 && !unlockedNoteIds.includes(note.id)
                      ? 'text-amber-700 dark:text-amber-400'
                      : 'text-orange-600 dark:text-orange-400'
                  }`}>
                    {note.price > 0 && !unlockedNoteIds.includes(note.id) ? 'View Price →' : 'Read Free →'}
                  </span>
                </div>

                {/* Author & University */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-600 flex items-center justify-center font-bold text-[10px]">
                      {note.author_name.charAt(0)}
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                      {note.author_name}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {note.university} • {note.semester}
                  </span>
                </div>
              </div>

              {/* Bottom Actions & Price */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  {/* Rating trigger */}
                  <button
                    onClick={() => setActiveReviewNote(note)}
                    className="flex items-center gap-1 text-amber-500 text-xs font-bold hover:scale-105 transition cursor-pointer"
                    title="Click to rate note"
                  >
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{note.stars.toFixed(1)}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({note.rating_count})</span>
                  </button>

                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Download className="w-3 h-3" /> {note.downloads}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Preview / Lock Button */}
                  <button
                    onClick={() => (note.price > 0 && !unlockedNoteIds.includes(note.id)) ? setLockedPaidNote(note) : setPreviewNote(note)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs ${
                      note.price > 0 && !unlockedNoteIds.includes(note.id)
                        ? 'border-amber-300 dark:border-amber-700/80 bg-amber-50/90 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                        : 'border-slate-200 dark:border-slate-700 hover:border-orange-400 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-orange-600 dark:hover:text-orange-400'
                    }`}
                    title={note.price > 0 && !unlockedNoteIds.includes(note.id) ? `Premium Note: ₹${note.price} (Preview locked)` : "Open real in-browser PDF Viewer"}
                  >
                    {note.price > 0 && !unlockedNoteIds.includes(note.id) ? (
                      <>
                        <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>🔒 ₹{note.price} Locked</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 text-orange-500" />
                        <span className="hidden sm:inline">Preview</span>
                      </>
                    )}
                  </button>

                  {/* Send to Print Hub shortcut */}
                  {onSendToPrint && (
                    <button
                      onClick={() => onSendToPrint({ documentTitle: `${note.title}.pdf`, pages: note.page_count })}
                      className="p-1.5 rounded-lg border border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition cursor-pointer"
                      title="Directly send to Campus Print Hub"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {note.price > 0 ? (
                    <span className="px-2.5 py-1 rounded-md bg-amber-100/90 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 text-xs font-extrabold border border-amber-300 dark:border-amber-800 flex items-center gap-1 shadow-xs">
                      <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span>₹{note.price}</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold border border-emerald-200 dark:border-emerald-800/60">
                      FREE
                    </span>
                  )}

                  <button
                    onClick={() => (note.price > 0 && !unlockedNoteIds.includes(note.id)) ? setLockedPaidNote(note) : handleDownload(note)}
                    className={`px-3 py-1.5 rounded-lg text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1 ${
                      note.price > 0 && !unlockedNoteIds.includes(note.id)
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : 'bg-orange-600 hover:bg-orange-700'
                    }`}
                  >
                    {note.price > 0 && !unlockedNoteIds.includes(note.id) ? (
                      <>
                        <Lock className="w-3 h-3" />
                        <span>Buy ₹{note.price}</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3 h-3" />
                        <span>Get</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* UPLOAD MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600">
                <Upload className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Upload Campus Notes</h3>
                <p className="text-xs text-slate-500">Earn +150 XP, Star Recognition ⭐, & Campus Coins</p>
              </div>
            </div>

            <form onSubmit={handleUploadSubmit} className="mt-4 space-y-3.5 text-sm">
              {/* Document File Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Upload Notes File (PDF / Docs) *
                  </label>
                  <span className="text-[11px] font-medium text-orange-600 dark:text-orange-400">
                    Required for student access
                  </span>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,application/pdf"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                {!selectedFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleFileDrop}
                    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 ring-4 ring-orange-500/10 scale-[1.01]'
                        : 'border-slate-300 dark:border-slate-700 hover:border-orange-400 bg-slate-50 dark:bg-slate-800/60 hover:bg-orange-50/30 dark:hover:bg-orange-950/10'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto mb-2.5 shadow-sm">
                      <Upload className="w-6 h-6 animate-pulse" />
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Click to choose PDF or drag & drop file here
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Supports PDF, DOCX, PPT, or handwritten scans (Max 35MB)
                    </p>
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100/70 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 text-[10px] font-semibold">
                      <FileText className="w-3 h-3" />
                      <span>PDFs get instant in-browser interactive preview & campus printing!</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl border-2 border-emerald-500/60 bg-emerald-50/60 dark:bg-emerald-950/30 flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-950/70 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 font-extrabold text-xs shadow-xs">
                        {selectedFile.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'DOC'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {selectedFile.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />
                            File verified & ready
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 transition"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSelectedFile(null); setFileError(null); }}
                        className="p-1 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {fileError && (
                  <p className="text-[11px] text-red-600 dark:text-red-400 font-semibold mt-1">
                    {fileError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Note Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operating Systems Complete Unit 1 to 5 Notes"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500 outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Operating Systems"
                    value={uploadSubject}
                    onChange={(e) => setUploadSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500 outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Branch
                  </label>
                  <select
                    value={uploadBranch}
                    onChange={(e) => setUploadBranch(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500 outline-none text-xs"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Tech">Information Tech</option>
                    <option value="Electronics & Comm">Electronics & Comm</option>
                    <option value="Mechanical Engg">Mechanical Engg</option>
                    <option value="Civil Engg">Civil Engg</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Semester
                  </label>
                  <select
                    value={uploadSemester}
                    onChange={(e) => setUploadSemester(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500 outline-none text-xs"
                  >
                    <option value="Sem 1">Semester 1</option>
                    <option value="Sem 2">Semester 2</option>
                    <option value="Sem 3">Semester 3</option>
                    <option value="Sem 4">Semester 4</option>
                    <option value="Sem 5">Semester 5</option>
                    <option value="Sem 6">Semester 6</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    University / College
                  </label>
                  <input
                    type="text"
                    value={uploadUniversity}
                    onChange={(e) => setUploadUniversity(e.target.value)}
                    placeholder="e.g. AKTU, VTU, RGPV"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500 outline-none text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pricing (Monetization)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[0, 19, 29].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setUploadPrice(amt)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition ${
                        uploadPrice === amt
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {amt === 0 ? 'FREE' : `₹${amt}`}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {uploadPrice === 0 ? 'Free notes get 5x more downloads & community stars ⭐' : 'You will receive 70% of earnings directly via UPI!'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Key Topics & Summary
                </label>
                <textarea
                  rows={2}
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  placeholder="Mention important chapters, exam tips or professor hints covered..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500 outline-none text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFile(null);
                    setFileError(null);
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 transition shadow-sm cursor-pointer"
                >
                  {uploading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Uploading & Processing PDF...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Publish Notes to Campus & Earn ⭐</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RATE MODAL */}
      {activeReviewNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setActiveReviewNote(null)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Rate Note: {activeReviewNote.title}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Author: {activeReviewNote.author_name}</p>

            <form onSubmit={handleRateSubmit} className="mt-4 space-y-4">
              <div className="flex items-center justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRatingValue(s)}
                    className="p-1 hover:scale-125 transition-transform"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        s <= ratingValue ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Comment / Review (Optional)
                </label>
                <textarea
                  rows={3}
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="How did this note help your exam preparation? Write here..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveReviewNote(null)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRating}
                  className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 transition shadow"
                >
                  {submittingRating ? 'Submitting...' : 'Give ⭐ Star'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAID NOTE PREVIEW LOCKED MODAL */}
      {lockedPaidNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-center space-y-4">
            <button
              onClick={() => setLockedPaidNote(null)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner border border-amber-200 dark:border-amber-800/60">
              <Lock className="w-7 h-7" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 text-[11px] font-extrabold uppercase tracking-wider mb-2 border border-amber-300 dark:border-amber-800">
                <Lock className="w-3 h-3" />
                <span>Premium Note • Preview Locked</span>
              </div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100 leading-snug">
                {lockedPaidNote.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {lockedPaidNote.subject} • {lockedPaidNote.university} ({lockedPaidNote.semester})
              </p>
            </div>

            {/* Real Price Display Card */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-800/90 dark:to-slate-800/90 border border-amber-200/90 dark:border-slate-700 text-center">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Official Document Price
              </span>
              <div className="text-3xl font-black text-orange-600 dark:text-orange-400 mt-1">
                ₹{lockedPaidNote.price}
              </div>
              <div className="flex items-center justify-center gap-2 mt-2 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-semibold">{lockedPaidNote.page_count} Real Pages</span>
                <span>•</span>
                <span>⭐ {lockedPaidNote.stars.toFixed(1)} Rating</span>
                <span>•</span>
                <span>By {lockedPaidNote.author_name}</span>
              </div>
            </div>

            {/* Notice */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
              <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Paid Document Security Notice</span>
              </p>
              <p className="text-[11px] leading-relaxed">
                Is document ka preview locked hai kyunki ye ek paid topper note hai (₹{lockedPaidNote.price}). Payments system (UPI / QR / Cards) jald live hoga. Tab tak aap marketplace ke sabhi <strong>FREE</strong> notes ko bina kisi restriction ke open aur padh sakte hain!
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={async () => {
                  try {
                    await apiClient.unlockNote(lockedPaidNote.id);
                    setUnlockedNoteIds((prev) => [...prev, lockedPaidNote.id]);
                    const noteToOpen = lockedPaidNote;
                    setLockedPaidNote(null);
                    setPreviewNote(noteToOpen);
                  } catch (err: any) {
                    alert(err.message || 'Failed to unlock note');
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Unlock for ₹{lockedPaidNote.price} (Demo Test)</span>
              </button>
              
              <button
                onClick={() => setLockedPaidNote(null)}
                className="w-full py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Close & Browse Free Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IN-BROWSER PDF VIEWER MODAL */}
      {previewNote && (
        <PdfViewerModal
          note={previewNote}
          onClose={() => setPreviewNote(null)}
          onSendToPrint={onSendToPrint}
          onStartQuizWithNote={onStartQuizWithNote}
          onRateNote={(n) => {
            setActiveReviewNote(n);
          }}
        />
      )}
    </div>
  );
};
