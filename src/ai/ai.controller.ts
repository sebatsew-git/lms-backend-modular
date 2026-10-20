import { Request, Response } from 'express';
import { asyncHandler } from '../common/utils/asyncHandler';
import * as aiService from './ai.service';
import { enqueueAiFeedback } from '../jobs/ai.job';

/**
 * Queues feedback generation and returns 202 immediately — the client polls
 * `GET /ai/feedback/:submissionId` until `status` is COMPLETED or FAILED.
 */
export const generateFeedback = asyncHandler(async (req: Request, res: Response) => {
  const body = (req.body ?? {}) as {
    tone?: 'encouraging' | 'neutral' | 'strict';
    includeScore?: boolean;
  };

  enqueueAiFeedback(req.params.submissionId, req.user!.userId);

  res.status(202).json({
    success: true,
    data: {
      message: 'Feedback generation queued',
      submissionId: req.params.submissionId,
      options: { tone: body.tone ?? 'encouraging', includeScore: body.includeScore ?? true },
    },
  });
});

/** Synchronous variant — awaits Gemini and returns the finished feedback. */
export const generateFeedbackSync = asyncHandler(async (req: Request, res: Response) => {
  const body = (req.body ?? {}) as {
    tone?: 'encouraging' | 'neutral' | 'strict';
    includeScore?: boolean;
  };

  const feedback = await aiService.generateAiFeedback(
    req.params.submissionId,
    req.user!.userId,
    body,
  );

  res.status(feedback.status === 'COMPLETED' ? 201 : 502).json({ success: true, data: feedback });
});

export const getFeedback = asyncHandler(async (req: Request, res: Response) => {
  const feedback = await aiService.getFeedbackForSubmission(req.params.submissionId);
  res.json({ success: true, data: feedback });
});

export const myFeedback = asyncHandler(async (req: Request, res: Response) => {
  const limit = Number((req.query as { limit?: string }).limit ?? 20);
  const feedback = await aiService.listFeedbackForUser(req.user!.userId, limit);
  res.json({ success: true, data: feedback });
});

export const summarize = asyncHandler(async (req: Request, res: Response) => {
  const { text, maxBullets } = req.body as { text: string; maxBullets: number };
  const result = await aiService.summarizeMaterial(text, maxBullets);
  res.json({ success: true, data: result });
});
