# Custom Domain Setup Guide for Mizan SaaS (ሚዛን)

This guide documents production custom domain configuration for Mizan multi-tenant sales analytics deployed across Vercel (Frontend) and Render (API Backend).

---

## 1. Domain Architecture Overview

| Component | Target URL | Recommended Custom Domain | Hosting Provider |
| :--- | :--- | :--- | :--- |
| **Web Dashboard** | `https://mizan-saas.vercel.app` | `app.mizan.et` (or `mizan.et`) | Vercel Edge Network |
| **API Server** | `https://mizan-api-3lif.onrender.com` | `api.mizan.et` | Render Cloud |
| **Swagger / OpenAPI** | `https://mizan-api-3lif.onrender.com/docs` | `api.mizan.et/docs` | Render Cloud |

---

## 2. Frontend Custom Domain (`app.mizan.et`) on Vercel

### Step 1: Add Domain in Vercel
1. Log in to your [Vercel Dashboard](https://vercel.com).
2. Navigate to your project **`mizan-saas`** > **Settings** > **Domains**.
3. Enter `app.mizan.et` (or your registered root domain `mizan.et`) and click **Add**.

### Step 2: Configure DNS Records in your Domain Registrar (Ethio Telecom / Cloudflare / Namecheap)

Add the following DNS record:

```dns
Type:  CNAME
Name:  app
Value: cname.vercel-dns.com.
TTL:   60 (or Auto)
```

If configuring the apex root domain (`mizan.et`):
```dns
Type:  A
Name:  @
Value: 76.76.21.21
TTL:   60
```

### Step 3: SSL Certificate Issuance
Vercel automatically provisions and renews a free wildcard SSL certificate via Let's Encrypt within 60 seconds of DNS propagation.

---

## 3. Backend Custom Domain (`api.mizan.et`) on Render

### Step 1: Add Custom Domain in Render
1. Open [Render Dashboard](https://dashboard.render.com).
2. Select Web Service **`mizan-api`** > **Settings** > **Custom Domains**.
3. Click **Add Custom Domain** and enter `api.mizan.et`.

### Step 2: Configure DNS Records
Add the following CNAME pointing to your Render service address:

```dns
Type:  CNAME
Name:  api
Value: mizan-api-3lif.onrender.com
TTL:   300
```

### Step 3: Verify TLS & Automatic SSL
Render automatically generates an SSL/TLS certificate via Let's Encrypt once the CNAME is verified.

---

## 4. CORS Whitelisting in Mizan Backend

To allow the frontend on `app.mizan.et` to communicate with `api.mizan.et` without CORS rejection, ensure `CORS_ORIGIN` is configured in your environment variables:

```bash
# Render Dashboard > Environment Variables
CORS_ORIGIN=https://mizan-saas.vercel.app,https://app.mizan.et,https://mizan.et
```

Mizan's CORS middleware parses comma-separated origins and allows preflight `OPTIONS` requests seamlessly.

---

## 5. Verification Commands

Test DNS propagation and SSL handshake:

```bash
# 1. Verify DNS CNAME resolution
dig CNAME app.mizan.et +short
dig CNAME api.mizan.et +short

# 2. Test SSL Certificate Handshake
curl -Iv https://app.mizan.et
curl -Iv https://api.mizan.et/healthz

# 3. Test POS Ingestion via Custom Domain
curl -X POST https://api.mizan.et/ingest/v1/events \
  -H "Content-Type: application/json" \
  -H "X-Mizan-Key: <YOUR_API_KEY>" \
  -d '{"events": []}'
```
