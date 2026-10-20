/**
 * Implements business operations for L Es So Ns. Coordinates persistence and related feature services behind the API layer.
 */

import { prisma } from '../database/prisma';
import { NotFoundError } from '../common/errors/AppError';

interface CreateLessonData {
  moduleId: string;
  title: string;
  content: string;
  order?: number;
  videoUrl?: string;
  duration?: number;
}

export const createLesson = async (data: CreateLessonData) => {
  const module = await prisma.module.findUnique({ where: { id: data.moduleId } });
  if (!module) throw new NotFoundError('Module not found');

  return prisma.lesson.create({ data });
};

export const listLessonsForModule = async (moduleId: string) => {
  const module = await prisma.module.findUnique({ where: { id: moduleId } });
  if (!module) throw new NotFoundError('Module not found');

  return prisma.lesson.findMany({ where: { moduleId }, orderBy: { order: 'asc' } });
};

/** Every lesson of a course, flattened — useful for a course outline / progress bar. */
export const listLessonsForCourse = async (courseId: string) => {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new NotFoundError('Course not found');

  const modules = await prisma.module.findMany({
    where: { courseId },
    orderBy: { order: 'asc' },
    include: { lessons: { orderBy: { order: 'asc' } } },
  });

  return modules.flatMap((m) =>
    m.lessons.map((lesson) => ({ ...lesson, moduleId: m.id, moduleTitle: m.title })),
  );
};

export const getLessonById = async (id: string) => {
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      module: {
        select: { id: true, title: true, courseId: true, course: { select: { id: true, title: true } } },
      },
    },
  });
  if (!lesson) throw new NotFoundError('Lesson not found');
  return lesson;
};

export const updateLesson = async (
  id: string,
  data: Partial<Omit<CreateLessonData, 'moduleId'>>,
) => {
  await getLessonById(id);
  return prisma.lesson.update({ where: { id }, data });
};

export const deleteLesson = async (id: string) => {
  await getLessonById(id);
  await prisma.lesson.delete({ where: { id } });
  return { id };
};
