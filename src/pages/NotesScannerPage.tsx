import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';
import {
  ScanText, Camera, Upload, Layers, CheckCircle2, RotateCw, Download,
  Sparkles, AlertTriangle, FileText, ChevronRight, HelpCircle
} from 'lucide-react';
import { Flashcard } from '../types.js';
import { ErrorBanner } from '../components/ErrorBanner.js';

interface NotesScannerPageProps {
  onStartQuizWithNotes?: () => void;
}

export const NotesScannerPage: React.FC<NotesScannerPageProps> = ({ onStartQuizWithNotes }) => {
  const { user, refreshUserData } = useAuth();
  const { language, t } = useLanguage();

  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [activeTab, setActiveTab] = useState<'review' | 'scan'>('review');
  const [isScanning, setIsScanning] = useState(false);
  const [errorNotice, setErrorNotice] = useState<any>(null);

  // Scanner state
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Flashcard review state
  const [reviewIndex, setReviewIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const fetchFlashcards = async () => {
    try {
      const res = await fetch('/api/flashcards/due');
      if (res.ok) {
        const data = await res.json();
        setFlashcards(data.flashcards || []);
      }
    } catch (err) {
      console.error('Failed to load flashcards:', err);
    }
  };

  useEffect(() => {
    fetchFlashcards();
  }, []);

  const handleImageUpload = (file: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      setPreviewImage(reader.result as string);
      uploadAndProcessScan(file);
    };
    reader.readAsDataURL(file);
  };

  const uploadAndProcessScan = async (file: File) => {
    try {
      setIsScanning(true);
      setErrorNotice(null);

      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/scans', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        setScannedResult(data);
        await fetchFlashcards();
        refreshUserData();
      } else {
        setErrorNotice({
          message: data.error || 'Failed to scan notes',
          errorKind: data.errorKind,
          fixHint: data.fixHint || 'Ensure handwriting is legible and well illuminated.'
        });
      }
    } catch (err: any) {
      setErrorNotice({
        message: 'Could not connect to OCR service',
        fixHint: 'Check network and retry.'
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleGradeCard = async (grade: number) => {
    if (flashcards.length === 0) return;
    const currentCard = flashcards[reviewIndex];

    try {
      await fetch(`/api/flashcards/${currentCard.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade })
      });

      setIsFlipped(false);
      if (reviewIndex < flashcards.length - 1) {
        setReviewIndex(prev => prev + 1);
      } else {
        await fetchFlashcards();
        setReviewIndex(0);
      }
      refreshUserData();
    } catch (err) {
      console.error('Failed to grade flashcard:', err);
    }
  };

  const exportCardsCsv = () => {
    if (flashcards.length === 0) return;
    const rows = [
      ['Question', 'Answer', 'Subject', 'Due Date'],
      ...flashcards.map(c => [
        `"${c.question.replace(/"/g, '""')}"`,
        `"${c.answer.replace(/"/g, '""')}"`,
        `"${c.subject}"`,
        c.due_date
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'campussathi_flashcards.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentCard = flashcards[reviewIndex];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-fuchsia-50 dark:bg-fuchsia-950/60 text-fuchsia-600 dark:text-purple-400">
              <ScanText className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {t('navScanner')} & Flashcards (SM-2)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Scan physical notebook pages with Gemini vision. Convert to clean Markdown, summary, and Spaced Repetition flashcards.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('review')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'review'
                ? 'bg-white dark:bg-slate-700 text-fuchsia-600 dark:text-purple-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Review Flashcards ({flashcards.length})
          </button>
          <button
            onClick={() => setActiveTab('scan')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'scan'
                ? 'bg-white dark:bg-slate-700 text-fuchsia-600 dark:text-purple-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Scan New Photo
          </button>
        </div>
      </div>

      <ErrorBanner
        message={errorNotice?.message}
        errorKind={errorNotice?.errorKind}
        fixHint={errorNotice?.fixHint}
        onDismiss={() => setErrorNotice(null)}
      />

      {/* Mode A: Flashcard Spaced Repetition Deck */}
      {activeTab === 'review' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Due Today ({flashcards.length} cards)
            </span>
            <button
              onClick={exportCardsCsv}
              className="text-xs font-semibold text-fuchsia-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          {flashcards.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-fuchsia-50 text-fuchsia-600 flex items-center justify-center mx-auto text-xl">
                🎉
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white">All caught up!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No flashcards are due for review today. Scan notes from your notebook to generate new cards.
              </p>
              <button
                onClick={() => setActiveTab('scan')}
                className="px-4 py-2 rounded-xl bg-fuchsia-600 text-white text-xs font-semibold hover:bg-fuchsia-700 cursor-pointer"
              >
                Scan Notes Now
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Interactive Flashcard with 3D Flip */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="relative min-h-[260px] p-8 rounded-3xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-850 border border-slate-200/80 dark:border-slate-700 shadow-md cursor-pointer flex flex-col justify-between select-none transition-transform active:scale-[0.99]"
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-fuchsia-600 dark:text-purple-400">
                    {currentCard?.subject || 'Engineering Notes'}
                  </span>
                  <span>Card {reviewIndex + 1} of {flashcards.length}</span>
                </div>

                <div className="my-auto text-center py-6">
                  {!isFlipped ? (
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Question</span>
                      <p className="text-base sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
                        {currentCard?.question}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">Answer</span>
                      <p className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                        {currentCard?.answer}
                      </p>
                    </div>
                  )}
                </div>

                <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1">
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>{t('flipCard')}</span>
                </div>
              </div>

              {/* SM-2 Spaced Repetition Grading Buttons */}
              {isFlipped && (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2 animate-in fade-in">
                  <span className="text-[11px] font-semibold text-slate-500 block text-center">
                    Rate Recall Accuracy (Calculates Next Due Date via SM-2 Algorithm)
                  </span>

                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => handleGradeCard(0)}
                      className="py-2.5 px-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300 font-semibold text-xs border border-red-200 cursor-pointer"
                    >
                      {t('againButton')}
                    </button>
                    <button
                      onClick={() => handleGradeCard(3)}
                      className="py-2.5 px-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 font-semibold text-xs border border-amber-200 cursor-pointer"
                    >
                      {t('hardButton')}
                    </button>
                    <button
                      onClick={() => handleGradeCard(4)}
                      className="py-2.5 px-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-semibold text-xs border border-blue-200 cursor-pointer"
                    >
                      {t('goodButton')}
                    </button>
                    <button
                      onClick={() => handleGradeCard(5)}
                      className="py-2.5 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold text-xs border border-emerald-200 cursor-pointer"
                    >
                      {t('easyButton')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mode B: Scan New Photo of Notes */}
      {activeTab === 'scan' && (
        <div className="space-y-6">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-10 border-2 border-dashed border-fuchsia-300 dark:border-fuchsia-800 rounded-3xl bg-fuchsia-50/30 dark:bg-fuchsia-950/20 text-center cursor-pointer hover:bg-fuchsia-50/60 transition-colors space-y-3"
          >
            <div className="w-14 h-14 rounded-2xl bg-fuchsia-100 dark:bg-fuchsia-900/50 text-fuchsia-600 dark:text-fuchsia-300 flex items-center justify-center mx-auto shadow-xs">
              <Camera className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Upload or Snap Handwritten Notes
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Take a clear camera photo or upload JPEG/PNG images from your gallery.
              </p>
            </div>
            <button className="px-4 py-2 rounded-xl bg-fuchsia-600 text-white font-semibold text-xs shadow-sm hover:bg-fuchsia-700 cursor-pointer">
              Choose Photo or Open Camera
            </button>
          </div>

          {/* Side by side original image & transcription */}
          {previewImage && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Original Photo Preview */}
              <div className="p-4 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Original Captured Image
                </span>
                <img
                  src={previewImage}
                  alt="Notes Preview"
                  className="w-full max-h-80 object-contain rounded-2xl bg-slate-100 dark:bg-slate-900"
                />
                <p className="text-[11px] text-amber-600 dark:text-amber-400 italic">
                  Note: Handwriting OCR accuracy depends on lighting and clarity.
                </p>
              </div>

              {/* Scanned OCR Results */}
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                  <span className="text-xs font-bold text-fuchsia-600 dark:text-purple-400 uppercase tracking-wider">
                    Transcribed Markdown Notes
                  </span>
                  {scannedResult?.flashcards && (
                    <span className="text-[11px] font-bold text-emerald-600">
                      +{scannedResult.flashcards.length} Flashcards Created
                    </span>
                  )}
                </div>

                {isScanning ? (
                  <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                    <Sparkles className="w-5 h-5 text-fuchsia-600 animate-spin mx-auto" />
                    <span>Gemini Vision reading handwriting and extracting flashcards...</span>
                  </div>
                ) : scannedResult ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 text-xs font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
                      {scannedResult.transcription}
                    </div>

                    {scannedResult.summary && (
                      <div className="p-3 rounded-2xl bg-fuchsia-50/50 dark:bg-fuchsia-950/40 border border-fuchsia-200/60 text-xs space-y-1">
                        <span className="font-bold text-fuchsia-900 dark:text-fuchsia-200 block">3-Bullet Summary</span>
                        <p className="text-fuchsia-950 dark:text-fuchsia-100 whitespace-pre-wrap">{scannedResult.summary}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => setActiveTab('review')}
                        className="px-4 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold text-xs cursor-pointer"
                      >
                        Start Reviewing Flashcards →
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
