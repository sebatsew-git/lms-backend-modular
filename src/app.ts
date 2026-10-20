/**
 * Creates and configures the Express application. Registers middleware, API routes, health checks, and API documentation.
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './common/config/env';
import routes from './routes';
import { errorHandler, notFoundHandler } from './common/middlewares/error.middleware';
import { uploadRoot } from './storage/storage.service';
import { queueStats } from './jobs/queue';

const app = express();

// ---------- Security ----------
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // let /uploads be embedded
  }),
);
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));

// ---------- Parsers ----------
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ---------- Logging ----------
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ---------- Static uploads ----------
app.use('/uploads', express.static(uploadRoot, { maxAge: '1d' }));

// ---------- Rate limiting ----------
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many auth attempts' } },
});

app.use('/api', apiLimiter);
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);

// ---------- Health ----------
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    jobs: queueStats(),
    timestamp: new Date().toISOString(),
  });
});

// ---------- API docs ----------
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'LMS API',
      version: '1.0.0',
      description: 'AI-Powered Learning Management System — modular REST API',
    },
    servers: [{ url: `${env.APP_URL}/api/v1` }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/**/*.routes.ts'],
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/openapi.json', (_req, res) => res.json(swaggerSpec));

// ---------- Routes ----------
app.use('/api/v1', routes);

// ---------- Errors ----------
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
