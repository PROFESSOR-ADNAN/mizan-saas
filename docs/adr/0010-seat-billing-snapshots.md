# ADR 0010: Seat Billing Method - Daily Snapshots and Proration

## Context
Tenants add and remove members throughout a billing cycle. Billing must reflect actual utilization without punitive fees for temporary access.

## Decision
1. **Daily Seat Snapshots**: A background worker records `seatSnapshots` once every 24 hours per organization at 00:00 `Africa/Addis_Ababa` time.
2. **Formula**:
   $$\text{Billable Seats} = \max\left(0, \left\lceil \frac{\sum_{d=1}^{N} \text{Active Seats}_d}{N} \right\rceil - \text{Included Seats}\right)$$
   where $N$ is the number of days in the billing period.
3. Seat charge = $\text{Billable Seats} \times \text{Extra Seat Price}$ in santim.
4. Integer arithmetic is used throughout.

## Alternatives Considered
- **Instant charge on seat addition**: Complicates refunds when members are removed after a few days.
- **Billing based solely on end-of-month count**: Subject to gaming (inviting members on day 2 and removing on day 29).

## Consequences
- **Positive**: Fair, tamper-resistant, audit-verifiable billing.
- **Negative**: Requires 30 snapshot rows per organization per month, negligible in MongoDB storage.
