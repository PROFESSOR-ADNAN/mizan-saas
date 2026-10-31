import { OrgRole, PlatformRole } from '../constants/permissions.js';
import { PlanId } from '../constants/plans.js';

export interface IUser {
  _id: string;
  email: string;
  passwordHash?: string;
  name: string;
  platformRole: PlatformRole;
  isEmailVerified: boolean;
  mfaEnabled: boolean;
  mfaSecret?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type OrgStatus = 'active' | 'suspended' | 'pending_deletion' | 'deleted';

export interface IOrganization {
  _id: string;
  name: string;
  slug: string;
  status: OrgStatus;
  tin?: string; // Ethiopian 10-digit Tax Identification Number
  vatRegistered: boolean;
  fiscalYearStartDay: number; // default 8
  fiscalYearStartMonth: number; // default 7 (July)
  timezone: string; // 'Africa/Addis_Ababa'
  preferredLanguage: 'en' | 'am';
  mfaRequired: boolean;
  spendCapSantim?: number;
  pendingDeletionAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMembership {
  _id: string;
  orgId: string;
  userId: string;
  role: OrgRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITeam {
  _id: string;
  orgId: string;
  name: string;
  description?: string;
  dataSourceIds: string[];
  dashboardIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ITeamMember {
  _id: string;
  orgId: string;
  teamId: string;
  userId: string;
  createdAt: Date;
}

export interface IDataSource {
  _id: string;
  orgId: string;
  name: string;
  type: 'pos' | 'telegram' | 'web' | 'manual' | 'csv';
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ApiKeyScope = 'ingest:write' | 'data:read';

export interface IApiKey {
  _id: string;
  orgId: string;
  sourceId?: string;
  name: string;
  keyPrefix: string;
  keyHash: string; // SHA-256 of full key
  scopes: ApiKeyScope[];
  rateLimitPerSec: number;
  lastUsedAt?: Date;
  lastUsedIp?: string;
  expiresAt?: Date;
  revokedAt?: Date;
  revokedReason?: string;
  createdAt: Date;
}

export type EventType = 'sale' | 'expense' | 'custom';

export interface IEventItem {
  sku: string;
  name: string;
  qty: number;
  unitPrice: number; // Santim
}

export interface IEvent {
  _id: string;
  orgId: string;
  sourceId: string;
  eventId: string; // Unique within org
  type: EventType;
  occurredAt: Date;
  receivedAt: Date;
  period: string; // YYYY-MM
  amount?: number; // Santim (sales or expense)
  currency: 'ETB';
  channel?: string;
  branch?: string;
  customerRef?: string;
  items?: IEventItem[];
  props?: Record<string, string | number | boolean>;
  createdAt: Date;
}

export interface IRollup {
  _id: string;
  orgId: string;
  bucketStart: Date;
  granularity: 'hour' | 'day';
  revenueSantim: number;
  expensesSantim: number;
  ordersCount: number;
  unitsCount: number;
  uniqueCustomersCount: number;
  channelBreakdown?: Record<string, number>;
  topSkus?: Array<{ sku: string; units: number; revenueSantim: number }>;
  version: number;
  updatedAt: Date;
}

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'suspended'
  | 'canceled'
  | 'free';

export interface ISubscription {
  _id: string;
  orgId: string;
  planId: PlanId;
  planVersion: number;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEndsAt?: Date;
  canceledAt?: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUsageLedger {
  _id: string;
  orgId: string;
  period: string; // YYYY-MM
  hourKey: string; // YYYY-MM-DD-HH
  eventsIngested: number;
  createdAt: Date;
}

export interface ISeatSnapshot {
  _id: string;
  orgId: string;
  period: string;
  snapshotDate: Date;
  activeSeatCount: number;
  createdAt: Date;
}

export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';

export interface IInvoiceLine {
  description: string;
  quantity: number;
  unitPriceSantim: number;
  totalSantim: number;
}

export interface IInvoice {
  _id: string;
  orgId: string;
  invoiceNumber: string; // Gap-free sequence: INV-2026-000001
  period: string; // YYYY-MM
  status: InvoiceStatus;
  subtotalSantim: number;
  vatRateBasisPoints: number; // 1500 = 15%
  vatSantim: number;
  creditAppliedSantim: number;
  totalSantim: number;
  currency: 'ETB';
  eventsBilledCount: number;
  lines: IInvoiceLine[];
  dueDate: Date;
  paidAt?: Date;
  paymentTxRef?: string;
  pdfStoragePath?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreditNote {
  _id: string;
  orgId: string;
  creditNoteNumber: string; // CN-2026-000001
  amountSantim: number;
  currency: 'ETB';
  reason: string;
  appliedToInvoiceId?: string;
  remainingSantim: number;
  createdAt: Date;
}

export interface IWebhookEndpoint {
  _id: string;
  orgId: string;
  url: string;
  secretEncrypted: string;
  events: string[];
  enabled: boolean;
  consecutiveFailures: number;
  lastFailureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWebhookDelivery {
  _id: string;
  orgId: string;
  endpointId: string;
  eventId: string;
  eventType: string;
  payload: Record<string, unknown>;
  statusCode?: number;
  durationMs?: number;
  responseBodySnippet?: string;
  attempt: number;
  status: 'pending' | 'delivered' | 'failed' | 'aborted_security_violation';
  nextRetryAt?: Date;
  createdAt: Date;
}

export interface IAuditLog {
  _id: string;
  orgId: string;
  actorId: string;
  actorEmail?: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}
