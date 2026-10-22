import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, Building, KeyRound, AlertCircle, Sparkles, CheckCircle2, ArrowRight, X } from 'lucide-react';
import { apiClient } from '../services/api-client.js';

interface FacultyAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const FacultyAuthModal: React.FC<FacultyAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [facultyEmail, setFacultyEmail] = useState('');
  const [facultyPin, setFacultyPin] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [facultyId, setFacultyId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleFacultyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation: PIN check
    if (facultyPin !== '1234' && facultyPin.length < 4) {
      setError('Invalid Faculty Security PIN. Use 1234 for demo or enter your 4+ digit institutional PIN.');
      return;
    }

    try {
      setLoading(true);
      await apiClient.switchRole('teacher');
      localStorage.setItem('campussathi_role', 'teacher');
      localStorage.setItem('campussathi_faculty_name', facultyEmail ? facultyEmail.split('@')[0] : 'Dr. Rajesh Sharma');
      localStorage.setItem('campussathi_faculty_dept', department);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate faculty credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      await apiClient.switchRole('teacher');
      localStorage.setItem('campussathi_role', 'teacher');
      localStorage.setItem('campussathi_faculty_name', 'Dr. Rajesh Sharma');
      localStorage.setItem('campussathi_faculty_dept', 'Computer Science & Engineering');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate demo faculty');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              Faculty & Educator Verification
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Restricted Portal • Login Required
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
          The Teacher Portal contains confidential student evaluations, viva scores, and assignment publishing tools. Direct switching is disabled for security.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1-Click Demo Faculty Card */}
        <div className="mb-4 p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                  Quick Access: Verified Faculty Demo
                </span>
                <span className="text-[10px] bg-indigo-200 dark:bg-indigo-800 text-indigo-900 dark:text-indigo-100 font-bold px-1.5 py-0.5 rounded-md">
                  1-Click
                </span>
              </div>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-0.5">
                Dr. Rajesh Sharma • HOD Computer Science (PIN: <span className="font-mono font-bold">1234</span>)
              </p>
            </div>
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Login Now</span>
            </button>
          </div>
        </div>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          <span className="flex-shrink mx-3 text-[11px] text-slate-400 font-medium">Or enter credentials</span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleFacultyLogin} className="space-y-3.5 mt-2 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Institutional Email / Faculty ID *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={facultyEmail}
                onChange={(e) => setFacultyEmail(e.target.value)}
                placeholder="prof.name@university.edu.in or FAC-204"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Department *
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electronics & Communication">Electronics & Communication</option>
                <option value="Electrical Engineering">Electrical Engineering</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Applied Sciences & Mathematics">Applied Sciences & Mathematics</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Faculty Security PIN / Password *
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={facultyPin}
                onChange={(e) => setFacultyPin(e.target.value)}
                placeholder="Enter 4-digit PIN (Demo: 1234)"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Default demo access PIN is: 1234</p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Verifying...</span>
              ) : (
                <>
                  <span>Verify & Enter Faculty Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
