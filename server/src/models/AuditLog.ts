import mongoose, { Schema, Document } from 'mongoose';
import { IAuditLog } from '@mizan/shared';
import { tenantScopedPlugin } from '../tenancy/tenantPlugin.js';
import { TenantRepository } from '../tenancy/repository.js';

export interface AuditLogDocument extends Omit<IAuditLog, '_id' | 'orgId'>, Document {
  orgId: mongoose.Types.ObjectId;
}

const AuditLogSchema = new Schema<AuditLogDocument>(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    actorId: {
      type: String,
      required: true,
      index: true,
    },
    actorEmail: {
      type: String,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      required: true,
    },
    targetId: {
      type: String,
    },
    details: {
      type: Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

AuditLogSchema.index({ orgId: 1, createdAt: -1 });
AuditLogSchema.plugin(tenantScopedPlugin);

export const AuditLogModel = mongoose.model<AuditLogDocument>('AuditLog', AuditLogSchema);
export const auditLogRepo = new TenantRepository<AuditLogDocument>(AuditLogModel);
