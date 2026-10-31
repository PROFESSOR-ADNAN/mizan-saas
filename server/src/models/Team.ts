import mongoose, { Schema, Document } from 'mongoose';
import { ITeam } from '@mizan/shared';
import { tenantScopedPlugin } from '../tenancy/tenantPlugin.js';
import { TenantRepository } from '../tenancy/repository.js';

export interface TeamDocument extends Omit<ITeam, '_id' | 'orgId'>, Document {
  orgId: mongoose.Types.ObjectId;
}

const TeamSchema = new Schema<TeamDocument>(
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
    description: {
      type: String,
      maxlength: 300,
    },
    dataSourceIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'DataSource',
      },
    ],
    dashboardIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Dashboard',
      },
    ],
  },
  {
    timestamps: true,
  }
);

TeamSchema.index({ orgId: 1, name: 1 }, { unique: true });
TeamSchema.plugin(tenantScopedPlugin);

export const TeamModel = mongoose.model<TeamDocument>('Team', TeamSchema);
export const teamRepo = new TenantRepository<TeamDocument>(TeamModel);
