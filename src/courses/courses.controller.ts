/**
 * Handles HTTP requests for C Ou Rs Es operations. Delegates business logic to the feature service and formats API responses.
 */

import { Request, Response } from 'express';
import { CourseStatus } from '@prisma/client';
import { asyncHandler } from '../common/utils/asyncHandler';
import * as coursesService from './courses.service';

export const createCourse = asyncHandler(async (req: Request, res: Response) => {
  const course = await coursesService.createCourse(req.user!.userId, req.body);
  res.status(201).json({ success: true, data: course });
});

export const listCourses = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, status, search, mine } = req.query as unknown as {
    page: number;
    limit: number;
    status?: CourseStatus;
    search?: string;
    mine?: boolean;
  };

  const result = await coursesService.listCourses({
    page,
    limit,
    status,
    search,
    mine,
    role: req.user?.role,
    userId: req.user?.userId,
  });

  res.json({ success: true, ...result });
});

export const getCourse = asyncHandler(async (req: Request, res: Response) => {
  const course = await coursesService.getCourseById(req.params.id);
  res.json({ success: true, data: course });
});

export const updateCourse = asyncHandler(async (req: Request, res: Response) => {
  const course = await coursesService.updateCourse(req.params.id, req.body);
  res.json({ success: true, data: course });
});

export const deleteCourse = asyncHandler(async (req: Request, res: Response) => {
  const result = await coursesService.deleteCourse(req.params.id);
  res.json({ success: true, data: result });
});
