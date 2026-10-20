import { prisma } from '../database/prisma';
import { NotFoundError, BadRequestError } from '../common/errors/AppError';
import { SubmissionStatus, Prisma } from '@prisma/client';
import { assertEnrolled } from '../enrollments/enrollments.service';
import { buildFileUrl } from '../storage/storage.service';
import { enqueueSubmissionReceipt } from '../jobs/email.job';

interface CreateSubmissionParams {
  assignmentId: string;
  studentId: string;
  content?: string;
  file?: Express.Multer.File;
}

/**
 * Creates — or replaces — the single submission a student may hold per assignment.
 * A submission arriving after `dueDate` is stored with status `LATE`.
 */
export const createSubmission = async (params: CreateSubmissionParams) => {
  const assignment = await prisma.assignment.findUnique({
    where: { id: params.assignmentId },
    include: { course: true },
  });
  if (!assignment) throw new NotFoundError('Assignment not found');

  await assertEnrolled(params.studentId, assignment.courseId);

  if (!params.content && !params.file) {
    throw new BadRequestError('Provide either text content or a file attachment');
  }

  const isLate = new Date() > assignment.dueDate;

  const data = {
    assignmentId: params.assignmentId,
    studentId: params.studentId,
    content: params.content ?? null,
    status: isLate ? SubmissionStatus.LATE : SubmissionStatus.SUBMITTED,
    submittedAt: new Date(),
    ...(params.file
      ? {
          fileUrl: buildFileUrl(params.file.filename),
          fileName: params.file.originalname,
          mimeType: params.file.mimetype,
          fileSize: params.file.size,
        }
      : {}),
  };

  const existing = await prisma.submission.findFirst({
    where: { assignmentId: params.assignmentId, studentId: params.studentId },
  });

  const submission = existing
    ? await prisma.submission.update({ where: { id: existing.id }, data })
    : await prisma.submission.create({ data });

  const student = await prisma.user.findUnique({ where: { id: params.studentId } });
  if (student) {
    enqueueSubmissionReceipt(
      student.email,
      student.firstName,
      assignment.title,
      assignment.course.title,
    );
  }

  return submission;
};

export const listSubmissionsForAssignment = async (assignmentId: string) => {
  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) throw new NotFoundError('Assignment not found');

  return prisma.submission.findMany({
    where: { assignmentId },
    orderBy: { submittedAt: 'desc' },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, email: true } },
      aiFeedback: { select: { id: true, status: true, score: true, summary: true } },
    },
  });
};

export const listMySubmissions = async (
  studentId: string,
  filters: { status?: SubmissionStatus; assignmentId?: string } = {},
) =>
  prisma.submission.findMany({
    where: {
      studentId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.assignmentId ? { assignmentId: filters.assignmentId } : {}),
    },
    orderBy: { submittedAt: 'desc' },
    include: {
      assignment: {
        select: { id: true, title: true, maxPoints: true, courseId: true, dueDate: true },
      },
      aiFeedback: { select: { id: true, status: true, score: true } },
    },
  });

export const getSubmissionById = async (id: string) => {
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, email: true } },
      assignment: {
        include: { course: { select: { id: true, title: true, instructorId: true } } },
      },
      aiFeedback: true,
    },
  });
  if (!submission) throw new NotFoundError('Submission not found');
  return submission;
};

export const deleteSubmission = async (id: string) => {
  await getSubmissionById(id);
  await prisma.submission.delete({ where: { id } });
  return { id };
};

/** Grade statistics for an assignment — handy for an instructor dashboard. */
export const submissionStatsForAssignment = async (assignmentId: string) => {
  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) throw new NotFoundError('Assignment not found');

  const [total, graded, late, aggregate] = await Promise.all([
    prisma.submission.count({ where: { assignmentId } }),
    prisma.submission.count({ where: { assignmentId, status: SubmissionStatus.GRADED } }),
    prisma.submission.count({ where: { assignmentId, status: SubmissionStatus.LATE } }),
    prisma.submission.aggregate({
      where: { assignmentId, grade: { not: null } },
      _avg: { grade: true },
      _min: { grade: true },
      _max: { grade: true },
    }),
  ]);

  return {
    assignmentId,
    total,
    graded,
    late,
    pending: total - graded,
    average: aggregate._avg.grade ?? null,
    min: aggregate._min.grade ?? null,
    max: aggregate._max.grade ?? null,
  };
};
