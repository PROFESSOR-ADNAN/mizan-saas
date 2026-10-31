import mongoose, { Schema, Document } from 'mongoose';
import { ISubscription } from '@mizan/shared';
import { tenantScopedPlugin } from '../tenancy/tenantPlugin.js';
import { TenantRepository } from '../tenancy/repository.js';

export interface SubscriptionDocument extends Omit<ISubscription, '_id' | 'orgId'>, Document {
  orgId: mongoose.Types.ObjectId;
}

const SubscriptionSchema = new Schema<SubscriptionDocument>(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      unique: true,
      index: true,
    },
    planId: {
      type: String,
      enum: ['free', 'starter', 'business'],
      required: true,
      default: 'free',
    },
    planVersion: {
      type: Number,
      required: true,
      default: 1,
    },
    status: {
      type: String,
      enum: ['trialing', 'active', 'past_due', 'suspended', 'canceled', 'free'],
      required: true,
      default: 'free',
      index: true,
    },
    currentPeriodStart: {
      type: Date,
      required: true,
      default: Date.now,
    },
    currentPeriodEnd: {
      type: Date,
      required: true,
    },
    trialEndsAt: {
      type: Date,
    },
    canceledAt: {
      type: Date,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

SubscriptionSchema.plugin(tenantScopedPlugin);

export const SubscriptionModel = mongoose.model<SubscriptionDocument>('Subscription', SubscriptionSchema);
export const subscriptionRepo = new TenantRepository<SubscriptionDocument>(SubscriptionModel);
