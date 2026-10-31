# ADR 0004: Event Schema, Custom Properties, and Cardinality Caps

## Context
Unbounded custom attributes and dimensions can lead to memory exhaustion during aggregation and MongoDB index explosion.

## Decision
Define a strict event schema:
- Core typed fields: `orgId`, `sourceId`, `eventId` (max 128 chars), `type` (`sale` | `expense` | `custom`), `occurredAt`, `receivedAt`, `period` (YYYY-MM), `amount` (integer santim, ETB), `currency`, `channel`, `branch`, `customerRef` (opaque string, optional SHA-256 hash), `items[]`.
- Custom properties: capped at 20 keys, key length <= 40 chars, value length <= 200 chars. Reserved prefixes (`$`, `_`, `.` operators) are rejected.
- Cardinality caps enforced per organization:
  - Max 200 distinct `channel` values
  - Max 200 distinct `branch` values
  - Max 5,000 distinct `sku` values for top-N ranking
  - Excess values are mapped to `"other"` in rollups and queries.

## Alternatives Considered
- **Uncapped custom properties**: Subject to denial of service through high cardinality dimension explosive expansion.
- **Strictly fixed schema without custom fields**: Too rigid for shop owners needing custom POS tags.

## Consequences
- **Positive**: Bounded memory footprint, predictable index sizes, resilience against memory exhaustion attacks.
- **Negative**: Extremely diverse enterprise catalogs beyond 5,000 distinct SKUs per org must utilize external SKU grouping.
