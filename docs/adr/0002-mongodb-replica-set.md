# ADR 0002: MongoDB Single-Node Replica Set

## Context
Multi-document ACID transactions are required for atomic operations:
1. Deduplication and usage counter increments
2. Invoice generation and gap-free counter sequence increment
3. Organization deletion with audit preservation
MongoDB standalone instances do not support multi-document transactions.

## Decision
Configure MongoDB as a single-node replica set (`rs0`) initialized with `rs.initiate()`.

## Alternatives Considered
- **Standalone MongoDB**: Lacks transaction support, risking orphaned invoice line items and inconsistent billing sequences.
- **3-Node Replica Set**: Triples memory and disk footprint, violating the 4-8 GB RAM budget on a single VPS.

## Consequences
- **Positive**: Enables full multi-document transactions with write concern `majority`.
- **Negative**: No automatic failover without additional nodes. Mitigated by automated hourly oplog backups and disaster recovery runbooks.
