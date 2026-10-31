# ADR 0015: Outbound Webhook Delivery and SSRF Defense

## Context
Allowing tenants to register outbound webhook endpoints exposes the platform to Server-Side Request Forgery (SSRF), internal port scanning, cloud metadata theft (`169.254.169.254`), and DNS rebinding attacks.

## Decision
1. **SSRF Guard Architecture**:
   - Webhook worker executes in an isolated Docker bridge network (`mizan_webhook_net`) with no route to `mizan_internal_net` (MongoDB, Redis, management API).
   - Before dispatch, DNS is resolved explicitly. The target IP is checked against a strict denylist:
     - IPv4: `0.0.0.0/8`, `10.0.0.0/8`, `127.0.0.0/8`, `169.254.0.0/16`, `172.16.0.0/12`, `192.168.0.0/16`, `224.0.0.0/4`, `240.0.0.0/4`, `255.255.255.255/32`
     - IPv6: `::1/128`, `::/128`, `fc00::/7`, `fe80::/10`, `ff00::/8`
   - The HTTP socket connects directly to the validated IP, overriding DNS lookup to prevent DNS rebinding.
   - Redirects are restricted to max 2 hops, with full IP validation repeated on each hop.
   - Allowed ports in production: 443 and 8443 only (port 80 allowed only in local dev).
   - Request timeout: 10 seconds; maximum response body read: 64 KB.
2. **Delivery Semantics & Security**:
   - Signature: `X-Mizan-Signature: t=<unix_ts>,v1=<HMAC-SHA256(t + "." + body)>`.
   - Retry schedule with exponential backoff: 1 min, 5 min, 30 min, 2 h, 6 h, 24 h.
   - Automatic endpoint disablement after 20 consecutive delivery failures, notifying the tenant owner.

## Alternatives Considered
- **Native `fetch` or `axios` without DNS inspection**: Vulnerable to DNS rebinding (TTL 0 switching to internal IP) and AWS/GCP/DigitalOcean metadata endpoints.

## Consequences
- **Positive**: Complete mitigation of SSRF, metadata exfiltration, and local network exploration.
- **Negative**: Webhooks cannot target internal private endpoints or custom non-standard ports.
