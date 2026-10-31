import mongoose, { Schema, Document } from 'mongoose';
import { ITeamMember } from '@mizan/shared';
import { tenantScopedPlugin } from '../tenancy/tenantPlugin.js';
import { TenantRepository } from '../tenancy/repository.js';

export interface TeamMemberDocument extends Omit<ITeamMember, '_id' | 'orgId' | 'teamId' | 'userId'>, Document {
  orgId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
}

const TeamMemberSchema = new Schema<TeamMemberDocument>(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

TeamMemberSchema.index({ orgId: 1, teamId: 1, userId: 1 }, { unique: true });
TeamMemberSchema.index({ orgId: 1, userId: 1 });
TeamMemberSchema.plugin(tenantScopedPlugin);

export const TeamMemberModel = mongoose.model<TeamMemberDocument>('TeamMember', TeamMemberSchema);
export const teamMemberRepo = new TenantRepository<TeamMemberDocument>(TeamMemberModel);
