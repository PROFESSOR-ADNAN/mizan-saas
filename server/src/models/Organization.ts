import mongoose, { Schema, Document } from 'mongoose';
import { IOrganization } from '@mizan/shared';

export interface OrganizationDocument extends Omit<IOrganization, '_id'>, Document {}

const OrganizationSchema = new Schema<OrganizationDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'pending_deletion', 'deleted'],
      default: 'active',
      index: true,
    },
    tin: {
      type: String,
      trim: true,
      match: /^\d{10}$/,
    },
    vatRegistered: {
      type: Boolean,
      default: true,
    },
    fiscalYearStartDay: {
      type: Number,
      default: 8, // Hamle 1
    },
    fiscalYearStartMonth: {
      type: Number,
      default: 7, // July
    },
    timezone: {
      type: String,
      default: 'Africa/Addis_Ababa',
    },
    preferredLanguage: {
      type: String,
      enum: ['en', 'am'],
      default: 'en',
    },
    mfaRequired: {
      type: Boolean,
      default: false,
    },
    spendCapSantim: {
      type: Number,
      min: 0,
    },
    pendingDeletionAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const OrganizationModel = mongoose.model<OrganizationDocument>('Organization', OrganizationSchema);
