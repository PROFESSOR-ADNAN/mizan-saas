# Mizan Environments Matrix

| Property | Local Dev | Staging | Production |
|---|---|---|---|
| **Host / Platform** | Docker Compose on localhost | 1 VPS (Ubuntu 24.04 LTS) | 1 VPS (Ubuntu 24.04 LTS, 4 vCPU / 8 GB RAM) |
| **Domain** | `localhost` | `*.staging.mizan.et` | `app.mizan.et`, `api.mizan.et`, `ingest.mizan.et` |
| **TLS** | Self-signed / HTTP | Let's Encrypt automated | Let's Encrypt automated + Cloudflare Origin CA |
| **MongoDB** | Container `rs0` replica set | Container `rs0` replica set | Container `rs0` replica set (Dedicated volume) |
| **Redis** | Container Redis 7 | Container Redis 7 | Container Redis 7 |
| **Chapa Integration** | Mocked test driver | Chapa Test Sandbox (`CHASECK_TEST-*`) | Chapa Live Production (`CHASECK_LIVE-*`) |
| **Email Delivery** | Mailcatcher (port 1080) | Mailcatcher / Test SMTP | Verified SES / Resend SMTP (DMARC pass) |
| **Webhooks** | Local receiver container | Mock webhook receiver | Production tenant endpoints (SSRF guard enforced) |
| **Observability** | Console pino logs | Loki + Prometheus + Grafana | Full Grafana stack + Alertmanager + Synthetic Probes |
| **Seeding** | 5 orgs, 20 users, 200k events | 5 orgs, 20 users, 500k events | Zero mock data (clean initial state) |
