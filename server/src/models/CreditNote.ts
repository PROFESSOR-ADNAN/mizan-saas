import mongoose, { Schema, Document } from 'mongoose';
import { ICreditNote } from '@mizan/shared';
import { tenantScopedPlugin } from '../tenancy/tenantPlugin.js';
import { TenantRepository } from '../tenancy/repository.js';

export interface CreditNoteDocument extends Omit<ICreditNote, '_id' | 'orgId' | 'appliedToInvoiceId'>, Document {
  orgId: mongoose.Types.ObjectId;
  appliedToInvoiceId?: mongoose.Types.ObjectId;
}

const CreditNoteSchema = new Schema<CreditNoteDocument>(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    creditNoteNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    amountSantim: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      default: 'ETB',
    },
    reason: {
      type: String,
      required: true,
      maxlength: 300,
    },
    appliedToInvoiceId: {
      type: Schema.Types.ObjectId,
      ref: 'Invoice',
    },
    remainingSantim: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

CreditNoteSchema.plugin(tenantScopedPlugin);

export const CreditNoteModel = mongoose.model<CreditNoteDocument>('CreditNote', CreditNoteSchema);
export const creditNoteRepo = new TenantRepository<CreditNoteDocument>(CreditNoteModel);
