# ADR 0006: Rollup Design - Dirty-Bucket Recompute vs Incremental Increment

## Context
Aggregated analytics (revenue, orders, units, expenses, unique customers) must remain correct even under duplicate events, retried network batches, late-arriving events, and out-of-order ingestion.

## Decision
Implement a **Dirty-Bucket Recomputation** architecture:
1. Ingestion marks affected hourly/daily buckets dirty by inserting `orgId:bucketStart` into a Redis dirty set.
2. Background BullMQ rollup workers debounce-pull dirty buckets and run an idempotent aggregation directly against raw events for that specific time window.
3. The computed result is written to `rollupsHourly` or `rollupsDaily` with a `$set` operation and an incremented `version`.
4. Updating rollups increments `dataVersion` in Redis, invalidating dashboard query caches.

## Alternatives Considered
- **Incremental `$inc` on Ingestion**: Vulnerable to double-counting when workers retry failed jobs, and complex to reconcile when late events arrive.

## Consequences
- **Positive**: 100% mathematically correct and idempotent. Automatic self-healing on retries.
- **Negative**: Moderate CPU overhead during aggregation, mitigated by limiting recomputation only to dirty buckets and using Redis debounce timers (e.g. 2-5 second delay window).
