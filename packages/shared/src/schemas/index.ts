import { z } from 'zod';

// ==========================================
// Authentication & User Schemas
// ==========================================

export const RegisterSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8).max(128),
  orgName: z.string().min(2).max(100).trim().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1).max(128),
  totpCode: z.string().length(6).regex(/^\d+$/).optional(),
});

export const MfaVerifySchema = z.object({
  token: z.string().length(6).regex(/^\d+$/),
});

// ==========================================
// Organization & RBAC Schemas
// ==========================================

export const CreateOrgSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  tin: z.string().regex(/^\d{10}$/, 'TIN must be 10 digits').optional(),
  vatRegistered: z.boolean().default(true),
  preferredLanguage: z.enum(['en', 'am']).default('en'),
});

export const UpdateOrgSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  tin: z.string().regex(/^\d{10}$/).optional(),
  vatRegistered: z.boolean().optional(),
  fiscalYearStartDay: z.number().int().min(1).max(31).optional(),
  fiscalYearStartMonth: z.number().int().min(1).max(12).optional(),
  preferredLanguage: z.enum(['en', 'am']).optional(),
  mfaRequired: z.boolean().optional(),
  spendCapSantim: z.number().int().min(0).optional().nullable(),
});

export const InviteMemberSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  role: z.enum(['admin', 'billing', 'analyst', 'viewer']),
});

export const UpdateMemberRoleSchema = z.object({
  role: z.enum(['admin', 'billing', 'analyst', 'viewer']),
});

export const TransferOwnershipSchema = z.object({
  newOwnerUserId: z.string().min(1),
});

// ==========================================
// Team & Data Source Schemas
// ==========================================

export const CreateTeamSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  description: z.string().max(300).optional(),
  dataSourceIds: z.array(z.string()).default([]),
  dashboardIds: z.array(z.string()).default([]),
});

export const CreateDataSourceSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  type: z.enum(['pos', 'telegram', 'web', 'manual', 'csv']).default('pos'),
  description: z.string().max(300).optional(),
});

export const CreateApiKeySchema = z.object({
  name: z.string().min(2).max(100).trim(),
  sourceId: z.string().optional(),
  scopes: z.array(z.enum(['ingest:write', 'data:read'])).min(1),
  expiresInDays: z.number().int().min(1).max(365).optional(),
});

// ==========================================
// Event Ingestion Schemas
// ==========================================

const CustomPropsSchema = z.record(
  z.string()
    .max(40)
    .refine((k) => !k.startsWith('$') && !k.includes('.'), {
      message: 'Keys cannot start with $ or contain dots',
    }),
  z.union([z.string().max(200), z.number(), z.boolean()])
).refine((obj) => Object.keys(obj).length <= 20, {
  message: 'Custom properties cannot exceed 20 keys',
});

export const EventItemSchema = z.object({
  sku: z.string().max(100).trim(),
  name: z.string().max(200).trim(),
  qty: z.number().int().min(1),
  unitPrice: z.number().int().min(0), // in santim
});

export const IngestEventSchema = z.object({
  eventId: z.string().min(1).max(128).trim(),
  type: z.enum(['sale', 'expense', 'custom']),
  occurredAt: z.string().datetime().or(z.date()),
  amount: z.number().int().min(0).optional(), // in santim
  currency: z.literal('ETB').default('ETB'),
  channel: z.string().max(100).trim().optional(),
  branch: z.string().max(100).trim().optional(),
  customerRef: z.string().max(128).trim().optional(),
  items: z.array(EventItemSchema).max(100).optional(),
  props: CustomPropsSchema.optional(),
});

export const IngestBatchSchema = z.object({
  events: z.array(IngestEventSchema).min(1).max(100),
});

// ==========================================
// Query & Analytics Schemas
// ==========================================

export const MetricQuerySchema = z.object({
  metric: z.enum(['revenue', 'expenses', 'orders', 'units', 'uniqueCustomers']),
  granularity: z.enum(['hour', 'day', 'month']).default('day'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  channel: z.string().optional(),
  branch: z.string().optional(),
  sourceId: z.string().optional(),
});

// ==========================================
// Billing & Payment Schemas
// ==========================================

export const ChangePlanSchema = z.object({
  planId: z.enum(['free', 'starter', 'business']),
});

export const InitPaymentSchema = z.object({
  invoiceId: z.string().min(1),
});

export const IssueCreditNoteSchema = z.object({
  amountSantim: z.number().int().min(1),
  reason: z.string().min(5).max(300),
});

// ==========================================
// Webhook & Share Link Schemas
// ==========================================

export const CreateWebhookEndpointSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()).min(1),
});

export const CreateShareLinkSchema = z.object({
  dashboardId: z.string().min(1),
  expiresInDays: z.number().int().min(1).max(90).default(30),
});
