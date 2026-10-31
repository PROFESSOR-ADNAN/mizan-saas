#!/usr/bin/env bash
set -euo pipefail

echo "=========================================================="
echo " INITIATING MIZAN EMERGENCY ROLLBACK"
echo " Date: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "=========================================================="

COMPOSE_FILE="docker/compose.prod.yaml"

if [ -f ".prev_commit" ]; then
  PREV_COMMIT=$(cat .prev_commit)
  echo "Rolling back to previous git commit: $PREV_COMMIT"
  git checkout "$PREV_COMMIT"
  docker compose -f "$COMPOSE_FILE" build
fi

echo "Restarting services with previous known-good state..."
docker compose -f "$COMPOSE_FILE" up -d --scale api=2 --scale ingest=2

echo "Rollback sequence completed. Checking health..."
sleep 5
curl -sf "http://127.0.0.1/health" && echo "Services recovered successfully!" || echo "Warning: Healthcheck failed after rollback."
