import { z } from 'zod';

export const userIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const listUsersSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    role: z.enum(['ADMIN', 'INSTRUCTOR', 'STUDENT']).optional(),
    search: z.string().optional(),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      firstName: z.string().min(1).max(50).optional(),
      lastName: z.string().min(1).max(50).optional(),
      role: z.enum(['ADMIN', 'INSTRUCTOR', 'STUDENT']).optional(),
      avatarUrl: z.string().url().optional(),
      isVerified: z.boolean().optional(),
    })
    .refine((v) => Object.keys(v).length > 0, { message: 'Provide at least one field' }),
});

export const updateProfileSchema = z.object({
  body: z
    .object({
      firstName: z.string().min(1).max(50).optional(),
      lastName: z.string().min(1).max(50).optional(),
      bio: z.string().max(1000).optional(),
      phone: z.string().max(30).optional(),
      country: z.string().max(60).optional(),
    })
    .refine((v) => Object.keys(v).length > 0, { message: 'Provide at least one field' }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain uppercase')
      .regex(/[a-z]/, 'Must contain lowercase')
      .regex(/[0-9]/, 'Must contain a number')
      .regex(/[^A-Za-z0-9]/, 'Must contain a symbol'),
  }),
});
