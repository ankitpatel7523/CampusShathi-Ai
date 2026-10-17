import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';
import {
  Calendar, CheckCircle2, Clock, Sparkles, RefreshCw, Download, Plus,
  AlertCircle, BookOpen, HelpCircle, Mic, Layers, ArrowRight
} from 'lucide-react';
import { PlanTask } from '../types.js';
import { ErrorBanner } from '../components/ErrorBanner.js';

export const PlannerPage: React.FC = () => {
  const { user, refreshUserData } = useAuth();
  const { language, t } = useLanguage();

  const [examName, setExamName] = useState('End-Semester Finals');
  const [examDate, setExamDate] = useState('2026-11-15');
  const [dailyHours, setDailyHours] = useState(2.5);
  const [subjectsText, setSubjectsText] = useState('Operating Systems, Data Structures & Algorithms, Computer Networks');

  const [plans, setPlans] = useState<any[]>([]);
  const [tasks, setTasks] = useState<PlanTask[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorNotice, setErrorNotice] = useState<any>(null);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');

  const fetchPlannerData = async () => {
    try {
      const res = await fetch('/api/planner/today');
      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans || []);
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error('Failed to load planner:', err);
    }
  };

  useEffect(() => {
    fetchPlannerData();
  }, []);

  const handleGeneratePlan = async () => {
    try {
      setIsGenerating(true);
      setErrorNotice(null);

      const subjects = subjectsText.split(',').map(s => s.trim()).filter(Boolean);

      const res = await fetch('/api/planner/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examName,
          examDate,
          dailyHours,
          subjects
        })
      });

      const data = await res.json();
      if (res.ok) {
        await fetchPlannerData();
        refreshUserData();
      } else {
        setErrorNotice({
          message: data.error || 'Failed to generate study timetable',
          errorKind: data.errorKind,
          fixHint: data.fixHint || 'Try specifying simpler subject names.'
        });
      }
    } catch (err: any) {
      setErrorNotice({
        message: 'Could not connect to Planner agent',
        fixHint: 'Check network and retry.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleTask = async (taskId: string, currentCompleted: number) => {
    try {
      const res = await fetch(`/api/planner/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !currentCompleted })
      });
      if (res.ok) {
        setTasks(prev =>
          prev.map(t => (t.id === taskId ? { ...t, completed: currentCompleted ? 0 : 1 } : t))
        );
        refreshUserData();
      }
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const downloadIcs = () => {
    window.location.href = '/api/planner/ics';
  };

  // Group tasks by date
  const uniqueDates = Array.from(new Set(tasks.map(t => t.date))).sort();

  const filteredTasks = selectedDateFilter === 'all'
    ? tasks
    : tasks.filter(t => t.date === selectedDateFilter);

  // Calculate subject progress rings
  const subjectStats: Record<string, { total: number; completed: number }> = {};
  tasks.forEach(t => {
    if (!subjectStats[t.subject]) {
      subjectStats[t.subject] = { total: 0, completed: 0 };
    }
    subjectStats[t.subject].total++;
    if (t.completed) subjectStats[t.subject].completed++;
  });

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'read': return <BookOpen className="w-3.5 h-3.5 text-blue-500" />;
      case 'quiz': return <HelpCircle className="w-3.5 h-3.5 text-orange-500" />;
      case 'viva': return <Mic className="w-3.5 h-3.5 text-rose-500" />;
      case 'flashcards': return <Layers className="w-3.5 h-3.5 text-fuchsia-500" />;
      default: return <Clock className="w-3.5 h-3.5 text-emerald-500" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-teal-400">
              <Calendar className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {t('navPlanner')}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic tool-calling study agent that rebalances your study time around weak topics identified in quizzes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadIcs}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{t('exportIcs')}</span>
          </button>
        </div>
      </div>

      <ErrorBanner
        message={errorNotice?.message}
        errorKind={errorNotice?.errorKind}
        fixHint={errorNotice?.fixHint}
        onDismiss={() => setErrorNotice(null)}
      />

      {/* Subject Progress Rings Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(subjectStats).map(([subj, stats]) => {
          const percent = Math.round((stats.completed / (stats.total || 1)) * 100);
          return (
            <div
              key={subj}
              className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between"
            >
              <div>
                <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate max-w-[120px]">
                  {subj}
                </div>
                <div className="text-[11px] text-slate-500">
                  {stats.completed}/{stats.total} tasks done
                </div>
              </div>

              <div className="relative w-11 h-11 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100 dark:text-slate-700"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-500 transition-all duration-500"
                    strokeDasharray={`${percent}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-[10px] font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                  {percent}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Generator Controls (4 cols) & Tasks by Date (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Plan Configurator */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">
              Adaptive Planner Setup
            </h2>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Target Exam
              </label>
              <input
                type="text"
                value={examName}
                onChange={e => setExamName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Exam Date
              </label>
              <input
                type="date"
                value={examDate}
                onChange={e => setExamDate(e.target.value)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Daily Study Hours Available: <span className="font-bold text-emerald-600">{dailyHours}h</span>
              </label>
              <input
                type="range"
                min="1"
                max="8"
                step="0.5"
                value={dailyHours}
                onChange={e => setDailyHours(parseFloat(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Subjects / Syllabus Modules
              </label>
              <textarea
                rows={2}
                value={subjectsText}
                onChange={e => setSubjectsText(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          <button
            onClick={handleGeneratePlan}
            disabled={isGenerating}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Synthesizing Schedule...' : t('rePlan')}</span>
          </button>

          {/* Why this plan explanation card */}
          {plans.length > 0 && plans[0].explanation && (
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 text-xs text-emerald-950 dark:text-emerald-200 space-y-1">
              <span className="font-bold block">💡 Agent Reasoning:</span>
              <p className="leading-relaxed">{plans[0].explanation}</p>
            </div>
          )}
        </div>

        {/* Right Column: Day-by-Day Task Schedule (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-3">
            <h2 className="font-bold text-base text-slate-900 dark:text-white">
              Scheduled Study Tasks ({tasks.length})
            </h2>

            {/* Date filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setSelectedDateFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedDateFilter === 'all'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                All Dates
              </button>
              {uniqueDates.map(d => (
                <button
                  key={d}
                  onClick={() => setSelectedDateFilter(d)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedDateFilter === d
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredTasks.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No tasks found for this date.
              </div>
            ) : (
              filteredTasks.map(t => (
                <div
                  key={t.id}
                  onClick={() => toggleTask(t.id, t.completed)}
                  className={`flex items-start justify-between gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    t.completed
                      ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 opacity-60'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/80 hover:border-emerald-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button className={`mt-0.5 ${t.completed ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <CheckCircle2 className={`w-5 h-5 ${t.completed ? 'fill-emerald-100' : ''}`} />
                    </button>
                    <div>
                      <div className={`text-xs sm:text-sm font-semibold ${t.completed ? 'line-through text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                        {t.topic}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                        <span className="font-semibold text-emerald-600 dark:text-teal-400">{t.subject}</span>
                        <span>·</span>
                        <span>{t.date}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          {getTaskIcon(t.task_type)}
                          <span className="capitalize">{t.task_type}</span>
                        </span>
                        <span>·</span>
                        <span>{t.duration_minutes}m</span>
                        {t.is_weak_topic === 1 && (
                          <>
                            <span>·</span>
                            <span className="text-red-500 font-semibold">Priority Weak Topic</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                    t.completed ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {t.completed ? 'Completed' : 'Pending'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
