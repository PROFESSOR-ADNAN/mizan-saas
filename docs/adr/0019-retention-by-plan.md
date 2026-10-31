# ADR 0019: Retention by Plan and Automated Deletion Jobs

## Context
Storing raw events indefinitely across all tiers would breach the 80 GB disk budget on the single VPS. Different plans have distinct contractual data retention periods.

## Decision
1. **Retention Periods**:
   - **Free Plan**: 30 days raw events, 90 days hourly rollups, 365 days daily rollups.
   - **Starter Plan**: 180 days raw events, 365 days hourly rollups, 3 years daily rollups.
   - **Business Plan**: 730 days (2 years) raw events, permanent rollups.
   - **Financial Records**: `invoices`, `invoiceLines`, `creditNotes`, and `usageLedger` entries are legally mandated to be preserved for 10 years per Ethiopian Commercial Code & Tax Regulations.
2. **Nightly Retention Job**:
   - A BullMQ worker runs nightly at 02:00 UTC.
   - Deletes raw events where `occurredAt < now() - retentionDays` for each organization's plan tier.
   - Bulk deletion is performed in batches of 5,000 documents using `_id` cursor pagination to avoid long write locks.
   - Rollup buckets older than the raw retention threshold are preserved, ensuring historical trend queries remain functional.

## Alternatives Considered
- **MongoDB TTL Indexes**: TTL indexes evaluate a single field statically across the entire collection and cannot accommodate dynamic, per-tenant retention rules defined by plan tiers.

## Consequences
- **Positive**: Disk usage remains bounded within VPS specifications; full legal compliance with tax record preservation.
- **Negative**: Granular raw queries beyond the plan's retention threshold become unavailable (only rollups remain).
