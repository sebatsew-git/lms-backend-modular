import { Request, Response } from 'express';
import { asyncHandler } from '../common/utils/asyncHandler';
import * as modulesService from './modules.service';

export const createModule = asyncHandler(async (req: Request, res: Response) => {
  const module = await modulesService.createModule(req.params.courseId, req.body);
  res.status(201).json({ success: true, data: module });
});

export const listModules = asyncHandler(async (req: Request, res: Response) => {
  const modules = await modulesService.listModulesForCourse(req.params.courseId);
  res.json({ success: true, data: modules });
});

export const getModule = asyncHandler(async (req: Request, res: Response) => {
  const module = await modulesService.getModuleById(req.params.id);
  res.json({ success: true, data: module });
});

export const updateModule = asyncHandler(async (req: Request, res: Response) => {
  const module = await modulesService.updateModule(req.params.id, req.body);
  res.json({ success: true, data: module });
});

export const deleteModule = asyncHandler(async (req: Request, res: Response) => {
  const result = await modulesService.deleteModule(req.params.id);
  res.json({ success: true, data: result });
});

export const reorderModules = asyncHandler(async (req: Request, res: Response) => {
  const { order } = req.body as { order: { id: string; order: number }[] };
  const modules = await modulesService.reorderModules(req.params.courseId, order);
  res.json({ success: true, data: modules });
});
