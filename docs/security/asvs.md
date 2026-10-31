# OWASP ASVS Level 2 Security Verification Checklist

| ASVS Section | Control Description | Mizan Implementation Status | Evidence / Architectural Location |
|---|---|---|---|
| **V1 Architecture** | Threat modeling and secure multi-tenancy design | **DONE** | Shared collection model with tenant-scoped layer (`server/src/tenancy/`). |
| **V2 Authentication** | Strong password hashing (Argon2 / Bcrypt cost >= 12) | **DONE** | `server/src/services/auth.service.ts` uses bcrypt with cost factor 12. |
| **V2.8 Account Security** | Account lockout after 5 failed attempts | **DONE** | Redis sliding window counter blocks IP and email for 15 minutes. |
| **V3 Session Mgmt** | Short-lived JWTs (15m) + rotated httpOnly refresh cookies | **DONE** | `server/src/middleware/auth.ts`, automated token family revocation. |
| **V4 Access Control** | Provable multi-tenant isolation; cross-tenant returns 404 | **DONE** | Tenant scoping plugin + `tests/isolation/tenant-isolation.test.ts`. |
| **V5 Cryptography** | HMAC-SHA256 constant-time verification | **DONE** | `crypto.timingSafeEqual` used in Chapa webhook & outbound signatures. |
| **V5.3 Secrets** | Encryption of sensitive secrets at rest | **DONE** | Webhook secrets encrypted via AES-256-GCM with master key. |
| **V8 Data Protection** | SSRF defense against private IPs, loopback, and metadata | **DONE** | Isolated Docker network + DNS inspection in `worker/src/utils/ssrfGuard.ts`. |
| **V10 Malicious Code** | CSV and Excel formula injection protection | **DONE** | Neutralizes `=, +, -, @, \t, \r` prefixes across CSV exports. |
| **V11 Business Logic** | Billing state machine; idempotent duplicate event rejection | **DONE** | `(orgId, eventId)` unique index; atomic billing transitions. |
| **V13 API Security** | Strict Zod validation on every route; reject unknown keys | **DONE** | Shared Zod schemas in `packages/shared/src/schemas/`. |
| **V14 Config Security** | Minimal non-root containers; dropped Linux capabilities | **DONE** | `docker/Dockerfile.*` running as `node` unprivileged user. |
