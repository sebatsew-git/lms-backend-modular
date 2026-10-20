/**
 * Handles HTTP requests for A Ut H operations. Delegates business logic to the feature service and formats API responses.
 */

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { prisma } from '../database/prisma';
import { env } from '../common/config/env';
import { asyncHandler } from '../common/utils/asyncHandler';
import * as authService from './auth.service';
import { sendWelcomeEmail } from '../email/email.service';
import { BadRequestError, UnauthorizedError, NotFoundError } from '../common/errors/AppError';

/** Google OAuth 2.0 payloads (no official types are pulled in for the raw REST calls). */
interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  refresh_token?: string;
  id_token?: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
}

const REFRESH_COOKIE = 'refreshToken';

const refreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const signEmailVerificationToken = (userId: string) =>
  jwt.sign({ userId, purpose: 'email-verification' }, env.JWT_ACCESS_SECRET, { expiresIn: '1d' });

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, role } = req.body as {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: Role;
  };

  const user = await authService.registerUser({ email, password, firstName, lastName, role });

  res.status(201).json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isVerified: user.isVerified,
    },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };
  const tokens = await authService.loginUser(email, password);

  res.cookie(REFRESH_COOKIE, tokens.refreshToken, refreshCookieOptions);
  res.json({
    success: true,
    data: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
  });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const fromCookie = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  const fromBody = (req.body as { refreshToken?: string } | undefined)?.refreshToken;
  const token = fromCookie ?? fromBody;

  if (!token) throw new UnauthorizedError('Missing refresh token');

  const tokens = await authService.rotateRefreshToken(token);
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, refreshCookieOptions);
  res.json({
    success: true,
    data: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.revokeAllUserTokens(req.user!.userId);
  res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
  res.json({ success: true, data: { message: 'Logged out successfully' } });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const token = req.query.token as string | undefined;
  if (!token) throw new BadRequestError('Verification token is required');

  let payload: { userId: string; purpose?: string };
  try {
    payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as { userId: string; purpose?: string };
  } catch {
    throw new UnauthorizedError('Invalid or expired verification token');
  }

  if (payload.purpose !== 'email-verification') {
    throw new UnauthorizedError('Invalid verification token');
  }

  await prisma.user.update({ where: { id: payload.userId }, data: { isVerified: true } });
  res.json({ success: true, data: { message: 'Email verified successfully' } });
});

export const resendVerification = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) throw new NotFoundError('User not found');

  if (user.isVerified) {
    return res.json({ success: true, data: { message: 'Email already verified' } });
  }

  await sendWelcomeEmail(user.email, user.firstName, signEmailVerificationToken(user.id));
  res.json({ success: true, data: { message: 'Verification email sent' } });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: { profile: true },
  });
  if (!user) throw new NotFoundError('User not found');

  const { password: _password, ...safeUser } = user;
  res.json({ success: true, data: safeUser });
});

export const googleRedirect = asyncHandler(async (_req: Request, res: Response) => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CALLBACK_URL) {
    throw new BadRequestError('Google OAuth is not configured on this server');
  }

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_CALLBACK_URL,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

export const googleCallback = asyncHandler(async (req: Request, res: Response) => {
  const code = req.query.code as string | undefined;
  if (!code) throw new BadRequestError('Missing Google authorization code');
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_CALLBACK_URL) {
    throw new BadRequestError('Google OAuth is not configured on this server');
  }

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: env.GOOGLE_CALLBACK_URL,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenResponse.ok) throw new UnauthorizedError('Google token exchange failed');
  const tokens = (await tokenResponse.json()) as GoogleTokenResponse;

  const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!profileResponse.ok) throw new UnauthorizedError('Failed to load Google profile');
  const profile = (await profileResponse.json()) as GoogleUserInfo;

  const user = await prisma.user.upsert({
    where: { email: profile.email },
    create: {
      email: profile.email,
      firstName: profile.given_name ?? profile.name,
      lastName: profile.family_name ?? '',
      googleId: profile.id,
      avatarUrl: profile.picture,
      isVerified: true,
      profile: { create: {} },
    },
    update: {
      googleId: profile.id,
      avatarUrl: profile.picture,
      isVerified: true,
    },
  });

  const issued = await authService.issueTokens(user.id, user.role);
  res.cookie(REFRESH_COOKIE, issued.refreshToken, refreshCookieOptions);
  res.redirect(`${env.CLIENT_URL}/oauth/success?accessToken=${issued.accessToken}`);
});
