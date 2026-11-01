/**
 * Converts integer santim to float ETB for display only.
 * Never use for internal accounting or storage.
 */
export declare function santimToEtb(santim: number): number;
/**
 * Converts ETB string/number to integer santim.
 */
export declare function etbToSantim(etb: number | string): number;
/**
 * Formats santim as Ethiopian Birr string with 2 decimal places.
 * Example: 150000 -> "1,500.00 ETB"
 */
export declare function formatSantim(santim: number, locale?: string): string;
/**
 * Computes VAT in integer santim using round-half-up.
 * vatBasisPoints default: 1500 (15%)
 */
export declare function calculateVatSantim(subtotalSantim: number, vatBasisPoints?: number): number;
/**
 * Computes usage overage in integer santim.
 * @param eventsIngested Total accepted events in period
 * @param includedEvents Plan's included events
 * @param overagePricePerThousandSantim Price per 1,000 events in santim
 */
export declare function calculateOverageSantim(eventsIngested: number, includedEvents: number, overagePricePerThousandSantim: number): {
    billableOverageEvents: number;
    overageSantim: number;
};
/**
 * Computes prorated amount for plan changes mid-period.
 * @param totalAmountSantim Base plan price in santim
 * @param periodStart Start date of billing period
 * @param periodEnd End date of billing period
 * @param changeDate Date the plan change takes effect
 */
export declare function calculateProration(totalAmountSantim: number, periodStart: Date, periodEnd: Date, changeDate: Date): {
    daysTotal: number;
    daysRemaining: number;
    unusedCreditSantim: number;
};
//# sourceMappingURL=money.d.ts.map