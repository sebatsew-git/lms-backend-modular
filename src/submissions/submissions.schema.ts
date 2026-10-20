/**
 * Defines Zod validation schemas for S Ub Mi Ss Io Ns requests. Exports rules used to validate incoming parameters and payloads before processing.
 */

import { z } from 'zod';

export const createSubmissionSchema = z.object({
  params: z.object({ assignmentId: z.string().uuid() }),
  body: z.object({
    content: z.string().max(20000).optional(),
  }),
});

export const submissionIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const assignmentSubmissionsSchema = z.object({
  params: z.object({ assignmentId: z.string().uuid() }),
});

export const mySubmissionsSchema = z.object({
  query: z.object({
    status: z.enum(['SUBMITTED', 'GRADED', 'LATE']).optional(),
    assignmentId: z.string().uuid().optional(),
  }),
});
