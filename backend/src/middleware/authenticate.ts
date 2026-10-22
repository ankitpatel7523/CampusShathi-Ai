import { Request, Response, NextFunction } from 'express';
import { DEMO_USER_ID } from '../../../server/seed.js';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: string;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.headers.cookie) {
    const match = req.headers.cookie.match(/campussathi_token=([^;]+)/);
    if (match) token = match[1];
  }

  // If no token or demo token, attach demo user
  if (!token || token === 'demo_session_token_123') {
    req.userId = DEMO_USER_ID;
    return next();
  }

  req.userId = token.startsWith('user_') ? token : DEMO_USER_ID;
  next();
}
