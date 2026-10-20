import { z } from 'zod';

export const createQuizSchema = z.object({
  params: z.object({ courseId: z.string().uuid() }),
  body: z.object({
    title: z.string().min(3).max(160),
    description: z.string().max(1000).optional(),
  }),
});

export const quizIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const updateQuizSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      title: z.string().min(3).max(160).optional(),
      description: z.string().max(1000).optional(),
      status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
    })
    .refine((v) => Object.keys(v).length > 0, { message: 'Provide at least one field' }),
});

export const addQuestionSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    prompt: z.string().min(5),
    options: z.array(z.string().min(1)).min(2).max(10),
    correctIndex: z.coerce.number().int().nonnegative(),
    explanation: z.string().max(1000).optional(),
    points: z.coerce.number().int().positive().max(100).default(1),
  }),
});

export const questionIdSchema = z.object({
  params: z.object({ questionId: z.string().uuid() }),
});

export const submitAttemptSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    answers: z
      .array(
        z.object({
          questionId: z.string().uuid(),
          selectedIndex: z.coerce.number().int().nonnegative(),
        }),
      )
      .min(1),
  }),
});

export const courseQuizParamsSchema = z.object({
  params: z.object({ courseId: z.string().uuid() }),
});
