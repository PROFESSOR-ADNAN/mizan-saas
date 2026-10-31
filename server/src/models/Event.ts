import mongoose, { Schema, Document } from 'mongoose';
import { IEvent } from '@mizan/shared';
import { tenantScopedPlugin } from '../tenancy/tenantPlugin.js';
import { TenantRepository } from '../tenancy/repository.js';

export interface EventDocument extends Omit<IEvent, '_id' | 'orgId' | 'sourceId'>, Document {
  orgId: mongoose.Types.ObjectId;
  sourceId: mongoose.Types.ObjectId;
}

const EventItemSchema = new Schema(
  {
    sku: { type: String, required: true, trim: true, maxlength: 100 },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    qty: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 }, // in santim
  },
  { _id: false }
);

const EventSchema = new Schema<EventDocument>(
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
      index: true,
    },
    eventId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 128,
    },
    type: {
      type: String,
      enum: ['sale', 'expense', 'custom'],
      required: true,
      index: true,
    },
    occurredAt: {
      type: Date,
      required: true,
      index: true,
    },
    receivedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    period: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      min: 0,
    },
    currency: {
      type: String,
      default: 'ETB',
    },
    channel: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    branch: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    customerRef: {
      type: String,
      trim: true,
      maxlength: 128,
    },
    items: [EventItemSchema],
    props: {
      type: Map,
      of: Schema.Types.Mixed,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound indexes as specified in ADR 0005
EventSchema.index({ orgId: 1, eventId: 1 }, { unique: true });
EventSchema.index({ orgId: 1, occurredAt: -1 });
EventSchema.index({ orgId: 1, period: 1 });
EventSchema.index({ orgId: 1, type: 1, occurredAt: -1 });

EventSchema.plugin(tenantScopedPlugin);

export const EventModel = mongoose.model<EventDocument>('Event', EventSchema);
export const eventRepo = new TenantRepository<EventDocument>(EventModel);
