import crypto from 'node:crypto';
import PDFDocument from 'pdfkit';
import { InvoiceModel, invoiceRepo, InvoiceDocument } from '../models/Invoice.js';
import { SubscriptionModel, subscriptionRepo } from '../models/Subscription.js';
import { PaymentModel, paymentRepo } from '../models/Payment.js';
import { UsageLedgerModel, usageLedgerRepo } from '../models/UsageLedger.js';
import { CreditNoteModel, creditNoteRepo } from '../models/CreditNote.js';
import { OrganizationModel } from '../models/Organization.js';
import { PLANS, PlanId, TRIAL_DURATION_DAYS } from '@mizan/shared';
import { getQuotaCounter } from '../config/redis.js';
import { getBillingPeriodKey, calculateProration, formatSantim, calculateVatSantim } from '@mizan/shared';
import { constantTimeCompare, signHmac } from '../utils/crypto.js';
import { NotFoundError, AppError, ConflictError } from '../utils/errors.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export class BillingService {
  /**
   * Runs the complete monthly billing cycle across all active tenants.
   */
  static async runBillingCycle(targetDate = new Date()): Promise<{ invoicesCreated: number }> {
    const periodKey = getBillingPeriodKey(targetDate);
    const year = targetDate.getUTCFullYear();

    const subscriptions = await SubscriptionModel.find(
      { status: { $in: ['active', 'past_due', 'trialing'] } },
      null,
      { unscopedForPlatformJob: true, platformJobName: 'billing_cycle_run' } as any
    );

    let createdCount = 0;

    for (const sub of subscriptions) {
      const orgId = sub.orgId.toString();

      // Idempotency: verify if already invoiced for this period
      const existing = await InvoiceModel.findOne(
        { orgId, period: periodKey },
        null,
        { unscopedForPlatformJob: true, platformJobName: 'billing_idempotency_check' } as any
      );

      if (existing) continue;

      const plan = PLANS[sub.planId as PlanId] || PLANS.free;

      // 1. Tally unique accepted events
      const ledgerAgg = await UsageLedgerModel.aggregate([
        { $match: { orgId: new (require('mongoose')).Types.ObjectId(orgId), period: periodKey } },
        { $group: { _id: null, total: { $sum: '$eventsIngested' } } },
      ]).option({ unscopedForPlatformJob: true, platformJobName: 'billing_ledger_sum' } as any);

      const totalEvents = ledgerAgg.length > 0 ? ledgerAgg[0].total : 0;

      // 2. Seat Snapshots
      const seatSnapshots = await (await import('../models/SeatSnapshot.js')).SeatSnapshotModel.find(
        { orgId, period: periodKey },
        null,
        { unscopedForPlatformJob: true, platformJobName: 'billing_seat_snapshots' } as any
      );

      let averageSeats = plan.includedSeats;
      if (seatSnapshots.length > 0) {
        const sumSeats = seatSnapshots.reduce((acc: number, s: any) => acc + s.activeSeatCount, 0);
        averageSeats = Math.ceil(sumSeats / seatSnapshots.length);
      }

      const billableExtraSeats = Math.max(0, averageSeats - plan.includedSeats);
      const seatChargeSantim = billableExtraSeats * plan.extraSeatPriceSantim;

      // 3. Overage
      const { billableOverageEvents, overageSantim } = (await import('@mizan/shared')).calculateOverageSantim(
        totalEvents,
        plan.includedEvents,
        plan.overagePricePerThousandSantim
      );

      // 4. Lines
      const lines: any[] = [
        {
          description: `${plan.name} Plan Base Subscription (${periodKey})`,
          quantity: 1,
          unitPriceSantim: plan.basePriceSantim,
          totalSantim: plan.basePriceSantim,
        },
      ];

      if (billableExtraSeats > 0) {
        lines.push({
          description: `Additional Team Seats (${billableExtraSeats} seat-months average)`,
          quantity: billableExtraSeats,
          unitPriceSantim: plan.extraSeatPriceSantim,
          totalSantim: seatChargeSantim,
        });
      }

      if (billableOverageEvents > 0) {
        lines.push({
          description: `Usage Overage (${billableOverageEvents.toLocaleString()} excess events)`,
          quantity: Math.ceil(billableOverageEvents / 1000),
          unitPriceSantim: plan.overagePricePerThousandSantim,
          totalSantim: overageSantim,
        });
      }

      const subtotalSantim = lines.reduce((acc: number, l: any) => acc + l.totalSantim, 0);
      const vatSantim = calculateVatSantim(subtotalSantim, 1500);

      // 5. Credit Notes
      const creditNotes = await CreditNoteModel.find(
        { orgId, remainingSantim: { $gt: 0 } },
        null,
        { unscopedForPlatformJob: true, platformJobName: 'billing_credits' } as any
      );

      let creditAppliedSantim = 0;
      const totalBeforeCredit = subtotalSantim + vatSantim;

      for (const cn of creditNotes) {
        const deduction = Math.min(cn.remainingSantim, totalBeforeCredit - creditAppliedSantim);
        if (deduction > 0) {
          creditAppliedSantim += deduction;
          cn.remainingSantim -= deduction;
          await cn.save();
        }
        if (creditAppliedSantim >= totalBeforeCredit) break;
      }

      const totalSantim = Math.max(0, totalBeforeCredit - creditAppliedSantim);
      const seq = await (await import('../models/Counter.js')).getNextSequence(`inv_${year}`);
      const invoiceNumber = `INV-${year}-${String(seq).padStart(6, '0')}`;
      const dueDate = new Date(targetDate.getTime() + 7 * 24 * 60 * 60 * 1000);

      await InvoiceModel.create({
        orgId,
        invoiceNumber,
        period: periodKey,
        status: totalSantim === 0 ? 'paid' : 'open',
        subtotalSantim,
        vatRateBasisPoints: 1500,
        vatSantim,
        creditAppliedSantim,
        totalSantim,
        currency: 'ETB',
        eventsBilledCount: totalEvents,
        lines,
        dueDate,
        paidAt: totalSantim === 0 ? new Date() : undefined,
      });

      createdCount++;
    }

    logger.info({ periodKey, invoicesCreated: createdCount }, 'Billing cycle run complete');
    return { invoicesCreated: createdCount };
  }

  /**
   * Retrieves live usage meters (Redis fast path) and durable ledger history.
   */
  static async getUsageMeters(orgId: string): Promise<any> {
    const sub = await subscriptionRepo.findOne(orgId, {});
    const planId: PlanId = (sub?.planId as PlanId) || 'free';
    const plan = PLANS[planId] || PLANS.free;

    const currentPeriod = getBillingPeriodKey(new Date());
    const redisCount = await getQuotaCounter(orgId, currentPeriod);

    // Sum durable ledger records for period
    const ledgerSum = await usageLedgerRepo.aggregate(orgId, [
      { $match: { period: currentPeriod } },
      { $group: { _id: null, total: { $sum: '$eventsIngested' } } },
    ]);

    const durableCount = ledgerSum.length > 0 ? ledgerSum[0].total : 0;
    const effectiveCount = Math.max(redisCount, durableCount);

    const percentUsed = plan.includedEvents > 0
      ? Math.min(100, Math.round((effectiveCount / plan.includedEvents) * 100))
      : 100;

    return {
      planId,
      planName: plan.name,
      status: sub?.status || 'active',
      period: currentPeriod,
      eventsIngested: effectiveCount,
      includedEvents: plan.includedEvents,
      percentUsed,
      thresholdAlert: percentUsed >= 100 ? '100%' : percentUsed >= 80 ? '80%' : percentUsed >= 50 ? '50%' : 'normal',
      isHardCapped: planId === 'free' && effectiveCount >= plan.includedEvents,
      trialEndsAt: sub?.trialEndsAt,
    };
  }

  /**
   * Changes plan with immediate proration for upgrades or period-end downgrades.
   */
  static async changePlan(orgId: string, targetPlanId: PlanId): Promise<any> {
    const sub = await subscriptionRepo.findOne(orgId, {});
    if (!sub) throw new NotFoundError('Subscription not found');

    const currentPlan = PLANS[sub.planId as PlanId] || PLANS.free;
    const targetPlan = PLANS[targetPlanId];
    if (!targetPlan) throw new NotFoundError(`Invalid plan ID: ${targetPlanId}`);

    const now = new Date();

    // Check if Upgrade
    if (targetPlan.basePriceSantim > currentPlan.basePriceSantim) {
      // Immediate Upgrade with Proration Credit/Debit
      const proration = calculateProration(
        currentPlan.basePriceSantim,
        sub.currentPeriodStart,
        sub.currentPeriodEnd,
        now
      );

      const targetProration = calculateProration(
        targetPlan.basePriceSantim,
        sub.currentPeriodStart,
        sub.currentPeriodEnd,
        now
      );

      const netAdjustmentSantim = targetProration.unusedCreditSantim - proration.unusedCreditSantim;

      sub.planId = targetPlanId;
      sub.planVersion = targetPlan.version;
      sub.status = 'active';
      await sub.save();

      return {
        action: 'upgrade',
        newPlanId: targetPlanId,
        proration: {
          daysRemaining: proration.daysRemaining,
          unusedCreditOldPlanSantim: proration.unusedCreditSantim,
          chargeNewPlanSantim: targetProration.unusedCreditSantim,
          netDueSantim: Math.max(0, netAdjustmentSantim),
        },
      };
    } else {
      // Downgrade: Takes effect at end of current period
      sub.cancelAtPeriodEnd = true;
      await sub.save();

      return {
        action: 'downgrade_scheduled',
        targetPlanId,
        effectiveDate: sub.currentPeriodEnd,
      };
    }
  }

  /**
   * Initializes Chapa payment for an open invoice.
   */
  static async initPayment(orgId: string, invoiceId: string): Promise<{ checkoutUrl: string; txRef: string }> {
    const invoice = await invoiceRepo.findById(orgId, invoiceId);
    if (!invoice) throw new NotFoundError('Invoice not found');

    if (invoice.status === 'paid') {
      throw new ConflictError('Invoice is already paid');
    }

    const org = await OrganizationModel.findById(orgId);
    const txRef = `mzn_tx_${invoiceId}_${Date.now()}`;
    const amountEtb = invoice.totalSantim / 100;

    // Call Chapa initialize API
    try {
      const chapaResponse = await fetch(`${config.CHAPA_API_URL}/transaction/initialize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.CHAPA_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountEtb.toFixed(2),
          currency: 'ETB',
          email: 'billing@mizan.et',
          first_name: org?.name || 'Customer',
          tx_ref: txRef,
          callback_url: `${process.env.API_BASE_URL || 'http://localhost:4000'}/api/v1/billing/chapa-webhook`,
          return_url: `${process.env.WEB_BASE_URL || 'http://localhost:5173'}/billing/success?txRef=${txRef}`,
          customization: {
            title: `Mizan Invoice ${invoice.invoiceNumber}`,
            description: `Payment for billing period ${invoice.period}`,
          },
        }),
      });

      const data: any = await chapaResponse.json();

      if (!chapaResponse.ok || data.status !== 'success') {
        logger.warn({ data }, 'Chapa initialize failed, utilizing simulated sandbox checkout for dev');
      }

      const checkoutUrl = data?.data?.checkout_url || `https://checkout.chapa.co/checkout/test/${txRef}`;

      // Save Payment attempt
      await paymentRepo.create(orgId, {
        invoiceId: invoice._id as any,
        txRef,
        amountSantim: invoice.totalSantim,
        currency: 'ETB',
        status: 'pending',
        checkoutUrl,
      });

      return { checkoutUrl, txRef };
    } catch (err) {
      logger.error({ err, invoiceId }, 'Chapa payment initialization failed');
      throw new AppError('Unable to initialize payment with Chapa', 502, 'PAYMENT_GATEWAY_ERROR');
    }
  }

  /**
   * Verifies and handles Chapa payment webhook with constant-time HMAC signature check.
   */
  static async handleChapaWebhook(rawBody: string, signature: string, payload: any): Promise<boolean> {
    // 1. Verify HMAC SHA-256 signature (or direct secret hash match if sent by Chapa)
    const expectedSignature = signHmac(rawBody, config.CHAPA_WEBHOOK_SECRET);
    const signatureValid =
      constantTimeCompare(expectedSignature, signature) ||
      constantTimeCompare(config.CHAPA_WEBHOOK_SECRET, signature);
    if (!signatureValid) {
      logger.warn({ signature }, 'FORGED_PAYMENT_WEBHOOK: Signature mismatch');
      return false;
    }

    const txRef = payload.tx_ref;
    if (!txRef) {
      logger.warn('Payment webhook missing tx_ref');
      return false;
    }

    // 2. Load Payment Record (unscoped for platform callback)
    const payment = await PaymentModel.findOne(
      { txRef },
      null,
      { unscopedForPlatformJob: true, platformJobName: 'chapa_webhook_verification' } as any
    );

    if (!payment) {
      logger.warn({ txRef }, 'Payment attempt not found for incoming webhook');
      return false;
    }

    // Idempotency: already paid returns true immediately
    if (payment.status === 'success') {
      return true;
    }

    // 3. Server-to-Server Verification directly with Chapa API
    try {
      const verifyRes = await fetch(`${config.CHAPA_API_URL}/transaction/verify/${txRef}`, {
        headers: {
          Authorization: `Bearer ${config.CHAPA_SECRET_KEY}`,
        },
      });

      const verifyData: any = await verifyRes.json();
      const isSuccess = verifyRes.ok && verifyData.status === 'success';

      // Accept in test environments if simulated
      if (!isSuccess && process.env.NODE_ENV === 'development') {
        logger.info({ txRef }, 'Development mode: accepting simulated payment');
      } else if (!isSuccess) {
        logger.warn({ txRef, verifyData }, 'Chapa server verification failed');
        payment.status = 'failed';
        await payment.save();
        return false;
      }

      // 4. Mark Payment and Invoice Paid
      payment.status = 'success';
      payment.verifiedAt = new Date();
      await payment.save();

      const invoice = await InvoiceModel.findById(payment.invoiceId);
      if (invoice) {
        invoice.status = 'paid';
        invoice.paidAt = new Date();
        invoice.paymentTxRef = txRef;
        await invoice.save();

        // Restore organization subscription to active
        await SubscriptionModel.updateOne(
          { orgId: invoice.orgId },
          { $set: { status: 'active' } }
        );
      }

      return true;
    } catch (err) {
      logger.error({ err, txRef }, 'Error during server-to-server Chapa verification');
      return false;
    }
  }

  /**
   * Streams a PDF invoice.
   */
  static generateInvoicePdf(invoice: InvoiceDocument, org: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('MIZAN TAX INVOICE', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Invoice Number: ${invoice.invoiceNumber}`);
      doc.text(`Billing Period: ${invoice.period}`);
      doc.text(`Issue Date: ${invoice.createdAt.toISOString().slice(0, 10)}`);
      doc.text(`Due Date: ${invoice.dueDate.toISOString().slice(0, 10)}`);
      doc.text(`Status: ${invoice.status.toUpperCase()}`);
      doc.moveDown();

      // Entity Details
      doc.text(`Platform TIN: 0012345678 (Mizan Cloud Tech PLC)`);
      doc.text(`Customer Org: ${org?.name || 'Client'}`);
      if (org?.tin) doc.text(`Customer TIN: ${org.tin}`);
      doc.moveDown();

      // Line items table
      doc.fontSize(12).text('Line Items:');
      doc.moveDown(0.5);
      doc.fontSize(9);

      for (const line of invoice.lines) {
        doc.text(`${line.description} | Qty: ${line.quantity} | Total: ${formatSantim(line.totalSantim)}`);
      }

      doc.moveDown();
      doc.text(`Subtotal: ${formatSantim(invoice.subtotalSantim)}`);
      doc.text(`VAT (15%): ${formatSantim(invoice.vatSantim)}`);
      if (invoice.creditAppliedSantim > 0) {
        doc.text(`Credits Applied: -${formatSantim(invoice.creditAppliedSantim)}`);
      }
      doc.fontSize(12).text(`Total Due: ${formatSantim(invoice.totalSantim)}`, { underline: true });

      doc.end();
    });
  }
}
