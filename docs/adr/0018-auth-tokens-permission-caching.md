# ADR 0018: Auth Tokens, Active Organization Handling, and Permission Caching

## Context
A user can belong to multiple organizations with different roles in each (e.g., owner of Shop A, analyst in Shop B). Trusting organization roles encoded directly in long-lived JWTs creates privilege de-synchronization when roles are changed or revoked.

## Decision
1. **Token Architecture**:
   - Access Token: Short-lived (15 minutes) signed JWT containing only `userId` and `platformRole` (`user` | `platform_admin`).
   - Refresh Token: Stored hashed in `refreshTokens` collection with token family tracking; delivered via an `httpOnly`, `Secure`, `SameSite=Strict` cookie.
   - Rotation: Refresh tokens rotate on every invocation. Reuse of an old refresh token invalidates the entire token family immediately.
2. **Active Organization Resolution**:
   - Organization context is explicit in every URL route: `/api/v1/orgs/:orgId/...`.
   - The server verifies active membership in `:orgId` on **every single request** against the database or Redis cache.
   - User permissions for `:orgId` are cached in Redis (`perm:{userId}:{orgId}`) with a short TTL (60 seconds).
   - Any membership change, role update, or member removal immediately evicts the Redis permission key, ensuring changes take effect in sub-second real time.

## Alternatives Considered
- **Embedding `orgId` and permissions in JWT**: Requires token blacklisting or waiting for token expiry when a user is removed from an organization.

## Consequences
- **Positive**: Instant revocation, seamless multi-org switching without re-authenticating, zero stale permission windows.
- **Negative**: Adds a fast Redis lookup per API request; measured latency < 0.5 ms.
