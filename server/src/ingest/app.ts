import express, { Request, Response } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { pinoHttp } from 'pino-http';
import { logger } from '../utils/logger.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { isDbConnected } from '../config/db.js';
import { isRedisConnected } from '../config/redis.js';

import ingestRoutes from '../routes/ingest.routes.js';

export const ingestApp = express();

ingestApp.disable('x-powered-by');

ingestApp.use(helmet());
ingestApp.use(compression());

// High-volume batch ingestion JSON body parser (256 KB limit)
ingestApp.use(express.json({ limit: '256kb' }));

ingestApp.use(
  pinoHttp({
    logger,
    autoLogging: {
      ignore: (req) => req.url === '/healthz',
    },
  })
);

// Liveness & Readiness Probe
ingestApp.get('/healthz', (_req: Request, res: Response) => {
  const dbOk = isDbConnected();
  const redisOk = isRedisConnected();
  const healthy = dbOk && redisOk;

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    database: dbOk ? 'connected' : 'disconnected',
    redis: redisOk ? 'connected' : 'disconnected',
    service: 'ingest',
    timestamp: new Date().toISOString(),
  });
});

// Ingestion Routes
ingestApp.use('/ingest/v1', ingestRoutes);

// Catch-all 404 handler
ingestApp.use((req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/problem+json');
  res.status(404).json({
    type: 'https://mizan.et/problems/not-found',
    title: 'Not Found',
    status: 404,
    detail: `Cannot ${req.method} ${req.originalUrl}`,
    instance: req.originalUrl,
  });
});

// Central Error Handler
ingestApp.use(errorHandler);
