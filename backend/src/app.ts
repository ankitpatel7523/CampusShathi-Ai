import express, { Router, Response } from 'express';
import { notesLibraryRouter } from './modules/notes-library/notes-library.router.js';
import { printingRouter } from './modules/printing/printing.router.js';
import { englishTeacherRouter } from './modules/english-teacher/english-teacher.router.js';
import { teachersRouter } from './modules/teachers/teachers.router.js';
import { authenticate, AuthenticatedRequest } from './middleware/authenticate.js';
import { db } from '../../server/db.js';
import { checkDatabaseHealth } from './config/database.js';

export const backendRouter = Router();

// Startup API sub-routers
backendRouter.use('/notes-library', notesLibraryRouter);
backendRouter.use('/printing', printingRouter);
backendRouter.use('/english', englishTeacherRouter);
backendRouter.use('/teacher', teachersRouter);

// Role switch helper: lets student experience teacher dashboard and vice versa
backendRouter.post('/auth/switch-role', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { role } = req.body;
    if (!['student', 'teacher', 'admin'].includes(role)) {
      res.status(400).json({ error: 'Invalid role. Choose student, teacher, or admin.' });
      return;
    }

    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId);
    res.json({ success: true, role, message: `Switched mode to ${role.toUpperCase()} successfully!` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// System Health & Diagnostics
backendRouter.get('/health', (req, res) => {
  const dbHealth = checkDatabaseHealth();
  res.json({
    status: 'ok',
    service: 'CampusSathi-AI-Backend',
    timestamp: new Date().toISOString(),
    database: dbHealth,
    environment: process.env.NODE_ENV || 'development'
  });
});
