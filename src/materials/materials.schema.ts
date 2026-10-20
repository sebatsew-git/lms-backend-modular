/**
 * Defines Zod validation schemas for M At Er Ia Ls requests. Exports rules used to validate incoming parameters and payloads before processing.
 */

import { z } from 'zod';

export const uploadMaterialSchema = z.object({
  params: z.object({ courseId: z.string().uuid() }),
  body: z.object({
    title: z.string().min(2).max(160).optional(),
  }),
});

export const materialIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const listMaterialsSchema = z.object({
  params: z.object({ courseId: z.string().uuid() }),
});
