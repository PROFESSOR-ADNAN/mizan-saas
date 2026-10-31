import mongoose, { Schema, Document } from 'mongoose';
import { IInvoice } from '@mizan/shared';
import { tenantScopedPlugin } from '../tenancy/tenantPlugin.js';
import { TenantRepository } from '../tenancy/repository.js';

export interface InvoiceDocument extends Omit<IInvoice, '_id' | 'orgId'>, Document {
  orgId: mongoose.Types.ObjectId;
}

const InvoiceLineSchema = new Schema(
  {
    description: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPriceSantim: { type: Number, required: true, min: 0 },
    totalSantim: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const InvoiceSchema = new Schema<InvoiceDocument>(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    period: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'open', 'paid', 'void', 'uncollectible'],
      default: 'draft',
      index: true,
    },
    subtotalSantim: {
      type: Number,
      required: true,
      min: 0,
    },
    vatRateBasisPoints: {
      type: Number,
      default: 1500, // 15%
    },
    vatSantim: {
      type: Number,
      required: true,
      min: 0,
    },
    creditAppliedSantim: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSantim: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'ETB',
    },
    eventsBilledCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lines: [InvoiceLineSchema],
    dueDate: {
      type: Date,
      required: true,
    },
    paidAt: {
      type: Date,
    },
    paymentTxRef: {
      type: String,
      index: true,
    },
    pdfStoragePath: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

InvoiceSchema.index({ orgId: 1, period: 1 });
InvoiceSchema.plugin(tenantScopedPlugin);

export const InvoiceModel = mongoose.model<InvoiceDocument>('Invoice', InvoiceSchema);
export const invoiceRepo = new TenantRepository<InvoiceDocument>(InvoiceModel);
