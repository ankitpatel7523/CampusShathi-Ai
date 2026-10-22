export const DEMO_USER_ID = 'user_demo_ankit';
export const DEMO_EMAIL = 'demo@campussathi.local';

export function seedDemoData() {
  // Intentionally disabled: this app must not auto-create demo accounts or fake user data.
  return;
}

export function seedStartupModules() {
  // Intentionally disabled: no fake marketplace data should be created automatically.
  return;
}

export function createDefaultProfileForUser(userId: string, userName: string) {
  const { db } = await import('./db.js');
  const existing = db.prepare('SELECT user_id FROM profiles WHERE user_id = ?').get(userId);
  if (!existing) {
    db.prepare(`
      INSERT INTO profiles (user_id, avatar, accent_color, theme, default_language, daily_goal_minutes, xp, level, streak_days, longest_streak, campus_coins, last_active_date)
      VALUES (?, '🎓', 'indigo', 'light', 'en', 45, 0, 1, 0, 0, 0, ?)
    `).run(userId, new Date().toISOString().split('T')[0]);
  }
}
