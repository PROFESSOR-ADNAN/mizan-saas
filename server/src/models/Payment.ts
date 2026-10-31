import mongoose, { Schema, Document } from 'mongoose';
import { tenantScopedPlugin } from '../tenancy/tenantPlugin.js';
import { TenantRepository } from '../tenancy/repository.js';

export interface PaymentDocument extends Document {
  orgId: mongoose.Types.ObjectId;
  invoiceId: mongoose.Types.ObjectId;
  txRef: string;
  amountSantim: number;
  currency: 'ETB';
  status: 'pending' | 'success' | 'failed';
  chapaReference?: string;
  checkoutUrl?: string;
  rawCallbackPayload?: Record<string, unknown>;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<PaymentDocument>(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
      index: true,
    },
    txRef: {
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
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
      index: true,
    },
    chapaReference: {
      type: String,
    },
    checkoutUrl: {
      type: String,
    },
    rawCallbackPayload: {
      type: Schema.Types.Mixed,
    },
    verifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

PaymentSchema.plugin(tenantScopedPlugin);

export const PaymentModel = mongoose.model<PaymentDocument>('Payment', PaymentSchema);
export const paymentRepo = new TenantRepository<PaymentDocument>(PaymentModel);
