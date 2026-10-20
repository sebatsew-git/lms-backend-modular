/**
 * Handles HTTP requests for A Ss Ig Nm En Ts operations. Delegates business logic to the feature service and formats API responses.
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../common/utils/asyncHandler';
import * as assignmentsService from './assignments.service';

export const createAssignment = asyncHandler(async (req: Request, res: Response) => {
  const assignment = await assignmentsService.createAssignment(req.params.courseId, req.body);
  res.status(201).json({ success: true, data: assignment });
});

export const listAssignments = asyncHandler(async (req: Request, res: Response) => {
  const studentId = req.user?.role === 'STUDENT' ? req.user.userId : undefined;
  const assignments = await assignmentsService.listAssignmentsForCourse(
    req.params.courseId,
    studentId,
  );
  res.json({ success: true, data: assignments });
});

export const upcomingAssignments = asyncHandler(async (req: Request, res: Response) => {
  const withinDays = Number((req.query as { days?: string }).days ?? 14);
  const assignments = await assignmentsService.listUpcomingForStudent(req.user!.userId, withinDays);
  res.json({ success: true, data: assignments });
});

export const getAssignment = asyncHandler(async (req: Request, res: Response) => {
  const assignment = await assignmentsService.getAssignmentById(req.params.id);
  res.json({ success: true, data: assignment });
});

export const updateAssignment = asyncHandler(async (req: Request, res: Response) => {
  const assignment = await assignmentsService.updateAssignment(req.params.id, req.body);
  res.json({ success: true, data: assignment });
});

export const deleteAssignment = asyncHandler(async (req: Request, res: Response) => {
  const result = await assignmentsService.deleteAssignment(req.params.id);
  res.json({ success: true, data: result });
});
