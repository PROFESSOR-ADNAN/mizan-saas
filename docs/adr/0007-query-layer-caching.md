# ADR 0007: Query Layer, Caching, and Result Limits

## Context
Concurrent dashboard users running large aggregations can trigger CPU starvation and memory spikes on the VPS.

## Decision
1. **Query Planning**: Queries automatically route to `rollupsHourly` for 1-7 day ranges, `rollupsDaily` for >7 day ranges, and fall back to bounded raw queries only for real-time (<2 hours) or custom property slices.
2. **Hard Limits**:
   - `maxTimeMS`: 3000ms hard ceiling on all queries
   - Result cap: 5,000 rows maximum
   - Dashboard concurrency: Max 4 active queries per user, 20 per organization enforced via Redis semaphores
   - Max 12 widgets per dashboard
3. **Caching & Request Coalescing**:
   - Cache key: `sha256(orgId + querySpec + dataVersion)`
   - TTL: 60 seconds
   - In-flight request coalescing prevents cache stampedes when 50 users load the same dashboard.

## Alternatives Considered
- **Direct unbounded raw queries**: Causes MongoDB memory pressure and unacceptably high p99 response times.

## Consequences
- **Positive**: Strict noisy-neighbor protection; sub-150ms cached dashboard queries.
- **Negative**: Queries spanning custom properties not present in rollups are limited to a maximum 30-day window.
