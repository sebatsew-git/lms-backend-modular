/**
 * Defines Express endpoints for E Nr Ol Lm En Ts operations. Connects request handlers and applies the relevant authentication or authorization middleware.
 */

import { Router } from 'express';
import * as enrollmentsController from './enrollments.controller';
import { authenticate } from '../auth/guards/authenticate.guard';
import { requirePermission } from '../auth/guards/pbac.guard';
import { requireEnrollmentOwnership } from '../auth/guards/abac.guard';
import { validateRequest } from '../common/middlewares/validate.middleware';
import {
  enrollSchema,
  enrollmentIdSchema,
  courseEnrollmentParamsSchema,
  updateEnrollmentSchema,
} from './enrollments.schema';

/** Mounted at `/courses/:courseId/enrollments` */
export const courseEnrollmentsRouter = Router({ mergeParams: true });

courseEnrollmentsRouter.get(
  '/',
  authenticate,
  requirePermission('course:write'),
  validateRequest(courseEnrollmentParamsSchema),
  enrollmentsController.courseEnrollments,
);

/** Mounted at `/enrollments` */
const router = Router();

// Self-enrolment into a published course
router.post(
  '/:courseId',
  authenticate,
  requirePermission('course:read'),
  validateRequest(enrollSchema),
  enrollmentsController.enroll,
);

// The authenticated student's own enrolments
router.get('/me', authenticate, enrollmentsController.myEnrollments);

router.get(
  '/:id',
  authenticate,
  validateRequest(enrollmentIdSchema),
  requireEnrollmentOwnership,
  enrollmentsController.getEnrollment,
);

router.patch(
  '/:id',
  authenticate,
  requirePermission('course:write'),
  validateRequest(updateEnrollmentSchema),
  enrollmentsController.updateEnrollment,
);

router.delete(
  '/:courseId',
  authenticate,
  requirePermission('course:read'),
  validateRequest(enrollSchema),
  enrollmentsController.dropEnrollment,
);

export default router;
