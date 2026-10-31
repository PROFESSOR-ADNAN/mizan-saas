# Runbook: Suspected Cross-Tenant Data Exposure

## Severity: SEV1
**Symptom**: User reports viewing data from an unrelated organization, or an audit log reveals query execution lacking `orgId`.

## Immediate Containment (First 15 Minutes)
1. **Quarantine Active Sessions**:
   If an endpoint is suspected of cross-tenant leakage, immediately route Nginx traffic for that endpoint to 503 maintenance mode.
2. **Review Security Logs**:
   Query Loki logs for IDOR or scoping failures:
   `{app="mizan-api"} |= "CrossTenantAccessAttempt" or "TenantScopeError"`
3. **Verify Database Records**:
   Run database integrity audit checking for orphaned documents without `orgId`:
   `docker compose -f docker/compose.prod.yaml exec mongo mongosh mizan --eval "db.events.find({ orgId: { \$exists: false } }).count()"`

## Root Cause Assessment
1. Inspect the route handler and ensure it relies on `req.orgId` from `requireOrgMembership` middleware rather than URL parameters or request bodies.
2. Confirm the repository helper or Mongoose plugin applied the tenant scoping filter.
3. Run the automated tenant-isolation suite against the current build:
   `npm run test:isolation --workspace=server`

## Notification & Compliance
1. Identify all affected organizations and user accounts through audit logs.
2. Prepare data breach notification per Ethiopian Personal Data Protection guidelines and tenant Data Processing Agreements within 72 hours.
3. Deploy patch through emergency CD pipeline.

## Verification
- Tenant-isolation suite passes 100% of routes.
- Cross-tenant requests consistently return `404 Not Found`.
