# Learning Management System Backend

A feature-oriented REST API for a Learning Management System (LMS), built with
TypeScript, Express, Prisma, and PostgreSQL. It provides course and learning-content
management, enrollments, assignments, submissions and grading, quizzes, notifications,
file uploads, and AI-assisted feedback.

## Contents

- [Features](#features)
- [Technology](#technology)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Environment configuration](#environment-configuration)
- [Available scripts](#available-scripts)
- [API](#api)
- [Authentication and authorization](#authentication-and-authorization)
- [Uploads and background jobs](#uploads-and-background-jobs)
- [Database and seed data](#database-and-seed-data)
- [Testing](#testing)
- [Production notes](#production-notes)

## Features

- Role-based accounts for administrators, instructors, and students
- Registration, login, email verification, Google OAuth, and rotating refresh tokens
- Course catalog, course modules, lessons, and enrollments
- Assignments, student submissions, grading, gradebooks, and grade recomputation
- Quizzes, questions, and server-side attempt scoring
- Course materials and submission file uploads
- In-app notifications and email delivery
- AI-generated quiz content, material summaries, and submission feedback
- Request validation, centralized error handling, rate limiting, and API documentation

## Technology

- **Runtime:** Node.js
- **Language:** TypeScript
- **HTTP:** Express 4
- **Database and ORM:** PostgreSQL and Prisma
- **Validation:** Zod
- **Authentication:** JWT, Argon2, and Passport Google OAuth
- **Files:** Multer with local-disk storage
- **Email:** Nodemailer
- **AI:** Google Generative AI
- **API documentation:** Swagger UI / OpenAPI
- **Tests:** Vitest and Supertest

## Architecture

The code is organized by feature. A feature generally owns its routes, controller,
service, and request schemas. Routes are assembled in `src/routes/index.ts` and
mounted under `/api/v1`.

```text
src/
  auth/           Registration, login, OAuth, token handling, and authorization guards
  users/          User directory and profile management
  courses/        Course catalog and course management
  modules/        Course modules
  lessons/        Lessons and course outlines
  enrollments/    Course enrollment and roster operations
  assignments/    Assignment management and deadlines
  submissions/    Student work and submission operations
  grading/        Grading, gradebooks, and grade recomputation
  quizzes/        Quizzes, questions, and attempts
  materials/      Course learning materials
  notifications/  In-app notifications
  ai/             AI feedback, quiz generation, and summaries
  email/          Email transport, templates, and logging
  jobs/           In-process email and AI work queue
  storage/        Local upload handling
  database/       Prisma client and seed script
  common/         Shared configuration, middleware, errors, types, and utilities
prisma/
  schema.prisma   Database models and enums
  migrations/     Database migration history
tests/            Vitest test suites
```

Features should use other features through their services rather than importing their
controllers, routes, or schemas. Shared infrastructure belongs in `common/` or the
dedicated `database/`, `email/`, `jobs/`, and `storage/` modules.

## Prerequisites

- Node.js and npm
- PostgreSQL
- A Google AI (Gemini) API key for AI features
- SMTP credentials for email delivery

Google OAuth credentials are optional unless you want to use Google sign-in.

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template and edit the values:

   **PowerShell**

   ```powershell
   Copy-Item .env.example .env
   ```

   **macOS / Linux**

   ```bash
   cp .env.example .env
   ```

3. Configure PostgreSQL and the required environment variables in `.env`. See
   [Environment configuration](#environment-configuration).

4. Generate the Prisma client, apply local development migrations, and optionally
   load demo data:

   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   npm run prisma:seed
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

By default, the API listens at `http://localhost:5000`. The health endpoint is
`http://localhost:5000/health`, and interactive API documentation is at
`http://localhost:5000/docs`.

### Demo accounts

The seed script creates these local-development accounts. The password for each is
`Passw0rd!`.

| Role | Email |
| --- | --- |
| Administrator | `admin@lms.dev` |
| Instructor | `instructor@lms.dev` |
| Student | `student@lms.dev` |

These credentials are public development fixtures. Do not use them in a deployed
environment.

## Environment configuration

The application validates its environment at startup. The `.env.example` file is the
configuration template; replace its placeholders with values appropriate for your
environment. Never commit real secrets.

| Variable | Required | Description |
| --- | --- | --- |
| `NODE_ENV` | No | `development`, `production`, or `test`; defaults to `development`. |
| `PORT` | No | HTTP port; defaults to `5000`. |
| `APP_URL` | Yes | Public/base URL for this API, such as `http://localhost:5000`. |
| `CLIENT_URL` | Yes | Allowed frontend origin for CORS, such as `http://localhost:3000`. |
| `DATABASE_URL` | Yes | PostgreSQL connection string used by Prisma. |
| `JWT_ACCESS_SECRET` | Yes | Secret used to sign access tokens; use a strong random value. |
| `JWT_REFRESH_SECRET` | Yes | Secret used to sign refresh tokens; use a separate strong random value. |
| `JWT_ACCESS_EXPIRES_IN` | No | Access-token lifetime; defaults to `15m`. |
| `JWT_REFRESH_EXPIRES_IN` | No | Refresh-token lifetime; defaults to `7d`. |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID. |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret. |
| `GOOGLE_CALLBACK_URL` | No | Google OAuth callback URL. |
| `SMTP_HOST` | Yes | SMTP server hostname. |
| `SMTP_PORT` | Yes | SMTP server port. |
| `SMTP_USER` | Yes | SMTP username. |
| `SMTP_PASS` | Yes | SMTP password. |
| `MAIL_FROM` | Yes | Sender address displayed on outgoing email. |
| `GEMINI_API_KEY` | Yes | API key used by AI features. |
| `UPLOAD_DIR` | No | Local upload directory; defaults to `uploads`. |
| `MAX_FILE_SIZE` | No | Maximum upload size in bytes; defaults to `5242880` (5 MiB). |

Although Google OAuth variables are optional, the SMTP and Gemini variables are
currently required by startup configuration validation. Supply values even if you are
not using those features locally.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the server with `tsx` watch mode. |
| `npm run build` | Compile TypeScript into `dist/`. |
| `npm start` | Run the compiled server from `dist/server.js`. |
| `npm test` | Run the Vitest suite once. |
| `npm run test:watch` | Run Vitest in watch mode. |
| `npm run prisma:generate` | Generate the Prisma client. |
| `npm run prisma:migrate` | Run Prisma development migrations. |
| `npm run prisma:seed` | Seed the database with demo LMS data. |

For production deployments, use Prisma's deploy command to apply committed migrations:

```bash
npx prisma migrate deploy
```

## API

All application routes are mounted under `/api/v1`.

| Resource | Base path | Purpose |
| --- | --- | --- |
| Authentication | `/auth` | Registration, login, refresh, logout, verification, and Google OAuth |
| Users | `/users` | Profiles and user administration |
| Courses | `/courses` | Course catalog and course management |
| Modules | `/modules` | Course module operations |
| Lessons | `/lessons` | Lesson operations and course content |
| Enrollments | `/enrollments` | Student enrollments and course rosters |
| Assignments | `/assignments` | Assignments and upcoming deadlines |
| Submissions | `/submissions` | Student submissions and submission statistics |
| Grading | `/grading` | Grades, bulk grading, and gradebooks |
| Quizzes | `/quizzes` | Quizzes, questions, and attempts |
| Materials | `/materials` | Course files and materials |
| Notifications | `/notifications` | User notifications and broadcasts |
| AI | `/ai` | Feedback, feedback status, and material summaries |

Some course resources are also available through nested course paths. The generated
OpenAPI definition is the authoritative source for endpoint paths, request schemas,
and responses:

- Swagger UI: `GET /docs`
- OpenAPI JSON: `GET /openapi.json`
- Health check: `GET /health`

### Response format

Successful responses use a success envelope:

```json
{
  "success": true,
  "data": {}
}
```

Errors use a consistent error envelope:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload",
    "details": []
  }
}
```

Validation and application errors are handled centrally. Common error codes include
`VALIDATION_ERROR`, `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`,
`CONFLICT`, and `INTERNAL_ERROR`.

## Authentication and authorization

The API uses JWT authentication and role-based permissions for `ADMIN`, `INSTRUCTOR`,
and `STUDENT` users. Access tokens and rotating refresh tokens are issued through the
authentication routes. Refresh-token rotation invalidates a presented token; reuse of
a revoked token revokes its token family.

Permission checks govern actions such as course, assignment, quiz, and grading
management. Attribute-based guards additionally enforce resource ownership for
operations involving courses, submissions, and enrollments. Consult the OpenAPI
documentation and route definitions for the requirements of each endpoint.

## Uploads and background jobs

Files are stored locally in the configured `UPLOAD_DIR` (by default, `uploads/`) and
served under `/uploads`. Upload size is controlled by `MAX_FILE_SIZE`; accepted file
types are restricted by the storage module. Local disk storage is suitable for
development or a single-instance deployment, not shared multi-instance hosting.

AI and email work is handled by an in-process queue with bounded concurrency. Queue
statistics are included in the `/health` response. This queue is not persistent: work
may be lost if the process stops, and separate application instances do not share a
queue.

## Database and seed data

The Prisma schema is in `prisma/schema.prisma`. It defines users and profiles, courses,
modules, lessons, enrollments, assignments, submissions, grades, quizzes, AI feedback,
notifications, and email logs.

For local development, create or update the database with:

```bash
npm run prisma:migrate
```

Load sample users and course content with:

```bash
npm run prisma:seed
```

## Testing

Run the test suite with:

```bash
npm test
```

Vitest uses the Node environment and `tests/setup.ts` to provide test configuration
defaults when importing the application. Tests are located in `tests/`.

## Production notes

- Set `NODE_ENV=production` and use strong, independently generated JWT secrets.
- Configure `APP_URL`, `CLIENT_URL`, PostgreSQL, and SMTP for the deployed environment.
- Use HTTPS/TLS in front of the API. Review cookie and CORS behavior against the
  frontend's deployment origins.
- Do not deploy the seeded demo accounts or their default password.
- Use shared object storage (for example, S3-compatible storage) instead of local disk
  when running multiple API instances.
- Replace the in-process queue with a durable, shared queue when reliability or
  horizontal scaling requires it.
- Apply migrations with `npx prisma migrate deploy` during deployment.
#   L M S - m o d u l a r  
 #   L M S - m o d u l a r  
 