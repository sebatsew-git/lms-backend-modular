/**
 * Defines Zod validation schemas for E Nr Ol Lm En Ts requests. Exports rules used to validate incoming parameters and payloads before processing.
 */

import { z } from 'zod';

export const enrollSchema = z.object({
  params: z.object({ courseId: z.string().uuid() }),
});

export const enrollmentIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const courseEnrollmentParamsSchema = z.object({
  params: z.object({ courseId: z.string().uuid() }),
});

export const updateEnrollmentSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      status: z.enum(['ACTIVE', 'COMPLETED', 'DROPPED']).optional(),
      grade: z.coerce.number().min(0).max(100).optional(),
    })
    .refine((v) => Object.keys(v).length > 0, { message: 'Provide at least one field' }),
});

export const studentCourseParamsSchema = z.object({
  params: z.object({ courseId: z.string().uuid(), studentId: z.string().uuid() }),
});
