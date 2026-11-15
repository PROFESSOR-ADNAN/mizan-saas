#!/usr/bin/env bash
set -euo pipefail

# Mizan Automated MongoDB Backup Script
# Usage: ./scripts/backup.sh [destination_dir]

DEST_DIR="${1:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="mizan_backup_${TIMESTAMP}.tar.gz"
TEMP_DIR="/tmp/mizan_dump_${TIMESTAMP}"

echo "=================================================="
echo " Starting Mizan Database Backup: ${TIMESTAMP}"
echo "=================================================="

mkdir -p "${DEST_DIR}"
mkdir -p "${TEMP_DIR}"

if [ -z "${MONGODB_URI:-}" ]; then
  echo "Error: MONGODB_URI environment variable is not set." >&2
  exit 1
fi

echo "--> Dumping MongoDB collections..."
mongodump --uri="${MONGODB_URI}" --out="${TEMP_DIR}" --gzip

echo "--> Compressing archive..."
tar -czf "${DEST_DIR}/${BACKUP_NAME}" -C "${TEMP_DIR}" .

echo "--> Cleaning up temporary files..."
rm -rf "${TEMP_DIR}"

# Prune backups older than 30 days
echo "--> Applying 30-day retention policy..."
find "${DEST_DIR}" -type f -name "mizan_backup_*.tar.gz" -mtime +30 -exec rm {} \;

FILE_SIZE=$(du -h "${DEST_DIR}/${BACKUP_NAME}" | cut -f1)
echo "✅ Backup completed successfully: ${DEST_DIR}/${BACKUP_NAME} (${FILE_SIZE})"
