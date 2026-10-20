/**
 * Enforces permission-based access for protected API actions. Checks the user role permissions before allowing a request to proceed.
 */

import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../../common/errors/AppError';

export const requirePermission =
  (...required: string[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new ForbiddenError('Not authenticated'));
    const hasAll = required.every((p) => req.user!.permissions.includes(p));
    if (!hasAll) return next(new ForbiddenError(`Missing permission: ${required.join(', ')}`));
    next();
  };
