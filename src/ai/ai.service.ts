import { Prisma } from '@prisma/client';
import { geminiModel } from '../common/config/ai';
import { prisma } from '../database/prisma';
import { NotFoundError, BadRequestError } from '../common/errors/AppError';
import { AiTaskStatus, QuizStatus } from '@prisma/client';
import { buildFeedbackPrompt } from './prompts/feedback.prompt';
import { buildQuizPrompt, buildSummaryPrompt } from './prompts/quiz.prompt';

interface FeedbackPayload {
  summary: string;
  strengths: string[];
  improvements: string[];
  score: number;
}

interface QuizPayload {
  questions: {
    prompt: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
    points?: number;
  }[];
}

interface SummaryPayload {
  summary: string;
  bullets: string[];
  keywords: string[];
}

/** Gemini is configured for `application/json`, but models still wrap output in fences. */
const parseJson = <T>(raw: string): T => {
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/, '').trim();
  return JSON.parse(cleaned) as T;
};

export const generateAiFeedback = async (
  submissionId: string,
  userId: string,
  options: { tone?: 'encouraging' | 'neutral' | 'strict'; includeScore?: boolean } = {},
) => {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { assignment: { include: { course: true } } },
  });
  if (!submission) throw new NotFoundError('Submission not found');

  await prisma.aiFeedback.upsert({
    where: { submissionId },
    create: { submissionId, userId, status: AiTaskStatus.PROCESSING },
    update: { status: AiTaskStatus.PROCESSING, errorMessage: null },
  });

  try {
    const prompt = buildFeedbackPrompt({
      courseTitle: submission.assignment.course.title,
      assignmentTitle: submission.assignment.title,
      assignmentDescription: submission.assignment.description,
      maxPoints: submission.assignment.maxPoints,
      submissionText: submission.content ?? '',
      tone: options.tone,
      includeScore: options.includeScore,
    });

    const result = await geminiModel.generateContent(prompt);
    const parsed = parseJson<FeedbackPayload>(result.response.text());

    const rawScore = typeof parsed.score === 'number' ? parsed.score : null;
    const score =
      rawScore === null
        ? null
        : Math.max(0, Math.min(submission.assignment.maxPoints, Math.round(rawScore * 100) / 100));

    return prisma.aiFeedback.update({
      where: { submissionId },
      data: {
        status: AiTaskStatus.COMPLETED,
        summary: parsed.summary ?? null,
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
        score,
        rawResponse: parsed as unknown as Prisma.InputJsonValue,
      },
    });
  } catch (err) {
    return prisma.aiFeedback.update({
      where: { submissionId },
      data: {
        status: AiTaskStatus.FAILED,
        errorMessage: err instanceof Error ? err.message : 'Unknown AI error',
      },
    });
  }
};

export const getFeedbackForSubmission = async (submissionId: string) => {
  const feedback = await prisma.aiFeedback.findUnique({ where: { submissionId } });
  if (!feedback) throw new NotFoundError('No AI feedback found for this submission');
  return feedback;
};

/** Appends generated questions to a quiz, preserving any questions already present. */
export const generateAiQuiz = async (
  quizId: string,
  userId: string,
  topic: string,
  count: number,
) => {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { course: { select: { title: true } } },
  });
  if (!quiz) throw new NotFoundError('Quiz not found');

  const prompt = buildQuizPrompt({
    courseTitle: quiz.course.title,
    quizTitle: quiz.title,
    topic,
    count,
  });

  const result = await geminiModel.generateContent(prompt);
  const parsed = parseJson<QuizPayload>(result.response.text());

  const questions = (parsed.questions ?? []).filter(
    (q) => Array.isArray(q.options) && q.options.length >= 2 && q.correctIndex < q.options.length,
  );

  if (questions.length === 0) throw new BadRequestError('The model returned no usable questions');

  await prisma.$transaction(
    questions.map((q) =>
      prisma.question.create({
        data: {
          quizId,
          prompt: q.prompt,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          points: q.points ?? 1,
        },
      }),
    ),
  );

  // A quiz that only just got its first questions stays a draft until published deliberately.
  if (quiz.status === QuizStatus.ARCHIVED) {
    await prisma.quiz.update({ where: { id: quizId }, data: { status: QuizStatus.DRAFT } });
  }

  return { quizId, userId, topic, created: questions.length };
};

/** Ad-hoc material summariser — not persisted, used by the study-assistant endpoint. */
export const summarizeMaterial = async (text: string, maxBullets: number) => {
  const prompt = buildSummaryPrompt({ text, maxBullets });

  const result = await geminiModel.generateContent(prompt);
  const parsed = parseJson<SummaryPayload>(result.response.text());

  return {
    summary: parsed.summary ?? '',
    bullets: Array.isArray(parsed.bullets) ? parsed.bullets.slice(0, maxBullets) : [],
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
  };
};

export const listFeedbackForUser = async (userId: string, limit = 20) =>
  prisma.aiFeedback.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      submission: {
        select: { id: true, assignment: { select: { id: true, title: true } } },
      },
    },
  });
