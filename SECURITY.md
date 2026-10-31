# Security Policy

Mizan (ሚዛን) takes security, tenant isolation, and data confidentiality seriously.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, IDOR risk, tenant isolation bypass, SSRF flaw, or payment tampering issue:

1. **Do not create a public GitHub issue.**
2. Send an email to `security@mizan.et` with:
   - Vulnerability description and impact assessment
   - Step-by-step reproduction instructions or proof-of-concept
   - Affected endpoints and components
3. We acknowledge receipt within 24 hours and issue fixes within 7 days for high/critical severities.

## Security Controls Overview
- Tenant Isolation enforced via tenant-scoped repository layer and strict MongoDB query injection
- Cross-tenant requests always return 404 (never 403) to prevent tenant enumeration
- Constant-time HMAC comparison on payment & outbound webhooks
- SSRF guard blocking all private, loopback, link-local, and cloud metadata IP ranges
- Argon2id / Bcrypt (cost >= 12) password hashing with select: false
- CSV formula injection sanitization on all exports and error reports
