/**
 * Handles HTTP requests for M At Er Ia Ls operations. Delegates business logic to the feature service and formats API responses.
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../common/utils/asyncHandler';
import * as materialsService from './materials.service';

export const uploadMaterial = asyncHandler(async (req: Request, res: Response) => {
  const material = await materialsService.uploadMaterial({
    courseId: req.params.courseId,
    uploaderId: req.user!.userId,
    title: (req.body as { title?: string }).title,
    file: req.file,
  });

  res.status(201).json({ success: true, data: material });
});

export const listMaterials = asyncHandler(async (req: Request, res: Response) => {
  const materials = await materialsService.listMaterialsForCourse(req.params.courseId);
  res.json({ success: true, data: materials });
});

export const getMaterial = asyncHandler(async (req: Request, res: Response) => {
  const material = await materialsService.getMaterialById(req.params.id);
  res.json({ success: true, data: material });
});

export const deleteMaterial = asyncHandler(async (req: Request, res: Response) => {
  const result = await materialsService.deleteMaterial(req.params.id);
  res.json({ success: true, data: result });
});
