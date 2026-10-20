import { Router } from 'express';
import * as authController from './auth.controller';
import { authenticate } from './guards/authenticate.guard';
import { validateRequest } from '../common/middlewares/validate.middleware';
import { registerSchema, loginSchema } from './auth.schema';

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Create a new account
 *     responses:
 *       201: { description: User created }
 */
router.post('/register', validateRequest(registerSchema), authController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Exchange credentials for a token pair
 *     responses:
 *       200: { description: Access + refresh tokens }
 */
router.post('/login', validateRequest(loginSchema), authController.login);

// Refresh-token rotation (RTR) — each call burns the presented token.
router.post('/refresh', authController.refresh);

// Revokes every active refresh token for the authenticated user.
router.post('/logout', authenticate, authController.logout);

router.get('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authenticate, authController.resendVerification);
router.get('/me', authenticate, authController.me);

// Google OAuth 2.0 (authorization-code flow)
router.get('/google', authController.googleRedirect);
router.get('/google/callback', authController.googleCallback);

export default router;
