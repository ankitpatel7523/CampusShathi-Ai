export type Language = 'en' | 'hi' | 'hinglish';
export type ThemeMode = 'light' | 'dark';

export interface User {
  id: string;
  email: string;
  name: string;
  college?: string;
  course?: string;
  year?: string;
  semester?: string;
}

export interface Profile {
  user_id: string;
  avatar: string;
  accent_color: string;
  theme: ThemeMode;
  default_language: Language;
  daily_goal_minutes: number;
  xp: number;
  level: number;
  streak_days: number;
  longest_streak: number;
}

export interface DocumentItem {
  id: string;
  title: string;
  page_count: number;
  chunk_count: number;
  file_size: number;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: string;
  created_at?: string;
}

export interface SourceCitation {
  documentTitle: string;
  pageNumber: number;
  excerpt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOption: number;
  explanation: string;
  citation?: string;
}

export interface QuizAttempt {
  id: string;
  topic: string;
  score: number;
  total: number;
  time_spent_seconds: number;
  difficulty: string;
  created_at: string;
}

export interface VivaTurn {
  turnNumber: number;
  question: string;
  studentAnswer?: string;
  score?: number;
  feedback?: string;
  missingPoints?: string;
  modelAnswer?: string;
}

export interface PlanTask {
  id: string;
  plan_id: string;
  date: string;
  subject: string;
  topic: string;
  task_type: 'read' | 'quiz' | 'flashcards' | 'viva';
  duration_minutes: number;
  completed: number;
  is_weak_topic: number;
  plan_title?: string;
}

export interface Flashcard {
  id: string;
  subject: string;
  question: string;
  answer: string;
  repetitions: number;
  interval_days: number;
  ease_factor: number;
  due_date: string;
}

export interface BadgeItem {
  id: string;
  badge_key: string;
  title: string;
  description: string;
  icon: string;
  unlocked_at: string;
}

export interface ErrorNotice {
  message: string;
  errorKind?: string;
  fixHint?: string;
}
