import { Redis } from 'ioredis';
import { config } from './index.js';
import { logger } from '../utils/logger.js';

export const redis = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('connect', () => {
  logger.info({ url: config.REDIS_URL }, 'Redis connected');
});

redis.on('error', (err) => {
  logger.error({ err }, 'Redis connection error');
});

export async function connectRedis(): Promise<Redis> {
  if (redis.status !== 'ready' && redis.status !== 'connecting') {
    await redis.connect();
  }
  return redis;
}

export async function disconnectRedis(): Promise<void> {
  if (redis.status === 'ready') {
    await redis.quit();
  }
}

export function isRedisConnected(): boolean {
  return redis.status === 'ready';
}

// ==========================================
// Redis Domain Helpers
// ==========================================

export async function getQuotaCounter(orgId: string, period: string): Promise<number> {
  const val = await redis.get(`usage:${orgId}:${period}:events`);
  return val ? parseInt(val, 10) : 0;
}

export async function incrQuotaCounter(orgId: string, period: string, delta: number): Promise<number> {
  const key = `usage:${orgId}:${period}:events`;
  const result = await redis.incrby(key, delta);
  // Set 90 day TTL on period keys
  await redis.expire(key, 90 * 86400);
  return result;
}

export async function resetQuotaCounter(orgId: string, period: string, count: number): Promise<void> {
  const key = `usage:${orgId}:${period}:events`;
  await redis.set(key, count, 'EX', 90 * 86400);
}

export async function markDirtyBucket(orgId: string, bucketKey: string): Promise<void> {
  await redis.sadd(`dirty_buckets:${orgId}`, bucketKey);
}

export async function getAndClearDirtyBuckets(orgId: string): Promise<string[]> {
  const key = `dirty_buckets:${orgId}`;
  const buckets = await redis.smembers(key);
  if (buckets.length > 0) {
    await redis.del(key);
  }
  return buckets;
}

export async function getOrgDataVersion(orgId: string): Promise<number> {
  const val = await redis.get(`org:${orgId}:dataVersion`);
  return val ? parseInt(val, 10) : 1;
}

export async function bumpOrgDataVersion(orgId: string): Promise<number> {
  return redis.incr(`org:${orgId}:dataVersion`);
}

export async function setIdempotencyKey(key: string, val: string, ttlSeconds = 86400): Promise<boolean> {
  const res = await redis.set(`idemp:${key}`, val, 'EX', ttlSeconds, 'NX');
  return res === 'OK';
}

export async function getIdempotencyKey(key: string): Promise<string | null> {
  return redis.get(`idemp:${key}`);
}
