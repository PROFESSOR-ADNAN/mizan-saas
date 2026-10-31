# ADR 0013: Chapa Integration, Invoice-and-Pay Flow, and Webhook Idempotency

## Context
Chapa (https://chapa.co) is the primary payment gateway for Ethiopian Birr transactions, supporting Telebirr, CBE Birr, Awash Birr, and local debit cards. Chapa provides hosted checkout initialization, transaction verification API, and webhook notifications.

## Decision
1. **Invoice-and-Pay Flow**:
   - The user clicks "Pay" on an open invoice.
   - The server creates a payment attempt with a unique reference: `txRef = mzn_tx_${invoiceId}_${timestamp}`.
   - Server initializes Chapa checkout via `POST https://api.chapa.co/v1/transaction/initialize` with amount in ETB, currency `ETB`, and callback URL.
   - User is redirected to Chapa's secure checkout page.
2. **Webhook Verification**:
   - Chapa delivers HMAC SHA-256 signature in the `x-chapa-signature` header computed over the raw body with the secret key.
   - The server performs constant-time comparison using `crypto.timingSafeEqual`.
   - On signature validation, the server makes a mandatory server-to-server call to Chapa's verification endpoint (`GET https://api.chapa.co/v1/transaction/verify/${txRef}`) to confirm the transaction status, amount, and currency before marking the invoice `paid`.
   - Webhook processing is idempotent: duplicate callbacks or already-paid invoice references return `200 OK` without re-processing.
   - The browser return URL never marks an invoice as paid.

## Alternatives Considered
- **Direct Card Storage**: Prohibited by PCI-DSS. Chapa's hosted checkout ensures no card data touches Mizan infrastructure.
- **Client-Side Verification**: Vulnerable to spoofed client requests.

## Consequences
- **Positive**: Resilient against forged webhooks, replay attacks, and network failures.
- **Negative**: Requires outbound internet connectivity from worker/api containers to Chapa's verification API.
