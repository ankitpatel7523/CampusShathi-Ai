import express, { Request, Response, NextFunction } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import multer from 'multer';
import dotenv from 'dotenv';
import { z } from 'zod';
import { db, initDb } from './server/db.js';
import { aiProvider } from './server/providers.js';
import { RAGService, OUT_OF_SCOPE_RESPONSES } from './server/rag.js';
import { seedDemoData, seedStartupModules } from './server/seed.js';
import { backendRouter } from './backend/src/app.js';

dotenv.config();

initDb();
seedDemoData();
seedStartupModules();

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

const uploadDir = path.resolve(process.cwd(), 'data', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
});

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));
app.use('/api', backendRouter);

const tokenUserMap = new Map<string, string>();

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.headers.cookie) {
    const match = req.headers.cookie.match(/campussathi_token=([^;]+)/);
    if (match) token = match[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const userId = tokenUserMap.get(token);
  if (!userId) {
    return res.status(401).json({ error: 'Invalid or expired session.' });
  }

  (req as any).userId = userId;
  next();
}

function awardUserXp(userId: string, xp: number, activityType: string, title: string) {
  try {
    db.prepare(`UPDATE profiles SET xp = xp + ? WHERE user_id = ?`).run(xp, userId);
    const profile = db.prepare(`SELECT xp, level FROM profiles WHERE user_id = ?`).get(userId) as any;
    if (profile) {
      const newLevel = Math.floor(profile.xp / 300) + 1;
      if (newLevel > profile.level) {
        db.prepare(`UPDATE profiles SET level = ? WHERE user_id = ?`).run(newLevel, userId);
      }
    }
    db.prepare(`
      INSERT INTO activity_log (id, user_id, activity_type, title, xp_earned)
      VALUES (?, ?, ?, ?, ?)
    `).run(`act_${Date.now()}_${Math.random().toString(36).substring(7)}`, userId, activityType, title, xp);
  } catch (err) {
    console.error('Failed to award XP:', err);
  }
}

app.post('/api/auth/signup', (req: Request, res: Response) => {
  const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    college: z.string().optional().default(''),
    course: z.string().optional().default(''),
    year: z.string().optional().default('1st Year'),
    semester: z.string().optional().default('Sem 1')
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', errorKind: 'VALIDATION_ERROR', details: parsed.error.issues });
  }

  const { name, email, password, college, course, year, semester } = parsed.data;
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(400).json({ error: 'Email already registered', errorKind: 'DUPLICATE_EMAIL' });
  }

  const userId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const hash = crypto.createHash('sha256').update(password).digest('hex');

  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, college, course, year, semester)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(userId, email, hash, name, college, course, year, semester);

  db.prepare(`
    INSERT INTO profiles (user_id, avatar, accent_color, theme, default_language, daily_goal_minutes, xp, level, streak_days, longest_streak)
    VALUES (?, '🎓', 'indigo', 'light', 'en', 45, 50, 1, 1, 1)
  `).run(userId);

  const token = `token_${crypto.randomBytes(24).toString('hex')}`;
  tokenUserMap.set(token, userId);

  awardUserXp(userId, 50, 'signup', 'Joined CampusSathi AI');

  res.cookie('campussathi_token', token, { httpOnly: true, maxAge: 30 * 24 * 3600 * 1000 });
  res.json({ token, user: { id: userId, email, name, college, course, year, semester } });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required', errorKind: 'MISSING_FIELDS' });
  }

  const hash = crypto.createHash('sha256').update(password).digest('hex');
  const user = db.prepare('SELECT * FROM users WHERE email = ? AND password_hash = ?').get(email, hash) as any;

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password', errorKind: 'AUTH_FAILED' });
  }

  const token = `token_${crypto.randomBytes(24).toString('hex')}`;
  tokenUserMap.set(token, user.id);

  res.cookie('campussathi_token', token, { httpOnly: true, maxAge: 30 * 24 * 3600 * 1000 });
  res.json({ token, user });
});

app.post('/api/auth/demo', (_req: Request, res: Response) => {
  return res.status(403).json({ error: 'Demo login is disabled in the real production build. Please create a real account.' });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    tokenUserMap.delete(authHeader.substring(7));
  }
  res.clearCookie('campussathi_token');
  res.json({ success: true });
});

app.get('/api/me', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const user = db.prepare("SELECT id, email, name, COALESCE(role, 'student') as role, college, course, year, semester, created_at FROM users WHERE id = ?").get(userId) as any;
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId);
  res.json({ user, profile });
});

app.patch('/api/me', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { name, college, course, year, semester, avatar, accent_color, theme, default_language, daily_goal_minutes } = req.body;

  if (name !== undefined || college !== undefined || course !== undefined || year !== undefined || semester !== undefined) {
    db.prepare(`
      UPDATE users SET 
        name = COALESCE(?, name),
        college = COALESCE(?, college),
        course = COALESCE(?, course),
        year = COALESCE(?, year),
        semester = COALESCE(?, semester)
      WHERE id = ?
    `).run(name, college, course, year, semester, userId);
  }

  if (avatar !== undefined || accent_color !== undefined || theme !== undefined || default_language !== undefined || daily_goal_minutes !== undefined) {
    db.prepare(`
      UPDATE profiles SET 
        avatar = COALESCE(?, avatar),
        accent_color = COALESCE(?, accent_color),
        theme = COALESCE(?, theme),
        default_language = COALESCE(?, default_language),
        daily_goal_minutes = COALESCE(?, daily_goal_minutes)
      WHERE user_id = ?
    `).run(avatar, accent_color, theme, default_language, daily_goal_minutes, userId);
  }

  const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const updatedProfile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId);
  res.json({ user: updatedUser, profile: updatedProfile });
});

app.get('/api/dashboard', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const profile = (db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId) || {}) as any;
  const user = (db.prepare('SELECT name, college, course FROM users WHERE id = ?').get(userId) || {}) as any;

  const quizStats = (db.prepare(`
    SELECT COUNT(*) as total_quizzes, AVG(CAST(score AS FLOAT) / total * 100) as avg_score
    FROM quiz_attempts WHERE user_id = ?
  `).get(userId) || { total_quizzes: 0, avg_score: 0 }) as any;

  const today = new Date().toISOString().split('T')[0];
  const dueFlashcards = (db.prepare(`
    SELECT COUNT(*) as due_count FROM flashcards WHERE user_id = ? AND due_date <= ?
  `).get(userId, today) || { due_count: 0 }) as any;

  const totalCards = (db.prepare(`
    SELECT COUNT(*) as total_count FROM flashcards WHERE user_id = ?
  `).get(userId) || { total_count: 0 }) as any;

  const weakTopics = db.prepare(`
    SELECT topic, AVG(CAST(score AS FLOAT) / total * 100) as avg_score, COUNT(*) as attempts
    FROM quiz_attempts
    WHERE user_id = ?
    GROUP BY topic
    ORDER BY avg_score ASC
    LIMIT 6
  `).all(userId) as any[];

  const studyMinutesRows = db.prepare(`
    SELECT date(created_at) as day, COUNT(*) as count
    FROM activity_log
    WHERE user_id = ? AND created_at >= datetime('now', '-13 days')
    GROUP BY date(created_at)
    ORDER BY day ASC
  `).all(userId) as any[];

  const studyMinutes = studyMinutesRows.map(row => ({
    day: new Date(row.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    minutes: Math.min(120, Math.max(10, Number(row.count) * 15))
  }));

  const topicMastery = db.prepare(`
    SELECT topic as subject, AVG(CAST(score AS FLOAT) / total * 100) as mastery
    FROM quiz_attempts
    WHERE user_id = ?
    GROUP BY topic
    ORDER BY mastery DESC
    LIMIT 6
  `).all(userId) as any[];

  const todayTasks = db.prepare(`
    SELECT pt.*, p.title as plan_title
    FROM plan_tasks pt
    JOIN plans p ON pt.plan_id = p.id
    WHERE pt.user_id = ? AND pt.date = ?
    ORDER BY pt.completed ASC, pt.is_weak_topic DESC
  `).all(userId, today) as any[];

  const recentActivity = db.prepare(`
    SELECT * FROM activity_log WHERE user_id = ? ORDER BY created_at DESC LIMIT 5
  `).all(userId) as any[];

  const upcomingExams = db.prepare(`
    SELECT title as name, exam_date as date,
      CAST((julianday(exam_date) - julianday(date('now'))) AS INTEGER) as daysLeft
    FROM plans
    WHERE user_id = ?
    ORDER BY exam_date ASC
    LIMIT 3
  `).all(userId) as any[];

  res.json({
    user,
    profile,
    stats: {
      streakDays: profile.streak_days || 3,
      xp: profile.xp || 120,
      level: profile.level || 1,
      totalQuizzes: quizStats.total_quizzes || 0,
      avgQuizScore: Math.round(quizStats.avg_score || 0),
      flashcardsDueToday: dueFlashcards.due_count || 0,
      totalFlashcards: totalCards.total_count || 0,
    },
    todayTasks,
    weakTopics: weakTopics.map(w => ({
      topic: w.topic,
      scorePercent: Math.round(w.avg_score),
      attempts: w.attempts,
      status: w.avg_score < 60 ? 'weak' : w.avg_score < 80 ? 'moderate' : 'strong'
    })),
    studyMinutes,
    topicMastery: topicMastery.map(t => ({
      subject: t.subject,
      mastery: Math.round(t.mastery)
    })),
    recentActivity,
    upcomingExams: upcomingExams.map(item => ({
      name: item.name,
      date: item.date,
      daysLeft: Number(item.daysLeft) || 0
    }))
  });
});

app.get('/api/quiz/leaderboard', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const subjectFilter = (req.query.subject as string) || 'All Subjects';

  const currentUser = (db.prepare('SELECT id, name, college, course FROM users WHERE id = ?').get(userId) || {}) as any;
  const currentProfile = (db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId) || {}) as any;

  let sql = `
    SELECT u.id AS userId,
           u.name,
           u.college,
           COALESCE(p.avatar, '🎓') AS avatar,
           COALESCE(p.xp, 0) AS xp,
           COALESCE(p.streak_days, 0) AS streakDays,
           COUNT(q.id) AS quizzesTaken,
           AVG(CAST(q.score AS FLOAT) / NULLIF(q.total, 0) * 100) AS avgAccuracy,
           CASE WHEN u.id = ? THEN 1 ELSE 0 END AS isCurrentUser
    FROM users u
    LEFT JOIN profiles p ON p.user_id = u.id
    LEFT JOIN quiz_attempts q ON q.user_id = u.id
    WHERE 1 = 1
  `;

  const params: any[] = [userId];
  if (subjectFilter !== 'All Subjects') {
    sql += ` AND q.topic LIKE ?`;
    params.push(`%${subjectFilter}%`);
  }
  sql += ` GROUP BY u.id ORDER BY xp DESC, avgAccuracy DESC LIMIT 20`;

  const rows = db.prepare(sql).all(...params) as any[];
  const rankedList = rows.map((item, idx) => ({
    userId: item.userId,
    name: item.name,
    college: item.college || 'Campus Student',
    avatar: item.avatar || '🎓',
    subject: subjectFilter === 'All Subjects' ? 'General Studies' : subjectFilter,
    quizzesTaken: Number(item.quizzesTaken) || 0,
    avgAccuracy: Math.round(Number(item.avgAccuracy) || 0),
    xp: Number(item.xp) || 0,
    streakDays: Number(item.streakDays) || 0,
    isCurrentUser: !!item.isCurrentUser,
    badge: Number(item.avgAccuracy) >= 90 ? 'Scholar' : Number(item.avgAccuracy) >= 70 ? 'Rising Star' : 'Newcomer',
    rank: idx + 1
  }));

  const currentUserEntry = {
    userId: currentUser.id || userId,
    name: (currentUser.name || 'You') + ' (You)',
    college: currentUser.college || 'Your College',
    avatar: currentProfile.avatar || '🎓',
    subject: subjectFilter === 'All Subjects' ? 'General Studies' : subjectFilter,
    quizzesTaken: rows.find(r => r.userId === userId)?.quizzesTaken || 0,
    avgAccuracy: Math.round(Number(rows.find(r => r.userId === userId)?.avgAccuracy) || 0),
    xp: Number(currentProfile.xp) || 0,
    streakDays: Number(currentProfile.streak_days) || 0,
    isCurrentUser: true,
    badge: 'You',
    rank: rankedList.find(r => r.isCurrentUser)?.rank || rankedList.length + 1
  };

  const finalList = rows.some(r => r.userId === userId)
    ? rankedList
    : [...rankedList, currentUserEntry];

  finalList.sort((a, b) => b.xp - a.xp || b.avgAccuracy - a.avgAccuracy);
  finalList.forEach((entry, idx) => { entry.rank = idx + 1; });

  const totalCompetitors = finalList.length;
  const userRank = finalList.find(r => r.isCurrentUser) || currentUserEntry;

  res.json({
    leaderboard: finalList,
    userRank,
    subjects: ['All Subjects', 'Operating Systems', 'Data Structures', 'Computer Networks'],
    activeSubject: subjectFilter,
    totalCompetitors
  });
});

app.get('/api/me/export', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId);
  const documents = db.prepare('SELECT id, title, page_count, created_at FROM documents WHERE user_id = ?').all(userId);
  const quizAttempts = db.prepare('SELECT * FROM quiz_attempts WHERE user_id = ?').all(userId);
  const flashcards = db.prepare('SELECT * FROM flashcards WHERE user_id = ?').all(userId);
  const vivaSessions = db.prepare('SELECT * FROM viva_sessions WHERE user_id = ?').all(userId);
  const plans = db.prepare('SELECT * FROM plans WHERE user_id = ?').all(userId);

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="campussathi_export.json"');
  res.json({
    exported_at: new Date().toISOString(),
    user,
    profile,
    documents,
    quizAttempts,
    flashcards,
    vivaSessions,
    plans
  });
});

app.delete('/api/me', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const docs = db.prepare('SELECT file_path FROM documents WHERE user_id = ?').all(userId) as Array<{ file_path: string }>;
  for (const doc of docs) {
    const fullPath = path.join(uploadDir, doc.file_path);
    if (fs.existsSync(fullPath)) {
      try { fs.unlinkSync(fullPath); } catch {}
    }
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  res.json({ success: true, message: 'Account and associated data deleted' });
});

app.post('/api/auth/demo', (_req: Request, res: Response) => {
  return res.status(403).json({ error: 'Demo login is disabled in the real app build. Please create a real account.' });
});

app.get('/api/health', async (req: Request, res: Response) => {
  const shouldProbe = req.query.probe === '1';
  let probeDetails: any = null;
  if (shouldProbe) {
    probeDetails = await aiProvider.probe();
  }

  res.json({
    status: 'ok',
    version: '1.0.0',
    time: new Date().toISOString(),
    aiProbe: probeDetails
  });
});

startServer().catch(err => {
  console.error('Failed to start CampusSathi server:', err);
});

async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', async () => {
    console.log(`====================================================`);
    console.log(`🚀 CampusSathi AI Full-Stack Server Running on Port ${PORT}`);
    console.log(`URL: http://localhost:${PORT}`);
    console.log(`====================================================`);

    try {
      const probeResult = await aiProvider.probe();
      console.log(`[AI Probe] Gemini (${probeResult.gemini.model}): ${probeResult.gemini.status} ${probeResult.gemini.error ? `(${probeResult.gemini.error})` : ''}`);
      console.log(`[AI Probe] Groq (${probeResult.groq.model}): ${probeResult.groq.status} ${probeResult.groq.error ? `(${probeResult.groq.error})` : ''}`);
    } catch (e) {
      console.warn('Initial AI probe error:', e);
    }
  });
}

export {}; 
