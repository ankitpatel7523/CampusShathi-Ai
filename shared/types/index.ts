export type UserRole = 'student' | 'teacher' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  college: string;
  course: string;
  year: string;
  semester: string;
  created_at: string;
}

export interface UserProfile {
  user_id: string;
  avatar: string;
  accent_color: string;
  theme: 'light' | 'dark' | 'system';
  default_language: 'en' | 'hi' | 'hinglish';
  daily_goal_minutes: number;
  xp: number;
  level: number;
  streak_days: number;
  longest_streak: number;
  last_active_date?: string;
  campus_coins?: number;
}

export interface CampusNote {
  id: string;
  user_id: string;
  title: string;
  description: string;
  subject: string;
  branch: string;
  semester: string;
  university: string;
  author_name: string;
  author_avatar?: string;
  file_path: string;
  page_count: number;
  stars: number;
  rating_count: number;
  price: number; // 0 for free notes, ₹19-₹49 for paid
  is_verified: boolean; // Faculty certified
  downloads: number;
  tags?: string[];
  created_at: string;
}

export interface NoteRating {
  id: string;
  note_id: string;
  user_id: string;
  user_name: string;
  rating: number; // 1 to 5
  comment: string;
  created_at: string;
}

export type ColorMode = 'bw' | 'color';
export type PrintSides = 'single' | 'double';
export type BindingType = 'staple' | 'spiral' | 'hardbound';
export type OrderStatus = 'order_placed' | 'printing' | 'out_for_delivery' | 'delivered';
export type PaymentStatus = 'pending' | 'paid';

export interface PrintOrder {
  id: string;
  user_id: string;
  document_title: string;
  file_path: string;
  pages: number;
  copies: number;
  color_mode: ColorMode;
  print_sides: PrintSides;
  binding_type: BindingType;
  hostel_delivery_address: string;
  phone_number: string;
  urgency: 'regular' | 'express_morning_9am';
  total_amount: number;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  estimated_delivery: string;
  created_at: string;
}

export type EnglishPracticeMode = 'general_tutor' | 'hr_interview' | 'tech_interview' | 'grammar_clinic';

export interface EnglishMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  correction?: string;
  tip?: string;
  timestamp: string;
}

export interface EnglishSession {
  id: string;
  user_id: string;
  mode: EnglishPracticeMode;
  topic: string;
  messages: EnglishMessage[];
  fluency_score?: number; // 0-100
  feedback?: {
    grammarAccuracy: string;
    vocabularyLevel: string;
    confidenceTips: string[];
    placementScore: number;
  };
  created_at: string;
}

export interface TeacherClass {
  id: string;
  teacher_id: string;
  name: string;
  subject: string;
  branch: string;
  semester: string;
  code: string;
  student_count: number;
  average_attendance?: number;
  weak_topics?: { topic: string; strugglePercent: number }[];
  created_at: string;
}

export interface TeacherAssignment {
  id: string;
  class_id: string;
  teacher_id: string;
  title: string;
  topic: string;
  due_date: string;
  total_marks: number;
  questions: Array<{
    question: string;
    type: 'mcq' | 'subjective' | 'coding';
    marks: number;
  }>;
  submissions_count: number;
  created_at: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  citation?: string;
}
