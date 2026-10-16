import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AdminUser } from '../models/AdminUser.ts';

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'eventflow-development-secret-jwt-key-2026';

export interface AuthenticatedRequest extends Request {
  adminUser?: {
    id: string;
    email: string;
    username: string;
    role: string;
    fullName: string;
  };
}

export function generateAdminToken(payload: { id: string; email: string; role: string; username: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export async function requireAdminAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token = req.cookies?.eventflow_admin_token;

    // Also support Authorization header
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Administrator authentication required.',
        },
      });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      username: string;
      role: string;
    };

    const user = await AdminUser.findById(decoded.id);
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'The administrator account associated with this session no longer exists.',
        },
      });
      return;
    }

    req.adminUser = {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED_OR_INVALID',
        message: 'Invalid or expired administrative session. Please sign in again.',
      },
    });
  }
}
