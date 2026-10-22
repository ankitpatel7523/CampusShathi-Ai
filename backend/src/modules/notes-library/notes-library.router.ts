import { Router, Response } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import multer from 'multer';
import { db } from '../../../../server/db.js';
import { authenticate, AuthenticatedRequest } from '../../middleware/authenticate.js';
import { CampusNoteUploadSchema, NoteRatingSchema } from '../../../../shared/schemas/index.js';
import { getStructuredNoteContent, generateValidPdfBuffer } from './notes-preview.service.js';

export const notesLibraryRouter = Router();

const uploadDir = path.resolve(process.cwd(), 'data', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const noteUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 35 * 1024 * 1024 }
});


// GET all notes with search & filtering
notesLibraryRouter.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, subject, branch, semester, sortBy } = req.query as { [key: string]: string };
    
    let query = `SELECT * FROM notes_library WHERE 1=1`;
    const params: any[] = [];

    if (search) {
      query += ` AND (title LIKE ? OR description LIKE ? OR subject LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (subject && subject !== 'all') {
      query += ` AND subject = ?`;
      params.push(subject);
    }

    if (branch && branch !== 'all') {
      query += ` AND branch = ?`;
      params.push(branch);
    }

    if (semester && semester !== 'all') {
      query += ` AND semester = ?`;
      params.push(semester);
    }

    if (sortBy === 'stars') {
      query += ` ORDER BY stars DESC, rating_count DESC`;
    } else if (sortBy === 'downloads') {
      query += ` ORDER BY downloads DESC`;
    } else if (sortBy === 'free') {
      query += ` ORDER BY price ASC, stars DESC`;
    } else {
      query += ` ORDER BY created_at DESC`;
    }

    const notes = db.prepare(query).all(...params);

    // Get subject counts for filter tabs
    const subjects = db.prepare(`SELECT subject, COUNT(*) as count FROM notes_library GROUP BY subject`).all();

    res.json({
      notes,
      total: notes.length,
      availableSubjects: subjects
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch notes' });
  }
});

// GET single note with its reviews
notesLibraryRouter.get('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const note = db.prepare('SELECT * FROM notes_library WHERE id = ?').get(req.params.id);
    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }
    const reviews = db.prepare('SELECT * FROM note_ratings WHERE note_id = ? ORDER BY created_at DESC').all(req.params.id);
    res.json({ note, reviews });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET structured preview pages for in-browser PDF viewer (blocked for unpaid notes)
notesLibraryRouter.get('/:id/preview', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const note = db.prepare('SELECT * FROM notes_library WHERE id = ?').get(req.params.id) as any;
    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    // Check if note is paid and not unlocked by this user
    const hasUnlocked = note.price === 0 || note.user_id === userId || !!db.prepare('SELECT 1 FROM note_unlocks WHERE user_id = ? AND note_id = ?').get(userId, note.id);
    if (!hasUnlocked) {
      res.status(402).json({
        error: 'PREMIUM_NOTE_LOCKED',
        isLocked: true,
        price: note.price,
        noteId: note.id,
        title: note.title,
        message: `This is a premium note priced at ₹${note.price}. Full preview is restricted until payment/unlock.`
      });
      return;
    }

    const previewData = getStructuredNoteContent(note);
    res.json(previewData);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate note preview' });
  }
});

// GET binary PDF stream for in-browser PDF reader or native download (blocked for unpaid notes)
notesLibraryRouter.get('/:id/pdf', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const note = db.prepare('SELECT * FROM notes_library WHERE id = ?').get(req.params.id) as any;
    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    // Check if note is paid and not unlocked by this user
    const hasUnlocked = note.price === 0 || note.user_id === userId || !!db.prepare('SELECT 1 FROM note_unlocks WHERE user_id = ? AND note_id = ?').get(userId, note.id);
    if (!hasUnlocked) {
      res.status(402).json({
        error: 'PREMIUM_NOTE_LOCKED',
        isLocked: true,
        price: note.price,
        message: `This is a premium note (₹${note.price}). Preview and download are locked.`
      });
      return;
    }

    const safeTitle = (note.title || 'document').replace(/[^a-zA-Z0-9_-]/g, '_');

    // If an actual uploaded PDF file exists in uploads directory, serve it directly!
    if (note.file_path && note.file_path !== 'notes_demo.pdf' && note.file_path !== 'notes_upload.pdf') {
      const diskPath = path.join(uploadDir, note.file_path);
      if (fs.existsSync(diskPath)) {
        const fileBuffer = fs.readFileSync(diskPath);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${safeTitle}.pdf"`);
        res.setHeader('Content-Length', fileBuffer.length);
        return res.send(fileBuffer);
      }
    }

    // Fallback: structured synthesized PDF preview matching exact real page_count
    const previewData = getStructuredNoteContent(note);
    const pdfBuffer = generateValidPdfBuffer(previewData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${safeTitle}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to serve PDF' });
  }
});

// POST unlock note (tracks unlocked premium documents)
notesLibraryRouter.post('/:id/unlock', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const note = db.prepare('SELECT * FROM notes_library WHERE id = ?').get(req.params.id) as any;
    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    const unlockId = `unlock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    db.prepare(`
      INSERT OR IGNORE INTO note_unlocks (id, note_id, user_id, amount_paid)
      VALUES (?, ?, ?, ?)
    `).run(unlockId, note.id, userId, note.price || 0);

    res.json({
      success: true,
      message: `Note '${note.title}' unlocked! You can now preview and study the document.`,
      noteId: note.id,
      price: note.price
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to unlock note' });
  }
});

// POST upload new note to marketplace (supports real PDF/doc files via multipart or JSON)
notesLibraryRouter.post('/upload', authenticate, noteUpload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const user = db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as { name?: string };
    const file = req.file;

    // Default title from uploaded file name if not provided
    if (!req.body.title && file) {
      req.body.title = file.originalname.replace(/\.[^/.]+$/, '').trim();
    }

    const validated = CampusNoteUploadSchema.parse(req.body);
    const noteId = `note_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    let diskFileName = 'notes_upload.pdf';
    let calculatedPageCount = req.body.pageCount ? Number(req.body.pageCount) : 1;

    // Handle real file binary if uploaded
    if (file) {
      diskFileName = `${noteId}_${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const diskPath = path.join(uploadDir, diskFileName);
      fs.writeFileSync(diskPath, file.buffer);

      // Check if it's a PDF
      const header = file.buffer.slice(0, 5).toString('ascii');
      const isPdf = header.startsWith('%PDF-');

      if (isPdf) {
        try {
          const pdfParseModule: any = await import('pdf-parse');
          if (pdfParseModule?.PDFParse) {
            const parser = new pdfParseModule.PDFParse({ data: file.buffer });
            const textResult = await parser.getText();
            calculatedPageCount = textResult?.total || 1;
            await parser.destroy?.();
          } else if (typeof pdfParseModule === 'function') {
            const parsed = await pdfParseModule(file.buffer);
            calculatedPageCount = parsed?.numpages || 1;
          } else if (typeof pdfParseModule?.default === 'function') {
            const parsed = await pdfParseModule.default(file.buffer);
            calculatedPageCount = parsed?.numpages || 1;
          }
        } catch (pdfErr) {
          console.warn('PDF page count extraction failed, using default:', pdfErr);
          calculatedPageCount = Math.max(1, Math.round(file.size / (100 * 1024)));
        }
      } else {
        calculatedPageCount = Math.max(1, Math.round(file.size / (150 * 1024)));
      }
    } else {
      calculatedPageCount = req.body.pageCount ? Number(req.body.pageCount) : Math.floor(Math.random() * 20) + 15;
    }

    db.prepare(`
      INSERT INTO notes_library (
        id, user_id, title, description, subject, branch, semester, university,
        author_name, file_path, page_count, stars, rating_count, price, is_verified, downloads
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      noteId,
      userId,
      validated.title,
      validated.description,
      validated.subject,
      validated.branch,
      validated.semester,
      validated.university,
      user?.name || 'Campus Scholar',
      diskFileName,
      calculatedPageCount,
      5.0,
      1,
      validated.price,
      1, // Real user uploaded notes receive verified student badge
      1
    );

    // Award XP, coins, streak, hype and uploads count to creator for sharing notes
    db.prepare(`
      UPDATE profiles 
      SET xp = xp + 150, 
          campus_coins = COALESCE(campus_coins, 150) + 100, 
          uploads_count = COALESCE(uploads_count, 0) + 1,
          streak_days = streak_days + 1,
          hype_score = COALESCE(hype_score, 100) + 200
      WHERE user_id = ?
    `).run(userId);

    // Also record in activity log
    try {
      db.prepare(`
        INSERT INTO activity_log (id, user_id, activity_type, title, xp_earned)
        VALUES (?, ?, 'upload', ?, 150)
      `).run(`act_${Date.now()}`, userId, `Shared Notes: ${validated.title}`);
    } catch {}

    const newNote = db.prepare('SELECT * FROM notes_library WHERE id = ?').get(noteId);
    const updatedProfile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId);

    res.status(201).json({
      note: newNote,
      profile: updatedProfile,
      hypeEarned: 200,
      coinsEarned: 100,
      xpEarned: 150,
      message: '🔥 Notes shared! +100 Campus Coins, +150 XP, & +200 Hype earned!'
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Validation error' });
  }
});

// POST submit review / star rating ⭐
notesLibraryRouter.post('/:id/rate', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const user = db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as { name?: string };
    const note = db.prepare('SELECT * FROM notes_library WHERE id = ?').get(req.params.id) as any;

    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    const { rating, comment } = NoteRatingSchema.parse(req.body);
    const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    db.prepare(`
      INSERT INTO note_ratings (id, note_id, user_id, user_name, rating, comment)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(reviewId, note.id, userId, user?.name || 'Student', rating, comment || '');

    // Calculate new average rating
    const stats = db.prepare(`SELECT AVG(rating) as avgRating, COUNT(*) as total FROM note_ratings WHERE note_id = ?`).get(note.id) as any;
    const newStars = Math.round((stats.avgRating || rating) * 10) / 10;
    const totalRatings = stats.total || 1;

    db.prepare(`UPDATE notes_library SET stars = ?, rating_count = ? WHERE id = ?`).run(newStars, totalRatings, note.id);

    // Give creator bonus XP if high rating!
    if (rating >= 4) {
      db.prepare(`UPDATE profiles SET xp = xp + 30 WHERE user_id = ?`).run(note.user_id);
    }

    res.json({ success: true, newStars, ratingCount: totalRatings, message: 'Rating submitted! Creator received ⭐ recognition.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST verify note (Faculty action)
notesLibraryRouter.post('/:id/verify', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const note = db.prepare('SELECT * FROM notes_library WHERE id = ?').get(req.params.id);
    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }
    db.prepare('UPDATE notes_library SET is_verified = 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Note has been awarded the Faculty Verified gold badge!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST download note
notesLibraryRouter.post('/:id/download', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    db.prepare('UPDATE notes_library SET downloads = downloads + 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Download started' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
