# Mizan DNS, Domain Architecture & TLS Configuration

## 1. Domain Structure & Routing

Driven by the single root domain variable `DOMAIN_ROOT=mizan.et` (or test placeholder `example.com`):

| Hostname | Target / Origin | Purpose & Caching Policy |
|---|---|---|
| `app.mizan.et` | Nginx -> Web Static container | Web SPA application. Cloudflare caches static hashed assets (`/assets/*`, 1 year immutable). |
| `api.mizan.et` | Nginx -> `api` container | Management REST API (`/api/v1/*`). Cloudflare proxy active, cache bypassed (`no-store`). |
| `ingest.mizan.et` | Nginx -> `ingest` container | High-volume ingestion (`/ingest/v1/*`). Independent Cloudflare WAF & rate-limiting policies. |

---

## 2. DNS Zone Configuration

```dns
; Primary Host Records
@                   A       203.0.113.10          ; Origin VPS IP (Proxied through Cloudflare)
app                 CNAME   @                     ; Proxied
api                 CNAME   @                     ; Proxied
ingest              CNAME   @                     ; Proxied

; Mail & Identity Records (SPF, DKIM, DMARC for Transactional Billing Emails)
@                   MX  10  feedback-smtp.eu-west-1.amazonses.com.
@                   TXT     "v=spf1 include:amazonses.com ~all"
mizan._domainkey    TXT     "p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC3..."
_dmarc              TXT     "v=DMARC1; p=reject; rua=mailto:dmarc@mizan.et; ruf=mailto:dmarc@mizan.et; pct=100; sp=reject"

; CAA Record Restricting Certificate Issuance
@                   CAA 0   issue "letsencrypt.org"
@                   CAA 0   iodef "mailto:security@mizan.et"
```

---

## 3. Automated TLS Renewal (Certbot / ACME)
- TLS certificates issued via Let's Encrypt using ACME DNS-01 or HTTP-01 challenge.
- Automated daily cron dry-run test (`certbot renew --dry-run`).
- Alertmanager triggers warning alert when certificate expiration is < 21 days, and SEV1 alert at < 7 days.
