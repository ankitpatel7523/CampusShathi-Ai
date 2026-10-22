import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';
import {
  HelpCircle, Sparkles, Clock, CheckCircle2, XCircle, ArrowRight, RotateCcw,
  Award, Trophy, AlertTriangle, FileText, ChevronRight, Volume2, VolumeX,
  Users, BarChart3, Target, Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { QuizQuestion, DocumentItem } from '../types.js';
import { ErrorBanner } from '../components/ErrorBanner.js';
import { CommunityLeaderboard } from '../components/CommunityLeaderboard.js';
import { soundManager } from '../utils/sound.js';

interface QuizPageProps {
  initialDocId?: string;
  onGoToPlanner?: () => void;
}

export const QuizPage: React.FC<QuizPageProps> = ({ initialDocId, onGoToPlanner }) => {
  const { user, refreshUserData } = useAuth();
  const { language, t } = useLanguage();

  const [activeMainTab, setActiveMainTab] = useState<'quiz' | 'leaderboard'>('quiz');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(soundManager.isEnabled());

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
  const [totalTimeSpent, setTotalTimeSpent] = useState<number>(0);

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

  const toggleSound = () => {
    const nextState = soundManager.toggleSound();
    setSoundEnabled(nextState);
  };

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
      if (questions.length === 0 || quizFinished || activeMainTab !== 'quiz') return;

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
  }, [questions, currentIndex, selectedAnswers, quizFinished, activeMainTab]);

  const handleGenerateQuiz = async (overrideTopic?: string) => {
    try {
      setLoading(true);
      setErrorNotice(null);
      setQuestions([]);
      setSelectedAnswers({});
      setCurrentIndex(0);
      setQuizFinished(false);
      setActiveMainTab('quiz');

      const targetTopic = overrideTopic || quizTopic;

      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: selectedDocId,
          count: questionCount,
          difficulty,
          language,
          topic: targetTopic
        })
      });

      const data = await res.json();
      if (res.ok && data.quiz?.questions?.length > 0) {
        setQuestions(data.quiz.questions);
        setTimeRemaining(data.quiz.questions.length * 60);
        setQuizStartTime(Date.now());
        soundManager.playClick();
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
    const isCorrect = optionIndex === questions[currentIndex].correctOption;

    // Distinct sounds on click:
    // Play tactile click first, then distinct tone for correct or incorrect!
    soundManager.playClick();
    if (isCorrect) {
      setTimeout(() => soundManager.playCorrect(), 50);
    } else {
      setTimeout(() => soundManager.playIncorrect(), 50);
    }

    setSelectedAnswers(prev => ({
      ...prev,
      [currentIndex]: optionIndex
    }));
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    soundManager.playClick();
    setShowExplanation(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    const duration = Math.max(10, Math.round((Date.now() - quizStartTime) / 1000));
    setTotalTimeSpent(duration);
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

    // Play Victory Fanfare Sound when result dashboard opens!
    soundManager.playFinishFanfare();

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch {}

    // Submit attempt to server
    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: quizTopic,
          score,
          total: questions.length,
          timeSpent: duration,
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
  };

  const resetQuiz = () => {
    setQuestions([]);
    setSelectedAnswers({});
    setCurrentIndex(0);
    setQuizFinished(false);
  };

  const correctCount = questions.reduce((acc, q, idx) => {
    return selectedAnswers[idx] === q.correctOption ? acc + 1 : acc;
  }, 0);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const accuracyPercent = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
  const incorrectCount = questions.length - correctCount;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 pb-20">
      {/* Top Header & Navigation Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
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
            Exam MCQs with audio feedback, verified page excerpts, and live college community rankings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sound Toggle Button */}
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects'}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 text-amber-700 dark:text-amber-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Sub-tabs: Practice vs Leaderboard */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveMainTab('quiz')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeMainTab === 'quiz'
                  ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Practice Quiz
            </button>
            <button
              onClick={() => setActiveMainTab('leaderboard')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeMainTab === 'leaderboard'
                  ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-amber-500" />
              <span>Leaderboard</span>
            </button>
          </div>

          {/* Timer pill during active test */}
          {questions.length > 0 && !quizFinished && activeMainTab === 'quiz' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-amber-300 font-mono font-bold text-xs border border-orange-200 dark:border-orange-800">
              <Clock className="w-3.5 h-3.5 animate-pulse text-amber-500" />
              <span>{formatTime(timeRemaining)}</span>
            </div>
          )}
        </div>
      </div>

      <ErrorBanner
        message={errorNotice?.message}
        errorKind={errorNotice?.errorKind}
        fixHint={errorNotice?.fixHint}
        onDismiss={() => setErrorNotice(null)}
      />

      {/* Mode 1: Community Leaderboard Tab */}
      {activeMainTab === 'leaderboard' && (
        <CommunityLeaderboard
          onStartQuizWithSubject={(subj) => {
            setQuizTopic(subj === 'All Subjects' ? 'Core Concepts' : subj);
            handleGenerateQuiz(subj === 'All Subjects' ? 'Core Concepts' : subj);
          }}
        />
      )}

      {/* Mode 2: Quiz Configuration (when no active quiz) */}
      {activeMainTab === 'quiz' && questions.length === 0 && (
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
            {/* Document Selector */}
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
                    onClick={() => {
                      soundManager.playClick();
                      setQuestionCount(cnt);
                    }}
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
                    onClick={() => {
                      soundManager.playClick();
                      setDifficulty(lvl);
                    }}
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
            onClick={() => handleGenerateQuiz()}
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-sm shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Verifying Excerpts & Generating Quiz...' : 'Start Verified AI Quiz'}</span>
          </button>
        </div>
      )}

      {/* Mode 3: Active Quiz Test Interface */}
      {activeMainTab === 'quiz' && questions.length > 0 && !quizFinished && (
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
              <span>{currentIndex === questions.length - 1 ? 'Finish & Open Result Dashboard' : 'Next Question'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mode 4: Comprehensive RESULT DASHBOARD (opened after the last question!) */}
      {activeMainTab === 'quiz' && quizFinished && (
        <div className="space-y-6">
          {/* Main Victory Banner */}
          <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-xl shadow-orange-500/15 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white text-xs font-bold">
                  <Trophy className="w-4 h-4 text-amber-200" />
                  <span>Quiz Completed Successfully</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {accuracyPercent >= 80 ? 'Outstanding Performance! 🌟' : accuracyPercent >= 60 ? 'Well Done! Solid Attempt 👏' : 'Keep Practicing! Review Below 💪'}
                </h2>
                <p className="text-orange-100 text-xs sm:text-sm max-w-lg">
                  {accuracyPercent >= 80
                    ? 'Your conceptual mastery on this syllabus is in the top bracket of campus test takers.'
                    : 'Check the verified citations below to strengthen weak points and boost your score.'}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-md text-center">
                  <span className="text-[11px] uppercase tracking-wider font-semibold block text-orange-100">Score</span>
                  <span className="text-3xl font-extrabold tabular-nums">{correctCount}/{questions.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4-Card Analytics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Accuracy Rate</span>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                {accuracyPercent}%
              </div>
              <span className="text-[10px] text-slate-400">
                {correctCount} correct, {incorrectCount} missed
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Total Time</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                {formatTime(totalTimeSpent)}
              </div>
              <span className="text-[10px] text-slate-400">
                ~{Math.round(totalTimeSpent / (questions.length || 1))}s per question
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 block">XP Earned</span>
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1 tabular-nums flex items-center gap-1">
                <Zap className="w-5 h-5 fill-indigo-500 text-indigo-500" />
                <span>+{earnedXp}</span>
              </div>
              <span className="text-[10px] text-slate-400">Added to your rank</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Performance Rank</span>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {accuracyPercent >= 80 ? 'Tier 1' : accuracyPercent >= 60 ? 'Tier 2' : 'Tier 3'}
              </div>
              <button
                onClick={() => setActiveMainTab('leaderboard')}
                className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline block text-left mt-0.5 cursor-pointer"
              >
                See Leaderboard →
              </button>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveMainTab('leaderboard')}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>View Community Leaderboard</span>
              </button>

              {onGoToPlanner && (
                <button
                  onClick={onGoToPlanner}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>Schedule Review in Planner</span>
                </button>
              )}
            </div>

            <button
              onClick={resetQuiz}
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Take Another Quiz</span>
            </button>
          </div>

          {/* Question Review & Citations Drawer */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
              Detailed Question Review & Textbook Citations
            </h3>

            <div className="space-y-3">
              {questions.map((q, idx) => {
                const selected = selectedAnswers[idx];
                const isCorrect = selected === q.correctOption;
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all text-xs space-y-2 ${
                      isCorrect
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                        : 'bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-bold text-slate-900 dark:text-white sm:text-sm">
                        Q{idx + 1}. {q.question}
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] shrink-0 ${
                        isCorrect
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                      }`}>
                        {isCorrect ? '✓ Correct' : '✗ Missed'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="text-slate-600 dark:text-slate-400">
                        Your choice: <span className="font-semibold text-slate-800 dark:text-slate-200">{selected !== undefined ? q.options[selected] : 'Not answered'}</span>
                      </div>
                      {!isCorrect && (
                        <div className="text-emerald-600 dark:text-emerald-400">
                          Correct answer: <span className="font-semibold">{q.options[q.correctOption]}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-amber-700 dark:text-amber-400 block mb-0.5">
                        💡 Key Takeaway {q.citation ? `(${q.citation})` : ''}:
                      </span>
                      <p>{q.explanation}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
