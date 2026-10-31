.PHONY: up down build test test-isolation test-property test-billing test-ssrf lint seed seed-big migrate load-test chaos billing-run deploy-staging rollback backup restore

# Default target
all: build test

# Local development lifecycle
up:
	docker compose -f docker/compose.yaml up -d --build
	@echo "Services started: API (4000), Ingestion (4001), Web (5173), Mongo (27017), Redis (6379), Mailcatcher (1080)"

down:
	docker compose -f docker/compose.yaml down -v

build:
	npm run build

# Quality & Testing
lint:
	npm run lint

test:
	npm test

test-isolation:
	npm run test:isolation

test-property:
	npm run test:property

test-billing:
	npm run test:billing

test-ssrf:
	npm run test:ssrf

# Database operations
migrate:
	npm run migrate --workspace=server

seed:
	npm run seed --workspace=server

seed-big:
	npm run seed:big --workspace=server

billing-run:
	@echo "Executing billing cycle run for $(DATE)..."
	npm run billing:run --workspace=server -- --date=$(DATE)

# Deployment and DR
deploy-staging:
	bash scripts/deploy.sh staging

rollback:
	bash scripts/rollback.sh staging

backup:
	bash scripts/backup.sh

restore:
	bash scripts/restore.sh $(BACKUP_FILE)

restore-tenant:
	bash scripts/restore-tenant.sh $(ORG_ID) $(BACKUP_FILE)

# Performance & Reliability
load-test:
	k6 run tests/load/k6-ingest.js

chaos:
	bash tests/chaos/chaos-run.sh
