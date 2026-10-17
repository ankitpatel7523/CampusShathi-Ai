import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';
import { useTheme } from '../context/ThemeContext.js';
import {
  User, Award, Flame, Zap, Shield, Download, Trash2, Check,
  Activity, Server, RefreshCw, KeyRound, ExternalLink, Sparkles
} from 'lucide-react';
import { Language, ThemeMode } from '../types.js';
import { ErrorBanner } from '../components/ErrorBanner.js';

export const ProfilePage: React.FC = () => {
  const { user, profile, updateProfileLocally, logout, refreshUserData } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme, accentColor, setAccentColor } = useTheme();

  // Edit fields
  const [name, setName] = useState(user?.name || '');
  const [college, setCollege] = useState(user?.college || '');
  const [course, setCourse] = useState(user?.course || '');
  const [year, setYear] = useState(user?.year || '3rd Year');
  const [semester, setSemester] = useState(user?.semester || 'Sem 5');
  const [avatar, setAvatar] = useState(profile?.avatar || '🎓');
  const [dailyGoal, setDailyGoal] = useState(profile?.daily_goal_minutes || 60);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorNotice, setErrorNotice] = useState<any>(null);

  // Live API probe state
  const [probeLoading, setProbeLoading] = useState(false);
  const [probeResult, setProbeResult] = useState<any>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setCollege(user.college || '');
      setCourse(user.course || '');
      setYear(user.year || '3rd Year');
      setSemester(user.semester || 'Sem 5');
    }
    if (profile) {
      setAvatar(profile.avatar || '🎓');
      setDailyGoal(profile.daily_goal_minutes || 60);
    }
  }, [user, profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorNotice(null);

      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          college,
          course,
          year,
          semester,
          avatar,
          daily_goal_minutes: dailyGoal,
          default_language: language,
          theme,
          accent_color: accentColor
        })
      });

      if (res.ok) {
        const data = await res.json();
        updateProfileLocally(data.user, data.profile);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      } else {
        const errJson = await res.json().catch(() => ({}));
        setErrorNotice({
          message: errJson.error || 'Failed to save profile changes',
          fixHint: 'Verify inputs and retry.'
        });
      }
    } catch (err: any) {
      setErrorNotice({
        message: 'Could not connect to update profile',
        fixHint: 'Check network and retry.'
      });
    } finally {
      setSaving(false);
    }
  };

  const runLiveApiProbe = async () => {
    try {
      setProbeLoading(true);
      setErrorNotice(null);
      const res = await fetch('/api/health?probe=1');
      if (res.ok) {
        const data = await res.json();
        setProbeResult(data.aiProbe);
      }
    } catch (err) {
      console.error('Probe failed:', err);
    } finally {
      setProbeLoading(false);
    }
  };

  const handleExportData = () => {
    window.location.href = '/api/me/export';
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to permanently delete your account, documents, and study records? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch('/api/me', { method: 'DELETE' });
      if (res.ok) {
        logout();
      }
    } catch (err) {
      console.error('Failed to delete account:', err);
    }
  };

  const avatarOptions = ['🎓', '🚀', '⚡', '🧠', '💡', '🔥', '📚', '🎯'];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            {t('navProfile')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your academic credentials, AI model connectivity, preferences, and data privacy.
          </p>
        </div>
      </div>

      <ErrorBanner
        message={errorNotice?.message}
        fixHint={errorNotice?.fixHint}
        onDismiss={() => setErrorNotice(null)}
      />

      {/* Grid: Profile Form (7 cols) & Badges / API Health (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Profile Edit Form */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Student Information
            </h2>

            {/* Avatar Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Choose Profile Avatar
              </label>
              <div className="flex items-center gap-2">
                {avatarOptions.map(em => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setAvatar(em)}
                    className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all cursor-pointer ${
                      avatar === em
                        ? 'bg-indigo-600 text-white shadow-md scale-105'
                        : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/40 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  College / University
                </label>
                <input
                  type="text"
                  value={college}
                  onChange={e => setCollege(e.target.value)}
                  placeholder="e.g. IIIT Delhi, DTU, NIT"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Degree & Branch
                </label>
                <input
                  type="text"
                  value={course}
                  onChange={e => setCourse(e.target.value)}
                  placeholder="e.g. B.Tech Computer Science"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Academic Year
                </label>
                <select
                  value={year}
                  onChange={e => setYear(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Daily Study Goal (Minutes)
                </label>
                <input
                  type="number"
                  min="15"
                  max="480"
                  value={dailyGoal}
                  onChange={e => setDailyGoal(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {saveSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : null}
                <span>{saving ? 'Saving...' : saveSuccess ? 'Profile Updated!' : t('saveChanges')}</span>
              </button>
            </div>
          </form>

          {/* Privacy & Data Controls */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-700/60 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Data Sovereignty & Account Privacy
            </h3>
            <p className="text-xs text-slate-500">
              All documents, vector chunks, and chat history belong exclusively to your user ID. You can export or delete your entire database footprint at any time.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleExportData}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export My Data (JSON)</span>
              </button>

              <button
                type="button"
                onClick={handleDeleteAccount}
                className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/60 text-red-600 dark:text-red-300 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Account & Files</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Badges & Live AI Connection Health (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* AI Connections Health Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  AI Provider Status & Health
                </h3>
              </div>
              <button
                onClick={runLiveApiProbe}
                disabled={probeLoading}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${probeLoading ? 'animate-spin' : ''}`} />
                <span>{t('runLiveTest')}</span>
              </button>
            </div>

            <p className="text-xs text-slate-500">
              CampusSathi uses Groq for fast inference & Whisper audio, and Gemini for multimodal vision OCR and embeddings with automated fallback.
            </p>

            <div className="space-y-3">
              {/* Gemini Provider Status */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200/60 dark:border-slate-700 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Gemini (Multimodal & OCR)</span>
                  <span className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                    probeResult?.gemini?.status === 'OK'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                    {probeResult?.gemini?.status || 'Active'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Model: <span className="font-mono">gemini-2.5-flash / text-embedding-004</span>
                </div>
              </div>

              {/* Groq Provider Status */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200/60 dark:border-slate-700 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Groq (Llama 3.3 & Whisper STT)</span>
                  <span className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                    probeResult?.groq?.status === 'OK'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                  }`}>
                    {probeResult?.groq?.status || 'Auto-Fallback'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Model: <span className="font-mono">llama-3.3-70b-versatile / whisper-large-v3-turbo</span>
                </div>
              </div>
            </div>
          </div>

          {/* Badges & Achievements */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700/60 pb-3">
              Unlocked Badges
            </h3>

            <div className="grid grid-cols-1 gap-2.5">
              {[
                { title: 'First Quiz Master', desc: 'Completed verified academic quiz', icon: '🎯' },
                { title: '5-Day Study Streak', desc: 'Active revision for 5 continuous days', icon: '🔥' },
                { title: 'Viva Ready', desc: 'Finished full spoken oral examination', icon: '🎙️' },
                { title: 'SM-2 Recall Champion', desc: 'Mastered 20+ memory flashcards', icon: '🧠' }
              ].map((badge, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <span className="text-xl flex items-center justify-center w-9 h-9 rounded-xl bg-white dark:bg-slate-700 shadow-2xs">
                    {badge.icon}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {badge.title}
                    </div>
                    <div className="text-[11px] text-slate-500">{badge.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
