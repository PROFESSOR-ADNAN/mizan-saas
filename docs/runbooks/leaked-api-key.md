# Runbook: Leaked API Key Response

## Severity: SEV2
**Symptom**: GitHub Secret Scanning alert or tenant notification indicates an API key has been committed to a public repository or shared in logs.

## Remediation Steps
1. **Identify the Leaked Key**:
   Compute SHA-256 hash of the exposed key string:
   `echo -n "mzn_live_..." | sha256sum`
2. **Revoke Immediately**:
   Locate and revoke the key in MongoDB:
   `docker compose -f docker/compose.prod.yaml exec mongo mongosh mizan --eval "db.apiKeys.updateOne({ keyHash: '...' }, { \$set: { revokedAt: new Date(), revokedReason: 'LEAKED_KEY_PROCEDURE' } })"`
3. **Evict Cache**:
   Evict key metadata from Redis:
   `docker compose -f docker/compose.prod.yaml exec redis redis-cli DEL "apikey:..."`
4. **Notify Tenant Owner**:
   Email tenant owner detailing revocation and guide them to generate a replacement key in the dashboard.
5. **Audit Ingestion**:
   Inspect events ingested with the compromised key during the exposure window.
