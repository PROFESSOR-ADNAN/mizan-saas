import { ETHIOPIAN_FISCAL_YEAR_START_DAY, ETHIOPIAN_FISCAL_YEAR_START_MONTH } from '../constants/currencies.js';

/**
 * Returns the billing period key for a given date in UTC (e.g. "2026-11").
 */
export function getBillingPeriodKey(date: Date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Returns hourly bucket start timestamp in UTC (aligned to 00 minutes, 00 seconds).
 */
export function getHourlyBucketStart(date: Date): Date {
  const d = new Date(date);
  d.setUTCMinutes(0, 0, 0);
  return d;
}

/**
 * Returns daily bucket start timestamp in Africa/Addis_Ababa (midnight local time in UTC).
 * Addis Ababa is UTC+3 with no Daylight Saving Time.
 */
export function getDailyBucketStart(date: Date): Date {
  const d = new Date(date);
  // Add 3 hours to get Addis time, set to midnight, then subtract 3 hours
  const addisOffsetMs = 3 * 60 * 60 * 1000;
  const addisTime = new Date(d.getTime() + addisOffsetMs);
  addisTime.setUTCHours(0, 0, 0, 0);
  return new Date(addisTime.getTime() - addisOffsetMs);
}

/**
 * Calculates Ethiopian Fiscal Year (EFY) range for a given Gregorian date.
 * Ethiopian fiscal year starts Hamle 1 (July 8 Gregorian).
 * For example, July 8, 2026 to July 7, 2027 belongs to Ethiopian Fiscal Year 2019 (2026/2027).
 */
export function getEthiopianFiscalYearRange(date: Date = new Date()): {
  fiscalYearLabel: string;
  startDate: Date;
  endDate: Date;
} {
  const year = date.getUTCFullYear();
  const fiscalStartThisYear = new Date(Date.UTC(year, ETHIOPIAN_FISCAL_YEAR_START_MONTH - 1, ETHIOPIAN_FISCAL_YEAR_START_DAY, 0, 0, 0));

  let startYear = year;
  if (date < fiscalStartThisYear) {
    startYear = year - 1;
  }

  const startDate = new Date(Date.UTC(startYear, ETHIOPIAN_FISCAL_YEAR_START_MONTH - 1, ETHIOPIAN_FISCAL_YEAR_START_DAY, 0, 0, 0));
  const endDate = new Date(Date.UTC(startYear + 1, ETHIOPIAN_FISCAL_YEAR_START_MONTH - 1, ETHIOPIAN_FISCAL_YEAR_START_DAY - 1, 23, 59, 59, 999));

  // Ethiopian calendar year is typically Gregorian year minus 7 or 8
  const efy = startYear - 7;

  return {
    fiscalYearLabel: `EFY ${efy} (${startYear}/${startYear + 1})`,
    startDate,
    endDate,
  };
}
