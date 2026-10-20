import { Router } from 'express';
import * as usersController from './users.controller';
import { authenticate } from '../auth/guards/authenticate.guard';
import { requirePermission } from '../auth/guards/pbac.guard';
import { validateRequest } from '../common/middlewares/validate.middleware';
import {
  userIdSchema,
  listUsersSchema,
  updateUserSchema,
  updateProfileSchema,
  changePasswordSchema,
} from './users.schema';

const router = Router();

// --- Self-service (declared before /:id so they are not shadowed) ---
router.get('/me', authenticate, usersController.getUser);
router.patch(
  '/me/profile',
  authenticate,
  validateRequest(updateProfileSchema),
  usersController.updateOwnProfile,
);
router.patch(
  '/me/password',
  authenticate,
  validateRequest(changePasswordSchema),
  usersController.changePassword,
);

// --- Admin only ---
router.get(
  '/',
  authenticate,
  requirePermission('user:read'),
  validateRequest(listUsersSchema),
  usersController.listUsers,
);

router.get(
  '/:id',
  authenticate,
  requirePermission('user:read'),
  validateRequest(userIdSchema),
  usersController.getUser,
);

router.patch(
  '/:id',
  authenticate,
  requirePermission('user:write'),
  validateRequest(updateUserSchema),
  usersController.updateUser,
);

router.delete(
  '/:id',
  authenticate,
  requirePermission('user:write'),
  validateRequest(userIdSchema),
  usersController.deleteUser,
);

export default router;
