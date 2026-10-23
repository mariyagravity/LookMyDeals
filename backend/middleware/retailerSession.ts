import { randomBytes } from 'node:crypto';
import { NextFunction, Request, Response } from 'express';

const COOKIE_NAME = 'lmd_retailer_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

export interface RetailerSession {
  storeId: string;
  expiresAt: number;
}

const sessions = new Map<string, RetailerSession>();

function readSessionToken(req: Request): string | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const cookie = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`));
  const token = cookie?.slice(COOKIE_NAME.length + 1);
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
}

export function getRetailerSession(req: Request): RetailerSession | null {
  const token = readSessionToken(req);
  if (!token) return null;
  const session = sessions.get(token);
  if (!session || session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return null;
  }
  return session;
}

export function createRetailerSession(res: Response, storeId: string): void {
  const now = Date.now();
  for (const [token, session] of sessions) {
    if (session.expiresAt <= now) sessions.delete(token);
  }
  const token = randomBytes(32).toString('hex');
  sessions.set(token, { storeId, expiresAt: now + SESSION_TTL_MS });
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}${secure}`);
}

export function clearRetailerSession(req: Request, res: Response): void {
  const token = readSessionToken(req);
  if (token) sessions.delete(token);
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`);
}

export function requireRetailer(req: Request, res: Response, next: NextFunction): void {
  if (!getRetailerSession(req)) {
    res.status(401).json({ error: { code: 'RETAILER_LOGIN_REQUIRED', message: 'Sign in to access the retailer workspace.' } });
    return;
  }
  next();
}
