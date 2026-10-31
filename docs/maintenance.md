# Mizan Maintenance Schedule & Cloud Cost Management

## 1. Routine Maintenance Schedule

| Cadence | Task | Owner | Verification Procedure |
|---|---|---|---|
| **Weekly** | Dependency review & security advisories | DevOps / SRE | Run `npm audit`, `trivy fs .`, Dependabot PR review. |
| **Monthly** | OS security patching & kernel update | DevOps / SRE | Apply unattended security upgrades, reboot under maintenance window. |
| **Monthly** | Automated DR restore rehearsal | SRE / QA | Automated cron triggers scratch restore script and verifies invoice/ledger sums. |
| **Quarterly** | Database index & performance analysis | Principal Architect | Review WiredTiger cache, slow query logs, index hit ratios. |
| **Quarterly** | Ethiopian VAT & Tax regulation check | Compliance / Lead | Verify VAT proclamation rates (standard 15%) and e-invoicing directives. |
| **Biannual** | Cryptographic secrets rotation | Security Lead | Rotate JWT master keys, webhook encryption master key, and Chapa secrets. |

---

## 2. Monthly Cloud Infrastructure Budget ($25 Total Cap)

| Item | Specification / Provider | Monthly Cost (USD) | Notes |
|---|---|---|---|
| **Primary VPS** | Hetzner CPX31 (4 vCPU AMD, 8 GB RAM, 160 GB NVMe, 20 TB Traffic) | $17.50 / mo | Runs Docker Compose, MongoDB, Redis, API, Ingest, Workers, Nginx. |
| **Off-Site Backups** | Cloudflare R2 / Backblaze B2 (50 GB encrypted cold storage) | $0.50 / mo | Daily encrypted restic snapshots (3-2-1 backup strategy). |
| **DNS, CDN & WAF** | Cloudflare Free Tier | $0.00 / mo | SSL termination, DDoS protection, edge caching. |
| **Transactional Email**| Amazon SES / Resend Free Tier (up to 3,000 emails/mo) | $0.00 / mo | Invoices, threshold alerts, password resets. |
| **Domain Registration**| .et / .com registry | $4.00 / mo (amortized)| Amortized annual registration fee. |
| **Total Monthly Spend**| - | **$22.00 / mo** | **Within $25.00/mo hard cap ($3.00 buffer)** |
