import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { sha256, validateApiKeyChecksum } from '../utils/crypto.js';
import { ApiKeyModel } from '../models/ApiKey.js';
import { OrganizationModel } from '../models/Organization.js';
import { redis } from '../config/redis.js';
import { ApiKeyScope } from '@mizan/shared';
import { logger } from '../utils/logger.js';

export interface ApiKeyContext {
  id: string;
  orgId: string;
  sourceId?: string;
  scopes: ApiKeyScope[];
  rateLimitPerSec: number;
}

declare global {
  namespace Express {
    interface Request {
      apiKey?: ApiKeyContext;
    }
  }
}

export function requireApiKey(requiredScope?: ApiKeyScope) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('API key is required in Authorization header');
    }

    const key = authHeader.substring(7).trim();

    // 1. Fast CRC32 checksum validation (fail fast without DB/cache hit)
    if (!validateApiKeyChecksum(key)) {
      throw new UnauthorizedError('Malformed or invalid API key format');
    }

    const keyHash = sha256(key);
    const cacheKey = `apikey:${keyHash}`;

    try {
      let keyData: ApiKeyContext | null = null;
      const cached = await redis.get(cacheKey);

      if (cached) {
        keyData = JSON.parse(cached);
      } else {
        // Query database (using platform escape hatch since we are authenticating the tenant)
        const doc = await ApiKeyModel.findOne(
          { keyHash, revokedAt: { $exists: false } },
          null,
          { unscopedForPlatformJob: true, platformJobName: 'api_key_auth' } as any
        );

        if (!doc) {
          throw new UnauthorizedError('Invalid or revoked API key');
        }

        if (doc.expiresAt && doc.expiresAt.getTime() < Date.now()) {
          throw new UnauthorizedError('API key has expired');
        }

        // Verify organization is active
        const org = await OrganizationModel.findById(doc.orgId);
        if (!org || org.status === 'deleted') {
          throw new UnauthorizedError('Organization does not exist');
        }

        keyData = {
          id: doc._id.toString(),
          orgId: doc.orgId.toString(),
          sourceId: doc.sourceId?.toString(),
          scopes: doc.scopes as ApiKeyScope[],
          rateLimitPerSec: doc.rateLimitPerSec || 30,
        };

        // Cache for 30 seconds
        await redis.set(cacheKey, JSON.stringify(keyData), 'EX', 30);
      }

      if (!keyData) {
        throw new UnauthorizedError('API key authentication failed');
      }

      // Check required scope
      if (requiredScope && !keyData.scopes.includes(requiredScope)) {
        throw new ForbiddenError(`API key lacks required scope: ${requiredScope}`);
      }

      req.apiKey = keyData;
      req.orgId = keyData.orgId;

      // Asynchronously update last used time and IP
      ApiKeyModel.updateOne(
        { _id: keyData.id },
        { $set: { lastUsedAt: new Date(), lastUsedIp: req.ip } },
        { unscopedForPlatformJob: true, platformJobName: 'api_key_touch' } as any
      ).catch((err) => logger.warn({ err }, 'Failed to touch API key lastUsedAt'));

      next();
    } catch (err) {
      next(err);
    }
  };
}
