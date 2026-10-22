import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';
import { 
  X, Sparkles, User, Mail, Lock, Building, BookOpen, 
  GraduationCap, ShieldCheck, Check, Briefcase, BadgeCheck 
} from 'lucide-react';
import { ErrorBanner } from '../components/ErrorBanner.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: 'student' | 'teacher';
  onRoleSuccess?: (role: 'student' | 'teacher') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  initialRole = 'student',
  onRoleSuccess 
}) => {
  const { login, signup, loginAsDemo } = useAuth();
  const { t } = useLanguage();

  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher'>(initialRole);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  
  // Shared fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  
  // Student specific
  const [course, setCourse] = useState('');
  const [semester, setSemester] = useState('Sem 4');
  
  // Teacher specific
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [employeeId, setEmployeeId] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState<any>(null);

  // Sync initialRole when modal opens
  useEffect(() => {
    if (isOpen && initialRole) {
      setSelectedRole(initialRole);
    }
  }, [isOpen, initialRole]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorNotice(null);

    try {
      if (mode === 'login') {
        const res = await login(email, password, selectedRole);
        if (res.success) {
          localStorage.setItem('campussathi_role', selectedRole);
          if (selectedRole === 'teacher') {
            localStorage.setItem('campussathi_faculty_name', res.user?.name || email.split('@')[0] || 'Faculty Member');
            localStorage.setItem('campussathi_faculty_dept', department || 'Faculty');
          }
          onRoleSuccess?.(selectedRole);
          onClose();
        } else {
          setErrorNotice({ message: res.error || 'Invalid credentials. Please verify your email and password.' });
        }
      } else {
        const payload: any = {
          name,
          email,
          password,
          role: selectedRole,
          college: college || (selectedRole === 'teacher' ? 'Institute of Technology' : 'Engineering College'),
          course: selectedRole === 'student' ? (course || 'B.Tech Computer Science') : department,
          year: selectedRole === 'student' ? '2nd Year' : 'Faculty',
          semester: selectedRole === 'student' ? semester : 'Faculty'
        };

        const res = await signup(payload);
        if (res.success) {
          localStorage.setItem('campussathi_role', selectedRole);
          if (selectedRole === 'teacher') {
            localStorage.setItem('campussathi_faculty_name', name || 'Faculty Member');
            localStorage.setItem('campussathi_faculty_dept', department);
          }
          onRoleSuccess?.(selectedRole);
          onClose();
        } else {
          setErrorNotice({ message: res.error || 'Signup failed. Please try again with valid details.' });
        }
      }
    } catch (err: any) {
      setErrorNotice({ message: err.message || 'Authentication error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = async () => {
    setLoading(true);
    setErrorNotice(null);
    try {
      await loginAsDemo(selectedRole);
      localStorage.setItem('campussathi_role', selectedRole);
      if (selectedRole === 'teacher') {
        localStorage.setItem('campussathi_faculty_name', 'Dr. Rajesh Sharma');
        localStorage.setItem('campussathi_faculty_dept', 'Computer Science & Engineering');
      }
      onRoleSuccess?.(selectedRole);
      onClose();
    } catch (err: any) {
      setErrorNotice({ message: err.message || 'Demo login failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[92vh] overflow-y-auto space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1 pr-8">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{selectedRole === 'student' ? '🎓' : '👨‍🏫'}</span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {mode === 'login' 
                ? (selectedRole === 'student' ? 'Student Sign In' : 'Faculty / Teacher Sign In')
                : (selectedRole === 'student' ? 'Register Student Account' : 'Register Faculty Account')}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {selectedRole === 'student'
              ? 'Access peer-reviewed notes, AI study assistant, quizzes & Voice Viva prep.'
              : 'Institutional access: manage batches, issue AI exams, verify notes & track struggles.'}
          </p>
        </div>

        {/* STEP 1: PROMINENT ROLE SELECTION TABS */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Choose Your Role / अपनी भूमिका चुनें:
          </label>
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80">
            {/* Student Role Option */}
            <button
              type="button"
              onClick={() => setSelectedRole('student')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                selectedRole === 'student'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-200 dark:border-indigo-800/60 ring-2 ring-indigo-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <GraduationCap className={`w-4 h-4 ${selectedRole === 'student' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
              <div className="text-left leading-tight">
                <div>Student</div>
                <div className="text-[10px] font-normal opacity-80">विद्यार्थी</div>
              </div>
              {selectedRole === 'student' && <Check className="w-3.5 h-3.5 ml-auto text-indigo-600 dark:text-indigo-400" />}
            </button>

            {/* Teacher Role Option */}
            <button
              type="button"
              onClick={() => setSelectedRole('teacher')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                selectedRole === 'teacher'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm border border-purple-200 dark:border-purple-800/60 ring-2 ring-purple-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck className={`w-4 h-4 ${selectedRole === 'teacher' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`} />
              <div className="text-left leading-tight">
                <div>Teacher / Faculty</div>
                <div className="text-[10px] font-normal opacity-80">शिक्षक / प्राध्यापक</div>
              </div>
              {selectedRole === 'teacher' && <Check className="w-3.5 h-3.5 ml-auto text-purple-600 dark:text-purple-400" />}
            </button>
          </div>
        </div>

        {/* STEP 2: ONE-CLICK DEMO BUTTON FOR THE SELECTED ROLE */}
        <button
          type="button"
          onClick={handleDemoClick}
          disabled={loading}
          className={`w-full py-2.5 px-4 rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-white ${
            selectedRole === 'student'
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-indigo-500/20'
              : 'bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 shadow-purple-500/20'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>
            {selectedRole === 'student'
              ? '✨ 1-Click Demo Login as Student (Ankit Sharma • IIIT Delhi)'
              : '✨ 1-Click Demo Login as Faculty (Dr. Rajesh Sharma • HOD CSE)'}
          </span>
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
          <span className="bg-white dark:bg-slate-900 px-3 text-[11px] uppercase tracking-wider text-slate-400 font-bold shrink-0">
            Or {mode === 'login' ? 'Sign In With Credentials' : 'Create Custom Account'}
          </span>
        </div>

        <ErrorBanner
          message={errorNotice?.message}
          onDismiss={() => setErrorNotice(null)}
        />

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <>
              {/* Name */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {selectedRole === 'student' ? 'Full Name' : 'Faculty Name & Title'}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={selectedRole === 'student' ? 'Ankit Sharma' : 'Dr. Rajesh Sharma (Prof. & HOD)'}
                    className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    required
                  />
                </div>
              </div>

              {/* College / Institute */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  College / University
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={college}
                    onChange={e => setCollege(e.target.value)}
                    placeholder={selectedRole === 'student' ? 'e.g. IIIT Delhi, DTU, AKTU' : 'e.g. Delhi Technological University (DTU)'}
                    className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
              </div>

              {/* Role-Specific Fields */}
              {selectedRole === 'student' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        placeholder="e.g. B.Tech CSE, BCA"
                        className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Semester
                    </label>
                    <select
                      value={semester}
                      onChange={e => setSemester(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    >
                      <option value="Sem 1">Semester 1</option>
                      <option value="Sem 2">Semester 2</option>
                      <option value="Sem 3">Semester 3</option>
                      <option value="Sem 4">Semester 4</option>
                      <option value="Sem 5">Semester 5</option>
                      <option value="Sem 6">Semester 6</option>
                      <option value="Sem 7">Semester 7</option>
                      <option value="Sem 8">Semester 8</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Department
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={department}
                        onChange={e => setDepartment(e.target.value)}
                        placeholder="Computer Science Dept."
                        className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Faculty / Employee ID
                    </label>
                    <div className="relative">
                      <BadgeCheck className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={employeeId}
                        onChange={e => setEmployeeId(e.target.value)}
                        placeholder="FAC-CSE-401"
                        className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Email */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              {selectedRole === 'student' ? 'Student Email Address' : 'Institutional / Faculty Email'}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={selectedRole === 'student' ? 'ankit@campussathi.ai' : 'rajesh.faculty@campussathi.ai'}
                className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              {selectedRole === 'teacher' ? 'Password / Security PIN' : 'Password'}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 ${
              selectedRole === 'teacher'
                ? 'bg-purple-700 hover:bg-purple-800 shadow-purple-600/20'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
            }`}
          >
            {loading 
              ? 'Verifying & Connecting...' 
              : mode === 'login' 
                ? (selectedRole === 'student' ? 'Log In as Student' : 'Log In as Faculty')
                : (selectedRole === 'student' ? 'Complete Student Registration' : 'Complete Faculty Registration')}
          </button>
        </form>

        {/* Toggle Login / Signup */}
        <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
          {mode === 'login' ? (
            <span>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer ml-1"
              >
                Sign Up as {selectedRole === 'student' ? 'Student' : 'Faculty'}
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer ml-1"
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
