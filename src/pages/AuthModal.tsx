import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';
import { X, Sparkles, User, Mail, Lock, Building, BookOpen } from 'lucide-react';
import { ErrorBanner } from '../components/ErrorBanner.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, signup, loginAsDemo } = useAuth();
  const { t } = useLanguage();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [course, setCourse] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState<any>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorNotice(null);

    if (mode === 'login') {
      const res = await login(email, password);
      if (res.success) {
        onClose();
      } else {
        setErrorNotice({ message: res.error || 'Invalid credentials' });
      }
    } else {
      const res = await signup({ name, email, password, college, course });
      if (res.success) {
        onClose();
      } else {
        setErrorNotice({ message: res.error || 'Signup failed' });
      }
    }
    setLoading(false);
  };

  const handleDemoClick = async () => {
    setLoading(true);
    await loginAsDemo();
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-6">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎓</span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {mode === 'login' ? 'Welcome Back to CampusSathi' : 'Create Student Account'}
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            {mode === 'login'
              ? 'Log in to access your notes, quizzes, and viva prep.'
              : 'Join Indian college students studying smarter with AI.'}
          </p>
        </div>

        {/* Quick Demo Button */}
        <button
          type="button"
          onClick={handleDemoClick}
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          <span>{t('tryDemoStudent')}</span>
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 dark:border-slate-700 w-full" />
          <span className="bg-white dark:bg-slate-800 px-3 text-[11px] uppercase tracking-wider text-slate-400 font-bold shrink-0">
            Or With Email
          </span>
        </div>

        <ErrorBanner
          message={errorNotice?.message}
          onDismiss={() => setErrorNotice(null)}
        />

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ankit Sharma"
                    className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  College / Institute
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={college}
                    onChange={e => setCollege(e.target.value)}
                    placeholder="e.g. IIIT Delhi, DTU"
                    className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Branch / Course
                </label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={course}
                    onChange={e => setCourse(e.target.value)}
                    placeholder="e.g. B.Tech Computer Science"
                    className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ankit@campussathi.ai"
                className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Processing...' : mode === 'login' ? t('login') : t('signup')}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          {mode === 'login' ? (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Sign Up
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Log In
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
