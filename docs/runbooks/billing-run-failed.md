# Runbook: Monthly Billing Run Failure or Interruption

## Severity: SEV2
**Symptom**: Alert `BillingRunFailed` or `BillingRunOverrun` fires; monthly invoices not generated after billing cycle close.

## Diagnosis
1. Inspect billing worker logs:
   `docker compose -f docker/compose.prod.yaml logs --tail=200 worker | grep -E "billing|invoice"`
2. Verify lock status in Redis:
   `docker compose -f docker/compose.prod.yaml exec redis redis-cli GET lock:billing_cycle`
3. Check last finalized invoice counter in MongoDB:
   `docker compose -f docker/compose.prod.yaml exec mongo mongosh mizan --eval "db.counters.findOne({ _id: 'invoice_counter' })"`

## Remediation Steps
1. Release stale lock if worker crashed mid-run:
   `docker compose -f docker/compose.prod.yaml exec redis redis-cli DEL lock:billing_cycle`
2. Trigger idempotent billing run retry for specific date:
   `make billing-run DATE="2026-11-01"`
3. Confirm that the billing engine is idempotent: subscriptions with already generated invoices for the period are skipped automatically with zero duplicates.

## Verification
1. Verify invoice count:
   `docker compose -f docker/compose.prod.yaml exec mongo mongosh mizan --eval "db.invoices.countDocuments({ period: '2026-10' })"`
2. Verify line item sums match total:
   `npm run test:billing --workspace=server`
3. Clear alert in Alertmanager.
