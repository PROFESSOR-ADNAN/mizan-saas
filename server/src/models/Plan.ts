import mongoose, { Schema, Document } from 'mongoose';
import { PlanConfig } from '@mizan/shared';

export interface PlanDocument extends Omit<PlanConfig, 'id'>, Document {
  planId: string;
}

const PlanSchema = new Schema<PlanDocument>(
  {
    planId: {
      type: String,
      enum: ['free', 'starter', 'business'],
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    version: {
      type: Number,
      required: true,
      default: 1,
    },
    basePriceSantim: {
      type: Number,
      required: true,
      min: 0,
    },
    includedEvents: {
      type: Number,
      required: true,
      min: 0,
    },
    includedSeats: {
      type: Number,
      required: true,
      min: 1,
    },
    extraSeatPriceSantim: {
      type: Number,
      required: true,
      min: 0,
    },
    overagePricePerThousandSantim: {
      type: Number,
      required: true,
      min: 0,
    },
    rawRetentionDays: {
      type: Number,
      required: true,
      min: 1,
    },
    rollupRetentionDays: {
      type: Number,
      required: true,
      min: 1,
    },
    apiRateLimitPerSec: {
      type: Number,
      required: true,
      min: 1,
    },
    maxCustomProps: {
      type: Number,
      default: 20,
    },
    spendCapSupported: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

PlanSchema.index({ planId: 1, version: 1 }, { unique: true });

export const PlanModel = mongoose.model<PlanDocument>('Plan', PlanSchema);
