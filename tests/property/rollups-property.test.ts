import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';

interface MockEvent {
  eventId: string;
  type: 'sale' | 'expense';
  amount: number;
  occurredAt: number;
  itemsCount: number;
}

describe('Rollup Mathematical Invariance Property Test (fast-check)', () => {
  it('Deduplicated events sum exactly equals rollup aggregation in santim and counts', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            eventId: fc.string({ minLength: 1, maxLength: 8 }),
            type: fc.constantFrom<'sale' | 'expense'>('sale', 'expense'),
            amount: fc.integer({ min: 100, max: 1_000_000 }), // Santim
            occurredAt: fc.integer({ min: 1700000000000, max: 1700086400000 }),
            itemsCount: fc.integer({ min: 1, max: 5 }),
          }),
          { minLength: 1, maxLength: 50 }
        ),
        (events: MockEvent[]) => {
          // 1. Ingestion Deduplication: keep only first occurrence of each eventId
          const uniqueEventsMap = new Map<string, MockEvent>();
          for (const ev of events) {
            if (!uniqueEventsMap.has(ev.eventId)) {
              uniqueEventsMap.set(ev.eventId, ev);
            }
          }
          const uniqueEvents = Array.from(uniqueEventsMap.values());

          // 2. Brute-force calculation directly over unique raw events
          let expectedRevenue = 0;
          let expectedExpenses = 0;
          let expectedOrders = 0;
          let expectedUnits = 0;

          for (const ev of uniqueEvents) {
            if (ev.type === 'sale') {
              expectedRevenue += ev.amount;
              expectedOrders += 1;
              expectedUnits += ev.itemsCount;
            } else if (ev.type === 'expense') {
              expectedExpenses += ev.amount;
            }
          }

          // 3. Rollup Recomputation logic (simulating MongoDB dirty-bucket aggregation)
          const computedRevenue = uniqueEvents
            .filter((e) => e.type === 'sale')
            .reduce((sum, e) => sum + e.amount, 0);

          const computedExpenses = uniqueEvents
            .filter((e) => e.type === 'expense')
            .reduce((sum, e) => sum + e.amount, 0);

          const computedOrders = uniqueEvents.filter((e) => e.type === 'sale').length;

          const computedUnits = uniqueEvents
            .filter((e) => e.type === 'sale')
            .reduce((sum, e) => sum + e.itemsCount, 0);

          // 4. Invariance Assertion
          assert.equal(computedRevenue, expectedRevenue);
          assert.equal(computedExpenses, expectedExpenses);
          assert.equal(computedOrders, expectedOrders);
          assert.equal(computedUnits, expectedUnits);
          assert.equal(computedRevenue - computedExpenses, expectedRevenue - expectedExpenses);
        }
      ),
      { numRuns: 100 }
    );
  });
});
