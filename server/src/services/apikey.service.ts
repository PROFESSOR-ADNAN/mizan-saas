import { apiKeyRepo, ApiKeyModel } from '../models/ApiKey.js';
import { generateApiKey, sha256 } from '../utils/crypto.js';
import { ApiKeyScope } from '@mizan/shared';
import { redis } from '../config/redis.js';
import { NotFoundError } from '../utils/errors.js';

export class ApiKeyService {
  /**
   * Generates a new API key.
   * Returns plaintext key ONLY ONCE. Plaintext is never saved to DB or logs.
   */
  static async createApiKey(
    orgId: string,
    data: {
      name: string;
      scopes: ApiKeyScope[];
      sourceId?: string;
      expiresInDays?: number;
    }
  ): Promise<{ apiKeyDoc: any; plaintextKey: string }> {
    const { key, keyPrefix, keyHash } = generateApiKey(process.env.NODE_ENV === 'production' ? 'live' : 'test');

    const expiresAt = data.expiresInDays
      ? new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000)
      : undefined;

    const apiKeyDoc = await apiKeyRepo.create(orgId, {
      name: data.name,
      sourceId: data.sourceId as any,
      keyPrefix,
      keyHash,
      scopes: data.scopes,
      expiresAt,
    });

    return {
      apiKeyDoc,
      plaintextKey: key,
    };
  }

  /**
   * Lists all API keys for an organization without sensitive key hashes.
   */
  static async listApiKeys(orgId: string): Promise<any[]> {
    return apiKeyRepo.find(
      orgId,
      {},
      { keyHash: 0 } // Exclude hash from response
    );
  }

  /**
   * Revokes an API key and purges cached entry from Redis.
   */
  static async revokeApiKey(orgId: string, apiKeyId: string, reason = 'Revoked by user'): Promise<void> {
    const keyDoc = await apiKeyRepo.findOne(orgId, { _id: apiKeyId as any });
    if (!keyDoc) {
      throw new NotFoundError('API key not found');
    }

    keyDoc.revokedAt = new Date();
    keyDoc.revokedReason = reason;
    await keyDoc.save();

    // Evict Redis cache
    await redis.del(`apikey:${keyDoc.keyHash}`);
  }
}
