/**
 * Handles HTTP requests for U Se Rs operations. Delegates business logic to the feature service and formats API responses.
 */

import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { asyncHandler } from '../common/utils/asyncHandler';
import * as usersService from './users.service';

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, role, search } = req.query as unknown as {
    page: number;
    limit: number;
    role?: Role;
    search?: string;
  };

  const result = await usersService.listUsers({ page, limit, role, search });
  res.json({ success: true, ...result });
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.getUserById(req.params.id);
  res.json({ success: true, data: user });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.updateUser(req.params.id, req.body);
  res.json({ success: true, data: user });
});

export const updateOwnProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await usersService.updateOwnProfile(req.user!.userId, req.body);
  res.json({ success: true, data: profile });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body as {
    currentPassword: string;
    newPassword: string;
  };

  const result = await usersService.changePassword(req.user!.userId, currentPassword, newPassword);
  res.json({ success: true, data: result });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const result = await usersService.deleteUser(req.params.id);
  res.json({ success: true, data: result });
});
