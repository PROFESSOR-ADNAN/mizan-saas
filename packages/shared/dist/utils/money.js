"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.santimToEtb = santimToEtb;
exports.etbToSantim = etbToSantim;
exports.formatSantim = formatSantim;
exports.calculateVatSantim = calculateVatSantim;
exports.calculateOverageSantim = calculateOverageSantim;
exports.calculateProration = calculateProration;
const currencies_js_1 = require("../constants/currencies.js");
/**
 * Converts integer santim to float ETB for display only.
 * Never use for internal accounting or storage.
 */
function santimToEtb(santim) {
    return santim / currencies_js_1.SANTIM_PER_ETB;
}
/**
 * Converts ETB string/number to integer santim.
 */
function etbToSantim(etb) {
    const parsed = typeof etb === 'string' ? parseFloat(etb) : etb;
    if (isNaN(parsed) || !isFinite(parsed)) {
        throw new Error(`Invalid ETB monetary value: ${etb}`);
    }
    return Math.round(parsed * currencies_js_1.SANTIM_PER_ETB);
}
/**
 * Formats santim as Ethiopian Birr string with 2 decimal places.
 * Example: 150000 -> "1,500.00 ETB"
 */
function formatSantim(santim, locale = 'en-US') {
    const etb = santim / currencies_js_1.SANTIM_PER_ETB;
    return new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(etb) + ' ETB';
}
/**
 * Computes VAT in integer santim using round-half-up.
 * vatBasisPoints default: 1500 (15%)
 */
function calculateVatSantim(subtotalSantim, vatBasisPoints = currencies_js_1.DEFAULT_VAT_BASIS_POINTS) {
    if (subtotalSantim <= 0)
        return 0;
    // Round half-up integer math: (subtotal * basisPoints + 5000) / 10000
    return Math.floor((subtotalSantim * vatBasisPoints + (currencies_js_1.BASIS_POINTS_DIVISOR / 2)) / currencies_js_1.BASIS_POINTS_DIVISOR);
}
/**
 * Computes usage overage in integer santim.
 * @param eventsIngested Total accepted events in period
 * @param includedEvents Plan's included events
 * @param overagePricePerThousandSantim Price per 1,000 events in santim
 */
function calculateOverageSantim(eventsIngested, includedEvents, overagePricePerThousandSantim) {
    if (eventsIngested <= includedEvents || overagePricePerThousandSantim <= 0) {
        return { billableOverageEvents: 0, overageSantim: 0 };
    }
    const excessEvents = eventsIngested - includedEvents;
    // Billed in chunks or exact units? Standard is proportional per 1,000:
    // (excessEvents * rate) / 1000 with half-up rounding
    const overageSantim = Math.round((excessEvents * overagePricePerThousandSantim) / 1000);
    return {
        billableOverageEvents: excessEvents,
        overageSantim,
    };
}
/**
 * Computes prorated amount for plan changes mid-period.
 * @param totalAmountSantim Base plan price in santim
 * @param periodStart Start date of billing period
 * @param periodEnd End date of billing period
 * @param changeDate Date the plan change takes effect
 */
function calculateProration(totalAmountSantim, periodStart, periodEnd, changeDate) {
    const totalMs = periodEnd.getTime() - periodStart.getTime();
    const remainingMs = Math.max(0, periodEnd.getTime() - changeDate.getTime());
    if (totalMs <= 0 || remainingMs <= 0) {
        return { daysTotal: 1, daysRemaining: 0, unusedCreditSantim: 0 };
    }
    const daysTotal = Math.max(1, Math.round(totalMs / (1000 * 60 * 60 * 24)));
    const daysRemaining = Math.max(0, Math.round(remainingMs / (1000 * 60 * 60 * 24)));
    const unusedCreditSantim = Math.round((totalAmountSantim * remainingMs) / totalMs);
    return {
        daysTotal,
        daysRemaining,
        unusedCreditSantim,
    };
}
//# sourceMappingURL=money.js.map