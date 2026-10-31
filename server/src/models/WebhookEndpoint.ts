import mongoose, { Schema, Document } from 'mongoose';
import { IWebhookEndpoint } from '@mizan/shared';
import { tenantScopedPlugin } from '../tenancy/tenantPlugin.js';
import { TenantRepository } from '../tenancy/repository.js';

export interface WebhookEndpointDocument extends Omit<IWebhookEndpoint, '_id' | 'orgId'>, Document {
  orgId: mongoose.Types.ObjectId;
}

const WebhookEndpointSchema = new Schema<WebhookEndpointDocument>(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    secretEncrypted: {
      type: String,
      required: true,
    },
    events: [
      {
        type: String,
        required: true,
      },
    ],
    enabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    consecutiveFailures: {
      type: Number,
      default: 0,
    },
    lastFailureReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

WebhookEndpointSchema.index({ orgId: 1, url: 1 });
WebhookEndpointSchema.plugin(tenantScopedPlugin);

export const WebhookEndpointModel = mongoose.model<WebhookEndpointDocument>('WebhookEndpoint', WebhookEndpointSchema);
export const webhookEndpointRepo = new TenantRepository<WebhookEndpointDocument>(WebhookEndpointModel);
