#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <path_to_backup_file> [target_mongo_uri]"
  exit 1
fi

BACKUP_FILE="$1"
TARGET_URI="${2:-${MONGODB_URI:-mongodb://localhost:27017/mizan_prod}}"

echo "=== Mizan Full Database Restore Initiated ==="
echo "Source: $BACKUP_FILE"
echo "Target: $TARGET_URI"
START_TIME=$(date +%s)

# Verify checksum if .sha256 file exists
if [ -f "${BACKUP_FILE}.sha256" ]; then
  echo "Verifying SHA256 checksum..."
  sha256sum -c "${BACKUP_FILE}.sha256"
  echo "Checksum verified successfully!"
fi

RESTORE_ARCHIVE="$BACKUP_FILE"

# Decrypt if encrypted
if [[ "$BACKUP_FILE" == *.enc ]]; then
  if [ -z "${BACKUP_ENCRYPTION_KEY:-}" ]; then
    echo "Error: BACKUP_ENCRYPTION_KEY environment variable required for encrypted backup"
    exit 1
  fi
  RESTORE_ARCHIVE="${BACKUP_FILE%.enc}"
  echo "Decrypting archive..."
  openssl enc -d -aes-256-cbc -pbkdf2 -in "$BACKUP_FILE" -out "$RESTORE_ARCHIVE" -pass "pass:${BACKUP_ENCRYPTION_KEY}"
fi

echo "Restoring MongoDB dataset..."
mongorestore --uri="$TARGET_URI" --archive="$RESTORE_ARCHIVE" --gzip --drop

# Cleanup decrypted temporary archive if decrypted
if [[ "$BACKUP_FILE" == *.enc ]]; then
  rm -f "$RESTORE_ARCHIVE"
fi

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "=== Full Database Restore COMPLETED successfully in ${DURATION}s ==="
