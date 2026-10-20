import { prisma } from '../database/prisma';
import { NotFoundError, BadRequestError, ForbiddenError } from '../common/errors/AppError';
import { QuizStatus, Prisma } from '@prisma/client';
import { assertEnrolled } from '../enrollments/enrollments.service';

export const createQuiz = async (
  courseId: string,
  data: { title: string; description?: string },
) => {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new NotFoundError('Course not found');

  return prisma.quiz.create({ data: { ...data, courseId } });
};

/**
 * `includeAnswers` strips `correctIndex`/`explanation` so students cannot read
 * the answer key from the network response.
 */
export const listQuizzesForCourse = async (courseId: string, includeAnswers: boolean) => {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new NotFoundError('Course not found');

  const quizzes = await prisma.quiz.findMany({
    where: { courseId, ...(includeAnswers ? {} : { status: QuizStatus.PUBLISHED }) },
    orderBy: { createdAt: 'desc' },
    include: {
      questions: includeAnswers
        ? { orderBy: { createdAt: 'asc' } }
        : { orderBy: { createdAt: 'asc' }, select: { id: true, prompt: true, options: true, points: true } },
      _count: { select: { questions: true, attempts: true } },
    },
  });

  return quizzes;
};

export const getQuizById = async (id: string, includeAnswers: boolean) => {
  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      course: { select: { id: true, title: true, instructorId: true } },
      questions: includeAnswers
        ? { orderBy: { createdAt: 'asc' } }
        : { orderBy: { createdAt: 'asc' }, select: { id: true, prompt: true, options: true, points: true } },
      _count: { select: { attempts: true } },
    },
  });
  if (!quiz) throw new NotFoundError('Quiz not found');
  return quiz;
};

export const updateQuiz = async (
  id: string,
  data: { title?: string; description?: string; status?: QuizStatus },
) => {
  await getQuizById(id, true);
  return prisma.quiz.update({ where: { id }, data });
};

export const deleteQuiz = async (id: string) => {
  await getQuizById(id, true);
  await prisma.quiz.delete({ where: { id } });
  return { id };
};

export const addQuestion = async (
  quizId: string,
  data: {
    prompt: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
    points?: number;
  },
) => {
  await getQuizById(quizId, true);

  if (data.correctIndex >= data.options.length) {
    throw new BadRequestError('correctIndex must point at one of the provided options');
  }

  return prisma.question.create({ data: { ...data, quizId } });
};

export const updateQuestion = async (
  questionId: string,
  data: Partial<{
    prompt: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    points: number;
  }>,
) => {
  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) throw new NotFoundError('Question not found');

  const optionCount = data.options?.length ?? question.options.length;
  const correctIndex = data.correctIndex ?? question.correctIndex;
  if (correctIndex >= optionCount) {
    throw new BadRequestError('correctIndex must point at one of the provided options');
  }

  return prisma.question.update({ where: { id: questionId }, data });
};

export const deleteQuestion = async (questionId: string) => {
  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) throw new NotFoundError('Question not found');

  await prisma.question.delete({ where: { id: questionId } });
  return { id: questionId };
};

/** Grades an attempt server-side; the client never submits a score. */
export const submitAttempt = async (
  quizId: string,
  studentId: string,
  answers: { questionId: string; selectedIndex: number }[],
) => {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: true },
  });
  if (!quiz) throw new NotFoundError('Quiz not found');
  if (quiz.status !== QuizStatus.PUBLISHED) {
    throw new ForbiddenError('This quiz is not published yet');
  }

  await assertEnrolled(studentId, quiz.courseId);

  const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);
  let earned = 0;

  const reviewed = quiz.questions.map((question) => {
    const answer = answers.find((a) => a.questionId === question.id);
    const selectedIndex = answer?.selectedIndex ?? -1;
    const correct = selectedIndex === question.correctIndex;
    if (correct) earned += question.points;

    return {
      questionId: question.id,
      prompt: question.prompt,
      selectedIndex,
      correctIndex: question.correctIndex,
      correct,
      explanation: question.explanation,
      points: question.points,
    };
  });

  const score = totalPoints > 0 ? Math.round((earned / totalPoints) * 10000) / 100 : 0;

  const attempt = await prisma.quizAttempt.create({
    data: {
      quizId,
      studentId,
      answers: answers as unknown as Prisma.InputJsonValue,
      score,
    },
  });

  return { attempt, score, earned, totalPoints, reviewed };
};

export const listAttemptsForQuiz = async (quizId: string) => {
  await getQuizById(quizId, true);

  return prisma.quizAttempt.findMany({
    where: { quizId },
    orderBy: { completedAt: 'desc' },
    include: { student: { select: { id: true, firstName: true, lastName: true, email: true } } },
  });
};

export const listMyAttempts = async (studentId: string) =>
  prisma.quizAttempt.findMany({
    where: { studentId },
    orderBy: { completedAt: 'desc' },
    include: { quiz: { select: { id: true, title: true, courseId: true } } },
  });

export const quizStats = async (quizId: string) => {
  await getQuizById(quizId, true);

  const aggregate = await prisma.quizAttempt.aggregate({
    where: { quizId },
    _avg: { score: true },
    _min: { score: true },
    _max: { score: true },
    _count: { _all: true },
  });

  return {
    quizId,
    attempts: aggregate._count._all,
    average: aggregate._avg.score ?? null,
    min: aggregate._min.score ?? null,
    max: aggregate._max.score ?? null,
  };
};
