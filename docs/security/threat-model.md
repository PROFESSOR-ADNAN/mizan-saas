# Mizan STRIDE Threat Model

## 1. Scope & Objective
This threat model evaluates Mizan's attack surfaces: multi-tenant cross-boundary isolation, high-volume event ingestion, billing and payment gateways, outbound webhooks, CSV file imports, and platform admin routes.

---

## 2. Threat Analysis by STRIDE Category

### S - Spoofing (Identity & Origin)
- **Threat 1: Forged Payment Webhook**: Malicious actor posts synthetic `invoice.paid` JSON to `/api/v1/billing/chapa-webhook` attempting to unlock paid subscriptions.
  - *Mitigation*: Header `x-chapa-signature` validated with HMAC-SHA256 constant-time comparison. Mandatory server-to-server verification call directly to Chapa before mutating state.
- **Threat 2: API Key Impersonation**: Attacker attempts to forge or guess API keys.
  - *Mitigation*: Keys carry 128-bit cryptographically secure entropy, formatted as `mzn_{env}_{prefix}_{random}_{crc32}`, hashed with SHA-256 before storage. Plaintext is never logged or stored.

### T - Tampering (Data Modification)
- **Threat 3: Cross-Tenant Mutation (IDOR)**: Tenant A attempts to update or delete Tenant B's dashboards, API keys, or webhooks.
  - *Mitigation*: Tenant-scoped Mongoose plugin enforces `orgId` on every database query and aggregation. Cross-tenant access always returns `404 Not Found` (never 403).
- **Threat 4: CSV / Formula Injection**: Attacker injects `=cmd|' /C calc'!A0` into event customer references or product names.
  - *Mitigation*: All CSV exports and error reports prefix formula characters (`=`, `+`, `-`, `@`, `\t`, `\r`) with single quote `'`.

### R - Repudiation (Dispute of Actions)
- **Threat 5: Denial of Membership or Billing Changes**: Delinquent user claims an admin changed their role or issued unauthorized plan upgrades.
  - *Mitigation*: Append-only, immutable `auditLogs` record actor ID, IP address, timestamp, action, and state diffs for all critical operations.

### I - Information Disclosure (Confidentiality)
- **Threat 6: Cross-Tenant Data Leakage via Dashboards**: SQL/NoSQL operator injection (`{ $ne: null }`) in query filters to read foreign org events.
  - *Mitigation*: Strict Zod schema parsing rejects `$` and `.` operators. Aggregation pipelines automatically prepend `{ $match: { orgId } }`.
- **Threat 7: Leaked Secrets in Logs**: Event bodies or API keys appearing in Nginx or application logs.
  - *Mitigation*: Pino logger serializers and Nginx log configurations explicitly strip `Authorization` headers, event bodies, and API keys.

### D - Denial of Service (Availability & Noisy Neighbors)
- **Threat 8: Ingestion Flooding**: Deliberate POS flood from Tenant A starving the dashboard API for Tenant B.
  - *Mitigation*: Separate process isolation (dedicated `ingest` containers); per-org and per-plan rate limiters in Redis; 503 backpressure when BullMQ queue lag spikes.
- **Threat 9: Heavy Aggregation Exhaustion**: Concurrent expensive queries exhausting MongoDB WiredTiger cache.
  - *Mitigation*: Query planner restricts date ranges; `maxTimeMS` capped at 3000ms; Redis semaphores restrict concurrent queries per tenant.

### E - Elevation of Privilege (Access Control)
- **Threat 10: Unauthorized Platform Admin Access**: Normal tenant user accesses `/api/v1/admin/*`.
  - *Mitigation*: Route guarded by `requirePlatformAdmin` checking user `platformRole === 'platform_admin'` and mandatory TOTP MFA verification.
- **Threat 11: Server-Side Request Forgery (SSRF) via Webhooks**: Attacker registers webhook pointing to `http://169.254.169.254/latest/meta-data/` or internal database container ports.
  - *Mitigation*: Pre-dispatch DNS resolution blocks private, loopback, and metadata ranges; socket connects directly to resolved IP; worker isolated in egress-only Docker network.
