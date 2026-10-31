import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis.js';
import { RateLimitError } from '../utils/errors.js';

export function rateLimit(options: {
  windowSeconds: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  errorMessage?: string;
}) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const keyPrefix = options.keyGenerator
      ? options.keyGenerator(req)
      : `ip:${req.ip}`;

    const redisKey = `ratelimit:${keyPrefix}`;

    try {
      const current = await redis.incr(redisKey);
      if (current === 1) {
        await redis.expire(redisKey, options.windowSeconds);
      }

      const ttl = await redis.ttl(redisKey);

      res.setHeader('X-RateLimit-Limit', options.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, options.maxRequests - current));
      res.setHeader('X-RateLimit-Reset', ttl > 0 ? ttl : options.windowSeconds);

      if (current > options.maxRequests) {
        res.setHeader('Retry-After', ttl > 0 ? ttl : options.windowSeconds);
        throw new RateLimitError(
          options.errorMessage || 'Too many requests, please try again later.'
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

export const authRateLimiter = rateLimit({
  windowSeconds: 60,
  maxRequests: 10,
  errorMessage: 'Too many authentication attempts. Please wait 1 minute before retrying.',
});

export const apiRateLimiter = rateLimit({
  windowSeconds: 60,
  maxRequests: 300,
  keyGenerator: (req) => (req.user ? `user:${req.user.userId}` : `ip:${req.ip}`),
});

export const shareLinkRateLimiter = rateLimit({
  windowSeconds: 60,
  maxRequests: 60,
  keyGenerator: (req) => `share:${req.ip}`,
});
