# ADR 0001: Docker Compose on Single VPS vs Kubernetes

## Context
Mizan is designed to serve Ethiopian SME sales analytics with 200 tenants, 500 sustained events/second, and 100 concurrent dashboard users. Hosting budget is capped at $25/month. Kubernetes incurs substantial compute overhead (control plane, etcd, kubelet) consuming 2+ GB RAM before any workload runs, exceeding the $25/mo VPS tier (typically 2-4 vCPU, 4-8 GB RAM).

## Decision
Deploy using Docker Compose on a single hardened Ubuntu LTS VPS. Run `api` and `ingest` as separate containerized processes (2 replicas each behind Nginx) to guarantee that ingestion spikes cannot starve the management API or dashboard.

## Alternatives Considered
- **Kubernetes (k3s/microk8s)**: Higher resource footprint and operational complexity without single-node resilience benefits.
- **Serverless (Lambda/Cloud Run)**: Unpredictable egress and request costs under 500 req/s sustained load, and lack of localized Ethiopian payment gateway integration support on edge cold starts.

## Consequences
- **Positive**: Low resource overhead (<300 MB for orchestration), deterministic configuration in git, zero licensing cost, full compliance with the $25/month budget.
- **Negative**: Vertical scaling limit of the single host; requires clear capacity thresholds documented in runbooks for migrating to multi-host when events exceed 2,000/sec.
