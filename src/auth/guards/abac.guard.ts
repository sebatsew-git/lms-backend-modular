import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, NotFoundError } from '../../common/errors/AppError';
import { prisma } from '../../database/prisma';

export const requireCourseOwnership = async (req: Request, _res: Response, next: NextFunction) => {
  const user = req.user;
  const courseId = req.params.id ?? req.params.courseId;
  if (!user) return next(new ForbiddenError('Not authenticated'));

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return next(new NotFoundError('Course not found'));

  if (user.role !== 'ADMIN' && course.instructorId !== user.userId) {
    return next(new ForbiddenError('You do not own this resource'));
  }
  next();
};

export const requireSubmissionOwnership = async (req: Request, _res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) return next(new ForbiddenError('Not authenticated'));

  const submission = await prisma.submission.findUnique({ where: { id: req.params.id } });
  if (!submission) return next(new NotFoundError('Submission not found'));

  const isOwner = submission.studentId === user.userId;
  const isStaff = ['INSTRUCTOR', 'ADMIN'].includes(user.role);

  if (!isOwner && !isStaff) return next(new ForbiddenError('You cannot modify this submission'));
  next();
};

export const requireEnrollmentOwnership = async (req: Request, _res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) return next(new ForbiddenError('Not authenticated'));

  const enrollment = await prisma.enrollment.findUnique({ where: { id: req.params.id } });
  if (!enrollment) return next(new NotFoundError('Enrollment not found'));

  if (user.role !== 'ADMIN' && enrollment.studentId !== user.userId) {
    return next(new ForbiddenError('Not your enrollment'));
  }
  next();
};
