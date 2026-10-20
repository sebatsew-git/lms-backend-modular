import { Request, Response } from 'express';
import { NotificationType } from '@prisma/client';
import { asyncHandler } from '../common/utils/asyncHandler';
import * as notificationsService from './notifications.service';

export const listNotifications = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, read, type } = req.query as unknown as {
    page: number;
    limit: number;
    read?: boolean;
    type?: NotificationType;
  };

  const result = await notificationsService.listNotifications(req.user!.userId, {
    page,
    limit,
    read,
    type,
  });

  res.json({ success: true, ...result });
});

export const unreadCount = asyncHandler(async (req: Request, res: Response) => {
  const count = await notificationsService.unreadCount(req.user!.userId);
  res.json({ success: true, data: { unread: count } });
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const notification = await notificationsService.markAsRead(req.user!.userId, req.params.id);
  res.json({ success: true, data: notification });
});

export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationsService.markAllAsRead(req.user!.userId);
  res.json({ success: true, data: result });
});

export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationsService.deleteNotification(req.user!.userId, req.params.id);
  res.json({ success: true, data: result });
});

export const broadcast = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationsService.broadcast(req.body);
  res.status(201).json({ success: true, data: result });
});
