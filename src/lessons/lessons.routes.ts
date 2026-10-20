/**
 * Defines Express endpoints for L Es So Ns operations. Connects request handlers and applies the relevant authentication or authorization middleware.
 */

import { Router } from 'express';
import * as lessonsController from './lessons.controller';
import { authenticate } from '../auth/guards/authenticate.guard';
import { requirePermission } from '../auth/guards/pbac.guard';
import { requireCourseOwnership } from '../auth/guards/abac.guard';
import { validateRequest } from '../common/middlewares/validate.middleware';
import {
  createLessonSchema,
  lessonIdSchema,
  updateLessonSchema,
  moduleLessonsSchema,
} from './lessons.schema';

/** Mounted at `/courses/:courseId/lessons` */
export const courseLessonsRouter = Router({ mergeParams: true });

courseLessonsRouter.get('/', authenticate, lessonsController.listCourseLessons);

courseLessonsRouter.post(
  '/',
  authenticate,
  requirePermission('lesson:write'),
  validateRequest(createLessonSchema),
  requireCourseOwnership,
  lessonsController.createLesson,
);

/** Mounted at `/lessons` */
const router = Router();

// Lessons belonging to a module
router.get(
  '/module/:moduleId',
  authenticate,
  validateRequest(moduleLessonsSchema),
  lessonsController.listModuleLessons,
);

router.get('/:id', authenticate, validateRequest(lessonIdSchema), lessonsController.getLesson);

router.patch(
  '/:id',
  authenticate,
  requirePermission('lesson:write'),
  validateRequest(updateLessonSchema),
  lessonsController.updateLesson,
);

router.delete(
  '/:id',
  authenticate,
  requirePermission('lesson:write'),
  validateRequest(lessonIdSchema),
  lessonsController.deleteLesson,
);

export default router;
