import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { LanguageProvider } from './context/LanguageContext.js';
import { ThemeProvider } from './context/ThemeContext.js';
import { Navbar } from './components/Navbar.js';
import { Sidebar } from './components/Sidebar.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { StudyChatPage } from './pages/StudyChatPage.js';
import { QuizPage } from './pages/QuizPage.js';
import { VoiceVivaPage } from './pages/VoiceVivaPage.js';
import { PlannerPage } from './pages/PlannerPage.js';
import { NotesScannerPage } from './pages/NotesScannerPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { AuthModal } from './pages/AuthModal.js';
import { NotesLibraryPage } from './features/notes-library/NotesLibraryPage.js';
import { PrintingHubPage } from './features/printing/PrintingHubPage.js';
import { EnglishTeacherPage } from './features/english-teacher/EnglishTeacherPage.js';
import { TeacherDashboard } from './features/teacher/TeacherDashboard.js';

function MainLayout() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(() => {
    const savedRole = localStorage.getItem('campussathi_role');
    return savedRole === 'teacher' ? 'teacher_dashboard' : 'dashboard';
  });
  const [currentRole, setCurrentRole] = useState<'student' | 'teacher'>(() => {
    return (localStorage.getItem('campussathi_role') as 'student' | 'teacher') || 'student';
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [quizInitialDocId, setQuizInitialDocId] = useState<string | undefined>(undefined);
  const [preselectedPrintDoc, setPreselectedPrintDoc] = useState<{ documentTitle: string; pages: number } | null>(null);

  const handleSwitchToStudent = () => {
    localStorage.setItem('campussathi_role', 'student');
    setCurrentRole('student');
    setActiveTab('dashboard');
  };

  const handleRoleChange = (role: 'student' | 'teacher') => {
    localStorage.setItem('campussathi_role', role);
    setCurrentRole(role);
    if (role === 'teacher') {
      setActiveTab('teacher_dashboard');
    } else {
      setActiveTab('dashboard');
    }
  };

  // Automatically sync role when user profile changes
  useEffect(() => {
    if (user?.role && (user.role === 'student' || user.role === 'teacher')) {
      if (user.role !== currentRole) {
        handleRoleChange(user.role);
      }
    }
  }, [user?.role]);

  const handleStartQuizWithDoc = (docId: string) => {
    setQuizInitialDocId(docId);
    setActiveTab('quiz');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* 3-Zone Top Navigation Bar */}
      <Navbar
        onOpenAuth={() => setAuthModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentRole={currentRole}
        setCurrentRole={handleRoleChange}
      />

      <div className="flex flex-1 relative overflow-hidden">
        {/* Left Desktop Sidebar + Mobile Bottom Tabs */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          currentRole={currentRole}
          onSwitchToStudent={handleSwitchToStudent}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto min-w-0 p-4 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="min-h-full"
            >
              {activeTab === 'dashboard' && (
                <DashboardPage
                  setActiveTab={setActiveTab}
                  onOpenDocChat={docId => {
                    setQuizInitialDocId(docId);
                    setActiveTab('chat');
                  }}
                />
              )}

              {activeTab === 'notes_library' && (
                <NotesLibraryPage
                  onSendToPrint={(details) => {
                    setPreselectedPrintDoc(details);
                    setActiveTab('printing');
                  }}
                  onStartQuizWithNote={(noteTitle, subject) => {
                    setActiveTab('quiz');
                  }}
                />
              )}

              {activeTab === 'printing' && (
                <PrintingHubPage initialDocument={preselectedPrintDoc} />
              )}

              {activeTab === 'english' && (
                <EnglishTeacherPage />
              )}

              {(activeTab === 'teacher_dashboard' || activeTab.startsWith('teacher')) && (
                <TeacherDashboard
                  activeSubTab={activeTab}
                  onSelectSubTab={setActiveTab}
                  onSwitchToStudent={handleSwitchToStudent}
                />
              )}

              {activeTab === 'chat' && (
                <StudyChatPage
                  onStartQuizWithDoc={handleStartQuizWithDoc}
                />
              )}

              {activeTab === 'quiz' && (
                <QuizPage
                  initialDocId={quizInitialDocId}
                  onGoToPlanner={() => setActiveTab('planner')}
                />
              )}

              {activeTab === 'viva' && (
                <VoiceVivaPage />
              )}

              {activeTab === 'planner' && (
                <PlannerPage />
              )}

              {activeTab === 'scanner' && (
                <NotesScannerPage
                  onStartQuizWithNotes={() => setActiveTab('quiz')}
                />
              )}

              {activeTab === 'profile' && (
                <ProfilePage />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>


      {/* Auth Modal with explicit Role Choice (Student vs Teacher) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialRole={currentRole}
        onRoleSuccess={handleRoleChange}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <MainLayout />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
