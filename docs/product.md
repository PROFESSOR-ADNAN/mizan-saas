# Mizan Product Specification & User Stories

## 1. Product Summary
Mizan (ሚዛን) is a multi-tenant sales and expense analytics SaaS built specifically for small and medium businesses in Ethiopia. It transforms fragmented retail logs, Telegram store transactions, and local POS records into unified analytics dashboards, while providing automated usage-based billing in Ethiopian Birr (ETB) through Chapa.

## 2. Target User Personas
- **Shop Owners & General Managers**: Need clear visibility into daily cash flow, revenue trends, top-selling items, and profit/loss without Excel spreadsheets.
- **Store Clerks & Cashiers**: Record sales via barcode scanner, web portal, or automated Telegram webhook integration.
- **Accountants & Finance Officers**: Manage invoices, verify 15% VAT allocations, generate tax compliance documentation, and process online payments.
- **Developers & System Integrators**: Integrate retail POS or e-commerce websites via REST API keys.
- **Platform Administrators**: Supervise system health, monitor tenant quotas, issue credit adjustments, and handle compliance requests.

---

## 3. User Stories, Acceptance Criteria & Test Traceability

| ID | User Story | Acceptance Criteria | Automated Test Mapping |
|---|---|---|---|
| **US-01** | As an analyst in Org A, I want full dashboard visibility so I can review sales without accessing Org B. | Any attempt to fetch, edit, or list resources with Org B's ID returns 404 Not Found. | `tests/isolation/tenant-isolation.test.ts` |
| **US-02** | As a store cashier using POS, I want to retry sending a sale event so that network drops don't fail my receipt. | Sending the same `eventId` multiple times stores exactly 1 event and returns `duplicate` on duplicates. | `tests/unit/ingest-dedup.test.ts` |
| **US-03** | As an owner on the Free tier, I want clear quota warnings so I can upgrade before disruption. | Alerts fire at 50%, 80%, and 100% of included events; at 100%, ingestion returns 429 with retry instructions. | `tests/unit/quota-enforcement.test.ts` |
| **US-04** | As an accountant, I want mathematically exact invoices so our financial books reconcile. | Invoice total equals the sum of line items + 15% VAT, and billed event count matches unique accepted events. | `tests/billing/scenarios.test.ts` |
| **US-05** | As a shop owner 14 days overdue, I want my POS events still saved so I do not lose customer sales records. | When an org is `suspended`, dashboards are read-only, but events are accepted up to the safety cap. | `tests/unit/dunning-lifecycle.test.ts` |
| **US-06** | As a branch manager in Branch 2, I want my dashboard restricted so I only see Branch 2 data. | A user limited to Team "Branch 2" receives queries automatically filtered to Branch 2 data sources. | `tests/unit/team-scoping.test.ts` |
| **US-07** | As an owner, I want to invite an accountant so they can manage our invoices. | Invitations are email-bound, expire in 7 days, and cannot reveal user existence. | `tests/unit/invitation-flow.test.ts` |
| **US-08** | As a sole owner, I want protection against accidental self-removal so the business is not orphaned. | Attempting to leave, delete, or demote the sole owner returns 400 Bad Request. | `tests/unit/last-owner.test.ts` |
| **US-09** | As an owner, I want to transfer ownership to my partner so they have full administrative control. | Ownership transfer requires nominee acceptance and demotes previous owner to admin. | `tests/unit/owner-transfer.test.ts` |
| **US-10** | As a developer, I want scoped API keys so POS terminals cannot read analytics dashboards. | Key with scope `ingest:write` cannot access `/ingest/v1/metrics/...`. | `tests/unit/api-key-scopes.test.ts` |
| **US-11** | As an owner, I want to import historical sales via CSV so I can see year-to-date performance. | Streaming CSV parser validates columns, flags errors with row numbers, and runs in background. | `tests/unit/csv-import.test.ts` |
| **US-12** | As a security officer, I want CSV export safe against formula injection. | Cells starting with `=`, `+`, `-`, `@`, `\t`, `\r` are prefixed with a quote `'`. | `tests/unit/csv-sanitize.test.ts` |
| **US-13** | As a store manager, I want Ethiopian fiscal year presets so tax reporting aligns with Hamle 1. | Setting fiscal year start to 8 July aligns all yearly aggregate queries with the Ethiopian calendar. | `tests/unit/fiscal-year.test.ts` |
| **US-14** | As an owner on Starter plan, I want to upgrade to Business immediately so my team gets more seats. | Upgrading prorates base fee to the exact santim; extra seats take effect immediately. | `tests/billing/proration.test.ts` |
| **US-15** | As an owner, I want to pay monthly invoices using Chapa with Telebirr or local bank cards. | Payment initialization redirects to Chapa; webhook verification validates amount and signature. | `tests/billing/chapa-webhook.test.ts` |
| **US-16** | As a developer, I want signed webhooks so my ERP knows when an invoice is marked paid. | Outbound webhooks include `X-Mizan-Signature` with HMAC-SHA256 and unix timestamp. | `tests/unit/webhook-signing.test.ts` |
| **US-17** | As a security engineer, I want the webhook dispatcher protected against SSRF. | Webhook URLs resolving to private, loopback, or metadata IPs (`169.254.169.254`) are blocked. | `tests/ssrf/ssrf-guard.test.ts` |
| **US-18** | As an analyst, I want to share a dashboard with investors via a temporary link. | Public share links are read-only, sanitized of org PII, and expire within 90 days. | `tests/unit/share-links.test.ts` |
| **US-19** | As an owner, I want to see weekly sales summaries in Amharic in my email. | Scheduled report generator compiles metrics with Ethiopic font and send via SMTP. | `tests/unit/email-report.test.ts` |
| **US-20** | As an admin, I want an immutable audit log so I can review security actions. | Member removals, key creations, and plan changes append immutable audit records. | `tests/unit/audit-log.test.ts` |
| **US-21** | As a platform admin, I want to extend an Ethiopian startup's trial without viewing their raw events. | Platform admin console can extend trial and issue credit notes, but cannot read raw sales events. | `tests/unit/admin-console.test.ts` |
| **US-22** | As an owner closing down my shop, I want to delete my organization with a 30-day grace period. | Org enters `pending_deletion` for 30 days before full event purge; tax invoices are retained. | `tests/unit/tenant-lifecycle.test.ts` |
| **US-23** | As an Amharic-speaking clerk, I want to switch the interface language to Amharic. | UI toggles between English and Amharic with full i18n key coverage. | `tests/unit/i18n.test.ts` |
| **US-24** | As a POS engineer, I want batch event ingestion to return per-event results. | Ingesting 100 events returns status array with individual status for each item. | `tests/unit/batch-ingest.test.ts` |
| **US-25** | As an ops engineer, I want late-arriving offline events to automatically update past rollups. | Late events trigger recomputation of historical dirty buckets idempotently. | `tests/property/rollup-recompute.test.ts` |
| **US-26** | As an owner, I want spend caps on overage events so monthly cloud bills stay within budget. | Ingestion halts on paid plan when customer-specified overage spend cap is reached. | `tests/unit/spend-cap.test.ts` |
| **US-27** | As a finance auditor, I want sequential gap-free invoice numbers for legal compliance. | Invoice numbers generated via atomic counter: `INV-{YYYY}-{000001}` without gaps. | `tests/billing/invoice-numbering.test.ts` |
| **US-28** | As a CFO, I want downloadable PDF invoices for tax filing. | Server generates compliant PDF containing platform TIN, customer TIN, line items, and VAT. | `tests/unit/pdf-invoice.test.ts` |
| **US-29** | As an owner, I want to rotate API keys with zero downtime for our POS network. | Secondary API key can be active concurrently during transition window. | `tests/unit/key-rotation.test.ts` |
| **US-30** | As a system administrator, I want to wipe Redis without corrupting invoices or ledgers. | Wiping Redis leaves `usageLedger` and `invoices` untouched; Redis counters rebuild cleanly. | `tests/unit/redis-resilience.test.ts` |
| **US-31** | As a user, I want multi-factor authentication (TOTP) to secure my business login. | 2FA verification using standard TOTP algorithms (RFC 6238). | `tests/unit/mfa-totp.test.ts` |
| **US-32** | As an owner, I want to export all our sales data in JSON/CSV format. | Data export background job archives events and invoices into downloadable ZIP. | `tests/unit/tenant-export.test.ts` |
| **US-33** | As an analyst, I want top-N product rankings so I know what inventory to reorder. | Analytics query aggregates top SKUs with values past cap rolled into "other". | `tests/unit/top-n-skus.test.ts` |
| **US-34** | As a platform operator, I want backpressure so high-ingestion bursts do not crash workers. | Ingest API responds with `503 Service Unavailable` with `Retry-After` if worker queue lags. | `tests/unit/backpressure.test.ts` |
| **US-35** | As an auditor, I want credit notes to be append-only rather than mutating paid invoices. | Issuing refund or proration credit creates a signed credit note linked to next invoice. | `tests/billing/credit-notes.test.ts` |

---

## 4. Out of Scope (Post-MVP)
- SAML / OIDC enterprise single sign-on
- Telegram bot direct conversational ingestion
- Dedicated MongoDB cluster per enterprise tenant
- Anomaly detection ML algorithms
- Card-on-file automatic recurring deductions (Chapa hosted invoice-and-pay flow used instead)
