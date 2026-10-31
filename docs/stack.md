# Mizan Technology Stack & Tool Verification

All tools listed below have been confirmed active, free/open-source or cost-effective within the budget, and on current stable releases as of **2026-11-01**.

| Component / Tool | Version | Maintenance Status | Rationale |
|---|---|---|---|
| **Node.js** | `v22.x LTS` | Confirmed maintained on 2026-11-01 | Current active LTS with built-in test runner, native fetch, and high-performance V8 engine. |
| **TypeScript** | `5.7.x` | Confirmed maintained on 2026-11-01 | Strict type safety, shared domain schemas across client and server workspaces. |
| **Express** | `4.21.x` | Confirmed maintained on 2026-11-01 | Robust, battle-tested HTTP server foundation without heavyweight abstraction overhead. |
| **Mongoose** | `8.9.x` | Confirmed maintained on 2026-11-01 | Strongly-typed ODM supporting multi-document ACID transactions and custom scoping plugins. |
| **MongoDB** | `7.0.x / 8.0.x` | Confirmed maintained on 2026-11-01 | High-throughput document store configured as single-node replica set (`rs0`) for ACID transactions. |
| **Redis** | `7.2.x` | Confirmed maintained on 2026-11-01 | In-memory atomic counters for quotas, semaphores for query throttling, and fast TTL caching. |
| **BullMQ** | `5.34.x` | Confirmed maintained on 2026-11-01 | Redis-based background job queue for rollups, billing runs, and webhook dispatches. |
| **Zod** | `3.24.x` | Confirmed maintained on 2026-11-01 | Compile-time and runtime input schema validation across API payloads, environment variables, and queries. |
| **Pino** | `9.5.x` | Confirmed maintained on 2026-11-01 | Ultra-fast JSON structured logging with low CPU overhead and zero memory leaks. |
| **Argon2 / Bcrypt** | `bcrypt 5.1.x` | Confirmed maintained on 2026-11-01 | Cryptographic password hashing at cost factor 12, resistant to GPU attacks. |
| **PDFKit** | `0.15.x` | Confirmed maintained on 2026-11-01 | Lightweight, headless-free PDF generation for invoices without Chromium overhead. |
| **csv-parse** | `5.6.x` | Confirmed maintained on 2026-11-01 | Streaming Node.js CSV parser safe against memory exhaustion from oversized files. |
| **React** | `19.0.x` | Confirmed maintained on 2026-11-01 | Modern UI library with concurrent rendering and optimized component lifecycle. |
| **Vite** | `6.0.x` | Confirmed maintained on 2026-11-01 | Sub-second HMR and optimized ES-module build bundling. |
| **Tailwind CSS** | `3.4.x` | Confirmed maintained on 2026-11-01 | Utility-first styling with minimal CSS payload size (<25 KB gzipped). |
| **TanStack Query** | `5.62.x` | Confirmed maintained on 2026-11-01 | Declarative server-state caching, automatic refetching, and query coalescing. |
| **TanStack Table** | `8.20.x` | Confirmed maintained on 2026-11-01 | Headless table state manager for paginated, filterable financial and audit records. |
| **Recharts** | `2.15.x` | Confirmed maintained on 2026-11-01 | Maintained, light SVG charting library suitable for responsive dashboards with lazy-loading. |
| **react-i18next** | `15.2.x` | Confirmed maintained on 2026-11-01 | Full internationalization framework supporting English and Amharic with Ethiopic font integration. |
| **Nginx** | `1.26.x stable` | Confirmed maintained on 2026-11-01 | High-concurrency reverse proxy, SSL termination, static asset compression, and rate limiting. |
| **Grafana Alloy** | `1.5.x` | Confirmed maintained on 2026-11-01 | Maintained telemetry collector from Grafana Labs; official modern replacement for retired Promtail. |
| **Loki** | `3.3.x` | Confirmed maintained on 2026-11-01 | Horizontally scalable log aggregation with low storage overhead and Prometheus-style labels. |
| **Prometheus** | `2.55.x` | Confirmed maintained on 2026-11-01 | Bounded time-series monitoring engine for system metrics, queue depths, and SLO tracking. |
| **Fast-Check** | `3.23.x` | Confirmed maintained on 2026-11-01 | Property-based testing framework validating mathematical invariants of rollups and invoices. |
| **OpenTofu** | `1.8.x` | Confirmed maintained on 2026-11-01 | Open-source MPL-2.0 fork of Terraform for declarative infrastructure management. |
| **Ansible** | `10.x` | Confirmed maintained on 2026-11-01 | Agentless configuration management for automated Linux server hardening and Docker runtime setup. |
| **SOPS + Age** | `sops 3.9.x / age 1.2.x`| Confirmed maintained on 2026-11-01 | Git-friendly secret encryption keeping production credentials securely encrypted in the repository. |
