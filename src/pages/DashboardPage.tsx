import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';
import {
  Flame, Zap, Award, HelpCircle, BookOpen, Clock, AlertCircle, CheckCircle2,
  Calendar, ArrowRight, Sparkles, MessageSquareText, Mic, ScanText, FileText
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { ErrorBanner } from '../components/ErrorBanner.js';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  onOpenDocChat?: (docId: string) => void;
}

export const DashboardPage: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const { user, profile, refreshUserData } = useAuth();
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [errorNotice, setErrorNotice] = useState<any>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setErrorNotice(null);
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        const errJson = await res.json().catch(() => ({}));
        setErrorNotice({
          message: errJson.error || 'Failed to load dashboard metrics',
          fixHint: 'Ensure server is running or click retry below.'
        });
      }
    } catch (err: any) {
      setErrorNotice({
        message: 'Could not connect to server database.',
        fixHint: 'Check local server connectivity and refresh.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const toggleTaskCompleted = async (taskId: string, currentCompleted: number) => {
    try {
      const res = await fetch(`/api/planner/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !currentCompleted })
      });
      if (res.ok) {
        fetchDashboardData();
        refreshUserData();
      }
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  // Greeting logic
  const hour = new Date().getHours();
  let greetingKey: 'greetingMorning' | 'greetingAfternoon' | 'greetingEvening' = 'greetingMorning';
  if (hour >= 12 && hour < 17) greetingKey = 'greetingAfternoon';
  else if (hour >= 17) greetingKey = 'greetingEvening';

  const studentName = user?.name || 'Student';

  if (loading && !data) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl w-2/3" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-72 bg-slate-200 dark:bg-slate-800 rounded-2xl lg:col-span-2" />
          <div className="h-72 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 pb-20">
      <ErrorBanner
        message={errorNotice?.message}
        fixHint={errorNotice?.fixHint}
        onRetry={fetchDashboardData}
        onDismiss={() => setErrorNotice(null)}
      />

      {/* Hero Greeting & College Info */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-800 text-white p-6 sm:p-8 shadow-xl shadow-indigo-500/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-200 text-sm font-medium mb-1">
              <span>{t(greetingKey)},</span>
              <span className="font-semibold text-white">{studentName}</span>
              <span>👋</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {language === 'hi'
                ? 'आज आपकी परीक्षा की तैयारी कैसी चल रही है?'
                : language === 'hinglish'
                ? 'Aaj study sprint me kya phodna hai?'
                : 'Ready to conquer today’s study goals?'}
            </h1>
            <p className="text-indigo-100/90 text-sm mt-1 max-w-xl">
              {user?.college ? `${user.college} · ${user.course || 'Engineering'} · ${user.year || '3rd Year'}` : 'All-in-one AI exam preparation partner for your semester finals.'}
            </p>
          </div>

          {/* Quick Action Pills */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setActiveTab('chat')}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-white text-indigo-900 hover:bg-indigo-50 transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <MessageSquareText className="w-4 h-4 text-indigo-600" />
              <span>{t('askNotes')}</span>
            </button>
            <button
              onClick={() => setActiveTab('quiz')}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-500/40 hover:bg-indigo-500/60 text-white border border-indigo-300/30 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <HelpCircle className="w-4 h-4 text-amber-300" />
              <span>{t('startQuiz')}</span>
            </button>
            <button
              onClick={() => setActiveTab('viva')}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-500/40 hover:bg-rose-500/60 text-white border border-rose-300/30 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Mic className="w-4 h-4 text-pink-300" />
              <span>{t('startViva')}</span>
            </button>
          </div>
        </div>

        {/* Ambient subtle glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      </div>

      {/* Stat Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Streak */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">{t('studyStreak')}</span>
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {data?.stats?.streakDays || 5} <span className="text-xs font-normal text-slate-500">days</span>
            </div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
              🔥 Keep it up!
            </div>
          </div>
        </div>

        {/* XP & Level */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">{t('xpLevel')} {data?.stats?.level || 1}</span>
            <Zap className="w-4 h-4 text-indigo-500 fill-indigo-500" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {data?.stats?.xp || 120} <span className="text-xs font-normal text-slate-500">XP</span>
            </div>
            <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
              +50 XP to Next Level
            </div>
          </div>
        </div>

        {/* Quizzes Taken */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">{t('quizzesCompleted')}</span>
            <HelpCircle className="w-4 h-4 text-orange-500" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {data?.stats?.totalQuizzes || 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Self-assessment tests
            </div>
          </div>
        </div>

        {/* Average Quiz Score */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">{t('avgScore')}</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {data?.stats?.avgQuizScore || 75}%
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
              Rank in top 15%
            </div>
          </div>
        </div>

        {/* Flashcards Due Today */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">{t('flashcardsDue')}</span>
            <BookOpen className="w-4 h-4 text-fuchsia-500" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {data?.stats?.flashcardsDueToday || 3} <span className="text-xs font-normal text-slate-500">cards</span>
            </div>
            <button
              onClick={() => setActiveTab('scanner')}
              className="text-[11px] text-fuchsia-600 dark:text-fuchsia-400 font-semibold mt-0.5 hover:underline text-left cursor-pointer"
            >
              Review Now →
            </button>
          </div>
        </div>
      </div>

      {/* Upcoming Exam Countdowns */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t('examCountdown')}
          </h2>
          <button
            onClick={() => setActiveTab('planner')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            Manage in Planner →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {data?.upcomingExams?.map((exam: any, idx: number) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 shadow-2xs"
            >
              <div>
                <div className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">
                  {exam.name}
                </div>
                <div className="text-[11px] text-slate-500">{exam.date}</div>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs tabular-nums border border-indigo-200/50 dark:border-indigo-800/40">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>{exam.daysLeft} {t('daysLeft')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Layout: Today's Plan & Weak Topics Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Today's Plan Tasks (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                {t('todayPlan')}
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('planner')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Full Schedule →
            </button>
          </div>

          <div className="space-y-2.5">
            {(!data?.todayTasks || data.todayTasks.length === 0) ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No tasks scheduled for today. Click below to generate an AI study plan!
                <div className="mt-3">
                  <button
                    onClick={() => setActiveTab('planner')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
                  >
                    Generate AI Plan
                  </button>
                </div>
              </div>
            ) : (
              data.todayTasks.map((task: any) => (
                <div
                  key={task.id}
                  onClick={() => toggleTaskCompleted(task.id, task.completed)}
                  className={`flex items-start justify-between gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    task.completed
                      ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 opacity-60'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/80 hover:border-emerald-300 dark:hover:border-emerald-700 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      className={`mt-0.5 rounded-lg p-0.5 transition-colors ${
                        task.completed ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    >
                      <CheckCircle2 className={`w-5 h-5 ${task.completed ? 'fill-emerald-100' : ''}`} />
                    </button>
                    <div>
                      <div className={`text-xs sm:text-sm font-semibold ${task.completed ? 'line-through text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                        {task.topic}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                        <span className="font-medium text-indigo-600 dark:text-indigo-400">{task.subject}</span>
                        <span>·</span>
                        <span>{task.duration_minutes} mins</span>
                        <span>·</span>
                        <span className="capitalize">{task.task_type}</span>
                        {task.is_weak_topic === 1 && (
                          <>
                            <span>·</span>
                            <span className="text-red-500 font-semibold">Priority Review</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 shrink-0 font-medium">
                    {task.completed ? 'Done' : 'Pending'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Weak Topics Heatmap (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                {t('weakTopicsTitle')}
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">Based on Quizzes</span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Topics where quiz or viva score was below 70%. Target these first to boost semester GPA.
          </p>

          <div className="space-y-3">
            {(!data?.weakTopics || data.weakTopics.length === 0) ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                Take quizzes to identify your weak topics!
              </div>
            ) : (
              data.weakTopics.map((topic: any, idx: number) => {
                const isWeak = topic.scorePercent < 60;
                const isModerate = topic.scorePercent >= 60 && topic.scorePercent < 80;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                        {topic.topic}
                      </span>
                      <span className={`font-semibold tabular-nums ${
                        isWeak ? 'text-red-600 dark:text-red-400' : isModerate ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600'
                      }`}>
                        {topic.scorePercent}%
                      </span>
                    </div>

                    {/* Heatmap Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isWeak
                            ? 'bg-gradient-to-r from-red-500 to-rose-400'
                            : isModerate
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                            : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        }`}
                        style={{ width: `${Math.max(10, topic.scorePercent)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={() => setActiveTab('quiz')}
            className="w-full mt-2 py-2 text-xs font-semibold rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-200/60 dark:border-amber-800/40 transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>Practice Weak Topics Quiz</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Charts Section: 14 Days Study Minutes & Topic Mastery Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Study Minutes Area Chart */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                {t('studyActivity')}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Average 58 mins/day over past two weeks</p>
            </div>
            <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
              Total: 820 mins
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.studyMinutes || []}>
                <defs>
                  <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit="m" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Area type="monotone" dataKey="minutes" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMinutes)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Topic Mastery Radar Chart */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                {t('topicMasteryRadar')}
              </h2>
              <p className="text-xs text-slate-500">Core Subject Balance</p>
            </div>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={data?.topicMastery || []}>
                <PolarGrid stroke="#cbd5e1" />
                <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={10} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94a3b8" fontSize={9} />
                <Radar name="Mastery" dataKey="mastery" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <h2 className="font-bold text-base text-slate-900 dark:text-white mb-4">
          {t('recentActivity')}
        </h2>

        <div className="space-y-3">
          {(!data?.recentActivity || data.recentActivity.length === 0) ? (
            <div className="p-4 text-center text-slate-400 text-xs">
              No recent activity yet. Start studying or taking quizzes!
            </div>
          ) : (
            data.recentActivity.map((act: any) => (
              <div key={act.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-sm">
                    {act.activity_type === 'quiz' ? '🎯' : act.activity_type === 'viva' ? '🎙️' : '📝'}
                  </span>
                  <div>
                    <div className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {act.title}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {new Date(act.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                  <Zap className="w-3.5 h-3.5 fill-indigo-500" />
                  <span>+{act.xp_earned} XP</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
