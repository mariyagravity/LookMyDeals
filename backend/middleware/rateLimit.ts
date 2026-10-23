import { Request, Response, NextFunction } from 'express';

export function createRateLimiter(limit: number, windowMs: number) {
  const requests = new Map<string, { count: number; resetAt: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    if (requests.size > 5_000) {
      for (const [client, record] of requests) {
        if (record.resetAt <= now) requests.delete(client);
      }
    }
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const current = requests.get(key);

    if (!current || current.resetAt <= now) {
      requests.set(key, { count: 1, resetAt: now + windowMs });
    } else if (current.count >= limit) {
      res.setHeader('Retry-After', Math.ceil((current.resetAt - now) / 1000));
      return res.status(429).json({
        error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again shortly.' },
      });
    } else {
      current.count += 1;
    }

    next();
  };
}
