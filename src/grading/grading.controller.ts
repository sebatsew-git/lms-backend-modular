import { Request, Response } from 'express';
import { asyncHandler } from '../common/utils/asyncHandler';
import * as gradingService from './grading.service';
import { recomputeCourseGrade } from '../enrollments/enrollments.service';

export const gradeSubmission = asyncHandler(async (req: Request, res: Response) => {
  const { grade, feedback, notifyStudent } = req.body as {
    grade: number;
    feedback?: string;
    notifyStudent: boolean;
  };

  const result = await gradingService.gradeSubmission({
    submissionId: req.params.id,
    grade,
    feedback,
    notifyStudent,
  });

  res.json({ success: true, data: result });
});

export const bulkGrade = asyncHandler(async (req: Request, res: Response) => {
  const { items, notifyStudent } = req.body as {
    items: { submissionId: string; grade: number; feedback?: string }[];
    notifyStudent: boolean;
  };

  const result = await gradingService.bulkGrade({ items, notifyStudent });
  res.json({ success: true, data: result });
});

export const listCourseGrades = asyncHandler(async (req: Request, res: Response) => {
  const grades = await gradingService.listCourseGrades(req.params.courseId);
  res.json({ success: true, data: grades });
});

export const courseGradebook = asyncHandler(async (req: Request, res: Response) => {
  const gradebook = await gradingService.courseGradebook(req.params.courseId);
  res.json({ success: true, data: gradebook });
});

export const recomputeStudentGrade = asyncHandler(async (req: Request, res: Response) => {
  const enrollment = await recomputeCourseGrade(req.params.studentId, req.params.courseId);
  res.json({ success: true, data: enrollment });
});
