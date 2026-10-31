import mongoose, { Schema, Document } from 'mongoose';
import { IWebhookDelivery } from '@mizan/shared';
import { tenantScopedPlugin } from '../tenancy/tenantPlugin.js';
import { TenantRepository } from '../tenancy/repository.js';

export interface WebhookDeliveryDocument extends Omit<IWebhookDelivery, '_id' | 'orgId' | 'endpointId'>, Document {
  orgId: mongoose.Types.ObjectId;
  endpointId: mongoose.Types.ObjectId;
}

const WebhookDeliverySchema = new Schema<WebhookDeliveryDocument>(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    endpointId: {
      type: Schema.Types.ObjectId,
      ref: 'WebhookEndpoint',
      required: true,
      index: true,
    },
    eventId: {
      type: String,
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    statusCode: {
      type: Number,
    },
    durationMs: {
      type: Number,
    },
    responseBodySnippet: {
      type: String,
      maxlength: 1000,
    },
    attempt: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ['pending', 'delivered', 'failed', 'aborted_security_violation'],
      default: 'pending',
      index: true,
    },
    nextRetryAt: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

WebhookDeliverySchema.index({ orgId: 1, createdAt: -1 });
WebhookDeliverySchema.plugin(tenantScopedPlugin);

export const WebhookDeliveryModel = mongoose.model<WebhookDeliveryDocument>('WebhookDelivery', WebhookDeliverySchema);
export const webhookDeliveryRepo = new TenantRepository<WebhookDeliveryDocument>(WebhookDeliveryModel);
