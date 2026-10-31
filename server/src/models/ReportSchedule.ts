import mongoose, { Schema, Document } from 'mongoose';
import { tenantScopedPlugin } from '../tenancy/tenantPlugin.js';
import { TenantRepository } from '../tenancy/repository.js';

export interface ReportScheduleDocument extends Document {
  orgId: mongoose.Types.ObjectId;
  name: string;
  cadence: 'weekly' | 'monthly';
  recipients: string[];
  dayOfWeek: number; // 0-6 (0 = Sunday)
  hourUtc: number; // 0-23
  format: 'csv' | 'pdf';
  preferredLanguage: 'en' | 'am';
  lastRunAt?: Date;
  nextRunAt?: Date;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReportScheduleSchema = new Schema<ReportScheduleDocument>(
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
    },
    cadence: {
      type: String,
      enum: ['weekly', 'monthly'],
      default: 'weekly',
    },
    recipients: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
    dayOfWeek: {
      type: Number,
      default: 1, // Monday
    },
    hourUtc: {
      type: Number,
      default: 6, // 09:00 AM Addis Ababa
    },
    format: {
      type: String,
      enum: ['csv', 'pdf'],
      default: 'csv',
    },
    preferredLanguage: {
      type: String,
      enum: ['en', 'am'],
      default: 'en',
    },
    lastRunAt: {
      type: Date,
    },
    nextRunAt: {
      type: Date,
      index: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

ReportScheduleSchema.index({ orgId: 1, enabled: 1 });
ReportScheduleSchema.plugin(tenantScopedPlugin);

export const ReportScheduleModel = mongoose.model<ReportScheduleDocument>('ReportSchedule', ReportScheduleSchema);
export const reportScheduleRepo = new TenantRepository<ReportScheduleDocument>(ReportScheduleModel);
