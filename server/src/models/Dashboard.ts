import mongoose, { Schema, Document } from 'mongoose';
import { tenantScopedPlugin } from '../tenancy/tenantPlugin.js';
import { TenantRepository } from '../tenancy/repository.js';

export interface IWidget {
  id: string;
  type: 'stat_tile' | 'line_chart' | 'bar_chart' | 'table' | 'channel_breakdown' | 'top_skus' | 'retention_cohort';
  title: string;
  metric: 'revenue' | 'expenses' | 'orders' | 'units' | 'uniqueCustomers' | 'profit';
  granularity?: 'hour' | 'day' | 'month';
  gridPos: { x: number; y: number; w: number; h: number };
}

export interface DashboardDocument extends Document {
  orgId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  isDefault: boolean;
  teamId?: mongoose.Types.ObjectId;
  widgets: IWidget[];
  createdAt: Date;
  updatedAt: Date;
}

const WidgetSchema = new Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ['stat_tile', 'line_chart', 'bar_chart', 'table', 'channel_breakdown', 'top_skus', 'retention_cohort'],
      required: true,
    },
    title: { type: String, required: true },
    metric: {
      type: String,
      enum: ['revenue', 'expenses', 'orders', 'units', 'uniqueCustomers', 'profit'],
      required: true,
    },
    granularity: { type: String, enum: ['hour', 'day', 'month'], default: 'day' },
    gridPos: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      w: { type: Number, default: 6 },
      h: { type: Number, default: 4 },
    },
  },
  { _id: false }
);

const DashboardSchema = new Schema<DashboardDocument>(
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
    isDefault: {
      type: Boolean,
      default: false,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
    },
    widgets: {
      type: [WidgetSchema],
      validate: [(val: any[]) => val.length <= 12, 'Maximum 12 widgets per dashboard'],
    },
  },
  {
    timestamps: true,
  }
);

DashboardSchema.index({ orgId: 1, name: 1 });
DashboardSchema.plugin(tenantScopedPlugin);

export const DashboardModel = mongoose.model<DashboardDocument>('Dashboard', DashboardSchema);
export const dashboardRepo = new TenantRepository<DashboardDocument>(DashboardModel);
