import { Router } from 'express';
import type { Request, Response } from 'express';
import { AdminUser } from '../models/AdminUser.ts';
import { generateAdminToken, requireAdminAuth, type AuthenticatedRequest } from '../middleware/auth.ts';

export const adminAuthRouter = Router();

/**
 * POST /api/auth/login
 * Administrator sign-in
 */
adminAuthRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_CREDENTIALS', message: 'Email/username and password are required.' },
      });
      return;
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    // Query admin user with passwordHash included explicitly
    const user = await AdminUser.findOne({
      $or: [{ email: cleanIdentifier }, { username: cleanIdentifier }],
    }).select('+passwordHash');

    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials provided.' },
      });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials provided.' },
      });
      return;
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = generateAdminToken({
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    });

    // Set secure HTTP-only cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('eventflow_admin_token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      message: 'Authentication successful.',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        lastLogin: user.lastLogin,
      },
      token, // Also return in body for environments where cookie headers are restricted
    });
  } catch (error) {
    console.error('[Admin Login Error]', error);
    res.status(500).json({
      success: false,
      error: { code: 'LOGIN_ERROR', message: 'An error occurred during authentication.' },
    });
  }
});

/**
 * POST /api/auth/logout
 * Clears administrator authentication cookie
 */
adminAuthRouter.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('eventflow_admin_token', {
    httpOnly: true,
    sameSite: 'lax',
  });
  res.json({
    success: true,
    message: 'Successfully logged out.',
  });
});

/**
 * GET /api/auth/me
 * Checks active session
 */
adminAuthRouter.get('/me', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    user: req.adminUser,
  });
});
