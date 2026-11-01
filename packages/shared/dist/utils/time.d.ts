/**
 * Returns the billing period key for a given date in UTC (e.g. "2026-11").
 */
export declare function getBillingPeriodKey(date?: Date): string;
/**
 * Returns hourly bucket start timestamp in UTC (aligned to 00 minutes, 00 seconds).
 */
export declare function getHourlyBucketStart(date: Date): Date;
/**
 * Returns daily bucket start timestamp in Africa/Addis_Ababa (midnight local time in UTC).
 * Addis Ababa is UTC+3 with no Daylight Saving Time.
 */
export declare function getDailyBucketStart(date: Date): Date;
/**
 * Calculates Ethiopian Fiscal Year (EFY) range for a given Gregorian date.
 * Ethiopian fiscal year starts Hamle 1 (July 8 Gregorian).
 * For example, July 8, 2026 to July 7, 2027 belongs to Ethiopian Fiscal Year 2019 (2026/2027).
 */
export declare function getEthiopianFiscalYearRange(date?: Date): {
    fiscalYearLabel: string;
    startDate: Date;
    endDate: Date;
};
//# sourceMappingURL=time.d.ts.map