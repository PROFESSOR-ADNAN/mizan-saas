# Runbook: Chapa Payment Gateway Outage or Delayed Webhooks

## Severity: SEV2
**Symptom**: Tenants report invoice payments initiated but status remains `open`; webhook verification errors in logs.

## Diagnosis
1. Check Chapa service status at `https://status.chapa.co` or test API reachability:
   `curl -s https://api.chapa.co/v1/transaction/verify/test`
2. Check pending payment attempts in MongoDB:
   `docker compose -f docker/compose.prod.yaml exec mongo mongosh mizan --eval "db.payments.find({ status: 'pending' }).count()"`
3. Inspect payment worker reconciliation logs:
   `docker compose -f docker/compose.prod.yaml logs --tail=100 worker | grep "payment-reconcile"`

## Remediation Steps
1. If webhooks are failing due to network drops, payment reconciliation job runs every 10 minutes checking pending payments older than 10 minutes against Chapa verify API.
2. Manually trigger payment reconciliation run:
   `docker compose -f docker/compose.prod.yaml exec worker node -e "require('./dist/worker/reconcile-payments').runReconciliation()"`
3. If an individual invoice remains unpaid despite bank deduction:
   - Verify `txRef` directly in Chapa dashboard.
   - Once confirmed, platform admin issues payment confirmation via admin console or `scripts/confirm-payment.sh [INVOICE_ID] [TX_REF]`.

## Verification
- Target invoice state transitions from `open` to `paid`.
- Audit log entry records manual reconciliation.
