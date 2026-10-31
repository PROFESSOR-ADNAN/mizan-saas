# Mizan (ሚዛን)
### Production-Grade Multi-Tenant Sales & Billing Analytics SaaS for Ethiopian Businesses

[![CI - Lint, Build & Tests](https://github.com/PROFESSOR-ADNAN/mizan-saas/actions/workflows/ci.yml/badge.svg)](https://github.com/PROFESSOR-ADNAN/mizan-saas/actions/workflows/ci.yml)
[![Node.js Version](https://img.shields.io/badge/node-22.x%20LTS-brightgreen.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Strict TypeScript](https://img.shields.io/badge/TypeScript-5.7%20Strict-blue)](https://www.typescriptlang.org/)
[![Test Coverage](https://img.shields.io/badge/Automated%20Tests-25%20Passed%20(100%25)-success)](tests/)

---

## 1. Architectural Overview

**Mizan** (ሚዛን, meaning *"scale"* or *"balance"* in Amharic) is an enterprise-ready, multi-tenant analytics and billing SaaS platform engineered specifically for the Ethiopian SME market. It bridges the gap between chaotic point-of-sale systems, manual paper notebooks, and fragmented Telegram merchant channels by providing real-time sales telemetry, channel mix intelligence, repeat customer retention tracking, and compliant billing in **Ethiopian Birr (ETB)**.

```
                           [ Public Traffic / Clients ]
                                       │
                                       ▼
                       [ Cloudflare WAF & Edge DNS ]
                                       │
                                       ▼
                        [ Edge Nginx Reverse Proxy ]
                          (Rate Limits & SSL/TLS)
                         /           │           \
                        /            │            \
      /api/v1/ingest   /      /api/  │             \ Static SPA
                      ▼              ▼              ▼
           ┌────────────────┐ ┌───────────────┐ ┌───────────────┐
           │ Ingest Process │ │  API Backend  │ │ React 19 SPA │
           │   (2 Replicas) │ │  (2 Replicas) │ │  (Tailwind)   │
           └───────┬────────┘ └───────┬───────┘ └───────────────┘
                   │                  │
        ┌──────────┴──────────────────┴──────────┐
        │                                        │
        ▼                                        ▼
┌──────────────────┐                    ┌──────────────────┐
│   Redis 7 (AOF)  │                    │ MongoDB 7 Replica│
│  - Quota Limiter │                    │ - Tenant Collections
│  - Dirty Buckets │                    │ - Usage Ledgers  │
│  - Cache Layer   │                    │ - Gap-Free Invs  │
└────────┬─────────┘                    └────────┬─────────┘
         │                                       │
         └──────────────────┬────────────────────┘
                            │
                            ▼
              ┌───────────────────────────┐
              │  BullMQ Background Engine │
              │   (Rollups, Billing Run,  │
              │   SSRF-Guarded Webhooks)  │
              └─────────────┬─────────────┘
                            │
               (Isolated Webhook Network)
                            ▼
               [ External Tenant Webhooks ]
```

---

## 2. Core Architectural Highlights

### 🛡️ Provable Multi-Tenancy & Tenant Isolation
- **Tenant-Scoped Data Layer:** Raw Mongoose models are strictly banned from tenant controllers. Every database access traverses `TenantRepository`, which enforces the `tenantScopedPlugin`.
- **Enumeration Defense:** Cross-tenant resource queries strictly return **HTTP 404 Not Found** (never 403 Forbidden), preventing attackers from enumerating valid resource IDs.
- **Automated Aggregation Guard:** Aggregation pipelines automatically inject `$match: { orgId }` as their first execution stage.
- **Tenant Isolation Test Suite:** Fully automated tests (`tests/isolation/tenant-isolation.test.ts`) assert that querying without an `orgId` throws `TenantScopeError`.

### 💰 64-bit Integer Financial Math (Exact Santim)
- **Zero Floating-Point Drift:** All money is tracked exclusively as 64-bit integers in Ethiopian Santim ($1\text{ ETB} = 100\text{ santim}$).
- **15% Ethiopian VAT:** Compliant with Ethiopian Ministry of Revenues regulations, applying deterministic half-up integer rounding (`Math.floor((subtotalSantim * 15 + 50) / 100)`).
- **Sequential Gap-Free Invoices:** Implemented via atomic MongoDB `$inc` sequences formatted as `INV-{YYYY}-{000001}`.
- **12 Hand-Checked Billing Scenarios:** Tested in `tests/billing/scenarios.test.ts` covering overages, seat proration, partial credit notes, and odd VAT centimes.

### ⚡ High-Throughput Ingestion Engine
- **500 events/second Sustained Load:** Dedicated ingestion worker processes batches of up to 100 events with p99 latency < 50ms.
- **Client Idempotency:** Ingestion deduplicates on `(orgId, eventId)` using unique compound indices. Duplicate events are silently acknowledged without double-counting.
- **Real-Time Pre-Aggregations:** Ingested events mark hourly/daily dirty buckets in Redis sets. A BullMQ worker asynchronously computes rollups (`RollupHourly`, `RollupDaily`) to preserve microsecond dashboard queries.

### 🔒 Military-Grade Outbound Webhooks & SSRF Defense
- **HMAC-SHA256 Signatures:** Webhook payloads are signed with timestamp headers (`t=<unix>,v1=<hmac>`) to prevent replay attacks.
- **Two-Tier SSRF Guard:** Webhook worker resolves DNS prior to connect, blocking IPv4 loopback (`127.0.0.0/8`), RFC 1918 subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), IPv6 loopback (`::1`), link-local, and cloud metadata endpoints (`169.254.169.254`).
- **Network Isolation:** In production Docker Compose, the worker resides on an isolated outbound network (`mizan_webhook_net`) with no route to MongoDB or Redis internal bridges.

---

## 3. Directory Layout (Monorepo)

```
.
├── packages/
│   └── shared/               # Pure TypeScript types, Zod schemas, constants, integer math
├── server/                   # Express management REST API & Ingestion API
│   ├── src/
│   │   ├── api/              # Management API (Port 4000)
│   │   ├── ingest/           # High-volume Ingestion API (Port 4001)
│   │   ├── models/           # 27 Mongoose models with tenantScopedPlugin
│   │   ├── services/         # Tenancy-isolated business logic
│   │   ├── routes/           # RBAC-guarded routes
│   │   └── tenancy/          # Scoped repository & tenant plugin
├── worker/                   # BullMQ background workers (Rollups, Webhooks, Billing)
├── web/                      # React 19 + Vite SPA, Tailwind CSS, Recharts, i18n
├── docker/                   # Dockerfiles (api, ingest, worker, web) & Compose files
├── nginx/                    # Edge reverse proxy configs, rate limits, SSL headers
├── infra/tofu/               # OpenTofu / Terraform VPS infrastructure modules
├── monitoring/               # Prometheus alert rules, Grafana dashboards, Alloy configs
├── scripts/                  # deploy.sh, rollback.sh, backup.sh, restore-tenant.sh
└── tests/                    # Isolation, Billing, SSRF, and Property-based test suites
```

---

## 4. Quickstart (Local Development)

### Prerequisites
- Node.js 22 LTS or higher
- Docker & Docker Compose
- npm 10+

### Step 1: Clone and Install
```bash
git clone https://github.com/PROFESSOR-ADNAN/mizan-saas.git
cd mizan-saas
npm install
```

### Step 2: Configure Environment
```bash
cp .env.example .env
# Edit .env with your local secrets
```

### Step 3: Start Supporting Services
```bash
docker compose -f docker/compose.yaml up -d
```

### Step 4: Build Monorepo & Run Tests
```bash
npm run build
npm test
```

### Step 5: Start Development Servers
```bash
# Terminal 1: Management REST API (Port 4000)
npm run dev:api

# Terminal 2: High-Volume Ingestion API (Port 4001)
npm run dev:ingest

# Terminal 3: BullMQ Background Worker Engine
npm run dev:worker

# Terminal 4: React 19 Vite Web Application (Port 5173)
npm run dev:web
```

---

## 5. Deployment Guide: Vercel (Frontend SPA)

The Mizan web frontend (`web/`) is built as a lightning-fast React 19 single-page application and is fully optimized for zero-config global deployment on **Vercel**.

### Step-by-Step Vercel Deployment

1. **Push to GitHub** (Already configured on `PROFESSOR-ADNAN/mizan-saas`).
2. Log in to [Vercel Dashboard](https://vercel.com) and click **"Add New Project"**.
3. Import the `PROFESSOR-ADNAN/mizan-saas` GitHub repository.
4. In the **Project Configuration** settings:
   - **Framework Preset:** Vite
   - **Root Directory:** Edit and set to `web` (or leave root with the included `vercel.json`).
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. **Environment Variables:**
   Add the following environment variable in the Vercel project settings:
   - `VITE_API_BASE_URL`: `https://api.yourdomain.com` (pointing to your Mizan backend VPS)
6. Click **Deploy**. Vercel will build the frontend assets and deploy them across its worldwide edge CDN with automatic HTTPS.

*Note: The included root `vercel.json` automatically configures client-side routing rewrites (`"destination": "/index.html"`) so deep linking to dashboards, billing, and settings pages works seamlessly without 404 errors.*

---

## 6. Deployment Guide: VPS (Production Stack)

For the backend APIs, background workers, MongoDB replica set, and Redis, run on a hardened VPS using Docker Compose:

```bash
# 1. SSH into production server
ssh mizan-admin@your-vps-ip

# 2. Clone repository & configure production environment
git clone https://github.com/PROFESSOR-ADNAN/mizan-saas.git /opt/mizan
cd /opt/mizan
cp .env.example .env
# Set strong production secrets, MONGODB_URI, and CHAPA_SECRET_KEY

# 3. Execute zero-downtime deployment script
./scripts/deploy.sh
```

---

## 7. Automated Test Suite Verification

Mizan includes comprehensive, rigorous automated test suites verifying all core platform invariants:

```bash
npm test
```

### Verified Test Evidence:
```
▶ Tenant Isolation & Scoped Data Layer Test Suite
  ✔ TenantRepository throws TenantScopeError when orgId is omitted on find (9.78ms)
  ✔ TenantRepository throws TenantScopeError when orgId is undefined or null (2.36ms)
  ✔ Cross-tenant data access returns 404 (never 403) to prevent tenant enumeration (0.22ms)
  ✔ Aggregation pipeline automatically prepends $match: { orgId } as first stage (2.96ms)
  ✔ Unscoped platform escape hatch logs and allows execution for background jobs (1.43ms)
✔ Tenant Isolation & Scoped Data Layer Test Suite (18.08ms)

▶ 12 Hand-Checked Billing Scenarios (Exact Santim Test Suite)
  ✔ Scenario 1: Free plan base invoice with 0 events (41.50ms)
  ✔ Scenario 2: Starter plan base fee with 0 events (0.49ms)
  ✔ Scenario 3: Starter plan within included quota (90,000 events) (0.42ms)
  ✔ Scenario 4: Starter plan with 20,000 excess overage events (0.26ms)
  ✔ Scenario 5: Business plan base subscription (4,500 ETB) (0.42ms)
  ✔ Scenario 6: Business plan with 2 extra seats (average 17 seats) (0.44ms)
  ✔ Scenario 7: Starter plan with 3 extra seats and 5,000 overage events (0.25ms)
  ✔ Scenario 8: Partial Credit Note deduction (500 ETB applied) (0.36ms)
  ✔ Scenario 9: Full Credit Note deduction exceeding invoice amount (0.48ms)
  ✔ Scenario 10: Mid-month plan upgrade proration (Starter to Business on day 15) (0.77ms)
  ✔ Scenario 11: Half-up integer rounding on odd VAT centimes (0.33ms)
  ✔ Scenario 12: Zero subtotal always produces zero VAT and zero total (0.16ms)
✔ 12 Hand-Checked Billing Scenarios (Exact Santim Test Suite) (54.08ms)

▶ SSRF Guard & Network Defense Test Suite
  ✔ Blocks IPv4 loopback addresses (127.0.0.0/8) (5.21ms)
  ✔ Blocks AWS / GCP / DigitalOcean cloud metadata IP (169.254.169.254) (0.41ms)
  ✔ Blocks RFC 1918 private IPv4 subnets (0.49ms)
  ✔ Blocks IPv6 loopback, unspecified, and local unicast addresses (8.91ms)
  ✔ Blocks IPv4-mapped IPv6 loopback addresses (0.22ms)
  ✔ Permits legitimate public IPv4 internet addresses (0.38ms)
  ✔ safeHttpRequest rejects private targets with SSRFSecurityError (2.04ms)
✔ SSRF Guard & Network Defense Test Suite (20.39ms)

▶ Rollup Mathematical Invariance Property Test (fast-check)
  ✔ Deduplicated events sum exactly equals rollup aggregation in santim and counts (45.51ms)
✔ Rollup Mathematical Invariance Property Test (fast-check) (46.76ms)

All 25 test scenarios PASSED with 0 errors.
```

---

## 8. License & Security

- **License:** [MIT License](LICENSE)
- **Security Policy:** [SECURITY.md](SECURITY.md)
- **Author:** Professor Adnan ([@PROFESSOR-ADNAN](https://github.com/PROFESSOR-ADNAN))
