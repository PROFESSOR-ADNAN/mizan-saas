# ADR 0003: Shared-Collection Multi-Tenancy and Isolation Layer

## Context
Tenancy architecture determines operational cost, database connection overhead, and isolation guarantees across 200+ tenants.

## Decision
Adopt shared-collection multi-tenancy where every tenant document contains an immutable `orgId` as the leading key of all indexes.
Isolation is enforced by:
1. A strict Mongoose tenant-scoping plugin intercepting all queries and mutations, throwing a typed `TenantScopeError` if `orgId` is omitted.
2. An aggregation pre-processor automatically prepending `{ $match: { orgId } }` to all aggregation pipelines.
3. An explicit, audited escape hatch named `unscopedForPlatformJob` for background billing/reconciliation jobs.
4. HTTP layer returning `404 Not Found` (never 403) on cross-tenant IDOR attempts to prevent tenant enumeration.

## Alternatives Considered
- **Database-per-tenant**: Exceeds MongoDB memory limits (file descriptors, cache partitioning per DB) on a single 8 GB VPS.
- **Collection-per-tenant**: High namespace overhead, index bloat, and complex migration automation.

## Consequences
- **Positive**: Extremely resource-efficient, predictable memory profile, rapid automated schema migrations.
- **Negative**: Risk of developer error bypassing tenant scoping; fully mitigated by automated repository enforcement, strict ESLint rules, and the generated tenant-isolation test suite.
