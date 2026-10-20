/**
 * Creates the shared Prisma client used to access the database. Configures connection behavior for the running application.
 */

import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
});
