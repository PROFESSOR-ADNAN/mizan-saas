"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateShareLinkSchema = exports.CreateWebhookEndpointSchema = exports.IssueCreditNoteSchema = exports.InitPaymentSchema = exports.ChangePlanSchema = exports.MetricQuerySchema = exports.IngestBatchSchema = exports.IngestEventSchema = exports.EventItemSchema = exports.CreateApiKeySchema = exports.CreateDataSourceSchema = exports.CreateTeamSchema = exports.TransferOwnershipSchema = exports.UpdateMemberRoleSchema = exports.InviteMemberSchema = exports.UpdateOrgSchema = exports.CreateOrgSchema = exports.MfaVerifySchema = exports.LoginSchema = exports.VerifyPhoneOtpSchema = exports.SendPhoneOtpSchema = exports.VerifyEmailSchema = exports.RegisterSchema = void 0;
const zod_1 = require("zod");
// ==========================================
// Authentication & User Schemas
// ==========================================
exports.RegisterSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100).trim(),
    email: zod_1.z.string().email().toLowerCase().trim(),
    password: zod_1.z.string().min(8).max(128),
    phone: zod_1.z.string().min(9).max(16).trim().optional(),
    orgName: zod_1.z.string().min(2).max(100).trim().optional(),
});
exports.VerifyEmailSchema = zod_1.z.object({
    code: zod_1.z.string().min(4).max(64).trim(),
});
exports.SendPhoneOtpSchema = zod_1.z.object({
    phone: zod_1.z.string().min(9).max(16).trim(),
});
exports.VerifyPhoneOtpSchema = zod_1.z.object({
    phone: zod_1.z.string().min(9).max(16).trim(),
    code: zod_1.z.string().length(6).regex(/^\d+$/, 'OTP must be 6 digits'),
});
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email().toLowerCase().trim(),
    password: zod_1.z.string().min(1).max(128),
    totpCode: zod_1.z.string().length(6).regex(/^\d+$/).optional(),
});
exports.MfaVerifySchema = zod_1.z.object({
    token: zod_1.z.string().length(6).regex(/^\d+$/),
});
// ==========================================
// Organization & RBAC Schemas
// ==========================================
exports.CreateOrgSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100).trim(),
    tin: zod_1.z.string().regex(/^\d{10}$/, 'TIN must be 10 digits').optional(),
    vatRegistered: zod_1.z.boolean().default(true),
    preferredLanguage: zod_1.z.enum(['en', 'am']).default('en'),
});
exports.UpdateOrgSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100).trim().optional(),
    tin: zod_1.z.string().regex(/^\d{10}$/).optional(),
    vatRegistered: zod_1.z.boolean().optional(),
    fiscalYearStartDay: zod_1.z.number().int().min(1).max(31).optional(),
    fiscalYearStartMonth: zod_1.z.number().int().min(1).max(12).optional(),
    preferredLanguage: zod_1.z.enum(['en', 'am']).optional(),
    mfaRequired: zod_1.z.boolean().optional(),
    spendCapSantim: zod_1.z.number().int().min(0).optional().nullable(),
});
exports.InviteMemberSchema = zod_1.z.object({
    email: zod_1.z.string().email().toLowerCase().trim(),
    role: zod_1.z.enum(['admin', 'billing', 'analyst', 'viewer']),
});
exports.UpdateMemberRoleSchema = zod_1.z.object({
    role: zod_1.z.enum(['admin', 'billing', 'analyst', 'viewer']),
});
exports.TransferOwnershipSchema = zod_1.z.object({
    newOwnerUserId: zod_1.z.string().min(1),
});
// ==========================================
// Team & Data Source Schemas
// ==========================================
exports.CreateTeamSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100).trim(),
    description: zod_1.z.string().max(300).optional(),
    dataSourceIds: zod_1.z.array(zod_1.z.string()).default([]),
    dashboardIds: zod_1.z.array(zod_1.z.string()).default([]),
});
exports.CreateDataSourceSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100).trim(),
    type: zod_1.z.enum(['pos', 'telegram', 'web', 'manual', 'csv']).default('pos'),
    description: zod_1.z.string().max(300).optional(),
});
exports.CreateApiKeySchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100).trim(),
    sourceId: zod_1.z.string().optional(),
    scopes: zod_1.z.array(zod_1.z.enum(['ingest:write', 'data:read'])).min(1),
    expiresInDays: zod_1.z.number().int().min(1).max(365).optional(),
});
// ==========================================
// Event Ingestion Schemas
// ==========================================
const CustomPropsSchema = zod_1.z.record(zod_1.z.string()
    .max(40)
    .refine((k) => !k.startsWith('$') && !k.includes('.'), {
    message: 'Keys cannot start with $ or contain dots',
}), zod_1.z.union([zod_1.z.string().max(200), zod_1.z.number(), zod_1.z.boolean()])).refine((obj) => Object.keys(obj).length <= 20, {
    message: 'Custom properties cannot exceed 20 keys',
});
exports.EventItemSchema = zod_1.z.object({
    sku: zod_1.z.string().max(100).trim(),
    name: zod_1.z.string().max(200).trim(),
    qty: zod_1.z.number().int().min(1),
    unitPrice: zod_1.z.number().int().min(0), // in santim
});
exports.IngestEventSchema = zod_1.z.object({
    eventId: zod_1.z.string().min(1).max(128).trim(),
    type: zod_1.z.enum(['sale', 'expense', 'custom']),
    occurredAt: zod_1.z.string().datetime().or(zod_1.z.date()),
    amount: zod_1.z.number().int().min(0).optional(), // in santim
    currency: zod_1.z.literal('ETB').default('ETB'),
    channel: zod_1.z.string().max(100).trim().optional(),
    branch: zod_1.z.string().max(100).trim().optional(),
    customerRef: zod_1.z.string().max(128).trim().optional(),
    items: zod_1.z.array(exports.EventItemSchema).max(100).optional(),
    props: CustomPropsSchema.optional(),
});
exports.IngestBatchSchema = zod_1.z.object({
    events: zod_1.z.array(exports.IngestEventSchema).min(1).max(100),
});
// ==========================================
// Query & Analytics Schemas
// ==========================================
exports.MetricQuerySchema = zod_1.z.object({
    metric: zod_1.z.enum(['revenue', 'expenses', 'orders', 'units', 'uniqueCustomers']),
    granularity: zod_1.z.enum(['hour', 'day', 'month']).default('day'),
    startDate: zod_1.z.string().datetime(),
    endDate: zod_1.z.string().datetime(),
    channel: zod_1.z.string().optional(),
    branch: zod_1.z.string().optional(),
    sourceId: zod_1.z.string().optional(),
});
// ==========================================
// Billing & Payment Schemas
// ==========================================
exports.ChangePlanSchema = zod_1.z.object({
    planId: zod_1.z.enum(['free', 'starter', 'business']),
});
exports.InitPaymentSchema = zod_1.z.object({
    invoiceId: zod_1.z.string().min(1),
});
exports.IssueCreditNoteSchema = zod_1.z.object({
    amountSantim: zod_1.z.number().int().min(1),
    reason: zod_1.z.string().min(5).max(300),
});
// ==========================================
// Webhook & Share Link Schemas
// ==========================================
exports.CreateWebhookEndpointSchema = zod_1.z.object({
    url: zod_1.z.string().url(),
    events: zod_1.z.array(zod_1.z.string()).min(1),
});
exports.CreateShareLinkSchema = zod_1.z.object({
    dashboardId: zod_1.z.string().min(1),
    expiresInDays: zod_1.z.number().int().min(1).max(90).default(30),
});
//# sourceMappingURL=index.js.map