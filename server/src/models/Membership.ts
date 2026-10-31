import mongoose, { Schema, Document } from 'mongoose';
import { IMembership } from '@mizan/shared';
import { tenantScopedPlugin } from '../tenancy/tenantPlugin.js';
import { TenantRepository } from '../tenancy/repository.js';

export interface MembershipDocument extends Omit<IMembership, '_id' | 'orgId' | 'userId'>, Document {
  orgId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
}

const MembershipSchema = new Schema<MembershipDocument>(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'billing', 'analyst', 'viewer'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

MembershipSchema.index({ orgId: 1, userId: 1 }, { unique: true });
MembershipSchema.index({ userId: 1, orgId: 1 });

MembershipSchema.plugin(tenantScopedPlugin);

export const MembershipModel = mongoose.model<MembershipDocument>('Membership', MembershipSchema);
export const membershipRepo = new TenantRepository<MembershipDocument>(MembershipModel);
