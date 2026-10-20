/**
 * Implements business operations for A Ut H. Coordinates persistence and related feature services behind the API layer.
 */

import { prisma } from '../database/prisma';
import { hashPassword, verifyPassword } from '../common/utils/password.util';
import {
  signAccessToken, signRefreshToken, verifyRefreshToken, hashToken, generateFamilyId,
} from '../common/utils/jwt.util';
import { ConflictError, UnauthorizedError, NotFoundError } from '../common/errors/AppError';
import { ROLE_PERMISSIONS } from '../common/constants/permissions';
import { Role } from '@prisma/client';
import { sendWelcomeEmail } from '../email/email.service';

export const registerUser = async (data: {
  email: string; password: string; firstName: string; lastName: string; role?: Role;
}) => {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new ConflictError('Email already in use');

  const hashed = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashed,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role ?? Role.STUDENT,
      profile: { create: {} },
    },
    include: { profile: true },
  });

  // Non-blocking email
  void sendWelcomeEmail(user.email, user.firstName, 'dummy-verification-token');

  return user;
};

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password) throw new UnauthorizedError('Invalid credentials');

  const ok = await verifyPassword(user.password, password);
  if (!ok) throw new UnauthorizedError('Invalid credentials');

  return issueTokens(user.id, user.role);
};

export const issueTokens = async (userId: string, role: Role, family?: string) => {
  const tokenFamily = family ?? generateFamilyId();
  const permissions = ROLE_PERMISSIONS[role] ?? [];

  const accessToken = signAccessToken({ userId, role, permissions });
  const refreshToken = signRefreshToken(userId, tokenFamily);
  const tokenHash = hashToken(refreshToken);

  await prisma.refreshToken.create({
    data: {
      userId, tokenHash, family: tokenFamily,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken, refreshToken };
};

export const rotateRefreshToken = async (oldToken: string) => {
  const payload = verifyRefreshToken(oldToken);
  const tokenHash = hashToken(oldToken);

  const stored = await prisma.refreshToken.findFirst({
    where: { tokenHash, userId: payload.userId },
  });

  if (!stored) throw new UnauthorizedError('Refresh token not recognized');

  // Reuse of an already-rotated token ⇒ the family is compromised: revoke every session in it.
  if (stored.revoked) {
    await prisma.refreshToken.updateMany({
      where: { family: stored.family },
      data: { revoked: true },
    });
    throw new UnauthorizedError('Token reuse detected — all sessions revoked');
  }

  if (stored.expiresAt < new Date()) {
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
    throw new UnauthorizedError('Refresh token expired');
  }

  // Rotate: burn the presented token, then issue a fresh pair in the same family.
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) throw new NotFoundError('User not found');

  return issueTokens(user.id, user.role, stored.family);
};

export const revokeAllUserTokens = async (userId: string) => {
  await prisma.refreshToken.updateMany({ where: { userId }, data: { revoked: true } });
};

/** Purges expired / revoked rows — safe to call from a scheduled job. */
export const pruneRefreshTokens = async () => {
  const { count } = await prisma.refreshToken.deleteMany({
    where: { OR: [{ revoked: true }, { expiresAt: { lt: new Date() } }] },
  });
  return { removed: count };
};
