import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';
import { useTheme } from '../context/ThemeContext.js';
import { Flame, Zap, Moon, Sun, User as UserIcon, LogOut, ChevronDown, Check, Coins, GraduationCap, ShieldCheck } from 'lucide-react';
import { Language } from '../types.js';
import { apiClient } from '../services/api-client.js';

interface NavbarProps {
  onOpenAuth: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth, activeTab, setActiveTab }) => {
  const { user, profile, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<'student' | 'teacher'>('student');

  const handleRoleToggle = async () => {
    const nextRole = currentRole === 'student' ? 'teacher' : 'student';
    try {
      await apiClient.switchRole(nextRole);
      setCurrentRole(nextRole);
      setActiveTab(nextRole === 'teacher' ? 'teacher_dashboard' : 'dashboard');
    } catch {
      setCurrentRole(nextRole);
      setActiveTab(nextRole === 'teacher' ? 'teacher_dashboard' : 'dashboard');
    }
  };

  const langLabels: Record<Language, string> = {
    en: 'EN',
    hi: 'हिंदी',
    hinglish: 'Hinglish'
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 lg:px-8 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      {/* Zone 1: Brand wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2 font-bold text-xl tracking-tight text-slate-900 dark:text-white hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
        >
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/20 text-lg">
            🎓
          </span>
          <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-500 bg-clip-text text-transparent font-extrabold">
            CampusSathi
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200/50 dark:border-indigo-800/40">
            AI
          </span>
        </button>
      </div>

      {/* Zone 2: Navigation Links (desktop quick jump) */}
      <nav className="hidden xl:flex items-center gap-5 text-xs font-semibold text-slate-600 dark:text-slate-300">
        {[
          { id: 'dashboard', label: 'Home' },
          { id: 'chat', label: 'Study Chat' },
          { id: 'notes_library', label: 'Notes Library ⭐' },
          { id: 'printing', label: 'Print Hub 🖨️' },
          { id: 'english', label: 'English Coach 🗣️' },
          { id: 'quiz', label: 'Quiz' },
          { id: 'viva', label: 'Voice Viva' },
          { id: 'teacher_dashboard', label: 'Faculty' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`whitespace-nowrap transition-colors hover:text-slate-950 dark:hover:text-white cursor-pointer ${
              activeTab === item.id
                ? 'font-bold text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 pb-0.5'
                : ''
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Zone 3: Gamification Chips + Role Switcher + Language + Theme */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Role Switcher Pill */}
        <button
          onClick={handleRoleToggle}
          title="Click to toggle between Student & Faculty Portal"
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-xs ${
            currentRole === 'teacher'
              ? 'bg-indigo-900 text-indigo-200 border-indigo-700 ring-2 ring-indigo-500/30'
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
          }`}
        >
          {currentRole === 'teacher' ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
              <span>Faculty Mode</span>
            </>
          ) : (
            <>
              <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
              <span>Student Mode</span>
            </>
          )}
        </button>

        {/* Campus Coins */}
        <div
          title="Campus Coins (Earned by sharing notes)"
          className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 text-amber-700 dark:text-amber-300 text-xs font-semibold tabular-nums cursor-default shadow-xs"
        >
          <Coins className="w-3.5 h-3.5 text-amber-500" />
          <span>150 ⭐</span>
        </div>

        {/* Streak Flame */}
        <div
          title="Daily Study Streak"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 text-amber-700 dark:text-amber-300 text-xs font-semibold tabular-nums cursor-default shadow-xs"
        >
          <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-pulse" />
          <span>{profile?.streak_days || 3}d</span>
        </div>

        {/* XP Chip */}
        <div
          title="Total Experience Points"
          className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold tabular-nums cursor-default shadow-xs"
        >
          <Zap className="w-3.5 h-3.5 fill-indigo-500 text-indigo-500" />
          <span>{profile?.xp || 120} XP</span>
        </div>

        {/* Language Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setLangMenuOpen(!langMenuOpen)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <span>{langLabels[language]}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>


          {langMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-32 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-1 text-xs z-50 animate-in fade-in zoom-in-95">
              {(['en', 'hi', 'hinglish'] as Language[]).map(l => (
                <button
                  key={l}
                  onClick={() => {
                    setLanguage(l);
                    setLangMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <span>{langLabels[l]}</span>
                  {language === l && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* User Avatar Menu */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                {profile?.avatar || '🎓'}
              </div>
              <span className="hidden md:inline-block text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[100px] truncate">
                {user.name}
              </span>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl p-2 text-xs z-50">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700/60 mb-1">
                  <p className="font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                  <p className="text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-0.5 truncate">{user.college || 'College Student'}</p>
                </div>

                <button
                  onClick={() => {
                    setActiveTab('profile');
                    setUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <UserIcon className="w-4 h-4 text-slate-500" />
                  <span>Profile & Achievements</span>
                </button>

                <button
                  onClick={() => {
                    logout();
                    setUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-lg shadow-sm transition-colors whitespace-nowrap cursor-pointer"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};
