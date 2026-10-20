/**
 * Defines Express endpoints for S Ub Mi Ss Io Ns operations. Connects request handlers and applies the relevant authentication or authorization middleware.
 */

import { Router } from 'express';
import * as submissionsController from './submissions.controller';
import { authenticate } from '../auth/guards/authenticate.guard';
import { requirePermission } from '../auth/guards/pbac.guard';
import { requireSubmissionOwnership } from '../auth/guards/abac.guard';
import { validateRequest } from '../common/middlewares/validate.middleware';
import { uploadSingle } from '../storage/storage.middleware';
import {
  createSubmissionSchema,
  submissionIdSchema,
  assignmentSubmissionsSchema,
  mySubmissionsSchema,
} from './submissions.schema';

const router = Router();

// --- Self-service (before any /:id route) ---
router.get('/me', authenticate, validateRequest(mySubmissionsSchema), submissionsController.listMySubmissions);

/**
 * Submit an assignment.
 * Accepts multipart/form-data (field name `file`) or JSON with `content`.
 */
router.post(
  '/assignment/:assignmentId',
  authenticate,
  requirePermission('submission:create'),
  uploadSingle('file'),
  validateRequest(createSubmissionSchema),
  submissionsController.createSubmission,
);

// --- Instructor / admin views ---
router.get(
  '/assignment/:assignmentId',
  authenticate,
  requirePermission('submission:read'),
  validateRequest(assignmentSubmissionsSchema),
  submissionsController.listSubmissionsForAssignment,
);

router.get(
  '/assignment/:assignmentId/stats',
  authenticate,
  requirePermission('submission:read'),
  validateRequest(assignmentSubmissionsSchema),
  submissionsController.submissionStats,
);

// --- Single submission (ABAC: owner or staff) ---
router.get(
  '/:id',
  authenticate,
  validateRequest(submissionIdSchema),
  requireSubmissionOwnership,
  submissionsController.getSubmission,
);

router.delete(
  '/:id',
  authenticate,
  validateRequest(submissionIdSchema),
  requireSubmissionOwnership,
  submissionsController.deleteSubmission,
);

export default router;
