import { z } from 'zod';

export const SignupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['student', 'teacher', 'admin']).default('student'),
  college: z.string().optional().default(''),
  course: z.string().optional().default(''),
  year: z.string().optional().default('1st Year'),
  semester: z.string().optional().default('Sem 1'),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const CampusNoteUploadSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional().default(''),
  subject: z.string().min(2, 'Subject is required'),
  branch: z.string().default('Computer Science'),
  semester: z.string().default('Sem 4'),
  university: z.string().default('AKTU'),
  price: z.coerce.number().min(0).max(499).default(0),
  shareToPublic: z.preprocess((val) => val === true || val === 'true' || val === '1', z.boolean()).default(true),
});

export const NoteRatingSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).default(''),
});

export const PrintOrderSchema = z.object({
  documentTitle: z.string().min(1),
  pages: z.number().int().min(1),
  copies: z.number().int().min(1).default(1),
  colorMode: z.enum(['bw', 'color']).default('bw'),
  printSides: z.enum(['single', 'double']).default('double'),
  bindingType: z.enum(['staple', 'spiral', 'hardbound']).default('staple'),
  hostelDeliveryAddress: z.string().min(5, 'Delivery address/Hostel room is required'),
  phoneNumber: z.string().min(10, 'Valid 10-digit phone number is required'),
  urgency: z.enum(['regular', 'express_morning_9am']).default('regular'),
});

export const EnglishChatSchema = z.object({
  message: z.string().min(1),
  mode: z.enum(['general_tutor', 'hr_interview', 'tech_interview', 'grammar_clinic']).default('general_tutor'),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string()
  })).default([]),
});

export const TeacherAssignmentCreateSchema = z.object({
  classId: z.string(),
  title: z.string().min(3),
  topic: z.string().min(2),
  dueDate: z.string(),
  questionCount: z.number().int().min(1).max(20).default(5),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
});
