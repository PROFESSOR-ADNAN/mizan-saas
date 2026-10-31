import mongoose, { Schema, Document } from 'mongoose';
import { OrgRole } from '@mizan/shared';
import { tenantScopedPlugin } from '../tenancy/tenantPlugin.js';
import { TenantRepository } from '../tenancy/repository.js';

export interface InvitationDocument extends Document {
  orgId: mongoose.Types.ObjectId;
  email: string;
  role: OrgRole;
  tokenHash: string;
  invitedByUserId: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InvitationSchema = new Schema<InvitationDocument>(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['admin', 'billing', 'analyst', 'viewer'],
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    invitedByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'revoked', 'expired'],
      default: 'pending',
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
    acceptedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

InvitationSchema.index({ orgId: 1, email: 1 });
InvitationSchema.plugin(tenantScopedPlugin);

export const InvitationModel = mongoose.model<InvitationDocument>('Invitation', InvitationSchema);
export const invitationRepo = new TenantRepository<InvitationDocument>(InvitationModel);
