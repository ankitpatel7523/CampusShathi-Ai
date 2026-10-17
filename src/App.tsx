import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext.js';
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

function MainLayout() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [quizInitialDocId, setQuizInitialDocId] = useState<string | undefined>(undefined);

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
      />

      <div className="flex flex-1 relative overflow-hidden">
        {/* Left Desktop Sidebar + Mobile Bottom Tabs */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto min-w-0">
          {activeTab === 'dashboard' && (
            <DashboardPage
              setActiveTab={setActiveTab}
              onOpenDocChat={docId => {
                setQuizInitialDocId(docId);
                setActiveTab('chat');
              }}
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
        </main>
      </div>

      {/* Auth Modal for Sign Up / Log In / Demo Student */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
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
