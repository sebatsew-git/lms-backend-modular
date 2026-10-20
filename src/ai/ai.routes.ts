import { Router } from 'express';
import * as aiController from './ai.controller';
import { authenticate } from '../auth/guards/authenticate.guard';
import { requirePermission } from '../auth/guards/pbac.guard';
import { validateRequest } from '../common/middlewares/validate.middleware';
import {
  submissionParamsSchema,
  feedbackRequestSchema,
  summarizeMaterialSchema,
} from './ai.schema';

const router = Router();

// Declared before /feedback/:submissionId so the literal path is not shadowed
router.get('/feedback/me', authenticate, requirePermission('ai:use'), aiController.myFeedback);

/** Queues the job (202). Poll the GET below for the result. */
router.post(
  '/feedback/:submissionId',
  authenticate,
  requirePermission('ai:use'),
  validateRequest(feedbackRequestSchema),
  aiController.generateFeedback,
);

/** Awaits Gemini in-request — use for small batches or demos. */
router.post(
  '/feedback/:submissionId/sync',
  authenticate,
  requirePermission('ai:use'),
  validateRequest(feedbackRequestSchema),
  aiController.generateFeedbackSync,
);

router.get(
  '/feedback/:submissionId',
  authenticate,
  requirePermission('ai:use'),
  validateRequest(submissionParamsSchema),
  aiController.getFeedback,
);

/** Ad-hoc study helper: summarise pasted material. */
router.post(
  '/summarize',
  authenticate,
  requirePermission('ai:use'),
  validateRequest(summarizeMaterialSchema),
  aiController.summarize,
);

export default router;
