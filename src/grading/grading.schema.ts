/**
 * Defines Zod validation schemas for G Ra Di Ng requests. Exports rules used to validate incoming parameters and payloads before processing.
 */

import { z } from 'zod';

export const gradeSubmissionSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    grade: z.coerce.number().min(0).max(1000),
    feedback: z.string().max(4000).optional(),
    notifyStudent: z.boolean().default(true),
  }),
});

export const bulkGradeSchema = z.object({
  params: z.object({ courseId: z.string().uuid() }),
  body: z.object({
    items: z
      .array(
        z.object({
          submissionId: z.string().uuid(),
          grade: z.coerce.number().min(0).max(1000),
          feedback: z.string().max(4000).optional(),
        }),
      )
      .min(1)
      .max(200),
    notifyStudent: z.boolean().default(false),
  }),
});

export const recomputeGradeSchema = z.object({
  params: z.object({
    courseId: z.string().uuid(),
    studentId: z.string().uuid(),
  }),
});

export const courseGradingSchema = z.object({
  params: z.object({ courseId: z.string().uuid() }),
});

export const gradingIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});
