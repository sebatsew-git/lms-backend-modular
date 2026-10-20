/**
 * Defines Zod validation schemas for M Od Ul Es requests. Exports rules used to validate incoming parameters and payloads before processing.
 */

import { z } from 'zod';

export const createModuleSchema = z.object({
  params: z.object({ courseId: z.string().uuid() }),
  body: z.object({
    title: z.string().min(2).max(120),
    order: z.coerce.number().int().nonnegative().default(0),
  }),
});

export const moduleIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const updateModuleSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      title: z.string().min(2).max(120).optional(),
      order: z.coerce.number().int().nonnegative().optional(),
    })
    .refine((v) => Object.keys(v).length > 0, { message: 'Provide at least one field' }),
});

export const reorderModulesSchema = z.object({
  params: z.object({ courseId: z.string().uuid() }),
  body: z.object({
    order: z
      .array(z.object({ id: z.string().uuid(), order: z.coerce.number().int().nonnegative() }))
      .min(1),
  }),
});
