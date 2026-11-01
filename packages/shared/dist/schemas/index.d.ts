import { z } from 'zod';
export declare const RegisterSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    orgName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    password: string;
    orgName?: string | undefined;
}, {
    name: string;
    email: string;
    password: string;
    orgName?: string | undefined;
}>;
export declare const LoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    totpCode: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    totpCode?: string | undefined;
}, {
    email: string;
    password: string;
    totpCode?: string | undefined;
}>;
export declare const MfaVerifySchema: z.ZodObject<{
    token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
}, {
    token: string;
}>;
export declare const CreateOrgSchema: z.ZodObject<{
    name: z.ZodString;
    tin: z.ZodOptional<z.ZodString>;
    vatRegistered: z.ZodDefault<z.ZodBoolean>;
    preferredLanguage: z.ZodDefault<z.ZodEnum<["en", "am"]>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    vatRegistered: boolean;
    preferredLanguage: "en" | "am";
    tin?: string | undefined;
}, {
    name: string;
    tin?: string | undefined;
    vatRegistered?: boolean | undefined;
    preferredLanguage?: "en" | "am" | undefined;
}>;
export declare const UpdateOrgSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    tin: z.ZodOptional<z.ZodString>;
    vatRegistered: z.ZodOptional<z.ZodBoolean>;
    fiscalYearStartDay: z.ZodOptional<z.ZodNumber>;
    fiscalYearStartMonth: z.ZodOptional<z.ZodNumber>;
    preferredLanguage: z.ZodOptional<z.ZodEnum<["en", "am"]>>;
    mfaRequired: z.ZodOptional<z.ZodBoolean>;
    spendCapSantim: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    tin?: string | undefined;
    vatRegistered?: boolean | undefined;
    preferredLanguage?: "en" | "am" | undefined;
    fiscalYearStartDay?: number | undefined;
    fiscalYearStartMonth?: number | undefined;
    mfaRequired?: boolean | undefined;
    spendCapSantim?: number | null | undefined;
}, {
    name?: string | undefined;
    tin?: string | undefined;
    vatRegistered?: boolean | undefined;
    preferredLanguage?: "en" | "am" | undefined;
    fiscalYearStartDay?: number | undefined;
    fiscalYearStartMonth?: number | undefined;
    mfaRequired?: boolean | undefined;
    spendCapSantim?: number | null | undefined;
}>;
export declare const InviteMemberSchema: z.ZodObject<{
    email: z.ZodString;
    role: z.ZodEnum<["admin", "billing", "analyst", "viewer"]>;
}, "strip", z.ZodTypeAny, {
    email: string;
    role: "admin" | "billing" | "analyst" | "viewer";
}, {
    email: string;
    role: "admin" | "billing" | "analyst" | "viewer";
}>;
export declare const UpdateMemberRoleSchema: z.ZodObject<{
    role: z.ZodEnum<["admin", "billing", "analyst", "viewer"]>;
}, "strip", z.ZodTypeAny, {
    role: "admin" | "billing" | "analyst" | "viewer";
}, {
    role: "admin" | "billing" | "analyst" | "viewer";
}>;
export declare const TransferOwnershipSchema: z.ZodObject<{
    newOwnerUserId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    newOwnerUserId: string;
}, {
    newOwnerUserId: string;
}>;
export declare const CreateTeamSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    dataSourceIds: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    dashboardIds: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    dataSourceIds: string[];
    dashboardIds: string[];
    description?: string | undefined;
}, {
    name: string;
    description?: string | undefined;
    dataSourceIds?: string[] | undefined;
    dashboardIds?: string[] | undefined;
}>;
export declare const CreateDataSourceSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodDefault<z.ZodEnum<["pos", "telegram", "web", "manual", "csv"]>>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    type: "pos" | "telegram" | "web" | "manual" | "csv";
    description?: string | undefined;
}, {
    name: string;
    type?: "pos" | "telegram" | "web" | "manual" | "csv" | undefined;
    description?: string | undefined;
}>;
export declare const CreateApiKeySchema: z.ZodObject<{
    name: z.ZodString;
    sourceId: z.ZodOptional<z.ZodString>;
    scopes: z.ZodArray<z.ZodEnum<["ingest:write", "data:read"]>, "many">;
    expiresInDays: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    scopes: ("data:read" | "ingest:write")[];
    sourceId?: string | undefined;
    expiresInDays?: number | undefined;
}, {
    name: string;
    scopes: ("data:read" | "ingest:write")[];
    sourceId?: string | undefined;
    expiresInDays?: number | undefined;
}>;
export declare const EventItemSchema: z.ZodObject<{
    sku: z.ZodString;
    name: z.ZodString;
    qty: z.ZodNumber;
    unitPrice: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    name: string;
    sku: string;
    qty: number;
    unitPrice: number;
}, {
    name: string;
    sku: string;
    qty: number;
    unitPrice: number;
}>;
export declare const IngestEventSchema: z.ZodObject<{
    eventId: z.ZodString;
    type: z.ZodEnum<["sale", "expense", "custom"]>;
    occurredAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    amount: z.ZodOptional<z.ZodNumber>;
    currency: z.ZodDefault<z.ZodLiteral<"ETB">>;
    channel: z.ZodOptional<z.ZodString>;
    branch: z.ZodOptional<z.ZodString>;
    customerRef: z.ZodOptional<z.ZodString>;
    items: z.ZodOptional<z.ZodArray<z.ZodObject<{
        sku: z.ZodString;
        name: z.ZodString;
        qty: z.ZodNumber;
        unitPrice: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        name: string;
        sku: string;
        qty: number;
        unitPrice: number;
    }, {
        name: string;
        sku: string;
        qty: number;
        unitPrice: number;
    }>, "many">>;
    props: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodEffects<z.ZodString, string, string>, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>, Record<string, string | number | boolean>, Record<string, string | number | boolean>>>;
}, "strip", z.ZodTypeAny, {
    type: "sale" | "expense" | "custom";
    eventId: string;
    occurredAt: string | Date;
    currency: "ETB";
    amount?: number | undefined;
    channel?: string | undefined;
    branch?: string | undefined;
    customerRef?: string | undefined;
    items?: {
        name: string;
        sku: string;
        qty: number;
        unitPrice: number;
    }[] | undefined;
    props?: Record<string, string | number | boolean> | undefined;
}, {
    type: "sale" | "expense" | "custom";
    eventId: string;
    occurredAt: string | Date;
    amount?: number | undefined;
    currency?: "ETB" | undefined;
    channel?: string | undefined;
    branch?: string | undefined;
    customerRef?: string | undefined;
    items?: {
        name: string;
        sku: string;
        qty: number;
        unitPrice: number;
    }[] | undefined;
    props?: Record<string, string | number | boolean> | undefined;
}>;
export declare const IngestBatchSchema: z.ZodObject<{
    events: z.ZodArray<z.ZodObject<{
        eventId: z.ZodString;
        type: z.ZodEnum<["sale", "expense", "custom"]>;
        occurredAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
        amount: z.ZodOptional<z.ZodNumber>;
        currency: z.ZodDefault<z.ZodLiteral<"ETB">>;
        channel: z.ZodOptional<z.ZodString>;
        branch: z.ZodOptional<z.ZodString>;
        customerRef: z.ZodOptional<z.ZodString>;
        items: z.ZodOptional<z.ZodArray<z.ZodObject<{
            sku: z.ZodString;
            name: z.ZodString;
            qty: z.ZodNumber;
            unitPrice: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            name: string;
            sku: string;
            qty: number;
            unitPrice: number;
        }, {
            name: string;
            sku: string;
            qty: number;
            unitPrice: number;
        }>, "many">>;
        props: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodEffects<z.ZodString, string, string>, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>, Record<string, string | number | boolean>, Record<string, string | number | boolean>>>;
    }, "strip", z.ZodTypeAny, {
        type: "sale" | "expense" | "custom";
        eventId: string;
        occurredAt: string | Date;
        currency: "ETB";
        amount?: number | undefined;
        channel?: string | undefined;
        branch?: string | undefined;
        customerRef?: string | undefined;
        items?: {
            name: string;
            sku: string;
            qty: number;
            unitPrice: number;
        }[] | undefined;
        props?: Record<string, string | number | boolean> | undefined;
    }, {
        type: "sale" | "expense" | "custom";
        eventId: string;
        occurredAt: string | Date;
        amount?: number | undefined;
        currency?: "ETB" | undefined;
        channel?: string | undefined;
        branch?: string | undefined;
        customerRef?: string | undefined;
        items?: {
            name: string;
            sku: string;
            qty: number;
            unitPrice: number;
        }[] | undefined;
        props?: Record<string, string | number | boolean> | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    events: {
        type: "sale" | "expense" | "custom";
        eventId: string;
        occurredAt: string | Date;
        currency: "ETB";
        amount?: number | undefined;
        channel?: string | undefined;
        branch?: string | undefined;
        customerRef?: string | undefined;
        items?: {
            name: string;
            sku: string;
            qty: number;
            unitPrice: number;
        }[] | undefined;
        props?: Record<string, string | number | boolean> | undefined;
    }[];
}, {
    events: {
        type: "sale" | "expense" | "custom";
        eventId: string;
        occurredAt: string | Date;
        amount?: number | undefined;
        currency?: "ETB" | undefined;
        channel?: string | undefined;
        branch?: string | undefined;
        customerRef?: string | undefined;
        items?: {
            name: string;
            sku: string;
            qty: number;
            unitPrice: number;
        }[] | undefined;
        props?: Record<string, string | number | boolean> | undefined;
    }[];
}>;
export declare const MetricQuerySchema: z.ZodObject<{
    metric: z.ZodEnum<["revenue", "expenses", "orders", "units", "uniqueCustomers"]>;
    granularity: z.ZodDefault<z.ZodEnum<["hour", "day", "month"]>>;
    startDate: z.ZodString;
    endDate: z.ZodString;
    channel: z.ZodOptional<z.ZodString>;
    branch: z.ZodOptional<z.ZodString>;
    sourceId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    metric: "revenue" | "expenses" | "orders" | "units" | "uniqueCustomers";
    granularity: "hour" | "day" | "month";
    startDate: string;
    endDate: string;
    sourceId?: string | undefined;
    channel?: string | undefined;
    branch?: string | undefined;
}, {
    metric: "revenue" | "expenses" | "orders" | "units" | "uniqueCustomers";
    startDate: string;
    endDate: string;
    sourceId?: string | undefined;
    channel?: string | undefined;
    branch?: string | undefined;
    granularity?: "hour" | "day" | "month" | undefined;
}>;
export declare const ChangePlanSchema: z.ZodObject<{
    planId: z.ZodEnum<["free", "starter", "business"]>;
}, "strip", z.ZodTypeAny, {
    planId: "free" | "starter" | "business";
}, {
    planId: "free" | "starter" | "business";
}>;
export declare const InitPaymentSchema: z.ZodObject<{
    invoiceId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    invoiceId: string;
}, {
    invoiceId: string;
}>;
export declare const IssueCreditNoteSchema: z.ZodObject<{
    amountSantim: z.ZodNumber;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    amountSantim: number;
    reason: string;
}, {
    amountSantim: number;
    reason: string;
}>;
export declare const CreateWebhookEndpointSchema: z.ZodObject<{
    url: z.ZodString;
    events: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    events: string[];
    url: string;
}, {
    events: string[];
    url: string;
}>;
export declare const CreateShareLinkSchema: z.ZodObject<{
    dashboardId: z.ZodString;
    expiresInDays: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    expiresInDays: number;
    dashboardId: string;
}, {
    dashboardId: string;
    expiresInDays?: number | undefined;
}>;
//# sourceMappingURL=index.d.ts.map