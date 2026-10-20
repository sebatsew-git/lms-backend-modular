import { Router } from 'express';
import * as gradingController from './grading.controller';
import { authenticate } from '../auth/guards/authenticate.guard';
import { requirePermission } from '../auth/guards/pbac.guard';
import { validateRequest } from '../common/middlewares/validate.middleware';
import {
  gradeSubmissionSchema,
  bulkGradeSchema,
  recomputeGradeSchema,
  courseGradingSchema,
} from './grading.schema';

/** Mounted at `/courses/:courseId/grading` */
export const courseGradingRouter = Router({ mergeParams: true });

courseGradingRouter.get(
  '/',
  authenticate,
  requirePermission('submission:grade'),
  validateRequest(courseGradingSchema),
  gradingController.listCourseGrades,
);

courseGradingRouter.get(
  '/gradebook',
  authenticate,
  requirePermission('submission:grade'),
  validateRequest(courseGradingSchema),
  gradingController.courseGradebook,
);

courseGradingRouter.post(
  '/bulk',
  authenticate,
  requirePermission('submission:grade'),
  validateRequest(bulkGradeSchema),
  gradingController.bulkGrade,
);

courseGradingRouter.post(
  '/recompute/:studentId',
  authenticate,
  requirePermission('submission:grade'),
  validateRequest(recomputeGradeSchema),
  gradingController.recomputeStudentGrade,
);

/** Mounted at `/grading` */
const router = Router();

router.patch(
  '/:id',
  authenticate,
  requirePermission('submission:grade'),
  validateRequest(gradeSubmissionSchema),
  gradingController.gradeSubmission,
);

export default router;
