/**
 * Root-level seed entry point.
 *
 * The seed logic lives in `src/database/seed.ts` — that is what `npm run prisma:seed`
 * executes. This shim exists so the conventional `npx prisma db seed` and
 * `npx tsx prisma/seed.ts` invocations also work from the repository root.
 */
import '../src/database/seed';
