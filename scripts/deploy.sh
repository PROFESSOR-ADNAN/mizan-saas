#!/usr/bin/env bash
set -euo pipefail

echo "=========================================================="
echo " Starting Mizan Zero-Downtime Deployment"
echo " Date: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo " Commit: $(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
echo "=========================================================="

COMPOSE_FILE="docker/compose.prod.yaml"

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "Error: Compose file $COMPOSE_FILE not found."
  exit 1
fi

echo "--> Validating Docker Compose configuration..."
docker compose -f "$COMPOSE_FILE" config > /dev/null

echo "--> Building production container images..."
docker compose -f "$COMPOSE_FILE" build --parallel

echo "--> Deploying database and caching infrastructure..."
docker compose -f "$COMPOSE_FILE" up -d mongodb redis
sleep 3

echo "--> Rolling update for API and Ingestion replicas..."
docker compose -f "$COMPOSE_FILE" up -d --no-deps --scale api=2 --scale ingest=2 api ingest
docker compose -f "$COMPOSE_FILE" up -d --no-deps worker web nginx

echo "--> Waiting for health checks to pass..."
RETRY_COUNT=0
MAX_RETRIES=15
HEALTH_URL="http://127.0.0.1/health"

until curl -sf "$HEALTH_URL" > /dev/null || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
  echo "Waiting for services to become healthy ($RETRY_COUNT/$MAX_RETRIES)..."
  sleep 2
  RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "Deployment FAILED: Healthcheck did not pass in time!"
  echo "Initiating automated rollback..."
  ./scripts/rollback.sh
  exit 1
fi

echo "--> Running post-deployment smoke tests..."
./scripts/smoke-test.sh

echo "=========================================================="
echo " Mizan Deployment SUCCESSFUL at $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "=========================================================="
