# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-11-01

### Added
- **Multi-tenant Core**: Organization hierarchy, membership RBAC (owner, admin, analyst, viewer, billing), teams, data sources, API keys with prefix `mzn_` and SHA-256 verification.
- **Tenant-Scoped Data Layer**: Custom Mongoose plugin enforcing `orgId` filtering on all operations, injecting `$match: { orgId }` as first aggregation stage, returning 404 for cross-tenant access.
- **High-Volume Ingestion API**: `/ingest/v1/events` processing up to 100 events/batch, deduplication by client `eventId`, Redis quota counters, majority MongoDB durability.
- **Rollup Engine**: Hourly and daily deterministic recomputations using dirty-bucket queuing, with reconciliation against raw events.
- **Usage & Metering Engine**: Fast-path Redis counters backed by append-only `usageLedger` database entries, with 0-drift reconciliation.
- **Billing State Machine**: Monthly billing cycle, seat snapshots, prorated plan changes, 15% Ethiopian VAT, gap-free sequential invoice numbering (`INV-YYYY-XXXXXX`), PDF generation.
- **Chapa Payment Gateway**: Hosted checkout initialization, secure webhook verification with constant-time HMAC comparison, and automated status synchronization.
- **Outbound Webhooks**: HMAC-SHA256 signatures, exponential backoff retries, and comprehensive SSRF defense guarding against DNS rebinding and private/metadata IP access.
- **CSV Data Importer**: Streaming parser, UTF-8 BOM tolerance, formula injection defense, and row-level error reporting.
- **Dashboard & Analytics**: React Vite SPA with Tailwind CSS, TanStack Query, ECharts/Recharts, English & Amharic i18n with Ethiopic font support.
- **DevSecOps & SRE**: Nginx reverse proxy configurations, Docker Compose production architectures, OpenTofu modules, Ansible playbooks, and Prometheus/Grafana observability stack.
