import { Router, Request, Response, NextFunction } from 'express';
import * as coursesController from './courses.controller';
import { authenticate } from '../auth/guards/authenticate.guard';
import { requirePermission } from '../auth/guards/pbac.guard';
import { requireCourseOwnership } from '../auth/guards/abac.guard';
import { validateRequest } from '../common/middlewares/validate.middleware';
import { verifyAccessToken } from '../common/utils/jwt.util';
import {
  createCourseSchema,
  courseIdSchema,
  listCoursesSchema,
  updateCourseSchema,
} from './courses.schema';
import { courseModulesRouter } from '../modules/modules.routes';
import { courseLessonsRouter } from '../lessons/lessons.routes';
import { courseAssignmentsRouter } from '../assignments/assignments.routes';
import { courseQuizzesRouter } from '../quizzes/quizzes.routes';
import { courseMaterialsRouter } from '../materials/materials.routes';
import { courseEnrollmentsRouter } from '../enrollments/enrollments.routes';
import { courseGradingRouter } from '../grading/grading.routes';

const router = Router({ mergeParams: true });

/**
 * Optional auth: anonymous visitors may browse the public catalogue
 * (published courses only) while logged-in users get their own view.
 */
const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = verifyAccessToken(header.slice(7));
    } catch {
      /* invalid token → treated as anonymous */
    }
  }
  next();
};

router.get('/', optionalAuth, validateRequest(listCoursesSchema), coursesController.listCourses);

router.post(
  '/',
  authenticate,
  requirePermission('course:write'),
  validateRequest(createCourseSchema),
  coursesController.createCourse,
);

router.get('/:id', validateRequest(courseIdSchema), coursesController.getCourse);

router.patch(
  '/:id',
  authenticate,
  requirePermission('course:write'),
  validateRequest(updateCourseSchema),
  requireCourseOwnership,
  coursesController.updateCourse,
);

router.delete(
  '/:id',
  authenticate,
  requirePermission('course:write'),
  validateRequest(courseIdSchema),
  requireCourseOwnership,
  coursesController.deleteCourse,
);

// ---------- Nested sub-resources (all scoped to /courses/:courseId/…) ----------
router.use('/:courseId/modules', courseModulesRouter);
router.use('/:courseId/lessons', courseLessonsRouter);
router.use('/:courseId/assignments', courseAssignmentsRouter);
router.use('/:courseId/quizzes', courseQuizzesRouter);
router.use('/:courseId/materials', courseMaterialsRouter);
router.use('/:courseId/enrollments', courseEnrollmentsRouter);
router.use('/:courseId/grading', courseGradingRouter);

export default router;
