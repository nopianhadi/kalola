import { Request, Response, NextFunction } from 'express';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const jwt = require('jsonwebtoken');

const getJwtSecret = (): string => process.env.JWT_SECRET || 'dev-only-change-me';

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: string;
}

// Extend Express Request to include `user`
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Middleware yang memverifikasi JWT dan meng-inject req.user
 * Menolak request tanpa token valid dengan 401.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const tokenFromQuery = typeof req.query.token === 'string' ? req.query.token : null;
  const token = tokenFromHeader || tokenFromQuery;

  if (!token) {
    res.status(401).json({ error: 'Token tidak ditemukan. Silakan login.' });
    return;
  }

  try {
    const payload = jwt.verify(token, getJwtSecret()) as any;
    req.user = {
      id: Number(payload.sub),
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token tidak valid atau sudah kedaluwarsa.' });
  }
}

/**
 * Helper: ambil vendor_id dari req.user.
 * Admin memakai id mereka sendiri.
 * Member juga memakai id Admin mereka — untuk saat ini kita gunakan req.user.id
 * (bisa diperluas nanti dengan tabel vendor_members).
 */
export function getVendorId(req: Request): number {
  if (!req.user) throw new Error('Unauthenticated');
  return req.user.id;
}
