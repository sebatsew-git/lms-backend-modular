import { prisma } from '../database/prisma';
import { NotFoundError, ConflictError, ForbiddenError } from '../common/errors/AppError';
import { CourseStatus, EnrollmentStatus, Prisma } from '@prisma/client';

const studentSelect = {
  select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
};

export const enrollStudent = async (studentId: string, courseId: string) => {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new NotFoundError('Course not found');
  if (course.status !== CourseStatus.PUBLISHED) {
    throw new ForbiddenError('You can only enroll in published courses');
  }

  const existing = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
  });
  if (existing) throw new ConflictError('Already enrolled in this course');

  return prisma.enrollment.create({
    data: { studentId, courseId },
    include: { course: { select: { id: true, title: true } } },
  });
};

export const listStudentEnrollments = async (studentId: string) =>
  prisma.enrollment.findMany({
    where: { studentId },
    orderBy: { enrolledAt: 'desc' },
    include: {
      course: {
        include: {
          instructor: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { modules: true, assignments: true, quizzes: true } },
        },
      },
    },
  });

export const listCourseEnrollments = async (courseId: string) => {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new NotFoundError('Course not found');

  return prisma.enrollment.findMany({
    where: { courseId },
    orderBy: { enrolledAt: 'asc' },
    include: { student: studentSelect },
  });
};

export const getEnrollmentById = async (id: string) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id },
    include: {
      student: studentSelect,
      course: { select: { id: true, title: true, instructorId: true } },
    },
  });
  if (!enrollment) throw new NotFoundError('Enrollment not found');
  return enrollment;
};

export const updateEnrollment = async (
  id: string,
  data: { status?: EnrollmentStatus; grade?: number },
) => {
  await getEnrollmentById(id);
  return prisma.enrollment.update({ where: { id }, data });
};

export const dropEnrollment = async (studentId: string, courseId: string) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
  });
  if (!enrollment) throw new NotFoundError('Enrollment not found');

  return prisma.enrollment.update({
    where: { id: enrollment.id },
    data: { status: EnrollmentStatus.DROPPED },
  });
};

export const isEnrolled = async (studentId: string, courseId: string) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
  });
  return Boolean(enrollment) && enrollment!.status !== EnrollmentStatus.DROPPED;
};

export const assertEnrolled = async (studentId: string, courseId: string) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
  });
  if (!enrollment) throw new ForbiddenError('You are not enrolled in this course');
  return enrollment;
};

/**
 * Recomputes `Enrollment.grade` as the percentage of graded submissions
 * (sum of awarded points ÷ sum of max points). Called after every grading action.
 */
export const recomputeCourseGrade = async (studentId: string, courseId: string) => {
  const submissions = await prisma.submission.findMany({
    where: {
      studentId,
      grade: { not: null },
      assignment: { courseId },
    },
    include: { assignment: { select: { maxPoints: true } } },
  });

  if (submissions.length === 0) {
    return prisma.enrollment.findUnique({ where: { studentId_courseId: { studentId, courseId } } });
  }

  const awarded = submissions.reduce((sum, s) => sum + (s.grade ?? 0), 0);
  const possible = submissions.reduce((sum, s) => sum + s.assignment.maxPoints, 0);
  const percentage = possible > 0 ? Math.round((awarded / possible) * 10000) / 100 : 0;

  return prisma.enrollment.update({
    where: { studentId_courseId: { studentId, courseId } },
    data: { grade: percentage },
  });
};
