# ADR 0017: Public Share Link Design and Data Sanitization

## Context
Tenants need to share specific read-only dashboard snapshots with external investors, partners, or non-members without creating full user accounts.

## Decision
1. **Link Architecture**:
   - Cryptographically random 256-bit token (URL-safe base64).
   - Only the SHA-256 hash of the token is stored in `shareLinks`.
   - Access URL: `https://app.mizan.et/share/{token}`.
   - Max expiration: 90 days from creation, with explicit revocation capability.
2. **Data Minimization & Security**:
   - Response includes ONLY aggregate widget data for the specified widget IDs.
   - Zero organization details (no org name, owner email, member counts, billing information, or TIN) are returned.
   - HTTP response includes `X-Robots-Tag: noindex, nofollow, noarchive` and strict Content Security Policy.
   - Strict per-IP rate limiting (60 requests/minute) on public share routes.
   - Formula injection protection: all exportable values are sanitized against CSV/Excel execution triggers (`=`, `+`, `-`, `@`, `\t`, `\r`).

## Alternatives Considered
- **Plain JWT in share URL**: Exposes tenant identifiers and claims within URL parameters.
- **Uncapped permanent share links**: Increases risk of forgotten sensitive dashboard exposures.

## Consequences
- **Positive**: Safe, granular external sharing with automatic expiration.
- **Negative**: Public viewers cannot customize date ranges or drill down beyond pre-shared widget definitions.
