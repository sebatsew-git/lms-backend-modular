/**
 * Implements business operations for M Od Ul Es. Coordinates persistence and related feature services behind the API layer.
 */

import { prisma } from '../database/prisma';
import { NotFoundError } from '../common/errors/AppError';

export const createModule = async (
  courseId: string,
  data: { title: string; order?: number },
) => {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new NotFoundError('Course not found');

  return prisma.module.create({ data: { ...data, courseId } });
};

export const listModulesForCourse = async (courseId: string) => {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new NotFoundError('Course not found');

  return prisma.module.findMany({
    where: { courseId },
    orderBy: { order: 'asc' },
    include: {
      lessons: { orderBy: { order: 'asc' } },
      _count: { select: { lessons: true } },
    },
  });
};

export const getModuleById = async (id: string) => {
  const module = await prisma.module.findUnique({
    where: { id },
    include: {
      course: { select: { id: true, title: true, instructorId: true } },
      lessons: { orderBy: { order: 'asc' } },
    },
  });
  if (!module) throw new NotFoundError('Module not found');
  return module;
};

export const updateModule = async (id: string, data: { title?: string; order?: number }) => {
  await getModuleById(id);
  return prisma.module.update({ where: { id }, data });
};

export const deleteModule = async (id: string) => {
  await getModuleById(id);
  await prisma.module.delete({ where: { id } });
  return { id };
};

/** Applies a batch of `{ id, order }` pairs inside one transaction. */
export const reorderModules = async (
  courseId: string,
  order: { id: string; order: number }[],
) => {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new NotFoundError('Course not found');

  await prisma.$transaction(
    order.map(({ id, order: position }) =>
      prisma.module.update({ where: { id }, data: { order: position } }),
    ),
  );

  return listModulesForCourse(courseId);
};
