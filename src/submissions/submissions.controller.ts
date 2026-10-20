import { Request, Response } from 'express';
import { SubmissionStatus } from '@prisma/client';
import { asyncHandler } from '../common/utils/asyncHandler';
import * as submissionsService from './submissions.service';

export const createSubmission = asyncHandler(async (req: Request, res: Response) => {
  const { content } = req.body as { content?: string };

  const submission = await submissionsService.createSubmission({
    assignmentId: req.params.assignmentId,
    studentId: req.user!.userId,
    content,
    file: req.file,
  });

  res.status(201).json({ success: true, data: submission });
});

export const listSubmissionsForAssignment = asyncHandler(async (req: Request, res: Response) => {
  const submissions = await submissionsService.listSubmissionsForAssignment(
    req.params.assignmentId,
  );
  res.json({ success: true, data: submissions });
});

export const listMySubmissions = asyncHandler(async (req: Request, res: Response) => {
  const { status, assignmentId } = req.query as unknown as {
    status?: SubmissionStatus;
    assignmentId?: string;
  };

  const submissions = await submissionsService.listMySubmissions(req.user!.userId, {
    status,
    assignmentId,
  });

  res.json({ success: true, data: submissions });
});

export const getSubmission = asyncHandler(async (req: Request, res: Response) => {
  const submission = await submissionsService.getSubmissionById(req.params.id);
  res.json({ success: true, data: submission });
});

export const submissionStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await submissionsService.submissionStatsForAssignment(req.params.assignmentId);
  res.json({ success: true, data: stats });
});

export const deleteSubmission = asyncHandler(async (req: Request, res: Response) => {
  const result = await submissionsService.deleteSubmission(req.params.id);
  res.json({ success: true, data: result });
});
