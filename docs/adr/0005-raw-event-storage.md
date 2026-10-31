# ADR 0005: Raw Event Storage (Regular Collection) and Indexes

## Context
MongoDB offers regular collections and Time Series Collections (TSC). We must evaluate query flexibility, updates, indexing, and TTL deletion characteristics for 10 million events.

## Decision
Use standard regular collections for `events` with compound B-Tree indexes:
1. `(orgId: 1, eventId: 1)` - UNIQUE index for strict idempotent deduplication
2. `(orgId: 1, occurredAt: -1)` - Timeline range queries
3. `(orgId: 1, period: 1)` - Ingestion period billing reconciliation
4. `(orgId: 1, type: 1, occurredAt: -1)` - Type-filtered queries (sales vs expenses)

## Alternatives Considered
- **Time Series Collections (TSC)**: TSC in MongoDB does not support unique secondary indexes on arbitrary fields (e.g. `(orgId, eventId)`), which breaks client-side deduplication guarantees. Updates and complex multi-key indexes are also restricted.

## Consequences
- **Positive**: Strict uniqueness deduplication at the storage layer; full support for multi-key indexing and point queries.
- **Negative**: Regular collections consume ~15% more disk space than compressed TSC buckets; mitigated by plan-based retention pruning and automated index compression (WiredTiger snappy).
