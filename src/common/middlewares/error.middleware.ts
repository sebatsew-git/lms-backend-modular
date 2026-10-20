/**
 * Converts application and unexpected errors into consistent API responses. Applies the project error-handling policy to Express requests.
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { Prisma } from '@prisma/client';

export const notFoundHandler = (_req: Request, res: Response) =>
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route not found' },
  });

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('🔥', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: { code: 'CONFLICT', message: 'Resource already exists', details: err.meta },
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Resource not found' },
      });
    }
  }

  return res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
  });
};
