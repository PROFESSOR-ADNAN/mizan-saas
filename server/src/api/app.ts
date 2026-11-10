import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import { logger } from '../utils/logger.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { shareLinkRateLimiter } from '../middleware/rateLimit.js';
import { DashboardService } from '../services/dashboard.service.js';
import { BillingService } from '../services/billing.service.js';
import { isDbConnected } from '../config/db.js';
import { isRedisConnected } from '../config/redis.js';

import authRoutes from '../routes/auth.routes.js';
import orgRoutes from '../routes/org.routes.js';
import adminRoutes from '../routes/admin.routes.js';

export const apiApp = express();

apiApp.disable('x-powered-by');

// Security & Utility Middlewares
apiApp.use(helmet());

const configuredOrigins = (process.env.WEB_BASE_URL || 'http://localhost:5173')
  .split(',')
  .map((s: string) => s.trim().replace(/\/$/, ''));

apiApp.use(
  cors({
    origin: (origin: any, callback: any) => {
      if (!origin) return callback(null, true);
      const isAllowed =
        configuredOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.onrender.com') ||
        origin.includes('localhost');
      return callback(null, isAllowed ? true : true);
    },
    credentials: true,
  })
);
apiApp.use(compression());
apiApp.use(cookieParser());

// JSON Body Parser with raw body preservation for HMAC verification
apiApp.use(
  express.json({
    limit: '2mb',
    verify: (req: any, _res: any, buf: any) => {
      req.rawBody = buf.toString('utf8');
    },
  })
);

apiApp.use(
  pinoHttp({
    logger,
    autoLogging: {
      ignore: (req: any) => req.url === '/healthz',
    },
  })
);

// Liveness & Readiness Probe
apiApp.get('/healthz', (_req: Request, res: Response) => {
  const dbOk = isDbConnected();
  const redisOk = isRedisConnected();
  const healthy = dbOk && redisOk;

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    database: dbOk ? 'connected' : 'disconnected',
    redis: redisOk ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Chapa Webhook Callback Endpoint (Unauthenticated, verified via HMAC-SHA256)
apiApp.post('/api/v1/billing/chapa-webhook', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = (req.headers['x-chapa-signature'] as string) || '';
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    const verified = await BillingService.handleChapaWebhook(rawBody, signature, req.body);
    if (!verified) {
      res.status(400).json({ status: 'ignored', message: 'Signature or verification failed' });
      return;
    }

    res.status(200).json({ status: 'success', message: 'Webhook processed' });
  } catch (err) {
    next(err);
  }
});

// Public Share Link Route (Sanitized of org details, rate-limited)
apiApp.get('/api/v1/share/:token', shareLinkRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    const data = await DashboardService.getPublicShareData(req.params.token);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
});

// API Routes
apiApp.use('/api/v1/auth', authRoutes);
apiApp.use('/api/v1/orgs', orgRoutes);
apiApp.use('/api/v1/admin', adminRoutes);

// Catch-all 404 handler
apiApp.use((req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/problem+json');
  res.status(404).json({
    type: 'https://mizan.et/problems/not-found',
    title: 'Not Found',
    status: 404,
    detail: `Cannot ${req.method} ${req.originalUrl}`,
    instance: req.originalUrl,
  });
});

// Central Problem Details Error Handler
apiApp.use(errorHandler);
