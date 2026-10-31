# ADR 0021: Observability Stack Sized to VPS and the Cardinality Rule

## Context
Full enterprise observability can consume significant memory (e.g. Jaeger, OpenTelemetry Collector, Tempo, Elastic). On a 4-8 GB VPS, the monitoring stack must consume < 15% of system resources. High-cardinality Prometheus labels (like `orgId` or `userId`) cause memory blowouts.

## Decision
1. **Telemetry Components**:
   - Metrics: Prometheus scraping custom application metrics, Node exporter, Redis exporter, and MongoDB exporter.
   - Dashboards & Alerts: Grafana + Alertmanager.
   - Logs: Structured JSON logs processed by Grafana Alloy into Loki. (Promtail is retired; Alloy is current and maintained).
   - Distributed Tracing (Tempo): Marked *Not Applicable* due to memory constraints; trace IDs are propagated across services and correlated directly via Loki JSON logs.
2. **Cardinality Rule**:
   - **Zero unbounded labels in Prometheus metrics**.
   - `orgId`, `userId`, `eventId`, `txRef`, and customer references are **strictly prohibited** from Prometheus metric labels.
   - Metrics use bounded dimensions only (e.g. `status_code`, `route`, `queue_name`, `granularity`, `event_type`).
   - Tenant-level metrics (e.g. Top 10 tenants by ingestion rate) are computed asynchronously by a scheduled worker into a fixed-cardinality gauge or queried directly through Loki log streams.

## Alternatives Considered
- **Including `orgId` in Prometheus metrics**: Rapidly produces millions of active time-series, crashing Prometheus on the single VPS.
- **Promtail**: Deprecated and retired by Grafana Labs in favor of Grafana Alloy.

## Consequences
- **Positive**: Lightweight monitoring footprint (<500 MB RAM total); zero risk of Prometheus time-series explosion.
- **Negative**: Deep per-tenant drilldowns rely on Loki log queries rather than raw Prometheus instant queries.
