#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:4000}"
INGEST_URL="${2:-http://localhost:4001}"

echo "=== Mizan Production Smoke Test Suite ==="
echo "Testing API at: $BASE_URL"
echo "Testing Ingestion at: $INGEST_URL"

FAILED=0

# 1. API Health Check
echo -n "1. Checking Management API /health... "
API_HEALTH=$(curl -sf "$BASE_URL/health" || true)
if echo "$API_HEALTH" | grep -q '"status":"ok"'; then
  echo "PASS"
else
  echo "FAIL (Response: $API_HEALTH)"
  FAILED=1
fi

# 2. Ingestion Health Check
echo -n "2. Checking Ingestion API /health... "
INGEST_HEALTH=$(curl -sf "$INGEST_URL/health" || true)
if echo "$INGEST_HEALTH" | grep -q '"status":"ok"'; then
  echo "PASS"
else
  echo "FAIL (Response: $INGEST_HEALTH)"
  FAILED=1
fi

# 3. OpenAPI Documentation Availability
echo -n "3. Checking OpenAPI Spec Endpoint... "
DOCS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/docs" || true)
if [ "$DOCS_CODE" -eq 200 ] || [ "$DOCS_CODE" -eq 301 ] || [ "$DOCS_CODE" -eq 302 ]; then
  echo "PASS (HTTP $DOCS_CODE)"
else
  echo "FAIL (HTTP $DOCS_CODE)"
  FAILED=1
fi

# 4. Ingestion Authentication Enforcement
echo -n "4. Checking Ingestion 401 on missing API key... "
AUTH_FAIL_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$INGEST_URL/api/v1/ingest" -H "Content-Type: application/json" -d '{"events":[]}' || true)
if [ "$AUTH_FAIL_CODE" -eq 401 ]; then
  echo "PASS (Got expected HTTP 401)"
else
  echo "FAIL (Expected HTTP 401, got $AUTH_FAIL_CODE)"
  FAILED=1
fi

echo "========================================="
if [ $FAILED -eq 0 ]; then
  echo " All smoke tests PASSED successfully!"
  exit 0
else
  echo " One or more smoke tests FAILED!"
  exit 1
fi
