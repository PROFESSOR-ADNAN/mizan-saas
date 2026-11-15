# Mizan Disaster Recovery & Business Continuity Runbook

This document details Recovery Time Objectives (RTO), Recovery Point Objectives (RPO), and step-by-step restoration procedures for Mizan multi-tenant data stores.

---

## 1. RTO & RPO Objectives

| Component | Target RPO (Data Loss Tolerance) | Target RTO (Max Downtime) | Failover Mechanism |
| :--- | :--- | :--- | :--- |
| **MongoDB Atlas** | < 1 minute | < 5 minutes | Automated 3-Node Replica Set Election |
| **Upstash Redis** | < 10 seconds | Instant | Active-Active Geo-Replication (AOF enabled) |
| **Render API** | 0 minutes | < 2 minutes | Auto-restart with container health probes |
| **Vercel Frontend** | 0 minutes | 0 minutes (Edge) | Multi-region Anycast Edge CDN |

---

## 2. Point-In-Time Restoration Procedure

In the event of catastrophic data corruption or human operator error:

```bash
# 1. Download target backup archive from cold storage
mkdir -p /tmp/restore
tar -xzf backups/mizan_backup_YYYYMMDD_HHMMSS.tar.gz -C /tmp/restore

# 2. Restore database while preserving existing tenant indexes
mongorestore --uri="$MONGODB_URI" --drop --gzip /tmp/restore

# 3. Flush stale Redis query caches
redis-cli -u "$REDIS_URL" FLUSHDB

# 4. Trigger reconciliation run
node --env-file=.env server/dist/server/src/scripts/seed.js
```
