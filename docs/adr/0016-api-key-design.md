# ADR 0016: API Key Design - Format, Hashing, Scopes, and Rotation

## Context
Tenants ingest high-volume events via external POS systems, scripts, and Telegram integrations using API keys. Keys must be high-entropy, recognizable, secure at rest, and fast to validate.

## Decision
1. **Key Format**:
   - `mzn_{env}_{prefix}_{random}_{crc32}`
   - Example: `mzn_live_ing_a8f93e1b7c2d4e5f_4a8b1c2d`
   - Visible prefix allows rapid regex identification for leak detection by GitHub secret scanners.
   - CRC-32 checksum enables immediate rejection of malformed or mistyped keys before database lookup.
2. **Storage and Authentication**:
   - Keys are displayed **exactly once** upon creation.
   - Plaintext keys are never stored in database or logs. Only the SHA-256 hash `hash = sha256(key)` is stored.
   - Fast lookup utilizes index on `keyHash`.
   - Redis caches authenticated key metadata (orgId, scopes, plan rate limit) for 30 seconds.
3. **Scopes**:
   - `ingest:write`: Authorized solely for event ingestion endpoints.
   - `data:read`: Authorized for metrics read API.
4. **Lifecycle**:
   - Keys support optional expiration dates and immediate revocation.
   - Rotation supports seamless overlap windows where old and new keys remain concurrently active.

## Alternatives Considered
- **Reversible encryption (AES) of keys**: Unnecessary security risk; if the database is breached, attacker decrypts all client API keys.
- **Argon2 / Bcrypt on every ingest request**: Too computationally expensive for 500 req/s sustained throughput. SHA-256 of 128+ bits entropy provides equivalent brute-force protection at microsecond lookup speed.

## Consequences
- **Positive**: Extremely fast validation; immune to offline rainbow table attacks; zero plaintext leakage.
- **Negative**: Lost keys cannot be recovered; users must generate a new key if misplaced.
