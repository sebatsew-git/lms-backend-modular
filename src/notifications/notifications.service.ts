/**
 * Implements business operations for N Ot If Ic At Io Ns. Coordinates persistence and related feature services behind the API layer.
 */

import { prisma } from '../database/prisma';
import { NotFoundError } from '../common/errors/AppError';
import { NotificationType, Prisma } from '@prisma/client';
import { enqueueNotificationEmail } from '../jobs/email.job';

interface CreateNotificationData {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  metadata?: Prisma.InputJsonValue;
}

export const createNotification = async (data: CreateNotificationData) =>
  prisma.notification.create({
    data: {
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type ?? NotificationType.GENERAL,
      metadata: data.metadata,
    },
  });

export const listNotifications = async (
  userId: string,
  params: { page: number; limit: number; read?: boolean; type?: NotificationType },
) => {
  const where: Prisma.NotificationWhereInput = { userId };
  if (params.read !== undefined) where.read = params.read;
  if (params.type) where.type = params.type;

  const skip = (params.page - 1) * params.limit;

  const [items, total, unread] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: params.limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);

  return {
    items,
    unread,
    meta: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.limit)),
    },
  };
};

export const unreadCount = async (userId: string) =>
  prisma.notification.count({ where: { userId, read: false } });

export const markAsRead = async (userId: string, id: string) => {
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== userId) {
    throw new NotFoundError('Notification not found');
  }

  return prisma.notification.update({ where: { id }, data: { read: true } });
};

export const markAllAsRead = async (userId: string) => {
  const { count } = await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
  return { updated: count };
};

export const deleteNotification = async (userId: string, id: string) => {
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== userId) {
    throw new NotFoundError('Notification not found');
  }

  await prisma.notification.delete({ where: { id } });
  return { id };
};

export const broadcast = async (params: {
  userIds: string[];
  title: string;
  message: string;
  type?: NotificationType;
  metadata?: Prisma.InputJsonValue;
  sendEmail?: boolean;
}) => {
  const created = await prisma.$transaction(
    params.userIds.map((userId) =>
      prisma.notification.create({
        data: {
          userId,
          title: params.title,
          message: params.message,
          type: params.type ?? NotificationType.GENERAL,
          metadata: params.metadata,
        },
      }),
    ),
  );

  if (params.sendEmail) {
    const users = await prisma.user.findMany({
      where: { id: { in: params.userIds } },
      select: { email: true, firstName: true },
    });

    for (const user of users) {
      enqueueNotificationEmail(user.email, user.firstName, params.title, params.message);
    }
  }

  return { created: created.length, ids: created.map((n) => n.id) };
};

// ---------- Domain-specific helpers (called by other modules) ----------

export const notifyEnrollment = async (userId: string, courseId: string, courseTitle: string) =>
  createNotification({
    userId,
    type: NotificationType.ENROLLMENT,
    title: 'Enrollment confirmed',
    message: `You are now enrolled in "${courseTitle}".`,
    metadata: { courseId },
  });

export const notifyGradePublished = async (
  userId: string,
  assignmentTitle: string,
  grade: number,
  maxPoints: number,
) => {
  const percentage = maxPoints > 0 ? Math.round((grade / maxPoints) * 10000) / 100 : 0;

  return createNotification({
    userId,
    type: NotificationType.GRADE,
    title: 'Grade published',
    message: `Your grade for "${assignmentTitle}" is ${grade}/${maxPoints} (${percentage}%).`,
    metadata: { assignmentTitle, grade, maxPoints, percentage },
  });
};

export const notifyAiFeedbackReady = async (submissionId: string, summary: string) => {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { assignment: { select: { title: true } }, student: { select: { id: true } } },
  });
  if (!submission) return null;

  return createNotification({
    userId: submission.studentId,
    type: NotificationType.AI_FEEDBACK,
    title: 'AI feedback is ready',
    message: `Feedback for "${submission.assignment.title}" has been generated: ${summary}`,
    metadata: { submissionId },
  });
};
