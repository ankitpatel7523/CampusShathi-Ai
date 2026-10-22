import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';
import { useTheme } from '../context/ThemeContext.js';
import { 
  Flame, Zap, Moon, Sun, User as UserIcon, LogOut, ChevronDown, Check, 
  Coins, GraduationCap, ShieldCheck, Settings, Lock, ArrowLeft
} from 'lucide-react';
import { Language } from '../types.js';
import { apiClient } from '../services/api-client.js';
import { FacultyAuthModal } from './FacultyAuthModal.js';
import { SettingsModal } from './SettingsModal.js';

interface NavbarProps {
  onOpenAuth: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentRole: 'student' | 'teacher';
  setCurrentRole: (role: 'student' | 'teacher') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenAuth, 
  activeTab, 
  setActiveTab,
  currentRole,
  setCurrentRole
}) => {
  const { user, profile, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [facultyModalOpen, setFacultyModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Switching to teacher mode requires logging in/verification
  const handleRoleToggle = () => {
    if (currentRole === 'student') {
      // Direct switch is blocked! Open Faculty Login / Verification Modal
      setFacultyModalOpen(true);
    } else {
      // In faculty mode, allow switching back to student portal
      handleSwitchToStudent();
    }
  };

  const handleSwitchToStudent = async () => {
    try {
      await apiClient.switchRole('student');
      localStorage.setItem('campussathi_role', 'student');
      setCurrentRole('student');
      setActiveTab('dashboard');
    } catch {
      setCurrentRole('student');
      setActiveTab('dashboard');
    }
  };

  const handleFacultyLoginSuccess = () => {
    setCurrentRole('teacher');
    setActiveTab('teacher_dashboard');
  };

  const langLabels: Record<Language, string> = {
    en: 'EN',
    hi: 'हिंदी',
    hinglish: 'Hinglish'
  };

  const facultyName = (user?.role === 'teacher' && user?.name)
    ? user.name
    : (localStorage.getItem('campussathi_faculty_name') || 'Dr. Rajesh Sharma');

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 lg:px-8 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      {/* Zone 1: Brand wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => setActiveTab(currentRole === 'teacher' ? 'teacher_dashboard' : 'dashboard')}
          className="flex items-center gap-2 font-bold text-xl tracking-tight text-slate-900 dark:text-white hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
        >
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/20 text-lg">
            🎓
          </span>
          <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-500 bg-clip-text text-transparent font-extrabold">
            CampusSathi
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200/50 dark:border-indigo-800/40">
            {currentRole === 'teacher' ? 'FACULTY' : 'AI'}
          </span>
        </button>
      </div>

      {/* Zone 2: Navigation Links (Desktop quick jump) */}
      <nav className="hidden xl:flex items-center gap-5 text-xs font-semibold text-slate-600 dark:text-slate-300">
        {currentRole === 'teacher' ? (
          // Dedicated Faculty quick navigation
          [
            { id: 'teacher_dashboard', label: 'Batches & Roster' },
            { id: 'teacher_assignments', label: 'AI Tests & Auto-Grading' },
            { id: 'teacher_radar', label: 'Struggle Radar' },
            { id: 'teacher_verify', label: 'Notes Verification' },
            { id: 'teacher_doubts', label: 'Doubt Desk' },
            { id: 'teacher_broadcasts', label: 'Announcements' },
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
          ))
        ) : (
          // Student navigation links (Strictly no faculty tab here)
          [
            { id: 'dashboard', label: 'Home' },
            { id: 'chat', label: 'Study Chat' },
            { id: 'notes_library', label: 'Notes Library ⭐' },
            { id: 'printing', label: 'Print Hub 🖨️' },
            { id: 'english', label: 'English Coach 🗣️' },
            { id: 'quiz', label: 'Quiz' },
            { id: 'viva', label: 'Voice Viva' },
            { id: 'planner', label: 'Planner' },
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
          ))
        )}
      </nav>

      {/* Zone 3: Mode Switcher + Gamification Chips + Language + Theme + Profile Menu */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Mode Switcher Button (Shows real active role & allows seamless switching/auth) */}
        <button
          onClick={handleRoleToggle}
          title={
            currentRole === 'teacher'
              ? 'Currently in Teacher / Faculty Portal • Click to switch to Student Mode'
              : 'Currently in Student Portal • Click to switch or verify as Teacher / Faculty'
          }
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-xs ${
            currentRole === 'teacher'
              ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-800/80 hover:bg-purple-100 dark:hover:bg-purple-900/50'
              : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
          }`}
        >
          {currentRole === 'teacher' ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span className="hidden sm:inline">Teacher: {facultyName.split(' ')[0]}</span>
              <span className="sm:hidden">Teacher</span>
              <span className="text-[10px] bg-purple-200/90 dark:bg-purple-900/80 px-1.5 py-0.5 rounded-full text-purple-800 dark:text-purple-300 font-semibold ml-0.5">
                Active
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal hidden lg:inline ml-0.5">
                (⇄ Switch)
              </span>
            </>
          ) : (
            <>
              <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Student Portal</span>
              <span className="sm:hidden">Student</span>
              <span className="text-[10px] bg-emerald-200/90 dark:bg-emerald-900/80 px-1.5 py-0.5 rounded-full text-emerald-800 dark:text-emerald-300 font-semibold ml-0.5">
                Active
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal hidden lg:inline ml-0.5">
                (⇄ Switch)
              </span>
            </>
          )}
        </button>

        {/* Gamification Chips (Only shown in student mode) */}
        {currentRole === 'student' && (
          <>
            {/* Campus Coins (Real Dynamic) */}
            <div
              title="Campus Coins (Earned by sharing notes & PDFs)"
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 text-amber-700 dark:text-amber-300 text-xs font-semibold tabular-nums cursor-default shadow-xs"
            >
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              <span>{profile?.campus_coins ?? 150} ⭐</span>
            </div>

            {/* Streak Flame */}
            <div
              title="Daily Study Streak & Hype"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-800/40 text-orange-700 dark:text-orange-300 text-xs font-semibold tabular-nums cursor-default shadow-xs"
            >
              <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500 animate-pulse" />
              <span>{profile?.streak_days || 3}d Streak</span>
            </div>

            {/* XP & Hype Chip */}
            <div
              title="Campus Hype & XP (Increases when you share PDFs and study)"
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold tabular-nums cursor-default shadow-xs"
            >
              <Zap className="w-3.5 h-3.5 fill-indigo-500 text-indigo-500" />
              <span>{profile?.xp || 120} XP</span>
              <span className="text-[10px] bg-indigo-200/70 dark:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200 px-1 py-0.2 rounded font-bold ml-0.5">
                ⚡ {profile?.hype_score || ((profile?.xp || 120) + ((profile?.campus_coins ?? 150) * 2))} Hype
              </span>
            </div>
          </>
        )}

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

        {/* User Profile & Settings Menu (Top Right Dropdown) */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                {currentRole === 'teacher' ? '👨‍🏫' : profile?.avatar || '🎓'}
              </div>
              <span className="hidden md:inline-block text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[110px] truncate">
                {currentRole === 'teacher' ? facultyName : user.name}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl p-2 text-xs z-50">
                {/* User Header Info */}
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700/60 mb-1">
                  <p className="font-bold text-slate-900 dark:text-white truncate">
                    {currentRole === 'teacher' ? facultyName : user.name}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 truncate text-[11px]">{user.email}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      currentRole === 'teacher'
                        ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    }`}>
                      {currentRole === 'teacher' ? 'Faculty Mode' : user.college || 'Student'}
                    </span>
                  </div>
                </div>

                {/* Profile & Academic Stats Option */}
                <button
                  onClick={() => {
                    setActiveTab('profile');
                    setUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 cursor-pointer font-medium"
                >
                  <UserIcon className="w-4 h-4 text-indigo-500" />
                  <span>My Profile & Academic Stats</span>
                </button>

                {/* Settings & Preferences Option */}
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    setSettingsModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 cursor-pointer font-medium"
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span>Settings & Preferences</span>
                </button>

                {/* Role Switcher Option within Profile */}
                <div className="my-1 border-t border-slate-100 dark:border-slate-700/60"></div>
                {currentRole === 'student' ? (
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      setFacultyModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 cursor-pointer font-medium"
                  >
                    <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Faculty / Teacher Login</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleSwitchToStudent();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 cursor-pointer font-medium"
                  >
                    <ArrowLeft className="w-4 h-4 text-emerald-600" />
                    <span>Switch to Student Portal</span>
                  </button>
                )}

                <div className="my-1 border-t border-slate-100 dark:border-slate-700/60"></div>

                {/* Log Out Option */}
                <button
                  onClick={() => {
                    logout();
                    setUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 cursor-pointer font-medium"
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

      {/* Faculty Login & Verification Modal */}
      <FacultyAuthModal
        isOpen={facultyModalOpen}
        onClose={() => setFacultyModalOpen(false)}
        onSuccess={handleFacultyLoginSuccess}
      />

      {/* Settings & Preferences Modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        onNavigateToProfile={() => setActiveTab('profile')}
      />
    </header>
  );
};
