import { Request, Response } from 'express';
import { asyncHandler } from '../common/utils/asyncHandler';
import * as quizzesService from './quizzes.service';
import { enqueueAiQuizGeneration } from '../jobs/ai.job';

const canSeeAnswers = (role?: string) => role === 'ADMIN' || role === 'INSTRUCTOR';

export const createQuiz = asyncHandler(async (req: Request, res: Response) => {
  const quiz = await quizzesService.createQuiz(req.params.courseId, req.body);
  res.status(201).json({ success: true, data: quiz });
});

export const listQuizzes = asyncHandler(async (req: Request, res: Response) => {
  const quizzes = await quizzesService.listQuizzesForCourse(
    req.params.courseId,
    canSeeAnswers(req.user?.role),
  );
  res.json({ success: true, data: quizzes });
});

export const getQuiz = asyncHandler(async (req: Request, res: Response) => {
  const quiz = await quizzesService.getQuizById(req.params.id, canSeeAnswers(req.user?.role));
  res.json({ success: true, data: quiz });
});

export const updateQuiz = asyncHandler(async (req: Request, res: Response) => {
  const quiz = await quizzesService.updateQuiz(req.params.id, req.body);
  res.json({ success: true, data: quiz });
});

export const deleteQuiz = asyncHandler(async (req: Request, res: Response) => {
  const result = await quizzesService.deleteQuiz(req.params.id);
  res.json({ success: true, data: result });
});

export const addQuestion = asyncHandler(async (req: Request, res: Response) => {
  const question = await quizzesService.addQuestion(req.params.id, req.body);
  res.status(201).json({ success: true, data: question });
});

export const updateQuestion = asyncHandler(async (req: Request, res: Response) => {
  const question = await quizzesService.updateQuestion(req.params.questionId, req.body);
  res.json({ success: true, data: question });
});

export const deleteQuestion = asyncHandler(async (req: Request, res: Response) => {
  const result = await quizzesService.deleteQuestion(req.params.questionId);
  res.json({ success: true, data: result });
});

export const submitAttempt = asyncHandler(async (req: Request, res: Response) => {
  const { answers } = req.body as {
    answers: { questionId: string; selectedIndex: number }[];
  };

  const result = await quizzesService.submitAttempt(req.params.id, req.user!.userId, answers);
  res.status(201).json({ success: true, data: result });
});

export const listAttempts = asyncHandler(async (req: Request, res: Response) => {
  const attempts = await quizzesService.listAttemptsForQuiz(req.params.id);
  res.json({ success: true, data: attempts });
});

export const myAttempts = asyncHandler(async (req: Request, res: Response) => {
  const attempts = await quizzesService.listMyAttempts(req.user!.userId);
  res.json({ success: true, data: attempts });
});

export const quizStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await quizzesService.quizStats(req.params.id);
  res.json({ success: true, data: stats });
});

/** Queues Gemini question generation for a draft quiz. */
export const generateQuestions = asyncHandler(async (req: Request, res: Response) => {
  const { topic, count } = req.body as { topic?: string; count: number };

  const quiz = await quizzesService.getQuizById(req.params.id, true);
  const resolvedTopic = topic ?? quiz.title;

  enqueueAiQuizGeneration(req.params.id, req.user!.userId, resolvedTopic, count);

  res.status(202).json({
    success: true,
    data: { message: 'Generation queued', quizId: req.params.id, topic: resolvedTopic, count },
  });
});
