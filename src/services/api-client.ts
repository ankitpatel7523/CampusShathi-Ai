import { CampusNote, NoteRating, PrintOrder, TeacherClass, TeacherAssignment } from '../../shared/types/index.js';

export const apiClient = {
  // Role Switcher
  async switchRole(role: 'student' | 'teacher'): Promise<{ success: boolean; role: string }> {
    const res = await fetch('/api/auth/switch-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    if (!res.ok) throw new Error('Failed to switch role');
    return res.json();
  },

  // Notes Library & Marketplace
  async getNotes(filters?: { search?: string; subject?: string; branch?: string; semester?: string; sortBy?: string }) {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.subject) params.append('subject', filters.subject);
    if (filters?.branch) params.append('branch', filters.branch);
    if (filters?.semester) params.append('semester', filters.semester);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);

    const res = await fetch(`/api/notes-library?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch notes');
    return res.json() as Promise<{ notes: CampusNote[]; total: number; availableSubjects: { subject: string; count: number }[] }>;
  },

  async uploadNote(data: FormData | {
    title: string;
    description: string;
    subject: string;
    branch: string;
    semester: string;
    university: string;
    price: number;
    shareToPublic?: boolean;
    pageCount?: number;
    file?: File;
  }) {
    let headers: Record<string, string> = {};
    let body: any;

    if (data instanceof FormData) {
      body = data;
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(data);
    }

    const res = await fetch('/api/notes-library/upload', {
      method: 'POST',
      headers,
      body
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to upload notes');
    }
    return res.json();
  },

  async rateNote(noteId: string, rating: number, comment: string) {
    const res = await fetch(`/api/notes-library/${noteId}/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, comment })
    });
    if (!res.ok) throw new Error('Failed to submit rating');
    return res.json();
  },

  async verifyNote(noteId: string) {
    const res = await fetch(`/api/notes-library/${noteId}/verify`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to verify note');
    return res.json();
  },

  async downloadNote(noteId: string) {
    await fetch(`/api/notes-library/${noteId}/download`, { method: 'POST' });
  },

  async getNotePreview(noteId: string) {
    const res = await fetch(`/api/notes-library/${noteId}/preview`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Failed to load note preview');
    }
    return res.json();
  },

  async unlockNote(noteId: string) {
    const res = await fetch(`/api/notes-library/${noteId}/unlock`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Failed to unlock note');
    }
    return res.json();
  },

  getPdfUrl(noteId: string) {
    return `/api/notes-library/${noteId}/pdf`;
  },

  // Campus Print Hub
  async calculatePrintPrice(params: {
    pages: number;
    copies: number;
    colorMode: 'bw' | 'color';
    printSides: 'single' | 'double';
    bindingType: 'staple' | 'spiral' | 'hardbound';
    urgency: 'regular' | 'express_morning_9am';
  }) {
    const res = await fetch('/api/printing/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error('Failed to calculate price');
    return res.json();
  },

  async getPrintOrders(): Promise<{ orders: PrintOrder[] }> {
    const res = await fetch('/api/printing/orders');
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
  },

  async createPrintOrder(data: {
    documentTitle: string;
    pages: number;
    copies: number;
    colorMode: 'bw' | 'color';
    printSides: 'single' | 'double';
    bindingType: 'staple' | 'spiral' | 'hardbound';
    hostelDeliveryAddress: string;
    phoneNumber: string;
    urgency: 'regular' | 'express_morning_9am';
  }) {
    const res = await fetch('/api/printing/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to place print order');
    }
    return res.json();
  },

  // English AI Teacher
  async chatEnglish(message: string, mode: 'general_tutor' | 'hr_interview' | 'tech_interview' | 'grammar_clinic', history: any[]) {
    const res = await fetch('/api/english/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, mode, history })
    });
    if (!res.ok) throw new Error('Failed to get English tutor response');
    return res.json();
  },

  // Teacher / Faculty Portal
  async getTeacherClasses(): Promise<{ classes: TeacherClass[] }> {
    const res = await fetch('/api/teacher/classes');
    if (!res.ok) throw new Error('Failed to fetch teacher classes');
    return res.json();
  },

  async createTeacherClass(data: { name: string; subject: string; branch?: string; semester?: string }) {
    const res = await fetch('/api/teacher/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create class');
    return res.json();
  },

  async getTeacherAssignments(): Promise<{ assignments: TeacherAssignment[] }> {
    const res = await fetch('/api/teacher/assignments');
    if (!res.ok) throw new Error('Failed to fetch assignments');
    return res.json();
  },

  async generateTeacherAssignment(data: { classId: string; title: string; topic: string; dueDate: string; questionCount: number }) {
    const res = await fetch('/api/teacher/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to generate assignment');
    return res.json();
  },

  async getTeacherAnalytics() {
    const res = await fetch('/api/teacher/analytics');
    if (!res.ok) throw new Error('Failed to fetch teacher analytics');
    return res.json();
  }
};
