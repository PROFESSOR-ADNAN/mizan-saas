"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_TIMEZONE = exports.ETHIOPIAN_FISCAL_YEAR_START_DAY = exports.ETHIOPIAN_FISCAL_YEAR_START_MONTH = exports.ETHIOPIAN_TIN_REGEX = exports.BASIS_POINTS_DIVISOR = exports.DEFAULT_VAT_BASIS_POINTS = exports.SANTIM_PER_ETB = exports.CURRENCY = void 0;
exports.CURRENCY = 'ETB';
exports.SANTIM_PER_ETB = 100;
// Standard Ethiopian VAT rate: 15% (1500 basis points)
exports.DEFAULT_VAT_BASIS_POINTS = 1500; // 15.00%
exports.BASIS_POINTS_DIVISOR = 10000;
exports.ETHIOPIAN_TIN_REGEX = /^\d{10}$/;
exports.ETHIOPIAN_FISCAL_YEAR_START_MONTH = 7; // July (0-indexed 6, or 7 in 1-indexed calendar)
exports.ETHIOPIAN_FISCAL_YEAR_START_DAY = 8; // July 8 (Hamle 1)
exports.DEFAULT_TIMEZONE = 'Africa/Addis_Ababa';
//# sourceMappingURL=currencies.js.map