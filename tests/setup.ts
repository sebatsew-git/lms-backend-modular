/**
 * Test bootstrap — supplies the environment variables `src/common/config/env.ts`
 * requires so importing the app never triggers `process.exit(1)`.
 * Values already present in the real environment always win.
 */
process.env.NODE_ENV ??= 'test';
process.env.PORT ??= '5000';
process.env.APP_URL ??= 'http://localhost:5000';
process.env.CLIENT_URL ??= 'http://localhost:3000';
process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/lms_test?schema=public';
process.env.JWT_ACCESS_SECRET ??= 'test_access_secret_key_0123456789';
process.env.JWT_REFRESH_SECRET ??= 'test_refresh_secret_key_0123456789';
process.env.JWT_ACCESS_EXPIRES_IN ??= '15m';
process.env.JWT_REFRESH_EXPIRES_IN ??= '7d';
process.env.SMTP_HOST ??= 'localhost';
process.env.SMTP_PORT ??= '2525';
process.env.SMTP_USER ??= 'test_user';
process.env.SMTP_PASS ??= 'test_pass';
process.env.MAIL_FROM ??= 'LMS Platform <no-reply@lms.dev>';
process.env.GEMINI_API_KEY ??= 'test_gemini_key';
process.env.UPLOAD_DIR ??= 'uploads';
process.env.MAX_FILE_SIZE ??= '5242880';
