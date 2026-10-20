/**
 * Defines permissions assigned to each LMS role. Centralizes the authorization matrix used by route guards.
 */

import { Role } from '@prisma/client';

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  ADMIN: [
    'user:read', 'user:write',
    'course:read', 'course:write',
    'module:write', 'lesson:write',
    'assignment:read', 'assignment:write',
    'submission:read', 'submission:grade',
    'quiz:read', 'quiz:write',
    'material:write',
    'ai:use',
  ],
  INSTRUCTOR: [
    'course:read', 'course:write',
    'module:write', 'lesson:write',
    'assignment:read', 'assignment:write',
    'submission:read', 'submission:grade',
    'quiz:read', 'quiz:write',
    'material:write',
    'ai:use',
  ],
  STUDENT: [
    'course:read',
    'assignment:read',
    'submission:read', 'submission:create',
    'quiz:read', 'quiz:attempt',
    'ai:use',
  ],
};
