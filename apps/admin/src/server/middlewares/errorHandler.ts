import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  statusCode: number;
  details?: any;

  constructor(message: string, statusCode = 400, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Zod Validation Errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Known Application Errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details,
    });
  }

  // Conflict Error (e.g. Booking conflict)
  if (err.name === 'ConflictError') {
    return res.status(409).json({
      error: err.message || 'Slot is no longer available',
    });
  }

  // Database Connection / Unreachable Errors (e.g. Supabase paused, network unreachable, invalid credentials)
  if (
    err?.name === 'PrismaClientInitializationError' ||
    err?.code === 'P1001' ||
    err?.message?.includes("Can't reach database server")
  ) {
    console.error('[Database Connection Error]:', err.message || err);
    return res.status(503).json({
      error: "Ma'lumotlar bazasiga ulanib bo'lmadi. Supabase loyihasi to'xtatilgan (paused) bo'lishi mumkin. Iltimos, Supabase panelida 'Restore project' tugmasini bosing yoki ulanish sozlamalarini tekshiring.",
      code: 'DATABASE_UNAVAILABLE',
    });
  }

  // Generic fallback without exposing internal stack trace in production
  console.error('[API Error]:', err);
  const isProd = process.env.NODE_ENV === 'production';
  return res.status(err.statusCode || 500).json({
    error: isProd ? 'An internal server error occurred' : err.message || 'Internal Server Error',
    ...(isProd ? {} : { stack: err.stack }),
  });
};
