import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { checkDatabaseConnection } from './db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';

// Security: restrict CORS to allowed origin
app.use(
  cors({
    origin: ALLOWED_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Security headers
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(express.json({ limit: '1mb' }));

import brochureRouter from './routes/brochure';
import externalSearchRouter from './routes/externalSearch';
import catalogRouter from './routes/catalog';
import offerRequestsRouter from './routes/offerRequests';

// Health check endpoint
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    await checkDatabaseConnection();
    return res.status(200).json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
      service: 'LookMyDeals Backend Proxy',
    });
  } catch {
    return res.status(503).json({
      status: 'unavailable',
      database: 'disconnected',
      service: 'LookMyDeals Backend Proxy',
    });
  }
});

// Mount API routes
app.use('/api/brochure', brochureRouter);
app.use('/api/external-search', externalSearchRouter);
app.use('/api/catalog', catalogRouter);
app.use('/api/offer-requests', offerRequestsRouter);

// Centralized error handler conforming to API_SPEC.md
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected error occurred.';

  // Never expose raw stack traces in responses
  res.status(status).json({
    error: {
      code,
      message,
    },
  });
});

if (process.env.NODE_ENV !== 'test') {
  void checkDatabaseConnection()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`[LookMyDeals Backend] connected to MySQL and running on http://localhost:${PORT}`);
      });
    })
    .catch((error: unknown) => {
      console.error('[LookMyDeals Backend] MySQL connection failed:', error instanceof Error ? error.message : error);
      console.error('Check DB_HOST, DB_PORT, DB_NAME, DB_USER, and DB_PASSWORD in .env');
      process.exit(1);
    });
}

export default app;
