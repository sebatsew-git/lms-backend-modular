/**
 * Authenticates requests using the access token. Attaches verified identity data to the request or rejects unauthenticated access.
 */

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../../common/utils/jwt.util';
import { UnauthorizedError } from '../../common/errors/AppError';

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next(new UnauthorizedError('Missing bearer token'));

  try {
    req.user = verifyAccessToken(header.slice(7));
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
};
