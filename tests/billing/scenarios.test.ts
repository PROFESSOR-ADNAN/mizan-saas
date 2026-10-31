import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PLANS,
  calculateOverageSantim,
  calculateVatSantim,
  calculateProration,
  formatSantim,
} from '@mizan/shared';

describe('12 Hand-Checked Billing Scenarios (Exact Santim Test Suite)', () => {
  it('Scenario 1: Free plan base invoice with 0 events', () => {
    const plan = PLANS.free;
    const subtotal = plan.basePriceSantim; // 0
    const vat = calculateVatSantim(subtotal);
    const total = subtotal + vat;

    assert.equal(subtotal, 0);
    assert.equal(vat, 0);
    assert.equal(total, 0);
    assert.equal(formatSantim(total), '0.00 ETB');
  });

  it('Scenario 2: Starter plan base fee with 0 events', () => {
    const plan = PLANS.starter;
    const subtotal = plan.basePriceSantim; // 150,000 santim (1,500 ETB)
    const vat = calculateVatSantim(subtotal); // 15% of 150,000 = 22,500 santim
    const total = subtotal + vat; // 172,500 santim (1,725.00 ETB)

    assert.equal(subtotal, 150_000);
    assert.equal(vat, 22_500);
    assert.equal(total, 172_500);
    assert.equal(formatSantim(total), '1,725.00 ETB');
  });

  it('Scenario 3: Starter plan within included quota (90,000 events)', () => {
    const plan = PLANS.starter;
    const { billableOverageEvents, overageSantim } = calculateOverageSantim(
      90_000,
      plan.includedEvents, // 100,000
      plan.overagePricePerThousandSantim
    );

    assert.equal(billableOverageEvents, 0);
    assert.equal(overageSantim, 0);

    const subtotal = plan.basePriceSantim + overageSantim;
    const vat = calculateVatSantim(subtotal);
    const total = subtotal + vat;

    assert.equal(total, 172_500);
  });

  it('Scenario 4: Starter plan with 20,000 excess overage events', () => {
    const plan = PLANS.starter;
    const { billableOverageEvents, overageSantim } = calculateOverageSantim(
      120_000,
      plan.includedEvents, // 100,000
      plan.overagePricePerThousandSantim // 1,500 santim per 1k (15 ETB)
    );

    assert.equal(billableOverageEvents, 20_000);
    assert.equal(overageSantim, 30_000); // 20 * 1500 = 30,000 santim (300 ETB)

    const subtotal = plan.basePriceSantim + overageSantim; // 150,000 + 30,000 = 180,000
    const vat = calculateVatSantim(subtotal); // 15% of 180,000 = 27,000
    const total = subtotal + vat; // 207,000 santim (2,070.00 ETB)

    assert.equal(subtotal, 180_000);
    assert.equal(vat, 27_000);
    assert.equal(total, 207_000);
  });

  it('Scenario 5: Business plan base subscription (4,500 ETB)', () => {
    const plan = PLANS.business;
    const subtotal = plan.basePriceSantim; // 450,000 santim
    const vat = calculateVatSantim(subtotal); // 15% of 450,000 = 67,500
    const total = subtotal + vat; // 517,500 santim (5,175.00 ETB)

    assert.equal(subtotal, 450_000);
    assert.equal(vat, 67_500);
    assert.equal(total, 517_500);
    assert.equal(formatSantim(total), '5,175.00 ETB');
  });

  it('Scenario 6: Business plan with 2 extra seats (average 17 seats)', () => {
    const plan = PLANS.business;
    const averageSeats = 17;
    const extraSeats = Math.max(0, averageSeats - plan.includedSeats); // 17 - 15 = 2
    const seatCharges = extraSeats * plan.extraSeatPriceSantim; // 2 * 12,000 = 24,000

    const subtotal = plan.basePriceSantim + seatCharges; // 450,000 + 24,000 = 474,000
    const vat = calculateVatSantim(subtotal); // 15% of 474,000 = 71,100
    const total = subtotal + vat; // 545,100 santim

    assert.equal(extraSeats, 2);
    assert.equal(seatCharges, 24_000);
    assert.equal(subtotal, 474_000);
    assert.equal(vat, 71_100);
    assert.equal(total, 545_100);
  });

  it('Scenario 7: Starter plan with 3 extra seats and 5,000 overage events', () => {
    const plan = PLANS.starter;
    const extraSeats = 3;
    const seatCharges = extraSeats * plan.extraSeatPriceSantim; // 3 * 15,000 = 45,000
    const { overageSantim } = calculateOverageSantim(105_000, plan.includedEvents, plan.overagePricePerThousandSantim); // 5 * 1,500 = 7,500

    const subtotal = plan.basePriceSantim + seatCharges + overageSantim; // 150,000 + 45,000 + 7,500 = 202,500
    const vat = calculateVatSantim(subtotal); // 15% of 202,500 = 30,375
    const total = subtotal + vat; // 232,875 santim

    assert.equal(subtotal, 202_500);
    assert.equal(vat, 30_375);
    assert.equal(total, 232_875);
  });

  it('Scenario 8: Partial Credit Note deduction (500 ETB applied)', () => {
    const subtotal = 202_500;
    const vat = 30_375;
    const totalBeforeCredit = subtotal + vat; // 232,875
    const creditAvailable = 50_000; // 500 ETB

    const creditApplied = Math.min(creditAvailable, totalBeforeCredit);
    const finalTotal = totalBeforeCredit - creditApplied;

    assert.equal(creditApplied, 50_000);
    assert.equal(finalTotal, 182_875);
  });

  it('Scenario 9: Full Credit Note deduction exceeding invoice amount', () => {
    const totalBeforeCredit = 172_500;
    const creditAvailable = 300_000; // 3,000 ETB credit

    const creditApplied = Math.min(creditAvailable, totalBeforeCredit);
    const finalTotal = totalBeforeCredit - creditApplied;
    const remainingCredit = creditAvailable - creditApplied;

    assert.equal(creditApplied, 172_500);
    assert.equal(finalTotal, 0);
    assert.equal(remainingCredit, 127_500);
  });

  it('Scenario 10: Mid-month plan upgrade proration (Starter to Business on day 15)', () => {
    const periodStart = new Date('2026-11-01T00:00:00Z');
    const periodEnd = new Date('2026-12-01T00:00:00Z');
    const changeDate = new Date('2026-11-16T00:00:00Z'); // Exact half-way (15 days remaining)

    const oldProration = calculateProration(PLANS.starter.basePriceSantim, periodStart, periodEnd, changeDate);
    const newProration = calculateProration(PLANS.business.basePriceSantim, periodStart, periodEnd, changeDate);

    // Old plan unused credit: 150,000 * 15 / 30 = 75,000 santim
    assert.equal(oldProration.unusedCreditSantim, 75_000);
    // New plan prorated charge: 450,000 * 15 / 30 = 225,000 santim
    assert.equal(newProration.unusedCreditSantim, 225_000);

    const netAdjustment = newProration.unusedCreditSantim - oldProration.unusedCreditSantim;
    assert.equal(netAdjustment, 150_000); // 1,500.00 ETB net due
  });

  it('Scenario 11: Half-up integer rounding on odd VAT centimes', () => {
    // 12,345 santim * 15% = 1,851.75 santim -> should round to 1,852 santim
    const subtotal = 12_345;
    const vat = calculateVatSantim(subtotal, 1500);
    assert.equal(vat, 1852);
    assert.equal(subtotal + vat, 14_197);
  });

  it('Scenario 12: Zero subtotal always produces zero VAT and zero total', () => {
    const vat = calculateVatSantim(0);
    assert.equal(vat, 0);
  });
});
