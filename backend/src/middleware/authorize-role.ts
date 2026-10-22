import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authenticate.js';
import { db } from '../../../server/db.js';

export function authorizeRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized. Please log in.' });
      return;
    }

    try {
      const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as { role?: string };
      const role = user?.role || 'student';
      req.userRole = role;

      if (!allowedRoles.includes(role)) {
        res.status(403).json({
          error: `Forbidden. This action requires one of the following roles: ${allowedRoles.join(', ')}`,
          currentRole: role
        });
        return;
      }

      next();
    } catch {
      // Allow through as student if table error
      req.userRole = 'student';
      next();
    }
  };
}
