import type { Request, Response } from 'express';
import { connectDb } from '../src/config/db.js';
import { connectRedis } from '../src/config/redis.js';
import { apiApp } from '../src/api/app.js';
import { logger } from '../src/utils/logger.js';

let initialized = false;

/**
 * Vercel Serverless Function entry point for Mizan Management REST API.
 * Automatically connects to MongoDB & Redis on cold start.
 */
export default async function handler(req: Request, res: Response) {
  if (!initialized) {
    try {
      if (process.env.MONGODB_URI) {
        await connectDb();
      }
      if (process.env.REDIS_URL) {
        await connectRedis();
      }
      initialized = true;
    } catch (err) {
      logger.error({ err }, 'Error initializing database in Vercel serverless function');
    }
  }

  return apiApp(req, res);
}
