import { Router } from 'express';
import * as notificationsController from './notifications.controller';
import { authenticate } from '../auth/guards/authenticate.guard';
import { requirePermission } from '../auth/guards/pbac.guard';
import { validateRequest } from '../common/middlewares/validate.middleware';
import {
  notificationIdSchema,
  listNotificationsSchema,
  broadcastSchema,
} from './notifications.schema';

const router = Router();

// --- Self-service (literal paths before /:id) ---
router.get(
  '/',
  authenticate,
  validateRequest(listNotificationsSchema),
  notificationsController.listNotifications,
);

router.get('/unread-count', authenticate, notificationsController.unreadCount);

router.patch('/read-all', authenticate, notificationsController.markAllAsRead);

// --- Admin broadcast ---
router.post(
  '/broadcast',
  authenticate,
  requirePermission('user:write'),
  validateRequest(broadcastSchema),
  notificationsController.broadcast,
);

router.patch(
  '/:id/read',
  authenticate,
  validateRequest(notificationIdSchema),
  notificationsController.markAsRead,
);

router.delete(
  '/:id',
  authenticate,
  validateRequest(notificationIdSchema),
  notificationsController.deleteNotification,
);

export default router;
