/**
 * Extends Express request typings with LMS authentication data. Keeps middleware and controllers type-safe when accessing the current user.
 */

import { AccessTokenPayload } from '../utils/jwt.util';

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

export {};
