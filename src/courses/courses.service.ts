import { prisma } from '../database/prisma';
import { NotFoundError } from '../common/errors/AppError';
import { CourseStatus, Prisma } from '@prisma/client';

const instructorSelect = {
  select: { id: true, firstName: true, lastName: true, avatarUrl: true },
};

export const createCourse = async (
  instructorId: string,
  data: { title: string; description: string; thumbnail?: string },
) => prisma.course.create({ data: { ...data, instructorId } });

export const listCourses = async (params: {
  page: number;
  limit: number;
  status?: CourseStatus;
  search?: string;
  role?: string;
  userId?: string;
  mine?: boolean;
}) => {
  const where: Prisma.CourseWhereInput = {};

  // Only staff may see drafts/archived; students and anonymous visitors see published only.
  const isStaff = params.role === 'ADMIN' || params.role === 'INSTRUCTOR';
  if (isStaff) {
    if (params.status) where.status = params.status;
  } else {
    where.status = CourseStatus.PUBLISHED;
  }

  if (params.mine && params.userId) where.instructorId = params.userId;

  if (params.search) {
    where.OR = [
      { title: { contains: params.search, mode: 'insensitive' } },
      { description: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  const skip = (params.page - 1) * params.limit;

  const [items, total] = await Promise.all([
    prisma.course.findMany({
      where,
      skip,
      take: params.limit,
      orderBy: { createdAt: 'desc' },
      include: {
        instructor: instructorSelect,
        _count: { select: { modules: true, enrollments: true, assignments: true, quizzes: true } },
      },
    }),
    prisma.course.count({ where }),
  ]);

  return {
    items,
    meta: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.limit)),
    },
  };
};

export const getCourseById = async (id: string) => {
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      instructor: instructorSelect,
      modules: {
        orderBy: { order: 'asc' },
        include: { lessons: { orderBy: { order: 'asc' } } },
      },
      assignments: { orderBy: { dueDate: 'asc' } },
      quizzes: { select: { id: true, title: true, status: true } },
      materials: { orderBy: { createdAt: 'desc' } },
      _count: { select: { enrollments: true } },
    },
  });
  if (!course) throw new NotFoundError('Course not found');
  return course;
};

export const updateCourse = async (
  id: string,
  data: Partial<{
    title: string;
    description: string;
    thumbnail: string;
    status: CourseStatus;
  }>,
) => {
  await assertCourseExists(id);
  return prisma.course.update({ where: { id }, data });
};

export const deleteCourse = async (id: string) => {
  await assertCourseExists(id);
  await prisma.course.delete({ where: { id } });
  return { id };
};

export const assertCourseExists = async (id: string) => {
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) throw new NotFoundError('Course not found');
  return course;
};
