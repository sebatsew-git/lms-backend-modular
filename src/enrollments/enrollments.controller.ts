import { Request, Response } from 'express';
import { EnrollmentStatus } from '@prisma/client';
import { asyncHandler } from '../common/utils/asyncHandler';
import * as enrollmentsService from './enrollments.service';

export const enroll = asyncHandler(async (req: Request, res: Response) => {
  const enrollment = await enrollmentsService.enrollStudent(req.user!.userId, req.params.courseId);
  res.status(201).json({ success: true, data: enrollment });
});

export const myEnrollments = asyncHandler(async (req: Request, res: Response) => {
  const enrollments = await enrollmentsService.listStudentEnrollments(req.user!.userId);
  res.json({ success: true, data: enrollments });
});

export const courseEnrollments = asyncHandler(async (req: Request, res: Response) => {
  const enrollments = await enrollmentsService.listCourseEnrollments(req.params.courseId);
  res.json({ success: true, data: enrollments });
});

export const getEnrollment = asyncHandler(async (req: Request, res: Response) => {
  const enrollment = await enrollmentsService.getEnrollmentById(req.params.id);
  res.json({ success: true, data: enrollment });
});

export const updateEnrollment = asyncHandler(async (req: Request, res: Response) => {
  const { status, grade } = req.body as { status?: EnrollmentStatus; grade?: number };
  const enrollment = await enrollmentsService.updateEnrollment(req.params.id, { status, grade });
  res.json({ success: true, data: enrollment });
});

export const dropEnrollment = asyncHandler(async (req: Request, res: Response) => {
  const enrollment = await enrollmentsService.dropEnrollment(req.user!.userId, req.params.courseId);
  res.json({ success: true, data: enrollment });
});
