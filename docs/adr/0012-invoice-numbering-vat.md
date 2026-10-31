# ADR 0012: Sequential Gap-Free Invoice Numbering and Ethiopian VAT Handling

## Context
Ethiopian tax regulations (Proclamation No. 285/2002 and Ministry of Revenue directives) require sequential, gap-free invoice identification numbers and distinct VAT breakdown for commercial business transactions.

## Decision
1. **Invoice Numbering**:
   - Atomic counter stored in `counters` collection keyed by issuing entity and fiscal year: `INV-{YYYY}-{000001}`.
   - Increment performed via atomic MongoDB `findOneAndUpdate({ $inc: { seq: 1 } })` within the invoice finalization transaction.
   - Numbers are strictly sequential and gap-free; voided invoices retain their number.
2. **VAT Calculation**:
   - Standard Ethiopian VAT rate: 15% (configurable per organization/tax jurisdiction, default 1500 basis points).
   - VAT amount is calculated from the taxable subtotal using half-up integer santim rounding:
     $$\text{VAT Santim} = \left\lfloor \frac{\text{Subtotal Santim} \times 15 + 50}{100} \right\rfloor$$
   - Total invoice amount = $\text{Subtotal} + \text{VAT} - \text{Applied Credits}$.
   - Tenant Tax Identification Number (TIN) and Mizan platform TIN are printed on every generated PDF.

## Alternatives Considered
- **Random UUIDs for invoices**: Explicitly disallowed by tax authority guidelines for tax invoices.
- **Floating point percentage multiplication**: Produces rounding fractional errors.

## Consequences
- **Positive**: Full compliance with Ethiopian tax and commercial invoicing standards.
- **Negative**: Counter lock contention during concurrent invoice generation; mitigated by running billing cycle jobs sequentially by batch.
