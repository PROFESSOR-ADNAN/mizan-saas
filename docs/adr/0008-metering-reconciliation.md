# ADR 0008: Metering Design - Redis Fast Path, MongoDB Truth, and 0-Drift Reconciliation

## Context
High-volume ingestion requires sub-millisecond quota checks, but financial invoicing requires durable, immutable records matching reality to the exact santim.

## Decision
Adopt a dual-tier metering model:
1. **Enforce Fast (Redis)**: Redis atomic counters (`usage:{orgId}:{period}:events`) provide instant quota verification and drive the live UI meters.
2. **Bill From Truth (MongoDB)**: Invoices are never generated from Redis. An hourly reconciliation job tallies durable MongoDB events by `(orgId, period)` and records append-only `usageLedger` entries.
3. **Bill on Ingestion Time**: Each event receives `period` derived from server `receivedAt` (UTC) so past billing periods never mutate when historical backfills arrive.
4. **Reconciliation**:
   - Compares Redis counters with `usageLedger` sums hourly.
   - If drift exceeds 0.1%, an alert fires and Redis is synchronized from MongoDB truth.
   - Wiping Redis entirely does not alter any invoice or billing outcome.

## Alternatives Considered
- **Direct database count on every ingest**: Introduces database contention under 500 req/s load.
- **Invoicing from Redis counters**: Vulnerable to counter loss during Redis restarts or network splits.

## Consequences
- **Positive**: Sub-millisecond latency on ingestion path; absolute financial auditability.
- **Negative**: Slight asynchronous delay (up to 1 hour) before official ledger entries are sealed.
