# Runbook: SSRF Security Violation / Webhook Abuse

## Severity: SEV2
**Symptom**: Alert `SSRFBlockedAttempt` fires; logs record webhook destination resolving to private/metadata IP.

## Diagnosis
1. Search Loki logs for SSRF security alerts:
   `{app="mizan-worker"} |= "SSRFBlocked" or "PrivateIPDenied"`
2. Identify the offending webhook endpoint ID and organization:
   `docker compose -f docker/compose.prod.yaml exec mongo mongosh mizan --eval "db.webhookEndpoints.findOne({ _id: ObjectId('...') })"`

## Remediation Steps
1. Immediately deactivate the offending endpoint:
   `docker compose -f docker/compose.prod.yaml exec mongo mongosh mizan --eval "db.webhookEndpoints.updateOne({ _id: ObjectId('...') }, { \$set: { enabled: false, disabledReason: 'SSRF_VIOLATION' } })"`
2. Review tenant activity for malicious behavior (e.g. multiple SSRF attempts targeting cloud metadata `169.254.169.254` or internal services).
3. If malicious intent is established, suspend the organization via platform admin console.

## Verification
- Webhook worker drops all future jobs for the endpoint.
- Webhook delivery status is updated to `aborted_security_violation`.
