import type { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string | number;
  errors?: Record<string, string>;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[Error Handler]', err);

  // Database offline or buffering timed out fallback
  if (
    err.name === 'MongooseError' ||
    err.name === 'MongoNetworkError' ||
    err.message?.includes('buffering timed out') ||
    err.message?.includes('ECONNREFUSED')
  ) {
    console.warn('[AI Studio] Database offline — returning fallback response');
    if (req.method === 'GET') {
      res.json(req.path.endsWith('s') || req.path.endsWith('s/') ? [] : {});
      return;
    }
    res.status(503).json({
      success: false,
      error: {
        code: 'DATABASE_OFFLINE',
        message: 'Database service is temporarily unavailable.',
      },
    });
    return;
  }

  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_REGISTRATION',
        message: 'This email address is already registered for this event.',
      },
    });
    return;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError' && (err as any).errors) {
    const fieldErrors: Record<string, string> = {};
    for (const key of Object.keys((err as any).errors)) {
      fieldErrors[key] = (err as any).errors[key].message;
    }
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request payload failed schema validation.',
        details: fieldErrors,
      },
    });
    return;
  }

  // Mongoose invalid ObjectId
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: 'The requested resource identifier format is invalid.',
      },
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected server error occurred.',
      ...(err.errors ? { details: err.errors } : {}),
    },
  });
}
