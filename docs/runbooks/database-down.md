# Runbook: MongoDB Replica Set Failure / Down

## Severity: SEV1
**Symptom**: Health checks fail on `/healthz`; API and Ingestion return 500/503; error logs show `MongoServerSelectionError`.

## Diagnosis
1. Inspect MongoDB container status:
   `docker compose -f docker/compose.prod.yaml ps mongo`
2. View MongoDB container logs:
   `docker compose -f docker/compose.prod.yaml logs --tail=100 mongo`
3. Verify replica set status:
   `docker compose -f docker/compose.prod.yaml exec mongo mongosh --eval "rs.status()"`

## Remediation Steps
1. If the container exited due to OOM:
   - Check host memory: `free -m`
   - Adjust WiredTiger cache in `docker/compose.prod.yaml` if needed.
   - Restart MongoDB: `docker compose -f docker/compose.prod.yaml restart mongo`
2. If replica set state is broken:
   - Run replica set re-initialization:
     `docker compose -f docker/compose.prod.yaml exec mongo mongosh --eval "rs.initiate()"`
3. Verify services recover:
   `curl -s http://localhost:4000/healthz | jq .`

## Verification
- Health status returns `{"status":"ok","database":"connected","redis":"connected"}`.
- Alerts resolve in Alertmanager.
