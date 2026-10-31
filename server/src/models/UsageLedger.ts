import mongoose, { Schema, Document } from 'mongoose';
import { IUsageLedger } from '@mizan/shared';
import { tenantScopedPlugin } from '../tenancy/tenantPlugin.js';
import { TenantRepository } from '../tenancy/repository.js';

export interface UsageLedgerDocument extends Omit<IUsageLedger, '_id' | 'orgId'>, Document {
  orgId: mongoose.Types.ObjectId;
}

const UsageLedgerSchema = new Schema<UsageLedgerDocument>(
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
    hourKey: {
      type: String,
      required: true,
      index: true,
    },
    eventsIngested: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

UsageLedgerSchema.index({ orgId: 1, period: 1, hourKey: 1 }, { unique: true });
UsageLedgerSchema.plugin(tenantScopedPlugin);

export const UsageLedgerModel = mongoose.model<UsageLedgerDocument>('UsageLedger', UsageLedgerSchema);
export const usageLedgerRepo = new TenantRepository<UsageLedgerDocument>(UsageLedgerModel);
