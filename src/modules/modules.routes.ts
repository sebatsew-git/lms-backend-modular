import { Router } from 'express';
import * as modulesController from './modules.controller';
import { authenticate } from '../auth/guards/authenticate.guard';
import { requirePermission } from '../auth/guards/pbac.guard';
import { requireCourseOwnership } from '../auth/guards/abac.guard';
import { validateRequest } from '../common/middlewares/validate.middleware';
import {
  createModuleSchema,
  moduleIdSchema,
  updateModuleSchema,
  reorderModulesSchema,
} from './modules.schema';

/** Mounted at `/courses/:courseId/modules` */
export const courseModulesRouter = Router({ mergeParams: true });

courseModulesRouter.get('/', authenticate, modulesController.listModules);

courseModulesRouter.post(
  '/',
  authenticate,
  requirePermission('module:write'),
  validateRequest(createModuleSchema),
  requireCourseOwnership,
  modulesController.createModule,
);

courseModulesRouter.patch(
  '/reorder',
  authenticate,
  requirePermission('module:write'),
  validateRequest(reorderModulesSchema),
  requireCourseOwnership,
  modulesController.reorderModules,
);

/** Mounted at `/modules` — flat access by module id */
const router = Router();

router.get('/:id', authenticate, validateRequest(moduleIdSchema), modulesController.getModule);

router.patch(
  '/:id',
  authenticate,
  requirePermission('module:write'),
  validateRequest(updateModuleSchema),
  modulesController.updateModule,
);

router.delete(
  '/:id',
  authenticate,
  requirePermission('module:write'),
  validateRequest(moduleIdSchema),
  modulesController.deleteModule,
);

export default router;
