import mongoose, { Schema, Document } from 'mongoose';
import { tenantScopedPlugin } from '../tenancy/tenantPlugin.js';
import { TenantRepository } from '../tenancy/repository.js';

export interface ImportJobDocument extends Document {
  orgId: mongoose.Types.ObjectId;
  sourceId: mongoose.Types.ObjectId;
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRows: number;
  processedRows: number;
  acceptedCount: number;
  duplicateCount: number;
  errorCount: number;
  errorReportStoragePath?: string;
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

const ImportJobSchema = new Schema<ImportJobDocument>(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    sourceId: {
      type: Schema.Types.ObjectId,
      ref: 'DataSource',
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    totalRows: {
      type: Number,
      default: 0,
    },
    processedRows: {
      type: Number,
      default: 0,
    },
    acceptedCount: {
      type: Number,
      default: 0,
    },
    duplicateCount: {
      type: Number,
      default: 0,
    },
    errorCount: {
      type: Number,
      default: 0,
    },
    errorReportStoragePath: {
      type: String,
    },
    errorMessage: {
      type: String,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

ImportJobSchema.index({ orgId: 1, createdAt: -1 });
ImportJobSchema.plugin(tenantScopedPlugin);

export const ImportJobModel = mongoose.model<ImportJobDocument>('ImportJob', ImportJobSchema);
export const importJobRepo = new TenantRepository<ImportJobDocument>(ImportJobModel);
