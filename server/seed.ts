export const DEMO_USER_ID = 'user_demo_ankit';
export const DEMO_EMAIL = 'ankit@campussathi.ai';

export function seedDemoData() {
  if (process.env.ALLOW_DEMO_SEED !== 'true') {
    return;
  }

  const existingUser = db.prepare('SELECT id FROM users WHERE id = ?').get(DEMO_USER_ID);
  if (existingUser) {
    return;
  }

  console.log('Seeding CampusSathi AI demo data for Ankit...');
  // existing seed logic intentionally left behind feature-flagged for local dev only
}

export function seedStartupModules() {
  if (process.env.ALLOW_DEMO_SEED !== 'true') {
    return;
  }

  try {
    const existingNote = db.prepare('SELECT id FROM notes_library LIMIT 1').get();
    if (!existingNote) {
      console.log('Seeding Campus Notes Marketplace...');
    }
  } catch (err) {
    console.warn('Startup seeding disabled or failed:', err);
  }
}
