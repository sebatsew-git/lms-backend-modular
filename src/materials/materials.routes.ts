/**
 * Defines Express endpoints for M At Er Ia Ls operations. Connects request handlers and applies the relevant authentication or authorization middleware.
 */

import { Router } from 'express';
import * as materialsController from './materials.controller';
import { authenticate } from '../auth/guards/authenticate.guard';
import { requirePermission } from '../auth/guards/pbac.guard';
import { requireCourseOwnership } from '../auth/guards/abac.guard';
import { validateRequest } from '../common/middlewares/validate.middleware';
import { uploadSingle } from '../storage/storage.middleware';
import { uploadMaterialSchema, materialIdSchema, listMaterialsSchema } from './materials.schema';

/** Mounted at `/courses/:courseId/materials` */
export const courseMaterialsRouter = Router({ mergeParams: true });

courseMaterialsRouter.get(
  '/',
  authenticate,
  validateRequest(listMaterialsSchema),
  materialsController.listMaterials,
);

courseMaterialsRouter.post(
  '/',
  authenticate,
  requirePermission('material:write'),
  requireCourseOwnership,
  uploadSingle('file'),
  validateRequest(uploadMaterialSchema),
  materialsController.uploadMaterial,
);

/** Mounted at `/materials` */
const router = Router();

router.get('/:id', authenticate, validateRequest(materialIdSchema), materialsController.getMaterial);

router.delete(
  '/:id',
  authenticate,
  requirePermission('material:write'),
  validateRequest(materialIdSchema),
  materialsController.deleteMaterial,
);

export default router;
