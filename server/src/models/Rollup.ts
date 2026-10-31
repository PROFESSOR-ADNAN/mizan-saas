import mongoose, { Schema, Document } from 'mongoose';
import { IRollup } from '@mizan/shared';
import { tenantScopedPlugin } from '../tenancy/tenantPlugin.js';
import { TenantRepository } from '../tenancy/repository.js';

export interface RollupDocument extends Omit<IRollup, '_id' | 'orgId'>, Document {
  orgId: mongoose.Types.ObjectId;
}

const RollupSchema = new Schema<RollupDocument>(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    bucketStart: {
      type: Date,
      required: true,
      index: true,
    },
    granularity: {
      type: String,
      enum: ['hour', 'day'],
      required: true,
    },
    revenueSantim: {
      type: Number,
      default: 0,
    },
    expensesSantim: {
      type: Number,
      default: 0,
    },
    ordersCount: {
      type: Number,
      default: 0,
    },
    unitsCount: {
      type: Number,
      default: 0,
    },
    uniqueCustomersCount: {
      type: Number,
      default: 0,
    },
    channelBreakdown: {
      type: Map,
      of: Number,
      default: {},
    },
    topSkus: [
      {
        sku: { type: String, required: true },
        units: { type: Number, required: true },
        revenueSantim: { type: Number, required: true },
      },
    ],
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

RollupSchema.index({ orgId: 1, bucketStart: 1 }, { unique: true });
RollupSchema.plugin(tenantScopedPlugin);

export const RollupHourlyModel = mongoose.model<RollupDocument>('RollupHourly', RollupSchema, 'rollupsHourly');
export const rollupHourlyRepo = new TenantRepository<RollupDocument>(RollupHourlyModel);

export const RollupDailyModel = mongoose.model<RollupDocument>('RollupDaily', RollupSchema, 'rollupsDaily');
export const rollupDailyRepo = new TenantRepository<RollupDocument>(RollupDailyModel);
