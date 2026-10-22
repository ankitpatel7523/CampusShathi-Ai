import React from 'react';
import { 
  LayoutDashboard, MessageSquareText, HelpCircle, Mic, Calendar, 
  ScanText, ChevronLeft, ChevronRight, BookOpen, Printer, Sparkles, 
  GraduationCap, Users, ShieldCheck, AlertTriangle, FileCheck, ArrowLeft, LogOut
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
  currentRole?: 'student' | 'teacher';
  onSwitchToStudent?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  currentRole = 'student',
  onSwitchToStudent
}) => {
  const { t } = useLanguage();

  // Pure student navigation items (No Teacher tab, No Profile tab)
  const studentNavItems = [
    {
      id: 'dashboard',
      label: t('navDashboard') || 'Dashboard',
      icon: LayoutDashboard,
      color: 'from-indigo-600 to-violet-600',
      activeText: 'text-indigo-600 dark:text-indigo-400',
      activeBg: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800/60',
      badge: 'Home'
    },
    {
      id: 'chat',
      label: t('navStudyChat') || 'Study Chat',
      icon: MessageSquareText,
      color: 'from-blue-600 to-cyan-500',
      activeText: 'text-blue-600 dark:text-cyan-400',
      activeBg: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800/60',
      badge: 'RAG'
    },
    {
      id: 'notes_library',
      label: 'Notes Library ⭐',
      icon: BookOpen,
      color: 'from-amber-500 to-orange-500',
      activeText: 'text-amber-600 dark:text-orange-400',
      activeBg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/60',
      badge: 'Market'
    },
    {
      id: 'printing',
      label: 'Campus Print 🖨️',
      icon: Printer,
      color: 'from-blue-600 to-indigo-600',
      activeText: 'text-blue-600 dark:text-indigo-400',
      activeBg: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800/60',
      badge: '9 AM'
    },
    {
      id: 'english',
      label: 'English Coach 🗣️',
      icon: Sparkles,
      color: 'from-emerald-600 to-teal-500',
      activeText: 'text-emerald-600 dark:text-teal-400',
      activeBg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/60',
      badge: 'Voice'
    },
    {
      id: 'quiz',
      label: t('navQuiz') || 'Quiz Arena',
      icon: HelpCircle,
      color: 'from-orange-500 to-amber-500',
      activeText: 'text-orange-600 dark:text-amber-400',
      activeBg: 'bg-orange-50 dark:bg-orange-950/60 border-orange-200 dark:border-orange-800/60',
      badge: 'MCQ'
    },
    {
      id: 'viva',
      label: t('navViva') || 'Voice Viva',
      icon: Mic,
      color: 'from-rose-500 to-pink-500',
      activeText: 'text-rose-600 dark:text-pink-400',
      activeBg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/60',
      badge: 'Audio'
    },
    {
      id: 'planner',
      label: t('navPlanner') || 'Exam Planner',
      icon: Calendar,
      color: 'from-teal-500 to-emerald-500',
      activeText: 'text-teal-600 dark:text-emerald-400',
      activeBg: 'bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800/60',
      badge: 'Agent'
    },
    {
      id: 'scanner',
      label: t('navScanner') || 'Notes Scanner',
      icon: ScanText,
      color: 'from-fuchsia-600 to-purple-500',
      activeText: 'text-fuchsia-600 dark:text-purple-400',
      activeBg: 'bg-fuchsia-50 dark:bg-fuchsia-950/60 border-fuchsia-200 dark:border-fuchsia-800/60',
      badge: 'OCR'
    }
  ];

  // Dedicated Faculty / Teacher Portal navigation items
  const teacherNavItems = [
    {
      id: 'teacher_dashboard',
      label: 'Batches & Roster',
      icon: Users,
      color: 'from-indigo-700 to-slate-900',
      activeText: 'text-indigo-700 dark:text-indigo-300',
      activeBg: 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-300 dark:border-indigo-700',
      badge: 'Classes'
    },
    {
      id: 'teacher_assignments',
      label: 'AI Tests & Grading',
      icon: BookOpen,
      color: 'from-violet-600 to-indigo-700',
      activeText: 'text-violet-600 dark:text-violet-300',
      activeBg: 'bg-violet-50 dark:bg-violet-950/80 border-violet-300 dark:border-violet-700',
      badge: 'Exam AI'
    },
    {
      id: 'teacher_radar',
      label: 'Struggle Radar',
      icon: AlertTriangle,
      color: 'from-amber-600 to-rose-600',
      activeText: 'text-amber-600 dark:text-amber-300',
      activeBg: 'bg-amber-50 dark:bg-amber-950/80 border-amber-300 dark:border-amber-700',
      badge: 'Radar'
    },
    {
      id: 'teacher_verify',
      label: 'Notes Certification',
      icon: ShieldCheck,
      color: 'from-amber-500 to-yellow-600',
      activeText: 'text-amber-700 dark:text-amber-300',
      activeBg: 'bg-amber-50 dark:bg-amber-950/80 border-amber-300 dark:border-amber-700',
      badge: 'Gold ⭐'
    },
    {
      id: 'teacher_doubts',
      label: 'Doubt Resolution Desk',
      icon: MessageSquareText,
      color: 'from-blue-600 to-teal-600',
      activeText: 'text-blue-600 dark:text-cyan-300',
      activeBg: 'bg-blue-50 dark:bg-blue-950/80 border-blue-300 dark:border-blue-700',
      badge: 'Inbox'
    },
    {
      id: 'teacher_broadcasts',
      label: 'Class Notices',
      icon: Calendar,
      color: 'from-emerald-600 to-teal-700',
      activeText: 'text-emerald-600 dark:text-emerald-300',
      activeBg: 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-700',
      badge: 'Notice'
    }
  ];

  const isTeacherMode = currentRole === 'teacher' || activeTab.startsWith('teacher');
  const navItems = isTeacherMode ? teacherNavItems : studentNavItems;

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 select-none ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Faculty Mode Indicator Banner */}
        {isTeacherMode && !collapsed && (
          <div className="mx-3 mt-3 p-2.5 rounded-xl bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white border border-indigo-700/60 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-300 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Faculty Portal
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-xs font-bold mt-0.5 truncate">
              Educator Console
            </p>
          </div>
        )}

        <div className="flex flex-col flex-1 p-3 space-y-1.5 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || (item.id === 'teacher_dashboard' && activeTab === 'teacher_dashboard');
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer border ${
                  isActive
                    ? `${item.activeBg} ${item.activeText} shadow-xs font-semibold`
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                } ${collapsed ? 'justify-center' : 'justify-between'}`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-lg transition-transform ${
                      isActive
                        ? `bg-gradient-to-tr ${item.color} text-white shadow-xs`
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!collapsed && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-md font-mono transition-opacity ${
                      isActive
                        ? 'bg-white/80 dark:bg-slate-800/80 shadow-xs'
                        : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Exit Teacher Mode Button (when in teacher mode) */}
        {isTeacherMode && onSwitchToStudent && (
          <div className="p-3 border-t border-slate-100 dark:border-slate-800/60">
            <button
              onClick={onSwitchToStudent}
              title="Return to Student Portal"
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              {!collapsed && <span>Return to Student Mode</span>}
            </button>
          </div>
        )}

        {/* Sidebar Collapse Toggle Button */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/60">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!collapsed && <span>Collapse Sidebar</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {navItems.slice(0, 5).map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
                isActive ? item.activeText : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <div
                className={`p-1 rounded-md ${
                  isActive ? `bg-gradient-to-tr ${item.color} text-white shadow-xs` : ''
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-medium leading-tight">{item.badge}</span>
            </button>
          );
        })}
        {/* If in Teacher mode on mobile, allow quick return */}
        {isTeacherMode && onSwitchToStudent && (
          <button
            onClick={onSwitchToStudent}
            className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-indigo-600 dark:text-indigo-400 cursor-pointer"
          >
            <div className="p-1 rounded-md bg-indigo-50 dark:bg-indigo-950">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold leading-tight">Student</span>
          </button>
        )}
      </nav>
    </>
  );
};
