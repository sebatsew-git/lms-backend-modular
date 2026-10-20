/**
 * Starts the LMS HTTP server using the configured application. Initializes shared services and handles graceful process shutdown.
 */

import app from './app';
import { env } from './common/config/env';
import { prisma } from './database/prisma';
import { queue } from './jobs/queue';

const bootstrap = async () => {
  await prisma.$connect();
  console.log('✅ Database connected');

  const server = app.listen(env.PORT, () => {
    console.log(`🚀 LMS API listening on ${env.APP_URL} (env: ${env.NODE_ENV})`);
    console.log(`📚 Swagger docs: ${env.APP_URL}/docs`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received — shutting down gracefully…`);

    server.close(async () => {
      try {
        // Let in-flight queued jobs (emails, AI calls) finish before exiting.
        await queue.onIdle();
      } catch (err) {
        console.warn('Queue did not drain cleanly:', err);
      }
      await prisma.$disconnect();
      console.log('👋 Closed. Bye!');
      process.exit(0);
    });

    // Hard exit if graceful shutdown hangs.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  (['SIGINT', 'SIGTERM'] as const).forEach((signal) => {
    process.on(signal, () => void shutdown(signal));
  });

  process.on('unhandledRejection', (reason) => {
    console.error('💥 Unhandled rejection:', reason);
  });

  process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught exception:', err);
    process.exit(1);
  });
};

void bootstrap().catch(async (err) => {
  console.error('❌ Failed to start server:', err);
  await prisma.$disconnect();
  process.exit(1);
});
