import React, { useState, useEffect } from 'react';
import { 
  Users, BookOpen, AlertTriangle, Sparkles, CheckCircle2, 
  Plus, Calendar, Award, ShieldCheck, BarChart3, Clock, ChevronRight, FileCheck
} from 'lucide-react';
import { apiClient } from '../../services/api-client.js';
import { TeacherClass, TeacherAssignment } from '../../../shared/types/index.js';
import confetti from 'canvas-confetti';

export const TeacherDashboard: React.FC = () => {
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [weakTopics, setWeakTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New assignment modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [assignTitle, setAssignTitle] = useState('Unit 3: Memory Management & Paging Test');
  const [assignTopic, setAssignTopic] = useState('Virtual Memory, TLB, Page Faults');
  const [assignDueDate, setAssignDueDate] = useState('2026-11-05');
  const [assignCount, setAssignCount] = useState(5);
  const [generatingAssign, setGeneratingAssign] = useState(false);

  // Note verification simulation
  const [unverifiedNotes, setUnverifiedNotes] = useState([
    {
      id: 'note_dbms_gate',
      title: 'DBMS Normalization & SQL Queries Master Guide',
      author: 'Ananya Deshmukh',
      subject: 'DBMS',
      pages: 38
    }
  ]);

  const loadTeacherData = async () => {
    try {
      setLoading(true);
      const [classRes, assignRes, analyticsRes] = await Promise.all([
        apiClient.getTeacherClasses(),
        apiClient.getTeacherAssignments(),
        apiClient.getTeacherAnalytics()
      ]);
      setClasses(classRes.classes || []);
      setAssignments(assignRes.assignments || []);
      setWeakTopics(analyticsRes.weakTopics || []);
      if (classRes.classes?.length > 0) {
        setSelectedClassId(classRes.classes[0].id);
      }
    } catch (err) {
      console.error('Failed to load teacher data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeacherData();
  }, []);

  const handleGenerateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTitle || !assignTopic || !selectedClassId) return;

    try {
      setGeneratingAssign(true);
      await apiClient.generateTeacherAssignment({
        classId: selectedClassId,
        title: assignTitle,
        topic: assignTopic,
        dueDate: assignDueDate,
        questionCount: assignCount
      });

      confetti({ particleCount: 70, spread: 60 });
      setShowAssignModal(false);
      loadTeacherData();
    } catch (err: any) {
      alert(err.message || 'Failed to generate assignment');
    } finally {
      setGeneratingAssign(false);
    }
  };

  const handleVerifyNote = async (noteId: string) => {
    try {
      await apiClient.verifyNote(noteId);
      confetti({ particleCount: 50, spread: 60 });
      setUnverifiedNotes((prev) => prev.filter((n) => n.id !== noteId));
      alert('Note has been awarded the official Faculty Verified Gold Badge ⭐!');
    } catch (err: any) {
      alert(err.message || 'Failed to verify note');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Faculty Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 shadow-xl border border-indigo-900/50">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Faculty & Department Administration Portal 👨‍🏫</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Teacher & Class Monitor Hub
          </h1>
          <p className="mt-2 text-slate-300 text-sm md:text-base leading-relaxed">
            Monitor real-time student weak topics, generate AI-aligned assignments from university syllabus with 1-click, and certify high-quality student notes.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => setShowAssignModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              1-Click AI Assignment Generator
            </button>
          </div>
        </div>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Enrolled Students</span>
            <span className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">64 Students</div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">92% active in AI Quiz & Viva this week</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Average Viva Score</span>
            <span className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">7.8 / 10</div>
          <p className="text-[11px] text-slate-400 mt-1">Up from 6.9 last month</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Struggling Topics Identified</span>
            <span className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">3 Critical Topics</div>
          <p className="text-[11px] text-amber-600 font-medium mt-1">Virtual Memory & Banker algorithm</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Class Weak Topics Heatmap & Assignments */}
        <div className="lg:col-span-8 space-y-6">
          {/* Weak Topics Heatmap */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Classroom Struggle Radar (Real-Time Student Analytics)
                </h3>
                <p className="text-xs text-slate-500">Topics where students scored &lt; 50% in Viva or Quiz</p>
              </div>
              <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-full">
                AI Diagnostic
              </span>
            </div>

            <div className="space-y-3">
              {weakTopics.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {item.topic}
                    </span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      {item.struggleRate}% students struggling ({item.studentCount} students)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.struggleRate > 60
                          ? 'bg-rose-500'
                          : item.struggleRate > 40
                          ? 'bg-amber-500'
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${item.struggleRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Published Assignments */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Published Assignments & Auto-Evaluated Tests
              </h3>
              <button
                onClick={() => setShowAssignModal(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                <Plus className="w-3.5 h-3.5" /> New AI Test
              </button>
            </div>

            <div className="space-y-3">
              {assignments.map((asg) => (
                <div
                  key={asg.id}
                  className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      {asg.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Topic: {asg.topic} • Due: {asg.due_date}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-right">
                      <span className="font-bold text-emerald-600 block">
                        {asg.submissions_count} / 64 Submitted
                      </span>
                      <span className="text-[10px] text-slate-400">Auto-graded by AI</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Notes Verification Queue */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-amber-500" />
                Notes Verification Queue
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Certify topper notes with Faculty Badge ⭐</p>
            </div>

            {unverifiedNotes.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">All student notes verified!</p>
            ) : (
              <div className="space-y-3">
                {unverifiedNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-2.5"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {note.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        By {note.author} • {note.pages} pages
                      </p>
                    </div>

                    <button
                      onClick={() => handleVerifyNote(note.id)}
                      className="w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Approve & Award Faculty Badge
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CREATE ASSIGNMENT MODAL */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              1-Click AI Assignment Generator
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Generates university exam level subjective and MCQ questions from course topic.
            </p>

            <form onSubmit={handleGenerateAssignment} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assignment Title *
                </label>
                <input
                  type="text"
                  required
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Syllabus Topic *
                </label>
                <input
                  type="text"
                  required
                  value={assignTopic}
                  onChange={(e) => setAssignTopic(e.target.value)}
                  placeholder="e.g. Virtual Memory, TLB, Page Faults"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={assignDueDate}
                    onChange={(e) => setAssignDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Number of Questions
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={assignCount}
                    onChange={(e) => setAssignCount(parseInt(e.target.value) || 5)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generatingAssign}
                  className="px-5 py-2 rounded-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition shadow"
                >
                  {generatingAssign ? 'Generating with AI...' : 'Generate & Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
