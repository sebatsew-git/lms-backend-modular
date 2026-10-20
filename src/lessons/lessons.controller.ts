/**
 * Handles HTTP requests for L Es So Ns operations. Delegates business logic to the feature service and formats API responses.
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../common/utils/asyncHandler';
import * as lessonsService from './lessons.service';

export const createLesson = asyncHandler(async (req: Request, res: Response) => {
  const lesson = await lessonsService.createLesson(req.body);
  res.status(201).json({ success: true, data: lesson });
});

export const listCourseLessons = asyncHandler(async (req: Request, res: Response) => {
  const lessons = await lessonsService.listLessonsForCourse(req.params.courseId);
  res.json({ success: true, data: lessons });
});

export const listModuleLessons = asyncHandler(async (req: Request, res: Response) => {
  const lessons = await lessonsService.listLessonsForModule(req.params.moduleId);
  res.json({ success: true, data: lessons });
});

export const getLesson = asyncHandler(async (req: Request, res: Response) => {
  const lesson = await lessonsService.getLessonById(req.params.id);
  res.json({ success: true, data: lesson });
});

export const updateLesson = asyncHandler(async (req: Request, res: Response) => {
  const lesson = await lessonsService.updateLesson(req.params.id, req.body);
  res.json({ success: true, data: lesson });
});

export const deleteLesson = asyncHandler(async (req: Request, res: Response) => {
  const result = await lessonsService.deleteLesson(req.params.id);
  res.json({ success: true, data: result });
});
