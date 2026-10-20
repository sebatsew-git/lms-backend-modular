/**
 * Combines feature routers under the versioned API path. Exports the central router mounted by the application.
 */

import { Router } from 'express';
import authRoutes from '../auth/auth.routes';
import userRoutes from '../users/users.routes';
import courseRoutes from '../courses/courses.routes';
import moduleRoutes from '../modules/modules.routes';
import lessonRoutes from '../lessons/lessons.routes';
import enrollmentRoutes from '../enrollments/enrollments.routes';
import materialRoutes from '../materials/materials.routes';
import assignmentRoutes from '../assignments/assignments.routes';
import submissionRoutes from '../submissions/submissions.routes';
import gradingRoutes from '../grading/grading.routes';
import quizRoutes from '../quizzes/quizzes.routes';
import notificationRoutes from '../notifications/notifications.routes';
import aiRoutes from '../ai/ai.routes';

const router = Router();

// Core resources
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/courses', courseRoutes);

// Flat access by id (also reachable nested under /courses/:courseId)
router.use('/modules', moduleRoutes);
router.use('/lessons', lessonRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/submissions', submissionRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/materials', materialRoutes);
router.use('/quizzes', quizRoutes);
router.use('/grading', gradingRoutes);

// Supporting features
router.use('/notifications', notificationRoutes);
router.use('/ai', aiRoutes);

export default router;
