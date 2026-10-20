import { Router } from 'express';
import { z } from 'zod';
import * as quizzesController from './quizzes.controller';
import { authenticate } from '../auth/guards/authenticate.guard';
import { requirePermission } from '../auth/guards/pbac.guard';
import { requireCourseOwnership } from '../auth/guards/abac.guard';
import { validateRequest } from '../common/middlewares/validate.middleware';
import {
  createQuizSchema,
  quizIdSchema,
  updateQuizSchema,
  addQuestionSchema,
  questionIdSchema,
  submitAttemptSchema,
  courseQuizParamsSchema,
} from './quizzes.schema';

/** Mounted at `/courses/:courseId/quizzes` */
export const courseQuizzesRouter = Router({ mergeParams: true });

courseQuizzesRouter.get(
  '/',
  authenticate,
  validateRequest(courseQuizParamsSchema),
  quizzesController.listQuizzes,
);

courseQuizzesRouter.post(
  '/',
  authenticate,
  requirePermission('quiz:write'),
  validateRequest(createQuizSchema),
  requireCourseOwnership,
  quizzesController.createQuiz,
);

const generateSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    topic: z.string().min(3).max(200).optional(),
    count: z.coerce.number().int().min(1).max(20).default(5),
  }),
});

/** Mounted at `/quizzes` */
const router = Router();

// Declared before /:id so the literal path is not shadowed
router.get('/attempts/me', authenticate, quizzesController.myAttempts);

router.get('/:id', authenticate, validateRequest(quizIdSchema), quizzesController.getQuiz);

router.patch(
  '/:id',
  authenticate,
  requirePermission('quiz:write'),
  validateRequest(updateQuizSchema),
  quizzesController.updateQuiz,
);

router.delete(
  '/:id',
  authenticate,
  requirePermission('quiz:write'),
  validateRequest(quizIdSchema),
  quizzesController.deleteQuiz,
);

router.post(
  '/:id/questions',
  authenticate,
  requirePermission('quiz:write'),
  validateRequest(addQuestionSchema),
  quizzesController.addQuestion,
);

router.post(
  '/:id/generate',
  authenticate,
  requirePermission('quiz:write'),
  validateRequest(generateSchema),
  quizzesController.generateQuestions,
);

router.post(
  '/:id/attempts',
  authenticate,
  requirePermission('quiz:attempt'),
  validateRequest(submitAttemptSchema),
  quizzesController.submitAttempt,
);

router.get(
  '/:id/attempts',
  authenticate,
  requirePermission('quiz:write'),
  validateRequest(quizIdSchema),
  quizzesController.listAttempts,
);

router.get(
  '/:id/stats',
  authenticate,
  requirePermission('quiz:write'),
  validateRequest(quizIdSchema),
  quizzesController.quizStats,
);

router.patch(
  '/questions/:questionId',
  authenticate,
  requirePermission('quiz:write'),
  validateRequest(
    z.object({
      params: z.object({ questionId: z.string().uuid() }),
      body: z
        .object({
          prompt: z.string().min(5).optional(),
          options: z.array(z.string().min(1)).min(2).max(10).optional(),
          correctIndex: z.coerce.number().int().nonnegative().optional(),
          explanation: z.string().max(1000).optional(),
          points: z.coerce.number().int().positive().max(100).optional(),
        })
        .refine((v) => Object.keys(v).length > 0, { message: 'Provide at least one field' }),
    }),
  ),
  quizzesController.updateQuestion,
);

router.delete(
  '/questions/:questionId',
  authenticate,
  requirePermission('quiz:write'),
  validateRequest(questionIdSchema),
  quizzesController.deleteQuestion,
);

export default router;
