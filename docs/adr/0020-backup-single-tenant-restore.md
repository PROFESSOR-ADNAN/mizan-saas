# ADR 0020: MongoDB Backup Strategy and Single-Tenant Restore Architecture

## Context
Tenants share database collections. We must support both full disaster recovery and granular single-tenant data restoration without overwriting or corrupting other tenants' live data.

## Decision
1. **Full Backup Pipeline**:
   - Automated nightly `mongodump --oplog --gzip` scheduled via cron.
   - Archives encrypted with SOPS/age and shipped via `restic` to an off-site S3-compatible cold storage bucket following the 3-2-1 backup rule.
   - Target RPO <= 24 hours (hourly oplog snapshots provide RPO <= 1 hour for billing). Target RTO <= 2 hours.
2. **Single-Tenant Restore Procedure**:
   - Full backup is restored into an isolated temporary scratch database (`mizan_scratch_restore`).
   - A specialized script `scripts/restore-tenant.sh` queries the scratch database filtered strictly by `orgId`.
   - The script verifies document counts, confirms isolation integrity, and merges/exports the specific tenant's records back into the target environment.
3. **Monthly Automated DR Rehearsal**:
   - Automated CI job restores the latest backup into a test container and runs data integrity checks:
     - Sum of invoice line items equals invoice total santim.
     - Usage ledger sum matches billed event count.
     - Rollup values match raw event aggregations on sample buckets.
     - Zero tenant-owned documents lack an `orgId`.

## Alternatives Considered
- **Direct production database restore for a single tenant**: Catastrophic risk of reverting all other active tenants to past states.

## Consequences
- **Positive**: Provable single-tenant disaster recovery without cross-tenant interference.
- **Negative**: Requires temporary scratch disk capacity equal to the backup size during restoration.
