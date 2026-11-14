import { Router, Request, Response, NextFunction } from 'express';
import { BillingService } from '../services/billing.service.js';
import { invoiceRepo } from '../models/Invoice.js';
import { OrgService } from '../services/org.service.js';
import { ChangePlanSchema } from '@mizan/shared';
import { requirePermission } from '../middleware/rbac.js';
import { recordAuditLog } from '../middleware/audit.js';
import { NotFoundError } from '../utils/errors.js';

const router = Router({ mergeParams: true });

// Live Quota & Usage Meters
router.get('/meters', requirePermission('billing:read'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const meters = await BillingService.getUsageMeters(req.orgId!);
    res.status(200).json({ meters });
  } catch (err) {
    next(err);
  }
});

// Change Plan (Upgrade / Downgrade)
router.post('/plan', requirePermission('billing:manage'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { planId } = ChangePlanSchema.parse(req.body);
    const result = await BillingService.changePlan(req.orgId!, planId);
    await recordAuditLog(req, 'billing.plan_changed', 'Subscription', req.orgId, { planId });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// List Invoices
router.get('/invoices', requirePermission('billing:read'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoices = await invoiceRepo.find(req.orgId!, {}, null, { sort: { createdAt: -1 } });
    res.status(200).json({ invoices });
  } catch (err) {
    next(err);
  }
});

// Get Single Invoice
router.get('/invoices/:invoiceId', requirePermission('billing:read'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await invoiceRepo.findById(req.orgId!, req.params.invoiceId);
    if (!invoice) throw new NotFoundError('Invoice not found');
    res.status(200).json({ invoice });
  } catch (err) {
    next(err);
  }
});

// Download PDF Invoice
router.get('/invoices/:invoiceId/pdf', requirePermission('billing:read'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await invoiceRepo.findById(req.orgId!, req.params.invoiceId);
    if (!invoice) throw new NotFoundError('Invoice not found');

    const org = await OrgService.getOrgById(req.orgId!);
    const pdfBuffer = await BillingService.generateInvoicePdf(invoice, org);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
});

// Pay Invoice via Chapa
router.post('/invoices/:invoiceId/pay', requirePermission('billing:manage'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await BillingService.initPayment(req.orgId!, req.params.invoiceId);
    await recordAuditLog(req, 'billing.payment_initiated', 'Invoice', req.params.invoiceId, { txRef: result.txRef });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// Simulate Payment in Test Mode (for portfolio review & staging)
router.post('/invoices/:invoiceId/simulate-payment', requirePermission('billing:manage'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await invoiceRepo.findById(req.orgId!, req.params.invoiceId);
    if (!invoice) throw new NotFoundError('Invoice not found');
    invoice.status = 'paid';
    invoice.paidAt = new Date();
    invoice.paymentTxRef = `sim_${Date.now()}`;
    await invoice.save();
    await recordAuditLog(req, 'billing.test_payment_simulated', 'Invoice', req.params.invoiceId, { mode: 'sandbox' });
    res.status(200).json({ success: true, message: 'Invoice marked paid in sandbox simulator mode' });
  } catch (err) {
    next(err);
  }
});

export default router;
