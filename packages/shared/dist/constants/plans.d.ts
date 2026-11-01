export type PlanId = 'free' | 'starter' | 'business';
export interface PlanConfig {
    id: PlanId;
    name: string;
    version: number;
    basePriceSantim: number;
    includedEvents: number;
    includedSeats: number;
    extraSeatPriceSantim: number;
    overagePricePerThousandSantim: number;
    rawRetentionDays: number;
    rollupRetentionDays: number;
    apiRateLimitPerSec: number;
    maxCustomProps: number;
    spendCapSupported: boolean;
}
export declare const PLANS: Record<PlanId, PlanConfig>;
export declare const TRIAL_DURATION_DAYS = 14;
export declare const TRIAL_PLAN_ID: PlanId;
//# sourceMappingURL=plans.d.ts.map