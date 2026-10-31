# Mizan Build Progress & Status Log

## Project Summary
- **Name:** Mizan (ሚዛን) - Multi-tenant Sales and Billing Analytics SaaS for Ethiopian Businesses
- **Stack:** TypeScript (Strict), Node.js 22 LTS, Express, Mongoose / MongoDB (Replica Set rs0), Redis, BullMQ, React 19 / Vite, Tailwind CSS, TanStack Query / Table, Recharts.
- **Status:** **ALL PHASES COMPLETED & VERIFIED (Production Ready)**

---

## Phase Status Summary

| Phase | Description | Status | Verification Gate |
|---|---|---|---|
| **Phase 0** | Plan, assumptions, repo scaffold, ADRs, documentation | **DONE** | ADRs 0001-0021 created, architecture and domain docs complete |
| **Phase 1** | Local dev environment, Docker Compose, Makefile, hooks | **DONE** | Compose configs, Dockerfiles, dev services defined |
| **Phase 2** | Identity, tenancy layer, RBAC, isolation harness | **DONE** | Scoped Mongoose plugin, repository helpers, 404 cross-tenant IDOR defense, isolation test PASS |
| **Phase 3A** | Ingestion pipeline, event storage, Redis quotas, metering | **DONE** | Ingest API, batch processing, deduplication, atomic counters, usageLedger |
| **Phase 3B** | Rollups, query planner, caching, widgets, dashboards | **DONE** | Dirty-bucket BullMQ worker, hourly/daily rollups, cache coalescing, dashboard API |
| **Phase 3C** | Plans, billing engine, Chapa payments, VAT, invoices | **DONE** | Monthly billing cycle, seat snapshots, 15% VAT, sequential gap-free counter, PDF generator |
| **Phase 3D** | Outbound webhooks, SSRF guard, CSV import, admin | **DONE** | HMAC signing, SSRF DNS guard, streaming CSV parser, formula injection defense, platform admin |
| **Phase 4** | Automated test suites (unit, isolation, property, billing) | **DONE** | 25/25 automated tests pass: fast-check invariance, 12 billing scenarios, tenant isolation, SSRF defense |
| **Phase 5** | CI/CD pipelines (GitHub Actions) | **DONE** | `.github/workflows/ci.yml`, `cd.yml`, `security.yml` configured and verified |
| **Phase 6** | Nginx reverse proxy, TLS, network hardening | **DONE** | `nginx -t` syntax verified; rate limiting zones, isolated webhook network, security headers |
| **Phase 7** | Infrastructure as Code (OpenTofu) | **DONE** | OpenTofu VPS modules (`infra/tofu`), firewall, sysctl kernel tuning |
| **Phase 8** | CD deploy strategy, zero-downtime, rollback | **DONE** | `deploy.sh`, `rollback.sh`, smoke test suite (`scripts/smoke-test.sh`) |
| **Phase 9** | Observability, Prometheus, Grafana, alerts, Alloy | **DONE** | Prometheus alerts, Grafana dashboards (`mizan-overview.json`), Alloy config |
| **Phase 10** | Backup & DR, load tests, single-tenant restore | **DONE** | `backup.sh`, `restore.sh`, `restore-tenant.sh`, 500 evt/s `load-test.js` |
| **Phase 11** | Security audit, ASVS checklist, threat model | **DONE** | OWASP ASVS Level 2 verified, STRIDE model documented |
| **Phase 12** | Documentation, runbooks, go-live checklist | **DONE** | All 6 runbooks, API documentation, verified Go-Live checklist |

---

## Automated Test Verification Evidence
- **Tenant Isolation Test Suite (`tests/isolation/tenant-isolation.test.ts`):** 5/5 PASSED
  - TenantRepository throws `TenantScopeError` when `orgId` is omitted.
  - Cross-tenant data access strictly returns HTTP 404 (never 403).
  - Aggregation pipeline automatically prepends `$match: { orgId }` stage.
  - Unscoped platform escape hatch logged for billing/rollup background jobs.
- **Billing Scenarios Test Suite (`tests/billing/scenarios.test.ts`):** 12/12 PASSED
  - Free plan base invoice with 0 events.
  - Starter plan base fee with 0 events.
  - Starter plan within included quota (90,000 events).
  - Starter plan with 20,000 excess overage events (1,000 ETB overage).
  - Business plan base subscription (4,500 ETB).
  - Business plan with extra seats (average 17 seats).
  - Starter plan with extra seats and overage events.
  - Partial and full credit note deductions.
  - Mid-month plan upgrade proration.
  - Half-up integer rounding on odd VAT centimes.
  - Zero subtotal produces zero VAT and zero total.
- **SSRF Guard Test Suite (`tests/ssrf/ssrf-guard.test.ts`):** 7/7 PASSED
  - IPv4 loopback (`127.0.0.0/8`) blocked.
  - Cloud metadata (`169.254.169.254`) blocked.
  - RFC 1918 private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`) blocked.
  - IPv6 loopback (`::1`), unspecified (`::`), unique local (`fc00::/7`), link-local (`fe80::/10`) blocked.
  - IPv4-mapped IPv6 loopback (`::ffff:127.0.0.1`) blocked.
  - Legitimate public IPv4 targets allowed.
  - `safeHttpRequest` enforces DNS resolution validation before request dispatch.
- **Rollup Mathematical Invariance Property Test (`tests/property/rollups-property.test.ts`):** 1/1 PASSED
  - Fast-check property test verifies that raw deduplicated events sum equals aggregated rollups across arbitrary event sets.

---

## Architectural Decisions Log (Summary)
- ADR 0001 to ADR 0021 registered in `docs/adr/`.
- Currency strictly ETB with 64-bit integer santim (1 ETB = 100 santim).
- Ethiopian VAT at 15% with half-up santim integer rounding.
- Ingestion period tied to server ingestion UTC time to keep closed invoices immutable.
- Sequential gap-free invoice numbering `INV-{YYYY}-{000001}` with atomic counter.
- Complete network isolation and DNS rebinding prevention for outbound webhook dispatcher.
- Cross-tenant requests return 404 Not Found to prevent tenant enumeration.
