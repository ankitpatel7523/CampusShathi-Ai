import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'campussathi.db');
export const db = new DatabaseSync(dbPath);

// Initialize database tables
export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      college TEXT DEFAULT '',
      course TEXT DEFAULT '',
      year TEXT DEFAULT '1st Year',
      semester TEXT DEFAULT 'Sem 1',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS profiles (
      user_id TEXT PRIMARY KEY,
      avatar TEXT DEFAULT '🎓',
      accent_color TEXT DEFAULT 'indigo',
      theme TEXT DEFAULT 'light',
      default_language TEXT DEFAULT 'en',
      daily_goal_minutes INTEGER DEFAULT 45,
      xp INTEGER DEFAULT 120,
      level INTEGER DEFAULT 1,
      streak_days INTEGER DEFAULT 3,
      longest_streak INTEGER DEFAULT 5,
      last_active_date TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      file_path TEXT NOT NULL,
      page_count INTEGER DEFAULT 1,
      chunk_count INTEGER DEFAULT 1,
      file_size INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chunks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      document_id TEXT NOT NULL,
      page_number INTEGER NOT NULL,
      chunk_index INTEGER NOT NULL,
      content TEXT NOT NULL,
      embedding TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      document_id TEXT,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      citations TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      document_id TEXT,
      topic TEXT NOT NULL,
      score INTEGER NOT NULL,
      total INTEGER NOT NULL,
      time_spent_seconds INTEGER DEFAULT 0,
      difficulty TEXT DEFAULT 'medium',
      language TEXT DEFAULT 'en',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quiz_answers (
      id TEXT PRIMARY KEY,
      attempt_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      question TEXT NOT NULL,
      selected_option INTEGER NOT NULL,
      correct_option INTEGER NOT NULL,
      is_correct INTEGER NOT NULL,
      explanation TEXT,
      citation TEXT,
      FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS viva_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      topic TEXT NOT NULL,
      mode TEXT DEFAULT 'college_viva',
      difficulty TEXT DEFAULT 'medium',
      overall_score REAL DEFAULT 0,
      strengths TEXT,
      weaknesses TEXT,
      pace_feedback TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS viva_turns (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      turn_number INTEGER NOT NULL,
      question TEXT NOT NULL,
      student_answer TEXT,
      score REAL DEFAULT 0,
      feedback TEXT,
      model_answer TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES viva_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS plans (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      exam_name TEXT,
      exam_date TEXT,
      daily_hours REAL DEFAULT 2.0,
      explanation TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS plan_tasks (
      id TEXT PRIMARY KEY,
      plan_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      subject TEXT NOT NULL,
      topic TEXT NOT NULL,
      task_type TEXT NOT NULL,
      duration_minutes INTEGER DEFAULT 30,
      completed INTEGER DEFAULT 0,
      is_weak_topic INTEGER DEFAULT 0,
      FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS scans (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      image_path TEXT,
      transcribed_text TEXT NOT NULL,
      summary TEXT,
      mindmap_outline TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS flashcards (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      scan_id TEXT,
      subject TEXT DEFAULT 'General',
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      repetitions INTEGER DEFAULT 0,
      interval_days INTEGER DEFAULT 1,
      ease_factor REAL DEFAULT 2.5,
      due_date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      flashcard_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      grade INTEGER NOT NULL,
      reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (flashcard_id) REFERENCES flashcards(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      activity_type TEXT NOT NULL,
      title TEXT NOT NULL,
      xp_earned INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS badges (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      badge_key TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, badge_key)
    );

    -- Startup Module: Campus Notes Marketplace
    CREATE TABLE IF NOT EXISTS notes_library (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      subject TEXT NOT NULL,
      branch TEXT DEFAULT 'Computer Science',
      semester TEXT DEFAULT 'Sem 4',
      university TEXT DEFAULT 'AKTU',
      author_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      page_count INTEGER DEFAULT 1,
      stars REAL DEFAULT 5.0,
      rating_count INTEGER DEFAULT 1,
      price INTEGER DEFAULT 0,
      is_verified INTEGER DEFAULT 0,
      downloads INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS note_ratings (
      id TEXT PRIMARY KEY,
      note_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (note_id) REFERENCES notes_library(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS note_unlocks (
      id TEXT PRIMARY KEY,
      note_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      amount_paid INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (note_id) REFERENCES notes_library(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, note_id)
    );

    -- Startup Module: Campus Print Hub
    CREATE TABLE IF NOT EXISTS print_orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      document_title TEXT NOT NULL,
      file_path TEXT DEFAULT '',
      pages INTEGER NOT NULL,
      copies INTEGER DEFAULT 1,
      color_mode TEXT DEFAULT 'bw',
      print_sides TEXT DEFAULT 'double',
      binding_type TEXT DEFAULT 'staple',
      hostel_delivery_address TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      urgency TEXT DEFAULT 'regular',
      total_amount REAL NOT NULL,
      payment_status TEXT DEFAULT 'paid',
      order_status TEXT DEFAULT 'order_placed',
      estimated_delivery TEXT DEFAULT 'Tomorrow, 9:00 AM',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Startup Module: English & Placement AI Coach
    CREATE TABLE IF NOT EXISTS english_conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      mode TEXT DEFAULT 'general_tutor',
      topic TEXT DEFAULT 'Spoken English & Fluency',
      messages TEXT NOT NULL,
      fluency_score INTEGER DEFAULT 82,
      feedback TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Startup Module: Teacher & Faculty Management
    CREATE TABLE IF NOT EXISTS teacher_classes (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL,
      name TEXT NOT NULL,
      subject TEXT NOT NULL,
      branch TEXT DEFAULT 'Computer Science',
      semester TEXT DEFAULT 'Sem 4',
      code TEXT UNIQUE NOT NULL,
      student_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS teacher_assignments (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      title TEXT NOT NULL,
      topic TEXT NOT NULL,
      due_date TEXT NOT NULL,
      total_marks INTEGER DEFAULT 20,
      questions TEXT NOT NULL,
      submissions_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (class_id) REFERENCES teacher_classes(id) ON DELETE CASCADE,
      FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Migration: Add role and campus_coins if missing
  try {
    db.exec(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'student';`);
  } catch {
    // Column already exists
  }

  try {
    db.exec(`ALTER TABLE profiles ADD COLUMN campus_coins INTEGER DEFAULT 150;`);
  } catch {
    // Column already exists
  }

  try {
    const dummyHash = 'dummy_hash_toppers';
    const authors = [
      { id: 'user_priya', name: 'Priya Sharma (Rank 1)', email: 'priya@aktu.ac.in', college: 'AKTU' },
      { id: 'user_ananya', name: 'Ananya Deshmukh', email: 'ananya@vtu.ac.in', college: 'VTU' },
      { id: 'user_rohit', name: 'Rohit Verma', email: 'rohit@dtu.ac.in', college: 'DTU' },
      { id: 'user_kunal', name: 'Kunal Patel', email: 'kunal@pune.ac.in', college: 'Pune University' }
    ];

    for (const a of authors) {
      db.prepare(`
        INSERT OR IGNORE INTO users (id, email, password_hash, name, college, course, year, semester)
        VALUES (?, ?, ?, ?, ?, 'B.Tech CSE', 'Final Year', 'Sem 8')
      `).run(a.id, a.email, dummyHash, a.name, a.college);
    }

    db.exec(`
      UPDATE notes_library SET user_id = 'user_priya' WHERE id = 'note_os_topper';
      UPDATE notes_library SET user_id = 'user_ananya' WHERE id = 'note_dbms_gate';
      UPDATE notes_library SET user_id = 'user_rohit' WHERE id = 'note_dsa_quick';
      UPDATE notes_library SET user_id = 'user_kunal' WHERE id = 'note_cn_protocols';
    `);
  } catch (e) {
    console.warn('Author migration warning:', e);
  }
}

