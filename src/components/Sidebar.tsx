import React from 'react';
import { LayoutDashboard, MessageSquareText, HelpCircle, Mic, Calendar, ScanText, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed
}) => {
  const { t } = useLanguage();

  const navItems = [
    {
      id: 'dashboard',
      label: t('navDashboard'),
      icon: LayoutDashboard,
      color: 'from-indigo-600 to-violet-600',
      activeText: 'text-indigo-600 dark:text-indigo-400',
      activeBg: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800/60',
      badge: 'Home'
    },
    {
      id: 'chat',
      label: t('navStudyChat'),
      icon: MessageSquareText,
      color: 'from-blue-600 to-cyan-500',
      activeText: 'text-blue-600 dark:text-cyan-400',
      activeBg: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800/60',
      badge: 'RAG'
    },
    {
      id: 'quiz',
      label: t('navQuiz'),
      icon: HelpCircle,
      color: 'from-orange-500 to-amber-500',
      activeText: 'text-orange-600 dark:text-amber-400',
      activeBg: 'bg-orange-50 dark:bg-orange-950/60 border-orange-200 dark:border-orange-800/60',
      badge: 'MCQ'
    },
    {
      id: 'viva',
      label: t('navViva'),
      icon: Mic,
      color: 'from-rose-500 to-pink-500',
      activeText: 'text-rose-600 dark:text-pink-400',
      activeBg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/60',
      badge: 'Voice'
    },
    {
      id: 'planner',
      label: t('navPlanner'),
      icon: Calendar,
      color: 'from-emerald-500 to-teal-500',
      activeText: 'text-emerald-600 dark:text-teal-400',
      activeBg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/60',
      badge: 'Agent'
    },
    {
      id: 'scanner',
      label: t('navScanner'),
      icon: ScanText,
      color: 'from-fuchsia-600 to-purple-500',
      activeText: 'text-fuchsia-600 dark:text-purple-400',
      activeBg: 'bg-fuchsia-50 dark:bg-fuchsia-950/60 border-fuchsia-200 dark:border-fuchsia-800/60',
      badge: 'OCR'
    },
    {
      id: 'profile',
      label: t('navProfile'),
      icon: User,
      color: 'from-slate-600 to-slate-800',
      activeText: 'text-slate-800 dark:text-slate-200',
      activeBg: 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700',
      badge: 'You'
    }
  ];

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 select-none ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="flex flex-col flex-1 p-3 space-y-1.5">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
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
        {/* Mobile More Button for scanner & profile */}
        <button
          onClick={() => setActiveTab(activeTab === 'scanner' ? 'profile' : 'scanner')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'scanner' || activeTab === 'profile'
              ? 'text-fuchsia-600 dark:text-purple-400'
              : 'text-slate-400'
          }`}
        >
          <div className="p-1 rounded-md">
            <ScanText className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-medium leading-tight">OCR/Me</span>
        </button>
      </nav>
    </>
  );
};
