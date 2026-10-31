# ADR 0014: Dunning Schedule and Ingestion Safety Cap

## Context
When tenants fail to pay invoices on time, the system must balance revenue recovery with data integrity. Abruptly dropping incoming POS sales data destroys trust and harms business operations.

## Decision
1. **Dunning Schedule (Net 7 due date)**:
   - Due - 3 days: Upcoming invoice reminder email
   - Due Date: Payment due notice
   - Due + 1 day: Status set to `past_due`, notice sent
   - Due + 3 days: Second overdue reminder
   - Due + 7 days: Final warning email
   - Due + 14 days: Status transitioned to `suspended`.
2. **Ingestion Behavior on Overdue**:
   - Ingestion is **NEVER silently dropped** when an organization is `past_due` or `suspended`.
   - While `suspended`, dashboards are locked to **read-only mode**.
   - Ingestion continues accepting events up to a **Safety Cap** (default 500,000 events or 3x monthly plan quota).
   - Once the safety cap is exceeded during suspension, ingestion returns `429 Too Many Requests` with a clear explanation.
   - Upon successful payment of all outstanding invoices, the organization immediately returns to `active` status and full dashboard write privileges are restored.

## Alternatives Considered
- **Immediate rejection of events upon overdue**: Causes irrecoverable loss of real-world retail store sales records.
- **Uncapped free ingestion during suspension**: Subject to abuse by delinquent accounts.

## Consequences
- **Positive**: High customer retention, operational goodwill, zero accidental data loss.
- **Negative**: Platform incurs minor storage cost during the 14-day grace window, bounded by the safety cap.
