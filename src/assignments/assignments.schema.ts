/**
 * Defines Zod validation schemas for A Ss Ig Nm En Ts requests. Exports rules used to validate incoming parameters and payloads before processing.
 */

import { z } from 'zod';

export const createAssignmentSchema = z.object({
  params: z.object({ courseId: z.string().uuid() }),
  body: z.object({
    title: z.string().min(3).max(160),
    description: z.string().min(5),
    dueDate: z.coerce.date(),
    maxPoints: z.coerce.number().int().positive().max(1000).default(100),
  }),
});

export const assignmentIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const updateAssignmentSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      title: z.string().min(3).max(160).optional(),
      description: z.string().min(5).optional(),
      dueDate: z.coerce.date().optional(),
      maxPoints: z.coerce.number().int().positive().max(1000).optional(),
    })
    .refine((v) => Object.keys(v).length > 0, { message: 'Provide at least one field' }),
});

export const courseAssignmentParamsSchema = z.object({
  params: z.object({ courseId: z.string().uuid() }),
});
