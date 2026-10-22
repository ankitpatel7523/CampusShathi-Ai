import { db, initDb } from '../../../server/db.js';

export { db, initDb };

/**
 * Migration helper to verify SQLite tables or hook into external MongoDB/PostgreSQL
 */
export function checkDatabaseHealth(): { status: 'healthy' | 'degraded'; provider: 'sqlite' | 'mongodb' | 'firestore' } {
  try {
    const result = db.prepare('SELECT 1 as alive').get() as { alive: number };
    return { status: result?.alive === 1 ? 'healthy' : 'degraded', provider: 'sqlite' };
  } catch {
    return { status: 'degraded', provider: 'sqlite' };
  }
}
