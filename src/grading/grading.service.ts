import { prisma } from '../database/prisma';
import { NotFoundError, BadRequestError } from '../common/errors/AppError';
import { SubmissionStatus } from '@prisma/client';
import { getSubmissionById } from '../submissions/submissions.service';
import { recomputeCourseGrade } from '../enrollments/enrollments.service';
import { notifyGradePublished } from '../notifications/notifications.service';

/**
 * Applies a grade, notifies the student, and refreshes the derived
 * `Enrollment.grade` for that course — all in one call.
 */
export const gradeSubmission = async (params: {
  submissionId: string;
  grade: number;
  feedback?: string;
  notifyStudent?: boolean;
}) => {
  const submission = await getSubmissionById(params.submissionId);
  const maxPoints = submission.assignment.maxPoints;

  if (params.grade > maxPoints) {
    throw new BadRequestError(`Grade cannot exceed the assignment maximum of ${maxPoints}`);
  }

  const updated = await prisma.submission.update({
    where: { id: params.submissionId },
    data: {
      grade: params.grade,
      feedback: params.feedback,
      status: SubmissionStatus.GRADED,
    },
  });

  const courseId = submission.assignment.course.id;
  const courseGrade = await recomputeCourseGrade(submission.studentId, courseId);

  if (params.notifyStudent !== false) {
    await notifyGradePublished(
      submission.studentId,
      submission.assignment.title,
      params.grade,
      maxPoints,
    );
  }

  return { submission: updated, courseGrade: courseGrade?.grade ?? null };
};

export const bulkGrade = async (params: {
  items: { submissionId: string; grade: number; feedback?: string }[];
  notifyStudent?: boolean;
}) => {
  const results: { submissionId: string; ok: boolean; error?: string }[] = [];

  for (const item of params.items) {
    try {
      await gradeSubmission({
        submissionId: item.submissionId,
        grade: item.grade,
        feedback: item.feedback,
        notifyStudent: params.notifyStudent,
      });
      results.push({ submissionId: item.submissionId, ok: true });
    } catch (err) {
      results.push({
        submissionId: item.submissionId,
        ok: false,
        error: err instanceof Error ? err.message : 'Unknown grading error',
      });
    }
  }

  return {
    total: results.length,
    succeeded: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  };
};

/** Every graded submission in a course, with student + assignment context. */
export const listCourseGrades = async (courseId: string) => {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new NotFoundError('Course not found');

  return prisma.submission.findMany({
    where: { assignment: { courseId } },
    orderBy: [{ assignment: { dueDate: 'asc' } }, { submittedAt: 'desc' }],
    include: {
      student: { select: { id: true, firstName: true, lastName: true, email: true } },
      assignment: { select: { id: true, title: true, maxPoints: true } },
      aiFeedback: { select: { status: true, score: true } },
    },
  });
};

/** Gradebook: one row per enrolled student with their submissions. */
export const courseGradebook = async (courseId: string) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      assignments: { orderBy: { dueDate: 'asc' }, select: { id: true, title: true, maxPoints: true } },
      enrollments: {
        orderBy: { enrolledAt: 'asc' },
        include: {
          student: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      },
    },
  });
  if (!course) throw new NotFoundError('Course not found');

  const submissions = await prisma.submission.findMany({
    where: { assignment: { courseId } },
    select: { id: true, studentId: true, assignmentId: true, grade: true, status: true },
  });

  const rows = course.enrollments.map((enrollment) => {
    const cells = course.assignments.map((assignment) => {
      const found = submissions.find(
        (s) => s.studentId === enrollment.studentId && s.assignmentId === assignment.id,
      );
      return {
        assignmentId: assignment.id,
        maxPoints: assignment.maxPoints,
        submissionId: found?.id ?? null,
        grade: found?.grade ?? null,
        status: found?.status ?? null,
      };
    });

    return {
      student: enrollment.student,
      enrollmentId: enrollment.id,
      courseGrade: enrollment.grade,
      enrollmentStatus: enrollment.status,
      cells,
    };
  });

  return { courseId, assignments: course.assignments, rows };
};
