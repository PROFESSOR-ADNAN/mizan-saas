"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRIAL_PLAN_ID = exports.TRIAL_DURATION_DAYS = exports.PLANS = void 0;
exports.PLANS = {
    free: {
        id: 'free',
        name: 'Free',
        version: 1,
        basePriceSantim: 0,
        includedEvents: 10_000,
        includedSeats: 2,
        extraSeatPriceSantim: 0,
        overagePricePerThousandSantim: 0, // Hard cap (429) on free plan
        rawRetentionDays: 30,
        rollupRetentionDays: 90,
        apiRateLimitPerSec: 5,
        maxCustomProps: 5,
        spendCapSupported: false,
    },
    starter: {
        id: 'starter',
        name: 'Starter',
        version: 1,
        basePriceSantim: 150_000, // 1,500 ETB
        includedEvents: 100_000,
        includedSeats: 5,
        extraSeatPriceSantim: 15_000, // 150 ETB per seat/mo
        overagePricePerThousandSantim: 1_500, // 15 ETB per 1,000 events
        rawRetentionDays: 180,
        rollupRetentionDays: 365,
        apiRateLimitPerSec: 30,
        maxCustomProps: 20,
        spendCapSupported: true,
    },
    business: {
        id: 'business',
        name: 'Business',
        version: 1,
        basePriceSantim: 450_000, // 4,500 ETB
        includedEvents: 500_000,
        includedSeats: 15,
        extraSeatPriceSantim: 12_000, // 120 ETB per seat/mo
        overagePricePerThousandSantim: 1_000, // 10 ETB per 1,000 events
        rawRetentionDays: 730,
        rollupRetentionDays: 3650, // 10 years / permanent
        apiRateLimitPerSec: 100,
        maxCustomProps: 20,
        spendCapSupported: true,
    },
};
exports.TRIAL_DURATION_DAYS = 14;
exports.TRIAL_PLAN_ID = 'business';
//# sourceMappingURL=plans.js.map