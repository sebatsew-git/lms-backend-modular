/**
 * Defines Zod validation schemas for AI requests. Exports rules used to validate incoming parameters and payloads before processing.
 */

import { z } from 'zod';

export const submissionParamsSchema = z.object({
  params: z.object({ submissionId: z.string().uuid() }),
});

export const feedbackRequestSchema = z.object({
  params: z.object({ submissionId: z.string().uuid() }),
  body: z
    .object({
      tone: z.enum(['encouraging', 'neutral', 'strict']).default('encouraging'),
      includeScore: z.boolean().default(true),
    })
    .optional(),
});

export const quizGenerateSchema = z.object({
  params: z.object({ quizId: z.string().uuid() }),
  body: z.object({
    topic: z.string().min(3).max(200),
    count: z.coerce.number().int().min(1).max(20).default(5),
  }),
});

export const summarizeMaterialSchema = z.object({
  body: z.object({
    text: z.string().min(50).max(50000),
    maxBullets: z.coerce.number().int().min(3).max(20).default(6),
  }),
});
