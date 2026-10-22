import React, { useState, useEffect } from 'react';
import { 
  Users, BookOpen, AlertTriangle, Sparkles, CheckCircle2, 
  Plus, Calendar, Award, ShieldCheck, BarChart3, Clock, ChevronRight, FileCheck,
  Send, MessageSquare, Download, Filter, Search, Check, AlertCircle, ArrowLeft,
  Bell, CheckSquare, Eye, ExternalLink, HelpCircle
} from 'lucide-react';
import { apiClient } from '../../services/api-client.js';
import { TeacherClass, TeacherAssignment } from '../../../shared/types/index.js';
import confetti from 'canvas-confetti';

interface TeacherDashboardProps {
  activeSubTab?: string;
  onSelectSubTab?: (tab: string) => void;
  onSwitchToStudent?: () => void;
}

interface StudentRecord {
  id: string;
  rollNo: string;
  name: string;
  attendanceRate: number;
  vivaScore: number;
  quizScore: number;
  weakTopic: string;
  status: 'Good' | 'Needs Attention' | 'At Risk';
  lastActive: string;
}

interface DoubtItem {
  id: string;
  studentName: string;
  rollNo: string;
  topic: string;
  question: string;
  timestamp: string;
  status: 'open' | 'answered';
  facultyAnswer?: string;
}

interface ClassNotice {
  id: string;
  title: string;
  type: 'urgent' | 'exam' | 'lab' | 'general';
  content: string;
  date: string;
  targetBatch: string;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  activeSubTab = 'teacher_dashboard',
  onSelectSubTab,
  onSwitchToStudent
}) => {
  // Normalize current view
  const currentTab = activeSubTab || 'teacher_dashboard';

  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [weakTopics, setWeakTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected batch for roster view
  const [selectedBatchId, setSelectedBatchId] = useState('cse_6a');
  const [rosterSearch, setRosterSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Good' | 'Needs Attention' | 'At Risk'>('all');

  // New assignment modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [assignTitle, setAssignTitle] = useState('Unit 3: Memory Management & Paging Test');
  const [assignTopic, setAssignTopic] = useState('Virtual Memory, TLB, Page Faults');
  const [assignDueDate, setAssignDueDate] = useState('2026-11-05');
  const [assignCount, setAssignCount] = useState(5);
  const [generatingAssign, setGeneratingAssign] = useState(false);

  // New Class modal
  const [showNewClassModal, setShowNewClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassSubject, setNewClassSubject] = useState('');
  const [newClassSemester, setNewClassSemester] = useState('Semester 6');

  // Notes verification simulation
  const [unverifiedNotes, setUnverifiedNotes] = useState([
    {
      id: 'note_dbms_gate',
      title: 'DBMS Normalization & SQL Queries Master Guide',
      author: 'Ananya Deshmukh',
      rollNo: '21CS042',
      subject: 'Database Systems',
      pages: 38,
      submittedDate: 'Today, 10:30 AM',
      qualityScore: 94
    },
    {
      id: 'note_cn_ip',
      title: 'Computer Networks - Subnetting & CIDR Cheat Sheet',
      author: 'Rahul Verma',
      rollNo: '21CS089',
      subject: 'Computer Networks',
      pages: 18,
      submittedDate: 'Yesterday',
      qualityScore: 89
    }
  ]);
  const [certifiedNotesCount, setCertifiedNotesCount] = useState(14);

  // Student Doubts
  const [doubts, setDoubts] = useState<DoubtItem[]>([
    {
      id: 'd1',
      studentName: 'Priya Sharma',
      rollNo: '21CS014',
      topic: 'Virtual Memory',
      question: 'Sir, how does inverted page table reduce memory overhead compared to multi-level hierarchical paging?',
      timestamp: '25 mins ago',
      status: 'open'
    },
    {
      id: 'd2',
      studentName: 'Aman Saxena',
      rollNo: '21CS052',
      topic: 'Bankers Algorithm',
      question: 'In Bankers deadlock avoidance, is a safe state always free of deadlock, and can an unsafe state still avoid deadlocks?',
      timestamp: '1 hour ago',
      status: 'open'
    },
    {
      id: 'd3',
      studentName: 'Rohan Gupta',
      rollNo: '21CS077',
      topic: 'TLB Miss vs Page Fault',
      question: 'Does a TLB hit guarantee that the page is present in physical memory without any page fault?',
      timestamp: '3 hours ago',
      status: 'answered',
      facultyAnswer: 'Yes, because the TLB only caches mappings for pages already loaded into main memory frames.'
    }
  ]);
  const [activeDoubtReplyId, setActiveDoubtReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Class Notices / Announcements
  const [notices, setNotices] = useState<ClassNotice[]>([
    {
      id: 'n1',
      title: 'Mid-Semester Viva Schedule Released',
      type: 'urgent',
      content: 'Viva will be conducted on Nov 3rd in Lab 402. Prepare Unit 1 to 3.',
      date: 'Oct 24, 2026',
      targetBatch: 'B.Tech CSE - 6th Sem (Sec A)'
    },
    {
      id: 'n2',
      title: 'Assignment #3 on Virtual Memory Posted',
      type: 'exam',
      content: 'Complete the auto-graded AI assignment before Nov 5th midnight.',
      date: 'Oct 22, 2026',
      targetBatch: 'B.Tech CSE - 6th Sem (Sec A)'
    }
  ]);
  const [newNoticeModal, setNewNoticeModal] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeType, setNoticeType] = useState<'urgent' | 'exam' | 'lab' | 'general'>('urgent');
  const [noticeContent, setNoticeContent] = useState('');

  // Mock student roster
  const [studentRoster, setStudentRoster] = useState<StudentRecord[]>([
    { id: 's1', rollNo: '21CS001', name: 'Aaditya Joshi', attendanceRate: 94, vivaScore: 8.5, quizScore: 92, weakTopic: 'None', status: 'Good', lastActive: '10m ago' },
    { id: 's2', rollNo: '21CS004', name: 'Aman Saxena', attendanceRate: 72, vivaScore: 5.2, quizScore: 48, weakTopic: 'Virtual Memory & TLB', status: 'Needs Attention', lastActive: '1h ago' },
    { id: 's3', rollNo: '21CS012', name: 'Ananya Deshmukh', attendanceRate: 98, vivaScore: 9.6, quizScore: 96, weakTopic: 'None', status: 'Good', lastActive: 'Just now' },
    { id: 's4', rollNo: '21CS019', name: 'Devendra Rathore', attendanceRate: 58, vivaScore: 4.1, quizScore: 39, weakTopic: 'Deadlock Bankers Alg', status: 'At Risk', lastActive: '2d ago' },
    { id: 's5', rollNo: '21CS028', name: 'Ishita Kapoor', attendanceRate: 88, vivaScore: 7.9, quizScore: 84, weakTopic: 'Semaphores', status: 'Good', lastActive: '30m ago' },
    { id: 's6', rollNo: '21CS035', name: 'Manish Kumar', attendanceRate: 64, vivaScore: 4.8, quizScore: 45, weakTopic: 'Page Replacement (LRU)', status: 'Needs Attention', lastActive: '4h ago' },
    { id: 's7', rollNo: '21CS042', name: 'Priya Sharma', attendanceRate: 91, vivaScore: 8.2, quizScore: 89, weakTopic: 'Inverted Page Table', status: 'Good', lastActive: '20m ago' },
    { id: 's8', rollNo: '21CS057', name: 'Rahul Verma', attendanceRate: 83, vivaScore: 7.4, quizScore: 79, weakTopic: 'Disk Scheduling', status: 'Good', lastActive: '2h ago' },
    { id: 's9', rollNo: '21CS063', name: 'Sneha Patil', attendanceRate: 52, vivaScore: 3.8, quizScore: 35, weakTopic: 'Virtual Memory & Paging', status: 'At Risk', lastActive: '3d ago' },
    { id: 's10', rollNo: '21CS079', name: 'Varun Nair', attendanceRate: 89, vivaScore: 8.0, quizScore: 81, weakTopic: 'Process Scheduling', status: 'Good', lastActive: '5m ago' }
  ]);

  const facultyName = localStorage.getItem('campussathi_faculty_name') || 'Dr. Rajesh Sharma';
  const facultyDept = localStorage.getItem('campussathi_faculty_dept') || 'Computer Science & Engineering';

  const loadTeacherData = async () => {
    try {
      setLoading(true);
      const [classRes, assignRes, analyticsRes] = await Promise.all([
        apiClient.getTeacherClasses().catch(() => ({ classes: [] })),
        apiClient.getTeacherAssignments().catch(() => ({ assignments: [] })),
        apiClient.getTeacherAnalytics().catch(() => ({ weakTopics: [] }))
      ]);

      const loadedClasses = classRes.classes?.length ? classRes.classes : [
        {
          id: 'class_cse_6a',
          teacher_id: 'usr_fac_1',
          name: 'B.Tech CSE - 6th Sem (Sec A)',
          subject: 'Operating Systems (CS-601)',
          branch: 'Computer Science',
          semester: 'Sem 6',
          code: 'CS-601A',
          student_count: 64,
          created_at: '2026-08-01'
        },
        {
          id: 'class_it_4b',
          teacher_id: 'usr_fac_1',
          name: 'B.Tech IT - 4th Sem (Sec B)',
          subject: 'Database Management Systems (IT-402)',
          branch: 'Information Technology',
          semester: 'Sem 4',
          code: 'IT-402B',
          student_count: 58,
          created_at: '2026-08-01'
        }
      ];

      setClasses(loadedClasses);
      setAssignments(assignRes.assignments?.length ? assignRes.assignments : [
        {
          id: 'asg_1',
          class_id: 'class_cse_6a',
          teacher_id: 'usr_fac_1',
          title: 'Unit 3: Virtual Memory & Page Replacement',
          topic: 'Paging, Inverted Page Tables, TLB, LRU',
          due_date: '2026-11-05',
          total_marks: 20,
          questions: [
            { question: 'Explain two-level paging address translation with TLB.', type: 'subjective', marks: 10 },
            { question: 'Compare FIFO and LRU page replacement anomalies.', type: 'subjective', marks: 5 },
            { question: 'What is effective memory access time formula?', type: 'mcq', marks: 5 }
          ],
          submissions_count: 58,
          created_at: '2026-10-20'
        },
        {
          id: 'asg_2',
          class_id: 'class_cse_6a',
          teacher_id: 'usr_fac_1',
          title: 'Unit 2: Process Synchronization & Deadlocks',
          topic: 'Bankers Algorithm, Semaphores, Dining Philosophers',
          due_date: '2026-10-25',
          total_marks: 20,
          questions: [
            { question: 'State and prove the Banker algorithm safety criterion.', type: 'subjective', marks: 10 },
            { question: 'Implement counting semaphore using binary semaphores.', type: 'subjective', marks: 10 }
          ],
          submissions_count: 62,
          created_at: '2026-10-10'
        }
      ]);

      setWeakTopics(analyticsRes.weakTopics?.length ? analyticsRes.weakTopics : [
        { topic: 'Virtual Memory & Page Replacement', struggleRate: 68, studentCount: 43, sampleQuestion: 'Explain working of 2-level paging and calculate TLB hit ratio' },
        { topic: 'Deadlock Prevention (Bankers Algorithm)', struggleRate: 54, studentCount: 35, sampleQuestion: 'Determine if system is in safe state given Allocation and Max matrix' },
        { topic: 'Semaphores & Race Conditions (Mutex)', struggleRate: 49, studentCount: 31, sampleQuestion: 'Implement reader-writer problem using semaphores without starvation' },
        { topic: 'CPU Scheduling Round Robin Quantum', struggleRate: 32, studentCount: 20, sampleQuestion: 'Calculate average waiting time with quantum = 4ms' },
        { topic: 'File System Inode Allocation', struggleRate: 24, studentCount: 15, sampleQuestion: 'Calculate maximum file size supported by UNIX inode structure' }
      ]);

      if (loadedClasses.length > 0) {
        setSelectedClassId(loadedClasses[0].id);
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
    } catch {
      // Offline fallback state
      const mockAsg: TeacherAssignment = {
        id: `asg_${Date.now()}`,
        class_id: selectedClassId,
        teacher_id: 'fac_1',
        title: assignTitle,
        topic: assignTopic,
        due_date: assignDueDate,
        total_marks: assignCount * 5,
        questions: [
          { question: `Explain the fundamental concept of ${assignTopic}.`, type: 'subjective', marks: 10 },
          { question: `Solve the standard numerical on ${assignTopic}.`, type: 'subjective', marks: 5 }
        ],
        submissions_count: 0,
        created_at: new Date().toISOString()
      };
      setAssignments(prev => [mockAsg, ...prev]);
      confetti({ particleCount: 70, spread: 60 });
      setShowAssignModal(false);
    } finally {
      setGeneratingAssign(false);
    }
  };

  const handleCreateNewClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName || !newClassSubject) return;

    const newClass: TeacherClass = {
      id: `class_${Date.now()}`,
      teacher_id: 'usr_fac_1',
      name: newClassName,
      subject: newClassSubject,
      branch: facultyDept,
      semester: newClassSemester,
      code: `${newClassSubject.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      student_count: 60,
      created_at: new Date().toISOString()
    };

    setClasses(prev => [newClass, ...prev]);
    setShowNewClassModal(false);
    setNewClassName('');
    setNewClassSubject('');
    confetti({ particleCount: 40, spread: 50 });
  };

  const handleVerifyNote = async (noteId: string) => {
    try {
      await apiClient.verifyNote(noteId);
    } catch {
      // Local state fallback
    }
    confetti({ particleCount: 60, spread: 70 });
    setUnverifiedNotes((prev) => prev.filter((n) => n.id !== noteId));
    setCertifiedNotesCount(c => c + 1);
  };

  const handlePublishNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle || !noticeContent) return;

    const n: ClassNotice = {
      id: `notice_${Date.now()}`,
      title: noticeTitle,
      type: noticeType,
      content: noticeContent,
      date: 'Just now',
      targetBatch: 'B.Tech CSE - 6th Sem (Sec A)'
    };
    setNotices(prev => [n, ...prev]);
    setNewNoticeModal(false);
    setNoticeTitle('');
    setNoticeContent('');
    confetti({ particleCount: 30, spread: 40 });
  };

  const handleAnswerDoubt = (doubtId: string) => {
    if (!replyText.trim()) return;

    setDoubts(prev => prev.map(d => {
      if (d.id === doubtId) {
        return {
          ...d,
          status: 'answered',
          facultyAnswer: replyText
        };
      }
      return d;
    }));
    setActiveDoubtReplyId(null);
    setReplyText('');
    confetti({ particleCount: 30, spread: 40 });
  };

  const handleAiSuggestReply = (doubt: DoubtItem) => {
    setActiveDoubtReplyId(doubt.id);
    if (doubt.topic.includes('Virtual Memory')) {
      setReplyText('Inverted Page Tables maintain a single entry per physical frame instead of per virtual page. This saves memory because table size scales with RAM size rather than the large virtual address space.');
    } else if (doubt.topic.includes('Banker')) {
      setReplyText('Yes. A safe state is guaranteed to have at least one safe execution sequence that avoids deadlocks. An unsafe state is not guaranteed to deadlock, but deadlock avoidance algorithms avoid it because it cannot guarantee safety.');
    } else {
      setReplyText(`Regarding ${doubt.topic}: ensure that the core principles from Unit 3 are followed. We will also discuss this during Friday's review lecture.`);
    }
  };

  const handleExportRosterCSV = () => {
    const headers = 'Roll No,Name,Attendance Rate (%),Viva Score (out of 10),Quiz Score (%),Weak Topic,Status\n';
    const rows = studentRoster.map(s => 
      `"${s.rollNo}","${s.name}",${s.attendanceRate},${s.vivaScore},${s.quizScore},"${s.weakTopic}","${s.status}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Class_Roster_${facultyDept.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredRoster = studentRoster.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(rosterSearch.toLowerCase()) || 
                          s.rollNo.toLowerCase().includes(rosterSearch.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const subTabs = [
    { id: 'teacher_dashboard', label: 'Batches & Roster', icon: Users, count: classes.length },
    { id: 'teacher_assignments', label: 'AI Tests & Auto-Grading', icon: BookOpen, count: assignments.length },
    { id: 'teacher_radar', label: 'Struggle Radar', icon: AlertTriangle, count: weakTopics.length, alert: true },
    { id: 'teacher_verify', label: 'Notes Certification', icon: Award, count: unverifiedNotes.length },
    { id: 'teacher_doubts', label: 'Doubt Desk', icon: MessageSquare, count: doubts.filter(d => d.status === 'open').length },
    { id: 'teacher_broadcasts', label: 'Class Notices', icon: Calendar, count: notices.length }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Faculty Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 shadow-xl border border-indigo-900/60">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Institutional Faculty & Educator Portal</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-bold">Verified Session</span>
            </div>
            
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {facultyName}
            </h1>
            <p className="mt-1 text-indigo-200 text-sm font-medium">
              Department of {facultyDept} • Academic Term Autumn 2026
            </p>
            <p className="mt-2 text-slate-300 text-xs md:text-sm leading-relaxed">
              Real-time batch analytics, automated AI examination generation, student viva diagnostics, and syllabus note quality assurance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowAssignModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              1-Click AI Test Generator
            </button>
            <button
              onClick={() => setShowNewClassModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 text-indigo-400" />
              Add Batch
            </button>
            {onSwitchToStudent && (
              <button
                onClick={onSwitchToStudent}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 font-semibold text-xs border border-white/15 transition cursor-pointer whitespace-nowrap"
                title="Switch back to student view"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-400" />
                Student Portal
              </button>
            )}
          </div>
        </div>

        {/* Sub-tab Navigation Bar */}
        <div className="mt-6 pt-4 border-t border-indigo-900/50 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
          {subTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectSubTab ? onSelectSubTab(tab.id) : null}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-white text-indigo-950 shadow-md font-bold'
                    : 'text-indigo-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-indigo-300'}`} />
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-700'
                      : tab.alert
                      ? 'bg-rose-500/80 text-white'
                      : 'bg-indigo-900/80 text-indigo-200'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 1: BATCHES & STUDENT ROSTER */}
      {(currentTab === 'teacher_dashboard' || currentTab === 'teacher_batches') && (
        <div className="space-y-6">
          {/* Top 4 Metric Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Active Batches</span>
                <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Users className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                {classes.length} Batches
              </div>
              <p className="text-[11px] text-slate-500 mt-1">122 Total Enrolled</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Avg Attendance</span>
                <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <CheckSquare className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                87.4%
              </div>
              <p className="text-[11px] text-emerald-600 font-medium mt-1">+2.1% this week</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Avg Viva Score</span>
                <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <Award className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                7.8 / 10
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Tested via Voice Viva AI</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Students At Risk</span>
                <span className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
                2 Students
              </div>
              <p className="text-[11px] text-rose-500 font-medium mt-1">Attendance &lt; 60%</p>
            </div>
          </div>

          {/* Batch Selector & Class Cards */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Course Batches & Enrollment
                </h2>
                <p className="text-xs text-slate-500">Select a batch to inspect student roster, attendance, and viva diagnostic marks</p>
              </div>

              <button
                onClick={() => setShowNewClassModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold text-xs border border-indigo-200 dark:border-indigo-800 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Create New Class
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classes.map(c => {
                const isSelected = selectedBatchId === c.id || (selectedBatchId === 'cse_6a' && c.name.includes('CSE'));
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedBatchId(c.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                          Code: {c.code}
                        </span>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                          {c.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">{c.subject}</p>
                      </div>
                      <span className="text-xs font-bold px-2 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                        {c.student_count} Students
                      </span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                      <span>Term: {c.semester}</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                        {isSelected ? 'Active Batch View' : 'Click to View Roster'} <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Student Roster Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  Student Performance & Attendance Roster
                </h3>
                <p className="text-xs text-slate-500">Live academic telemetry aggregated from student Quiz, Viva, and class attendance</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name / roll..."
                    value={rosterSearch}
                    onChange={e => setRosterSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-indigo-500 w-44"
                  />
                </div>

                {/* Filter */}
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="Good">Good Standing</option>
                  <option value="Needs Attention">Needs Attention</option>
                  <option value="At Risk">At Risk (&lt;60%)</option>
                </select>

                {/* Export CSV */}
                <button
                  onClick={handleExportRosterCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Roll No</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4 text-center">Attendance</th>
                    <th className="py-3 px-4 text-center">AI Viva (10)</th>
                    <th className="py-3 px-4 text-center">Quiz Avg</th>
                    <th className="py-3 px-4">Struggling Area</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredRoster.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {s.rollNo}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {s.name}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-bold ${
                          s.attendanceRate < 65 ? 'text-rose-600' : s.attendanceRate < 75 ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                          {s.attendanceRate}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-indigo-600 dark:text-indigo-400">
                        {s.vivaScore}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-800 dark:text-slate-200">
                        {s.quizScore}%
                      </td>
                      <td className="py-3 px-4">
                        {s.weakTopic === 'None' ? (
                          <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                            ✓ Mastered all
                          </span>
                        ) : (
                          <span className="text-rose-600 dark:text-rose-400 text-[11px] font-medium bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md">
                            {s.weakTopic}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          s.status === 'Good'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : s.status === 'Needs Attention'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            alert(`Sent 1-on-1 revision reminder to ${s.name} (${s.rollNo})!`);
                          }}
                          className="px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold transition cursor-pointer"
                        >
                          Send Drill
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: AI TESTS & AUTO-GRADING */}
      {currentTab === 'teacher_assignments' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                AI Examination & Assignment Generator
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Create university syllabus-aligned tests in seconds. Submissions are auto-graded with AI rubrics.
              </p>
            </div>
            <button
              onClick={() => setShowAssignModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              Generate New AI Test
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignments.map(asg => (
              <div
                key={asg.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
                      Auto-Graded Test
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-1.5">
                      {asg.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Syllabus: {asg.topic}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    {asg.total_marks} Marks
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Student Submissions</span>
                    <span className="font-bold text-emerald-600">
                      {asg.submissions_count} / 64 submitted (90%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${(asg.submissions_count / 64) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Due: {asg.due_date}
                  </span>
                  <button
                    onClick={() => {
                      alert(`Viewing auto-evaluated answer sheets for: ${asg.title}. Class average: 16.4/20.`);
                    }}
                    className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Review Grades & Feedback →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: CLASSROOM STRUGGLE RADAR */}
      {currentTab === 'teacher_radar' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Classroom Struggle Radar (Real-Time Student Analytics)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Topics where students scored &lt; 50% in Viva or Quizzes. Identifies exact conceptual bottlenecks before exams.
                </p>
              </div>

              <button
                onClick={() => {
                  confetti({ particleCount: 50 });
                  alert('Remedial practice questions dispatched to all 43 students who scored <50% in Virtual Memory!');
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs cursor-pointer transition"
              >
                <Sparkles className="w-4 h-4" />
                Dispatch 1-Click Remedial Drill
              </button>
            </div>

            <div className="space-y-4">
              {weakTopics.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <div>
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {item.topic}
                      </span>
                      {item.sampleQuestion && (
                        <p className="text-slate-500 text-[11px] mt-0.5 italic">
                          Common failed question: "{item.sampleQuestion}"
                        </p>
                      )}
                    </div>
                    <span className="font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded text-xs whitespace-nowrap">
                      {item.struggleRate}% students struggling ({item.studentCount} students)
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
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
        </div>
      )}

      {/* SECTION 4: NOTES CERTIFICATION QUEUE */}
      {currentTab === 'teacher_verify' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  Notes Certification & Gold Badge Desk ⭐
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review student-uploaded notes for syllabus accuracy and award the official Faculty Verified Gold Badge.
                </p>
              </div>
              <div className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                {certifiedNotesCount} Notes Certified This Semester
              </div>
            </div>

            {unverifiedNotes.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">All Notes are Certified!</h3>
                <p className="text-xs text-slate-500">There are no pending student notes in the moderation queue.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {unverifiedNotes.map(note => (
                  <div
                    key={note.id}
                    className="p-5 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded">
                          {note.subject}
                        </span>
                        <span className="text-xs text-slate-500">Submitted {note.submittedDate}</span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {note.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Uploaded by: <span className="font-semibold text-slate-900 dark:text-slate-200">{note.author}</span> ({note.rollNo}) • {note.pages} Pages
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => alert(`Previewing note contents of "${note.title}" (${note.pages} pages). Quality score: ${note.qualityScore}%.`)}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
                      >
                        Inspect Preview
                      </button>
                      <button
                        onClick={() => handleVerifyNote(note.id)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer transition"
                      >
                        <Award className="w-4 h-4 text-white" />
                        Certify & Award Gold Badge ⭐
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 5: STUDENT DOUBT RESOLUTION DESK */}
      {currentTab === 'teacher_doubts' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                  Student Doubt Resolution Desk
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Answer student conceptual queries with 1-click AI drafts or custom faculty responses.
                </p>
              </div>

              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                {doubts.filter(d => d.status === 'open').length} Unanswered Queries
              </span>
            </div>

            <div className="space-y-4">
              {doubts.map(doubt => (
                <div
                  key={doubt.id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {doubt.studentName}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        ({doubt.rollNo})
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                        {doubt.topic}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">{doubt.timestamp}</span>
                  </div>

                  <p className="text-xs text-slate-800 dark:text-slate-200 font-medium bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                    "{doubt.question}"
                  </p>

                  {doubt.status === 'answered' ? (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs">
                      <span className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1 mb-1">
                        <Check className="w-3.5 h-3.5" /> Faculty Response Provided:
                      </span>
                      <p className="text-slate-700 dark:text-slate-300">{doubt.facultyAnswer}</p>
                    </div>
                  ) : activeDoubtReplyId === doubt.id ? (
                    <div className="space-y-2 pt-1">
                      <textarea
                        rows={3}
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Write your explanation or edit the AI draft..."
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setActiveDoubtReplyId(null)}
                          className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleAnswerDoubt(doubt.id)}
                          className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                        >
                          Send Answer to Student
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleAiSuggestReply(doubt)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> 1-Click AI Answer Draft
                      </button>
                      <button
                        onClick={() => {
                          setActiveDoubtReplyId(doubt.id);
                          setReplyText('');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        Write Custom Reply
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: CLASS NOTICES & BROADCASTS */}
      {currentTab === 'teacher_broadcasts' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-indigo-600" />
                  Class Notices & Broadcast Desk
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Broadcast instant exam schedules, lab deadlines, and urgent notices to student batch feeds.
                </p>
              </div>

              <button
                onClick={() => setNewNoticeModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer transition"
              >
                <Plus className="w-4 h-4" /> New Announcement
              </button>
            </div>

            <div className="space-y-3">
              {notices.map(notice => (
                <div
                  key={notice.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${
                        notice.type === 'urgent'
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                          : notice.type === 'exam'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                          : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                      }`}>
                        {notice.type}
                      </span>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                        {notice.title}
                      </h4>
                    </div>
                    <span className="text-xs text-slate-400">{notice.date}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {notice.content}
                  </p>
                  <div className="text-[10px] text-slate-400">
                    Broadcasted to: {notice.targetBatch}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE AI ASSIGNMENT */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              1-Click AI Assignment Generator
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Select topic from syllabus; CampusSathi AI generates questions with grading rubrics.
            </p>

            <form onSubmit={handleGenerateAssignment} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Batch *
                </label>
                <select
                  value={selectedClassId}
                  onChange={e => setSelectedClassId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.subject})</option>
                  ))}
                </select>
              </div>

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
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generatingAssign}
                  className="px-5 py-2 rounded-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition shadow cursor-pointer"
                >
                  {generatingAssign ? 'Generating with AI...' : 'Generate & Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD NEW CLASS / BATCH */}
      {showNewClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Add New Course Batch
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Create a new class section with automatic syllabus tracking and student join code.
            </p>

            <form onSubmit={handleCreateNewClass} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Batch Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. B.Tech CSE - 6th Sem (Sec B)"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject Name & Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Compiler Design (CS-603)"
                  value={newClassSubject}
                  onChange={(e) => setNewClassSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Academic Semester
                </label>
                <select
                  value={newClassSemester}
                  onChange={e => setNewClassSemester(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                >
                  <option value="Semester 2">Semester 2</option>
                  <option value="Semester 4">Semester 4</option>
                  <option value="Semester 6">Semester 6</option>
                  <option value="Semester 8">Semester 8</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewClassModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow cursor-pointer"
                >
                  Create Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: BROADCAST NOTICE */}
      {newNoticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-600" />
              Broadcast Class Announcement
            </h3>

            <form onSubmit={handlePublishNotice} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notice Type
                </label>
                <select
                  value={noticeType}
                  onChange={e => setNoticeType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                >
                  <option value="urgent">Urgent Announcement 🔴</option>
                  <option value="exam">Examination Alert 📑</option>
                  <option value="lab">Lab & Project Submission 🧪</option>
                  <option value="general">General Notice ℹ️</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notice Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lab 4 Assignment Deadline Extended"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notice Content *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter details for the class..."
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewNoticeModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow cursor-pointer"
                >
                  Broadcast Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
