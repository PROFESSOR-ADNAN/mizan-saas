import mongoose, { Schema, Document } from 'mongoose';
import { IApiKey } from '@mizan/shared';
import { tenantScopedPlugin } from '../tenancy/tenantPlugin.js';
import { TenantRepository } from '../tenancy/repository.js';

export interface ApiKeyDocument extends Omit<IApiKey, '_id' | 'orgId' | 'sourceId'>, Document {
  orgId: mongoose.Types.ObjectId;
  sourceId?: mongoose.Types.ObjectId;
}

const ApiKeySchema = new Schema<ApiKeyDocument>(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    sourceId: {
      type: Schema.Types.ObjectId,
      ref: 'DataSource',
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    keyPrefix: {
      type: String,
      required: true,
      index: true,
    },
    keyHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    scopes: [
      {
        type: String,
        enum: ['ingest:write', 'data:read'],
      },
    ],
    rateLimitPerSec: {
      type: Number,
      default: 30,
    },
    lastUsedAt: {
      type: Date,
    },
    lastUsedIp: {
      type: String,
    },
    expiresAt: {
      type: Date,
    },
    revokedAt: {
      type: Date,
      index: true,
    },
    revokedReason: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

ApiKeySchema.index({ orgId: 1, keyPrefix: 1 });
ApiKeySchema.plugin(tenantScopedPlugin);

export const ApiKeyModel = mongoose.model<ApiKeyDocument>('ApiKey', ApiKeySchema);
export const apiKeyRepo = new TenantRepository<ApiKeyDocument>(ApiKeyModel);
