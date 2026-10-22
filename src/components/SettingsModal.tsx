import React, { useState } from 'react';
import { 
  Settings, Moon, Sun, Globe, Clock, Volume2, Shield, Download, 
  Trash2, X, Check, ExternalLink, Sparkles, Bell
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';
import { useTheme } from '../context/ThemeContext.js';
import { useAuth } from '../context/AuthContext.js';
import { Language } from '../types.js';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToProfile: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onNavigateToProfile }) => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme, accentColor, setAccentColor } = useTheme();
  const { profile, updateProfileLocally } = useAuth();

  const [dailyGoal, setDailyGoal] = useState<number>(profile?.daily_goal_minutes || 45);
  const [audioFeedback, setAudioFeedback] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [savedToast, setSavedToast] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          daily_goal_minutes: dailyGoal,
          default_language: language,
          theme,
          accent_color: accentColor
        })
      });
      updateProfileLocally(undefined, { daily_goal_minutes: dailyGoal });
      setSavedToast(true);
      setTimeout(() => {
        setSavedToast(false);
        onClose();
      }, 1000);
    } catch {
      onClose();
    }
  };

  const handleExportData = () => {
    window.location.href = '/api/me/export';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Preferences & Settings
              </h3>
              <p className="text-[11px] text-slate-500">
                Customize your CampusSathi workspace and learning preferences
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 text-xs">
          {/* Appearance Section */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px]">
              Theme & Appearance
            </h4>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Dark Mode ({theme === 'dark' ? 'Active' : 'Light'})
                </span>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Language Selection */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-500" />
                Default Study Language
              </h4>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'en', label: 'English', desc: 'Standard' },
                { id: 'hi', label: 'हिंदी', desc: 'Hindi' },
                { id: 'hinglish', label: 'Hinglish', desc: 'Bilingual' }
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLanguage(item.id as Language)}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    language === item.id
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <p className="text-xs font-bold">{item.label}</p>
                  <p className="text-[10px] opacity-75">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Daily Study Goal */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Daily Target Goal
              </h4>
              <span className="font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                {dailyGoal} Minutes/Day
              </span>
            </div>
            <input
              type="range"
              min="15"
              max="180"
              step="15"
              value={dailyGoal}
              onChange={(e) => setDailyGoal(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>15m (Light)</span>
              <span>45m (Balanced)</span>
              <span>180m (Exam Sprint)</span>
            </div>
          </div>

          {/* Sound & Notifications */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px]">
              Audio & Alerts
            </h4>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-slate-500" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Voice Viva Audio Feedback
                </span>
              </div>
              <input
                type="checkbox"
                checked={audioFeedback}
                onChange={(e) => setAudioFeedback(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 cursor-pointer accent-indigo-600"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-slate-500" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Classroom & Assignment Notices
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 cursor-pointer accent-indigo-600"
              />
            </div>
          </div>

          {/* Data Export & Sovereignty */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200">
                Backup / Export Learning History
              </p>
              <p className="text-[10px] text-slate-400">
                Download JSON of notes, quizzes, and viva transcripts
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportData}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigateToProfile();
            }}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1 cursor-pointer"
          >
            <span>Full Profile Details</span>
            <ExternalLink className="w-3 h-3" />
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              {savedToast ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Preferences</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
