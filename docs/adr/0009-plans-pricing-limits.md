# ADR 0009: Plans, Prices in ETB, Limits, and Spend Caps

## Context
Ethiopian SaaS businesses operate in Ethiopian Birr (ETB). Float math causes rounding discrepancies. Clear tiers and spend caps protect tenants from surprise bills.

## Decision
All monetary values are stored as 64-bit integer santim (1 ETB = 100 santim).
Plans are stored as data in the `plans` collection with versioned schemas:

| Plan | Base Price (ETB / Santim) | Events Included | Seats Included | Extra Seat (ETB) | Overage (per 1,000 events) | Raw Retention | API Limit |
|---|---|---|---|---|---|---|---|
| **Free** | 0 ETB / 0 s | 10,000 | 2 | N/A | Hard Cap (429) | 30 days | 5 req/s |
| **Starter** | 1,500 ETB / 150,000 s | 100,000 | 5 | 150 ETB / 15,000 s | 15 ETB / 1,500 s | 180 days | 30 req/s |
| **Business** | 4,500 ETB / 450,000 s | 500,000 | 15 | 120 ETB / 12,000 s | 10 ETB / 1,000 s | 730 days | 100 req/s |

- **Trial**: 14-day trial of Business without credit card; falls back to Free if not upgraded.
- **Alerts**: Sent at 50%, 80%, and 100% of included events via email and outbound webhook.
- **Spend Cap**: Paid plan owners can set an optional monthly overage ceiling in ETB. When reached, ingestion returns 429 for non-included events with instructions on raising the cap.

## Alternatives Considered
- **US Dollar pricing**: Unusable for domestic Ethiopian bank transfers, mobile money, and tax compliance.
- **Float arithmetic**: Introduces precision bugs in invoice calculations.

## Consequences
- **Positive**: Exact financial calculations to the santim; transparent predictable billing for Ethiopian businesses.
- **Negative**: Currency conversion logic needed if foreign cards or cross-border plans are introduced in future versions.
