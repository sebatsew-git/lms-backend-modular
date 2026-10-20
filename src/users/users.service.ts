import { prisma } from '../database/prisma';
import { NotFoundError, BadRequestError } from '../common/errors/AppError';
import { hashPassword, verifyPassword } from '../common/utils/password.util';
import { Prisma, Role } from '@prisma/client';

const publicSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  isVerified: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
  profile: true,
} satisfies Prisma.UserSelect;

export const listUsers = async (params: {
  page: number;
  limit: number;
  role?: Role;
  search?: string;
}) => {
  const where: Prisma.UserWhereInput = {};
  if (params.role) where.role = params.role;
  if (params.search) {
    where.OR = [
      { email: { contains: params.search, mode: 'insensitive' } },
      { firstName: { contains: params.search, mode: 'insensitive' } },
      { lastName: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  const skip = (params.page - 1) * params.limit;

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: params.limit,
      orderBy: { createdAt: 'desc' },
      select: publicSelect,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    items,
    meta: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.limit)),
    },
  };
};

export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      ...publicSelect,
      _count: { select: { courses: true, enrollments: true, submissions: true } },
    },
  });
  if (!user) throw new NotFoundError('User not found');
  return user;
};

export const updateUser = async (
  id: string,
  data: Partial<{ firstName: string; lastName: string; role: Role; avatarUrl: string; isVerified: boolean }>,
) => {
  await getUserById(id);
  return prisma.user.update({ where: { id }, data, select: publicSelect });
};

export const updateOwnProfile = async (
  userId: string,
  data: Partial<{
    firstName: string;
    lastName: string;
    bio: string;
    phone: string;
    country: string;
  }>,
) => {
  const { firstName, lastName, ...profile } = data;

  await prisma.user.update({
    where: { id: userId },
    data: { firstName, lastName },
  });

  return prisma.profile.upsert({
    where: { userId },
    create: { userId, ...profile },
    update: profile,
  });
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');
  if (!user.password) throw new BadRequestError('This account signs in with Google — no password set');

  const ok = await verifyPassword(user.password, currentPassword);
  if (!ok) throw new BadRequestError('Current password is incorrect');

  const hashed = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

  // Any previously issued refresh token stays valid; revoke explicitly if desired.
  return { message: 'Password updated successfully' };
};

export const deleteUser = async (id: string) => {
  await getUserById(id);
  await prisma.user.delete({ where: { id } });
  return { id };
};
