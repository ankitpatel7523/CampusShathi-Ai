import { db } from './db.js';
import crypto from 'node:crypto';

export const DEMO_USER_ID = 'user_demo_ankit';
export const DEMO_EMAIL = 'ankit@campussathi.ai';

export function seedDemoData() {
  const existingUser = db.prepare('SELECT id FROM users WHERE id = ?').get(DEMO_USER_ID);
  if (existingUser) {
    return; // Already seeded
  }

  console.log('Seeding CampusSathi AI demo data for Ankit...');

  // 1. Create demo user
  const passwordHash = crypto.createHash('sha256').update('password123').digest('hex');
  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, college, course, year, semester)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    DEMO_USER_ID,
    DEMO_EMAIL,
    passwordHash,
    'Ankit Sharma',
    'IIIT Delhi',
    'B.Tech Computer Science & Engineering',
    '3rd Year',
    'Semester 5'
  );

  // 2. Create profile
  db.prepare(`
    INSERT INTO profiles (user_id, avatar, accent_color, theme, default_language, daily_goal_minutes, xp, level, streak_days, longest_streak, last_active_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    DEMO_USER_ID,
    '🚀',
    'indigo',
    'light',
    'hinglish',
    60,
    840,
    3,
    5,
    9,
    new Date().toISOString().split('T')[0]
  );

  // 3. Create Documents
  const doc1Id = 'doc_os_unit1';
  db.prepare(`
    INSERT INTO documents (id, user_id, title, file_path, page_count, chunk_count, file_size)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    doc1Id,
    DEMO_USER_ID,
    'Operating Systems & Process Synchronization.pdf',
    'demo_os.pdf',
    4,
    4,
    428000
  );

  const doc2Id = 'doc_dsa_unit2';
  db.prepare(`
    INSERT INTO documents (id, user_id, title, file_path, page_count, chunk_count, file_size)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    doc2Id,
    DEMO_USER_ID,
    'Data Structures - Graphs and Shortest Paths.pdf',
    'demo_dsa.pdf',
    3,
    3,
    312000
  );

  // 4. Create Chunks for OS document
  const osChunks = [
    {
      page: 1,
      content: `Operating System Process Management: A Process is an instance of a program in execution. Process Control Block (PCB) contains process ID, state, program counter, CPU registers, CPU scheduling information, and memory management information. Process states include New, Ready, Running, Waiting, and Terminated. Context switching is the mechanism of saving the state of the current process and restoring the state of another process.`
    },
    {
      page: 2,
      content: `CPU Scheduling Algorithms: First-Come, First-Served (FCFS) suffers from the convoy effect. Shortest Job First (SJF) is optimal for minimizing average waiting time but requires prior knowledge of burst times. Round Robin (RR) allocates a small unit of CPU time called a time quantum (typically 10-100 milliseconds). Priority Scheduling may cause starvation, solved by aging technique.`
    },
    {
      page: 3,
      content: `Process Synchronization & Deadlocks: The Critical Section problem requires Mutual Exclusion, Progress, and Bounded Waiting. Semaphores are integer synchronization tools (wait/P and signal/V operations). A Deadlock occurs when 4 necessary conditions hold simultaneously: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. Banker's Algorithm is used for deadlock avoidance in multi-instance resource systems.`
    },
    {
      page: 4,
      content: `Memory Management & Virtual Memory: Paging eliminates external fragmentation by dividing physical memory into frames and logical memory into pages. Page replacement algorithms include FIFO, Optimal, and Least Recently Used (LRU). Thrashing occurs when a process spends more time swapping pages in and out of memory than executing code, caused by insufficient page frames.`
    }
  ];

  osChunks.forEach((c, idx) => {
    db.prepare(`
      INSERT INTO chunks (id, user_id, document_id, page_number, chunk_index, content)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(`chunk_os_${idx}`, DEMO_USER_ID, doc1Id, c.page, idx, c.content);
  });

  // Chunks for DSA document
  const dsaChunks = [
    {
      page: 1,
      content: `Graph Representations and Traversals: Graphs G = (V, E) can be represented using Adjacency Matrix (space complexity O(V^2)) or Adjacency List (space complexity O(V + E)). Breadth-First Search (BFS) uses a Queue to explore vertices level by level with time complexity O(V + E). Depth-First Search (DFS) uses a Stack or recursion.`
    },
    {
      page: 2,
      content: `Shortest Path Algorithms: Dijkstra's Algorithm finds single-source shortest paths in a weighted graph with non-negative edge weights using a Min-Heap priority queue in O((V + E) log V) time. Bellman-Ford algorithm handles negative weight edges and detects negative weight cycles in O(V * E) time.`
    },
    {
      page: 3,
      content: `Minimum Spanning Trees (MST): Kruskal's Algorithm sorts all edges and uses Disjoint Set Union (Union-Find) with path compression in O(E log E) time. Prim's Algorithm grows a single tree starting from an arbitrary root vertex using a priority queue in O(E log V) time.`
    }
  ];

  dsaChunks.forEach((c, idx) => {
    db.prepare(`
      INSERT INTO chunks (id, user_id, document_id, page_number, chunk_index, content)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(`chunk_dsa_${idx}`, DEMO_USER_ID, doc2Id, c.page, idx, c.content);
  });

  // 5. Seed Flashcards with SM-2 intervals
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const cards = [
    {
      question: 'What are the 4 necessary conditions for Deadlock to occur?',
      answer: '1. Mutual Exclusion, 2. Hold and Wait, 3. No Preemption, 4. Circular Wait.',
      subject: 'Operating Systems',
      due: today,
      repetitions: 2,
      interval: 1,
      ease: 2.5
    },
    {
      question: 'What is the time complexity of Dijkstra\'s algorithm with a Min-Heap?',
      answer: 'O((V + E) log V), where V is vertices and E is edges.',
      subject: 'Data Structures',
      due: today,
      repetitions: 3,
      interval: 2,
      ease: 2.6
    },
    {
      question: 'Explain the difference between Paging and Segmentation.',
      answer: 'Paging divides memory into fixed-size blocks (pages and frames). Segmentation divides memory into variable-sized logical modules (code, stack, heap).',
      subject: 'Operating Systems',
      due: today,
      repetitions: 1,
      interval: 1,
      ease: 2.4
    },
    {
      question: 'What causes Thrashing in virtual memory?',
      answer: 'Thrashing occurs when memory allocation is smaller than the process active working set, causing continuous page faults and disk swapping.',
      subject: 'Operating Systems',
      due: tomorrow,
      repetitions: 4,
      interval: 4,
      ease: 2.7
    }
  ];

  cards.forEach((card, idx) => {
    db.prepare(`
      INSERT INTO flashcards (id, user_id, subject, question, answer, repetitions, interval_days, ease_factor, due_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(`card_${idx}`, DEMO_USER_ID, card.subject, card.question, card.answer, card.repetitions, card.interval, card.ease, card.due);
  });

  // 6. Seed Quiz Attempts & Weak Topics
  const attempt1Id = 'attempt_os_1';
  db.prepare(`
    INSERT INTO quiz_attempts (id, user_id, document_id, topic, score, total, time_spent_seconds, difficulty, language)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(attempt1Id, DEMO_USER_ID, doc1Id, 'Deadlocks & Process Synchronization', 3, 5, 140, 'medium', 'en');

  const attempt2Id = 'attempt_dsa_1';
  db.prepare(`
    INSERT INTO quiz_attempts (id, user_id, document_id, topic, score, total, time_spent_seconds, difficulty, language)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(attempt2Id, DEMO_USER_ID, doc2Id, 'Graph Algorithms & MST', 4, 5, 110, 'medium', 'en');

  // 7. Seed Viva Session
  const vivaId = 'viva_demo_1';
  db.prepare(`
    INSERT INTO viva_sessions (id, user_id, topic, mode, difficulty, overall_score, strengths, weaknesses, pace_feedback)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    vivaId,
    DEMO_USER_ID,
    'Operating Systems Core Concepts',
    'college_viva',
    'medium',
    8.2,
    'Clear understanding of Process States, PCB, and Round Robin scheduling time slices.',
    'Banker algorithm safety state calculations need more numerical practice.',
    'Good speaking tempo (128 words/min), minimal filler words.'
  );

  // 8. Seed Study Plan & Tasks
  const planId = 'plan_midterm_2026';
  const examDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
  db.prepare(`
    INSERT INTO plans (id, user_id, title, exam_name, exam_date, daily_hours, explanation)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    planId,
    DEMO_USER_ID,
    'End-Semester Exam Mastery Plan',
    'OS & DSA Semester 5 Finals',
    examDate,
    2.5,
    'Dynamic schedule prioritized around identified weak spots (Deadlock Banker Algorithm and MST).'
  );

  const planTasks = [
    {
      subject: 'Operating Systems',
      topic: 'Bankers Algorithm & Safe State Detection',
      type: 'quiz',
      duration: 25,
      completed: 1,
      isWeak: 1,
      date: today
    },
    {
      subject: 'Data Structures',
      topic: 'Dijkstra vs Bellman Ford comparison',
      type: 'read',
      duration: 35,
      completed: 0,
      isWeak: 0,
      date: today
    },
    {
      subject: 'Flashcards',
      topic: 'Daily SM-2 Card Review (3 cards due)',
      type: 'flashcards',
      duration: 15,
      completed: 0,
      isWeak: 0,
      date: today
    },
    {
      subject: 'Operating Systems',
      topic: 'Virtual Memory & LRU Page Replacement Viva',
      type: 'viva',
      duration: 20,
      completed: 0,
      isWeak: 1,
      date: tomorrow
    }
  ];

  planTasks.forEach((t, idx) => {
    db.prepare(`
      INSERT INTO plan_tasks (id, plan_id, user_id, date, subject, topic, task_type, duration_minutes, completed, is_weak_topic)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(`task_${idx}`, planId, DEMO_USER_ID, t.date, t.subject, t.topic, t.type, t.duration, t.completed, t.isWeak);
  });

  // 9. Badges
  const badges = [
    { key: 'first_quiz', title: 'First Quiz Master', desc: 'Completed first self-test quiz', icon: '🎯' },
    { key: 'streak_5', title: '5-Day Streak', desc: 'Maintained 5 consecutive days of study', icon: '🔥' },
    { key: 'viva_pro', title: 'Viva Ready', desc: 'Successfully completed full voice viva session', icon: '🎙️' }
  ];

  badges.forEach(b => {
    db.prepare(`
      INSERT INTO badges (id, user_id, badge_key, title, description, icon)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(`badge_${b.key}`, DEMO_USER_ID, b.key, b.title, b.desc, b.icon);
  });

  // 10. Activity log
  const activities = [
    { type: 'quiz', title: 'Scored 80% in Graph Algorithms Quiz', xp: 50 },
    { type: 'viva', title: 'Completed OS Viva Practice (Score 8.2/10)', xp: 100 },
    { type: 'flashcard', title: 'Reviewed 4 Flashcards', xp: 20 }
  ];

  activities.forEach((act, idx) => {
    db.prepare(`
      INSERT INTO activity_log (id, user_id, activity_type, title, xp_earned)
      VALUES (?, ?, ?, ?, ?)
    `).run(`act_${idx}`, DEMO_USER_ID, act.type, act.title, act.xp);
  });

  console.log('CampusSathi AI demo data seeded successfully!');
}
