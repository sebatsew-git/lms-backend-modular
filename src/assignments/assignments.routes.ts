import { Router } from 'express';
import * as assignmentsController from './assignments.controller';
import { authenticate } from '../auth/guards/authenticate.guard';
import { requirePermission } from '../auth/guards/pbac.guard';
import { requireCourseOwnership } from '../auth/guards/abac.guard';
import { validateRequest } from '../common/middlewares/validate.middleware';
import {
  createAssignmentSchema,
  assignmentIdSchema,
  updateAssignmentSchema,
  courseAssignmentParamsSchema,
} from './assignments.schema';

/** Mounted at `/courses/:courseId/assignments` */
export const courseAssignmentsRouter = Router({ mergeParams: true });

courseAssignmentsRouter.get(
  '/',
  authenticate,
  validateRequest(courseAssignmentParamsSchema),
  assignmentsController.listAssignments,
);

courseAssignmentsRouter.post(
  '/',
  authenticate,
  requirePermission('assignment:write'),
  validateRequest(createAssignmentSchema),
  requireCourseOwnership,
  assignmentsController.createAssignment,
);

/** Mounted at `/assignments` */
const router = Router();

// Declared before /:id so the literal path is not shadowed
router.get('/upcoming', authenticate, assignmentsController.upcomingAssignments);

router.get(
  '/:id',
  authenticate,
  validateRequest(assignmentIdSchema),
  assignmentsController.getAssignment,
);

router.patch(
  '/:id',
  authenticate,
  requirePermission('assignment:write'),
  validateRequest(updateAssignmentSchema),
  assignmentsController.updateAssignment,
);

router.delete(
  '/:id',
  authenticate,
  requirePermission('assignment:write'),
  validateRequest(assignmentIdSchema),
  assignmentsController.deleteAssignment,
);

export default router;
