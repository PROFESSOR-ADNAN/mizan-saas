#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/backups}"
TIMESTAMP=$(date -u +"%Y%m%d_%H%M%SZ")
BACKUP_NAME="mizan_mongodb_${TIMESTAMP}"
BACKUP_ARCHIVE="${BACKUP_DIR}/${BACKUP_NAME}.archive.gz"
BACKUP_ENC="${BACKUP_ARCHIVE}.enc"
LOG_FILE="${BACKUP_DIR}/backup.log"

mkdir -p "$BACKUP_DIR"

echo "=== Mizan Backup Started: ${TIMESTAMP} ===" | tee -a "$LOG_FILE"
START_TIME=$(date +%s)

# Execute mongodump into compressed archive
MONGO_URI="${MONGODB_URI:-mongodb://localhost:27017/mizan_prod}"
echo "Dumping MongoDB databases..." | tee -a "$LOG_FILE"

mongodump --uri="$MONGO_URI" --archive="$BACKUP_ARCHIVE" --gzip

RAW_SIZE=$(du -h "$BACKUP_ARCHIVE" | cut -f1)
echo "Unencrypted backup size: ${RAW_SIZE}" | tee -a "$LOG_FILE"

# Encrypt backup with OpenSSL AES-256-CBC if ENCRYPTION_KEY is provided
if [ -n "${BACKUP_ENCRYPTION_KEY:-}" ]; then
  echo "Encrypting backup with AES-256-CBC..." | tee -a "$LOG_FILE"
  openssl enc -aes-256-cbc -salt -pbkdf2 -in "$BACKUP_ARCHIVE" -out "$BACKUP_ENC" -pass "pass:${BACKUP_ENCRYPTION_KEY}"
  rm -f "$BACKUP_ARCHIVE"
  FINAL_FILE="$BACKUP_ENC"
else
  FINAL_FILE="$BACKUP_ARCHIVE"
fi

# Generate SHA256 Checksum
sha256sum "$FINAL_FILE" > "${FINAL_FILE}.sha256"

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "Backup completed successfully in ${DURATION}s." | tee -a "$LOG_FILE"
echo "Artifact: ${FINAL_FILE}" | tee -a "$LOG_FILE"
echo "Checksum: $(cat "${FINAL_FILE}.sha256")" | tee -a "$LOG_FILE"

# Retain last 30 daily backups
find "$BACKUP_DIR" -name "mizan_mongodb_*.gz*" -mtime +30 -delete
echo "=== Backup Process Finished ===" | tee -a "$LOG_FILE"
