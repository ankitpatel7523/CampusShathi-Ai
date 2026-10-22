import { Request, Response, NextFunction } from 'express';

const ipHits = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(maxRequests = 100, windowMs = 60 * 1000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const client = ipHits.get(ip);

    if (!client || now > client.resetTime) {
      ipHits.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    client.count++;
    if (client.count > maxRequests) {
      res.status(429).json({
        error: 'Too many requests. Please slow down.',
        retryAfterMs: client.resetTime - now
      });
      return;
    }

    next();
  };
}
