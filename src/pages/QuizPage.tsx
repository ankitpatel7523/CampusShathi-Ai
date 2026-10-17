import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';
import {
  HelpCircle, Sparkles, Clock, CheckCircle2, XCircle, ArrowRight, RotateCcw,
  Award, Trophy, AlertTriangle, FileText, ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { QuizQuestion, DocumentItem } from '../types.js';
import { ErrorBanner } from '../components/ErrorBanner.js';

interface QuizPageProps {
  initialDocId?: string;
  onGoToPlanner?: () => void;
}

export const QuizPage: React.FC<QuizPageProps> = ({ initialDocId, onGoToPlanner }) => {
  const { user, refreshUserData } = useAuth();
  const { language, t } = useLanguage();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>(initialDocId || '');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<string>('medium');
  const [quizTopic, setQuizTopic] = useState<string>('Process Synchronization & Scheduling');
  const [loading, setLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState<any>(null);

  // Quiz active state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(300); // 5 mins
  const [quizStartTime, setQuizStartTime] = useState<number>(0);
  const [earnedXp, setEarnedXp] = useState<number>(0);

  useEffect(() => {
    fetch('/api/documents')
      .then(res => res.json())
      .then(data => {
        setDocuments(data.documents || []);
        if (data.documents?.length > 0 && !selectedDocId) {
          setSelectedDocId(data.documents[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // Timer countdown
  useEffect(() => {
    if (questions.length > 0 && !quizFinished) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            finishQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [questions, quizFinished]);

  // Keyboard shortcuts 1-4 / A-D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (questions.length === 0 || quizFinished) return;

      const key = e.key.toUpperCase();
      let optionIndex = -1;

      if (['1', 'A'].includes(key)) optionIndex = 0;
      else if (['2', 'B'].includes(key)) optionIndex = 1;
      else if (['3', 'C'].includes(key)) optionIndex = 2;
      else if (['4', 'D'].includes(key)) optionIndex = 3;

      if (optionIndex !== -1 && selectedAnswers[currentIndex] === undefined) {
        handleSelectOption(optionIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [questions, currentIndex, selectedAnswers, quizFinished]);

  const handleGenerateQuiz = async () => {
    try {
      setLoading(true);
      setErrorNotice(null);
      setQuestions([]);
      setSelectedAnswers({});
      setCurrentIndex(0);
      setQuizFinished(false);

      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: selectedDocId,
          count: questionCount,
          difficulty,
          language,
          topic: quizTopic
        })
      });

      const data = await res.json();
      if (res.ok && data.quiz?.questions?.length > 0) {
        setQuestions(data.quiz.questions);
        setTimeRemaining(data.quiz.questions.length * 60);
        setQuizStartTime(Date.now());
      } else {
        setErrorNotice({
          message: data.error || 'Failed to generate quiz questions',
          errorKind: data.errorKind,
          fixHint: data.fixHint || 'Try selecting another document or adjusting difficulty.'
        });
      }
    } catch (err: any) {
      setErrorNotice({
        message: 'Could not connect to Quiz service',
        fixHint: 'Check network and retry.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (optionIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentIndex]: optionIndex
    }));
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    setShowExplanation(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setQuizFinished(true);

    let score = 0;
    const answerRecords: any[] = [];
    questions.forEach((q, idx) => {
      const selected = selectedAnswers[idx] ?? -1;
      if (selected === q.correctOption) {
        score++;
      }
      answerRecords.push({
        question: q.question,
        selectedOption: selected,
        correctOption: q.correctOption,
        explanation: q.explanation,
        citation: q.citation
      });
    });

    const timeSpent = Math.max(10, Math.round((Date.now() - quizStartTime) / 1000));

    // Submit to server
    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: quizTopic,
          score,
          total: questions.length,
          timeSpent,
          difficulty,
          language,
          answers: answerRecords
        })
      });
      if (res.ok) {
        const json = await res.json();
        setEarnedXp(json.xpEarned || 40);
        refreshUserData();
      }
    } catch (err) {
      console.error('Failed to submit quiz attempt:', err);
    }

    // Trigger celebration confetti if passed
    if (score / questions.length >= 0.6) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}
    }
  };

  // Reset quiz
  const resetQuiz = () => {
    setQuestions([]);
    setSelectedAnswers({});
    setCurrentIndex(0);
    setQuizFinished(false);
  };

  // Score calculation
  const correctCount = questions.reduce((acc, q, idx) => {
    return selectedAnswers[idx] === q.correctOption ? acc + 1 : acc;
  }, 0);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-amber-400">
              <HelpCircle className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {t('navQuiz')}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Exam-pattern MCQs generated from notes with verified page excerpts and keyboard shortcuts (1-4 / A-D).
          </p>
        </div>

        {questions.length > 0 && !quizFinished && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-amber-300 font-mono font-bold text-xs border border-orange-200 dark:border-orange-800">
            <Clock className="w-4 h-4 animate-pulse" />
            <span>{formatTime(timeRemaining)}</span>
          </div>
        )}
      </div>

      <ErrorBanner
        message={errorNotice?.message}
        errorKind={errorNotice?.errorKind}
        fixHint={errorNotice?.fixHint}
        onDismiss={() => setErrorNotice(null)}
      />

      {/* View 1: Quiz Configurator (when no active quiz) */}
      {questions.length === 0 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          <div className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Configure Your Practice Quiz
            </h2>
            <p className="text-xs text-slate-500">
              Choose your syllabus source, number of questions, and difficulty level.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Document / Subject Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Source Document
              </label>
              <select
                value={selectedDocId}
                onChange={e => setSelectedDocId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {documents.map(d => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
                <option value="">General Engineering Syllabus</option>
              </select>
            </div>

            {/* Custom Topic */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Topic Focus
              </label>
              <input
                type="text"
                value={quizTopic}
                onChange={e => setQuizTopic(e.target.value)}
                placeholder="e.g. Deadlocks, Banker's Algorithm, Trees"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Number of Questions */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Number of MCQs
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[5, 10].map(cnt => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setQuestionCount(cnt)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      questionCount === cnt
                        ? 'bg-orange-50 dark:bg-orange-950/60 border-orange-400 text-orange-700 dark:text-amber-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {cnt} Questions
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['easy', 'medium', 'hard'].map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setDifficulty(lvl)}
                    className={`py-2 rounded-xl text-xs font-semibold capitalize border transition-all cursor-pointer ${
                      difficulty === lvl
                        ? 'bg-orange-50 dark:bg-orange-950/60 border-orange-400 text-orange-700 dark:text-amber-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerateQuiz}
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-sm shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Verifying Excerpts & Generating Quiz...' : 'Start Verified AI Quiz'}</span>
          </button>
        </div>
      )}

      {/* View 2: Active Quiz Interface */}
      {questions.length > 0 && !quizFinished && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          {/* Progress Strip */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span className="capitalize">{difficulty} Level</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {questions[currentIndex].question}
            </h2>
            {questions[currentIndex].citation && (
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                Citation: {questions[currentIndex].citation}
              </p>
            )}
          </div>

          {/* Options Grid */}
          <div className="space-y-3">
            {questions[currentIndex].options.map((opt, optIdx) => {
              const isSelected = selectedAnswers[currentIndex] === optIdx;
              const hasAnswered = selectedAnswers[currentIndex] !== undefined;
              const isCorrect = optIdx === questions[currentIndex].correctOption;

              let optionStyle = 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50';
              if (hasAnswered) {
                if (isCorrect) {
                  optionStyle = 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 text-emerald-900 dark:text-emerald-100 font-semibold';
                } else if (isSelected && !isCorrect) {
                  optionStyle = 'bg-red-50 dark:bg-red-950/60 border-red-400 text-red-900 dark:text-red-100';
                }
              }

              return (
                <button
                  key={optIdx}
                  onClick={() => !hasAnswered && handleSelectOption(optIdx)}
                  disabled={hasAnswered}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left text-xs sm:text-sm transition-all cursor-pointer ${optionStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs shrink-0">
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span>{opt}</span>
                  </div>

                  {hasAnswered && isCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  )}
                  {hasAnswered && isSelected && !isCorrect && (
                    <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Callout */}
          {showExplanation && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-100 space-y-1 animate-in fade-in">
              <div className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Explanation & Verified Citation</span>
              </div>
              <p className="leading-relaxed">
                {questions[currentIndex].explanation}
              </p>
            </div>
          )}

          {/* Next / Submit Control */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700/60">
            <span className="text-[11px] text-slate-400">
              Press 1-4 or A-D on keyboard to select
            </span>

            <button
              onClick={handleNextQuestion}
              disabled={selectedAnswers[currentIndex] === undefined}
              className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <span>{currentIndex === questions.length - 1 ? 'Finish & See Score' : 'Next Question'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* View 3: Quiz Score Summary */}
      {quizFinished && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center mx-auto text-2xl shadow-lg shadow-orange-500/20">
            <Trophy className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Quiz Completed!
            </h2>
            <p className="text-sm text-slate-500">
              You scored <span className="font-bold text-orange-600 dark:text-amber-400">{correctCount}</span> out of {questions.length} ({Math.round((correctCount / questions.length) * 100)}%)
            </p>
          </div>

          {/* XP Banner */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-sm border border-indigo-200/60">
            <Award className="w-5 h-5 text-indigo-500" />
            <span>+{earnedXp} XP Awarded to your Profile</span>
          </div>

          {/* Question Review List */}
          <div className="text-left space-y-3 pt-4 border-t border-slate-100 dark:border-slate-700/60">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
              Answer Review
            </h3>
            {questions.map((q, idx) => {
              const selected = selectedAnswers[idx];
              const isCorrect = selected === q.correctOption;
              return (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      Q{idx + 1}. {q.question}
                    </span>
                    {isCorrect ? (
                      <span className="text-emerald-600 font-bold shrink-0">Correct</span>
                    ) : (
                      <span className="text-red-500 font-bold shrink-0">Incorrect</span>
                    )}
                  </div>
                  <div className="text-slate-600 dark:text-slate-400">
                    Your answer: <span className="font-medium">{selected !== undefined ? q.options[selected] : 'Not answered'}</span>
                  </div>
                  {!isCorrect && (
                    <div className="text-emerald-600 dark:text-emerald-400">
                      Correct: <span className="font-medium">{q.options[q.correctOption]}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              onClick={resetQuiz}
              className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Take Another Quiz</span>
            </button>
            {onGoToPlanner && (
              <button
                onClick={onGoToPlanner}
                className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer"
              >
                <span>Add Weak Topics to Planner →</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
