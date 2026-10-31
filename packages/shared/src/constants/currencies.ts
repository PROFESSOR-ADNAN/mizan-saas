export const CURRENCY = 'ETB';
export const SANTIM_PER_ETB = 100;

// Standard Ethiopian VAT rate: 15% (1500 basis points)
export const DEFAULT_VAT_BASIS_POINTS = 1500; // 15.00%
export const BASIS_POINTS_DIVISOR = 10000;

export const ETHIOPIAN_TIN_REGEX = /^\d{10}$/;
export const ETHIOPIAN_FISCAL_YEAR_START_MONTH = 7; // July (0-indexed 6, or 7 in 1-indexed calendar)
export const ETHIOPIAN_FISCAL_YEAR_START_DAY = 8; // July 8 (Hamle 1)
export const DEFAULT_TIMEZONE = 'Africa/Addis_Ababa';
