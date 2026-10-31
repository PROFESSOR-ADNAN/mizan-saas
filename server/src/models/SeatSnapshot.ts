import mongoose, { Schema, Document } from 'mongoose';
import { ISeatSnapshot } from '@mizan/shared';
import { tenantScopedPlugin } from '../tenancy/tenantPlugin.js';
import { TenantRepository } from '../tenancy/repository.js';

export interface SeatSnapshotDocument extends Omit<ISeatSnapshot, '_id' | 'orgId'>, Document {
  orgId: mongoose.Types.ObjectId;
}

const SeatSnapshotSchema = new Schema<SeatSnapshotDocument>(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    period: {
      type: String,
      required: true,
      index: true,
    },
    snapshotDate: {
      type: Date,
      required: true,
      index: true,
    },
    activeSeatCount: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

SeatSnapshotSchema.index({ orgId: 1, period: 1, snapshotDate: 1 }, { unique: true });
SeatSnapshotSchema.plugin(tenantScopedPlugin);

export const SeatSnapshotModel = mongoose.model<SeatSnapshotDocument>('SeatSnapshot', SeatSnapshotSchema);
export const seatSnapshotRepo = new TenantRepository<SeatSnapshotDocument>(SeatSnapshotModel);
