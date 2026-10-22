import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Flame, Zap, Award, BookOpen, RefreshCw, ChevronUp, Users } from 'lucide-react';

interface LeaderboardItem {
  rank: number;
  userId: string;
  name: string;
  college: string;
  avatar: string;
  subject: string;
  quizzesTaken: number;
  avgAccuracy: number;
  xp: number;
  streakDays: number;
  isCurrentUser: boolean;
  badge: string;
}

interface CommunityLeaderboardProps {
  onStartQuizWithSubject?: (subject: string) => void;
}

export const CommunityLeaderboard: React.FC<CommunityLeaderboardProps> = ({ onStartQuizWithSubject }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardItem | null>(null);
  const [subjects, setSubjects] = useState<string[]>(['All Subjects']);
  const [activeSubject, setActiveSubject] = useState<string>('All Subjects');
  const [loading, setLoading] = useState<boolean>(true);
  const [totalCompetitors, setTotalCompetitors] = useState<number>(480);

  const fetchLeaderboard = async (subject: string = activeSubject) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/quiz/leaderboard?subject=${encodeURIComponent(subject)}`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
        setUserRank(data.userRank || null);
        if (data.subjects) setSubjects(data.subjects);
        if (data.totalCompetitors) setTotalCompetitors(data.totalCompetitors);
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(activeSubject);
  }, [activeSubject]);

  const topThree = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <span className="text-xl">🥇</span>;
    if (rank === 2) return <span className="text-xl">🥈</span>;
    if (rank === 3) return <span className="text-xl">🥉</span>;
    return <span className="text-xs font-bold text-slate-500 tabular-nums">#{rank}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header & Subject Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Campus Peer Leaderboard
            </h2>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold border border-amber-200/50">
              {totalCompetitors} Students Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time rankings across engineering colleges based on quiz accuracy, XP, and daily study streaks.
          </p>
        </div>

        {/* Refresh */}
        <button
          onClick={() => fetchLeaderboard(activeSubject)}
          disabled={loading}
          className="self-start sm:self-center p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Refresh rankings"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Subject Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {subjects.map(s => (
          <button
            key={s}
            onClick={() => setActiveSubject(s)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeSubject === s
                ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20'
                : 'bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Top 3 Podium Cards */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
          {topThree.map((item, idx) => {
            const isWinner = item.rank === 1;
            return (
              <div
                key={item.userId}
                className={`relative p-5 rounded-3xl border transition-all ${
                  isWinner
                    ? 'bg-gradient-to-b from-amber-50/80 via-white to-amber-50/30 dark:from-amber-950/40 dark:via-slate-800 dark:to-slate-800 border-amber-300 dark:border-amber-700/80 shadow-md sm:-translate-y-1'
                    : 'bg-white dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700 shadow-xs'
                } ${item.isCurrentUser ? 'ring-2 ring-indigo-500' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getRankBadge(item.rank)}</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      Rank #{item.rank}
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                    {item.badge}
                  </span>
                </div>

                <div className="flex items-center gap-3 my-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center text-xl shadow-xs">
                    {item.avatar}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {item.college}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Accuracy</span>
                    <span className="font-bold text-emerald-600 tabular-nums">{item.avgAccuracy}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Total XP</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">{item.xp}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Streak</span>
                    <span className="font-bold text-amber-600 tabular-nums">🔥 {item.streakDays}d</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Your Current Rank Highlight Banner */}
      {userRank && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-700 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-lg">
              {userRank.avatar}
            </div>
            <div>
              <div className="text-xs font-semibold text-indigo-100">
                Your Community Standing: <span className="font-bold text-white">Rank #{userRank.rank}</span> of {totalCompetitors}
              </div>
              <div className="text-sm font-bold">
                {userRank.name} · {userRank.college}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <div>
              <span className="text-indigo-200 text-[10px] block">Quiz Accuracy</span>
              <span className="font-bold text-white text-sm tabular-nums">{userRank.avgAccuracy}%</span>
            </div>
            <div>
              <span className="text-indigo-200 text-[10px] block">Total Points</span>
              <span className="font-bold text-white text-sm tabular-nums">{userRank.xp} XP</span>
            </div>
            {onStartQuizWithSubject && (
              <button
                onClick={() => onStartQuizWithSubject(activeSubject)}
                className="px-3.5 py-1.5 rounded-xl bg-white text-indigo-900 font-bold hover:bg-indigo-50 transition-colors shadow-xs cursor-pointer text-xs"
              >
                Take Quiz to Rank Up ↑
              </button>
            )}
          </div>
        </div>
      )}

      {/* Remaining Leaderboard Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center justify-between">
          <span>Student Leaderboard</span>
          <span>Performance & XP</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-700/40">
          {leaderboard.map(item => (
            <div
              key={item.userId}
              className={`flex items-center justify-between p-4 transition-colors ${
                item.isCurrentUser
                  ? 'bg-indigo-50/70 dark:bg-indigo-950/40 font-semibold'
                  : 'hover:bg-slate-50/80 dark:hover:bg-slate-750/50'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-8 flex items-center justify-center font-bold text-xs tabular-nums text-slate-500 shrink-0">
                  {getRankBadge(item.rank)}
                </div>

                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-lg shrink-0">
                  {item.avatar}
                </div>

                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                    <span>{item.name}</span>
                    {item.isCurrentUser && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {item.college} · {item.subject}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 sm:gap-6 shrink-0 text-xs text-right">
                <div className="hidden sm:block">
                  <span className="text-[10px] text-slate-400 block">Quizzes</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                    {item.quizzesTaken}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block">Accuracy</span>
                  <span className="font-bold text-emerald-600 tabular-nums">
                    {item.avgAccuracy}%
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block">Points</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                    {item.xp} XP
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
