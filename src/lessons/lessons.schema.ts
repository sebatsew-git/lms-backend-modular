/**
 * Defines Zod validation schemas for L Es So Ns requests. Exports rules used to validate incoming parameters and payloads before processing.
 */

import { z } from 'zod';

export const createLessonSchema = z.object({
  params: z.object({ courseId: z.string().uuid() }),
  body: z.object({
    moduleId: z.string().uuid(),
    title: z.string().min(2).max(160),
    content: z.string().min(1),
    order: z.coerce.number().int().nonnegative().default(0),
    videoUrl: z.string().url().optional(),
    duration: z.coerce.number().int().positive().optional(),
  }),
});

export const lessonIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const updateLessonSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      title: z.string().min(2).max(160).optional(),
      content: z.string().min(1).optional(),
      order: z.coerce.number().int().nonnegative().optional(),
      videoUrl: z.string().url().optional(),
      duration: z.coerce.number().int().positive().optional(),
    })
    .refine((v) => Object.keys(v).length > 0, { message: 'Provide at least one field' }),
});

export const moduleLessonsSchema = z.object({
  params: z.object({ moduleId: z.string().uuid() }),
});
