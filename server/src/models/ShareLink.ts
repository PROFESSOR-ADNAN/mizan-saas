import mongoose, { Schema, Document } from 'mongoose';
import { tenantScopedPlugin } from '../tenancy/tenantPlugin.js';
import { TenantRepository } from '../tenancy/repository.js';

export interface ShareLinkDocument extends Document {
  orgId: mongoose.Types.ObjectId;
  dashboardId: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date;
  viewCount: number;
  createdAt: Date;
}

const ShareLinkSchema = new Schema<ShareLinkDocument>(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    dashboardId: {
      type: Schema.Types.ObjectId,
      ref: 'Dashboard',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
    revokedAt: {
      type: Date,
      index: true,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

ShareLinkSchema.plugin(tenantScopedPlugin);

export const ShareLinkModel = mongoose.model<ShareLinkDocument>('ShareLink', ShareLinkSchema);
export const shareLinkRepo = new TenantRepository<ShareLinkDocument>(ShareLinkModel);
