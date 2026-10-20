/**
 * Wraps asynchronous Express handlers and forwards rejected promises to error middleware. Keeps route error handling consistent.
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';

export const asyncHandler = (fn: RequestHandler): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);
