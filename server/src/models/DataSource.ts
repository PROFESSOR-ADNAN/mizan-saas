import mongoose, { Schema, Document } from 'mongoose';
import { IDataSource } from '@mizan/shared';
import { tenantScopedPlugin } from '../tenancy/tenantPlugin.js';
import { TenantRepository } from '../tenancy/repository.js';

export interface DataSourceDocument extends Omit<IDataSource, '_id' | 'orgId'>, Document {
  orgId: mongoose.Types.ObjectId;
}

const DataSourceSchema = new Schema<DataSourceDocument>(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    type: {
      type: String,
      enum: ['pos', 'telegram', 'web', 'manual', 'csv'],
      default: 'pos',
    },
    description: {
      type: String,
      maxlength: 300,
    },
  },
  {
    timestamps: true,
  }
);

DataSourceSchema.index({ orgId: 1, name: 1 });
DataSourceSchema.plugin(tenantScopedPlugin);

export const DataSourceModel = mongoose.model<DataSourceDocument>('DataSource', DataSourceSchema);
export const dataSourceRepo = new TenantRepository<DataSourceDocument>(DataSourceModel);
