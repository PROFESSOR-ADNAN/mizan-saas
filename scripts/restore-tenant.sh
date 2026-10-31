#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <tenant_org_id> <path_to_backup_archive> [target_mongo_uri]"
  exit 1
fi

ORG_ID="$1"
BACKUP_ARCHIVE="$2"
TARGET_URI="${3:-${MONGODB_URI:-mongodb://localhost:27017/mizan_prod}}"
STAGING_URI="mongodb://localhost:27017/mizan_tenant_restore_temp"

echo "=== Mizan Granular Single-Tenant Restore Initiated ==="
echo "Tenant OrgId: $ORG_ID"
echo "Backup Archive: $BACKUP_ARCHIVE"
START_TIME=$(date +%s)

echo "1. Restoring backup into isolated temporary staging database..."
mongorestore --uri="$STAGING_URI" --archive="$BACKUP_ARCHIVE" --gzip --drop

echo "2. Extracting and transferring tenant data to production..."
node - <<EOF
import mongoose from 'mongoose';

async function restoreTenant() {
  const stagingConn = await mongoose.createConnection('$STAGING_URI').asPromise();
  const prodConn = await mongoose.createConnection('$TARGET_URI').asPromise();

  const collections = ['events', 'datasources', 'dashboards', 'memberships', 'invoices', 'usages', 'apikeys'];
  
  for (const collName of collections) {
    const stagingColl = stagingConn.collection(collName);
    const prodColl = prodConn.collection(collName);

    const docs = await stagingColl.find({ orgId: '$ORG_ID' }).toArray();
    if (docs.length > 0) {
      console.log(\`Restoring \${docs.length} documents for collection '\${collName}'...\`);
      const bulkOps = docs.map(doc => ({
        replaceOne: {
          filter: { _id: doc._id },
          replacement: doc,
          upsert: true
        }
      }));
      await prodColl.bulkWrite(bulkOps);
    }
  }

  await stagingConn.dropDatabase();
  await stagingConn.close();
  await prodConn.close();
  console.log("Tenant data migration completed.");
}

restoreTenant().catch(err => {
  console.error("Single-tenant restore failed:", err);
  process.exit(1);
});
EOF

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
echo "=== Single-Tenant Restore COMPLETED in ${DURATION}s ==="
