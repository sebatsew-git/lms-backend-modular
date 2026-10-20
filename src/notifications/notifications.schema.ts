/**
 * Defines Zod validation schemas for N Ot If Ic At Io Ns requests. Exports rules used to validate incoming parameters and payloads before processing.
 */

import { z } from 'zod';

export const notificationIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const listNotificationsSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    read: z
      .enum(['true', 'false'])
      .transform((v) => v === 'true')
      .optional(),
    type: z
      .enum(['ENROLLMENT', 'GRADE', 'AI_FEEDBACK', 'ASSIGNMENT', 'GENERAL'])
      .optional(),
  }),
});

export const broadcastSchema = z.object({
  body: z.object({
    userIds: z.array(z.string().uuid()).min(1).max(500),
    title: z.string().min(2).max(160),
    message: z.string().min(1).max(2000),
    type: z
      .enum(['ENROLLMENT', 'GRADE', 'AI_FEEDBACK', 'ASSIGNMENT', 'GENERAL'])
      .default('GENERAL'),
    metadata: z.record(z.unknown()).optional(),
    sendEmail: z.boolean().default(false),
  }),
});
