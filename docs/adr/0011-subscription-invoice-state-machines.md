# ADR 0011: Subscription and Invoice State Machines

## Context
Clear, deterministic state transitions are essential for subscription management, billing integrity, and dunning workflows.

## Decision
1. **Subscription State Machine**:
   - States: `trialing`, `active`, `past_due`, `suspended`, `canceled`, `free`
   - Permitted transitions:
     - `trialing -> active` (on plan selection)
     - `trialing -> free` (trial expired without card/payment)
     - `active -> past_due` (invoice due + 1 day)
     - `past_due -> suspended` (invoice due + 14 days; dashboards become read-only)
     - `past_due -> active` (invoice paid)
     - `suspended -> active` (invoice paid)
     - `active -> canceled` (end-of-period cancellation requested)
   - Illegal transitions throw a `StateTransitionError`.

2. **Invoice State Machine**:
   - States: `draft`, `open`, `paid`, `void`, `uncollectible`
   - Transitions:
     - `draft -> open` (finalized at billing cycle close, immutable from this point)
     - `open -> paid` (confirmed via verified Chapa payment)
     - `open -> void` (admin annulment before payment, gap-free counter remains intact)
     - `open -> uncollectible` (long non-payment dunning termination)
   - Once an invoice is in `open` or subsequent states, it is **append-only and immutable**. Adjustments are issued solely via `creditNotes`.

## Alternatives Considered
- **In-place invoice modification**: Violates Ethiopian tax accounting rules and creates auditing discrepancies.

## Consequences
- **Positive**: Strict financial traceability; reliable dunning automation.
- **Negative**: Corrections require issuing explicit credit note documents.
