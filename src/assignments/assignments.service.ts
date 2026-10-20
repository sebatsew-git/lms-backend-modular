/**
 * Implements business operations for A Ss Ig Nm En Ts. Coordinates persistence and related feature services behind the API layer.
 */

import { prisma } from '../database/prisma';
import { NotFoundError } from '../common/errors/AppError';
import { assertEnrolled } from '../enrollments/enrollments.service';

interface CreateAssignmentData {
  title: string;
  description: string;
  dueDate: Date;
  maxPoints?: number;
}

export const createAssignment = async (courseId: string, data: CreateAssignmentData) => {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new NotFoundError('Course not found');

  return prisma.assignment.create({ data: { ...data, courseId } });
};

/**
 * For a student the payload includes their own submission (so the UI can show
 * "submitted / graded"); staff see aggregate counts only.
 */
export const listAssignmentsForCourse = async (courseId: string, studentId?: string) => {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new NotFoundError('Course not found');

  if (studentId) await assertEnrolled(studentId, courseId);

  return prisma.assignment.findMany({
    where: { courseId },
    orderBy: { dueDate: 'asc' },
    include: {
      _count: { select: { submissions: true } },
      ...(studentId
        ? {
            submissions: {
              where: { studentId },
              select: { id: true, status: true, grade: true, submittedAt: true, fileUrl: true },
            },
          }
        : {}),
    },
  });
};

export const getAssignmentById = async (id: string) => {
  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      course: { select: { id: true, title: true, instructorId: true } },
      _count: { select: { submissions: true } },
    },
  });
  if (!assignment) throw new NotFoundError('Assignment not found');
  return assignment;
};

export const updateAssignment = async (id: string, data: Partial<CreateAssignmentData>) => {
  await getAssignmentById(id);
  return prisma.assignment.update({ where: { id }, data });
};

export const deleteAssignment = async (id: string) => {
  await getAssignmentById(id);
  await prisma.assignment.delete({ where: { id } });
  return { id };
};

/** Assignments that are due soon across every course a student is enrolled in. */
export const listUpcomingForStudent = async (studentId: string, withinDays = 14) => {
  const until = new Date(Date.now() + withinDays * 24 * 60 * 60 * 1000);

  return prisma.assignment.findMany({
    where: {
      dueDate: { lte: until },
      course: { enrollments: { some: { studentId, status: 'ACTIVE' } } },
    },
    orderBy: { dueDate: 'asc' },
    include: { course: { select: { id: true, title: true } } },
  });
};
