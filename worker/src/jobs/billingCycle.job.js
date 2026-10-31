"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runBillingCycleJob = runBillingCycleJob;
const mongoose_1 = __importDefault(require("mongoose"));
const Subscription_js_1 = require("@mizan/server/dist/server/src/models/Subscription.js");
const Invoice_js_1 = require("@mizan/server/dist/server/src/models/Invoice.js");
const UsageLedger_js_1 = require("@mizan/server/dist/server/src/models/UsageLedger.js");
const SeatSnapshot_js_1 = require("@mizan/server/dist/server/src/models/SeatSnapshot.js");
const CreditNote_js_1 = require("@mizan/server/dist/server/src/models/CreditNote.js");
const Counter_js_1 = require("@mizan/server/dist/server/src/models/Counter.js");
const shared_1 = require("@mizan/shared");
const logger_js_1 = require("@mizan/server/dist/server/src/utils/logger.js");
async function runBillingCycleJob(targetDate = new Date()) {
    const periodKey = (0, shared_1.getBillingPeriodKey)(targetDate);
    const year = targetDate.getUTCFullYear();
    // Find all active or past_due subscriptions
    const subscriptions = await Subscription_js_1.SubscriptionModel.find({ status: { $in: ['active', 'past_due', 'trialing'] } }, null, { unscopedForPlatformJob: true, platformJobName: 'billing_cycle_run' });
    let createdCount = 0;
    for (const sub of subscriptions) {
        const orgId = sub.orgId.toString();
        // Idempotency: check if invoice already generated for this org and period
        const existingInvoice = await Invoice_js_1.InvoiceModel.findOne({ orgId, period: periodKey }, null, { unscopedForPlatformJob: true, platformJobName: 'billing_idempotency_check' });
        if (existingInvoice) {
            continue; // Skip, already finalized! Running twice creates 0 new invoices.
        }
        const plan = shared_1.PLANS[sub.planId] || shared_1.PLANS.free;
        // 1. Tally unique accepted events from durable usageLedger
        const ledgerAgg = await UsageLedger_js_1.UsageLedgerModel.aggregate([
            { $match: { orgId: new mongoose_1.default.Types.ObjectId(orgId), period: periodKey } },
            { $group: { _id: null, total: { $sum: '$eventsIngested' } } },
        ]).option({ unscopedForPlatformJob: true, platformJobName: 'billing_ledger_sum' });
        const totalEvents = ledgerAgg.length > 0 ? ledgerAgg[0].total : 0;
        // 2. Compute Seat Charges from daily snapshots
        const seatSnapshots = await SeatSnapshot_js_1.SeatSnapshotModel.find({ orgId, period: periodKey }, null, { unscopedForPlatformJob: true, platformJobName: 'billing_seat_snapshots' });
        let averageSeats = plan.includedSeats;
        if (seatSnapshots.length > 0) {
            const sumSeats = seatSnapshots.reduce((acc, s) => acc + s.activeSeatCount, 0);
            averageSeats = Math.ceil(sumSeats / seatSnapshots.length);
        }
        const billableExtraSeats = Math.max(0, averageSeats - plan.includedSeats);
        const seatChargeSantim = billableExtraSeats * plan.extraSeatPriceSantim;
        // 3. Compute Overage
        const { billableOverageEvents, overageSantim } = (0, shared_1.calculateOverageSantim)(totalEvents, plan.includedEvents, plan.overagePricePerThousandSantim);
        // 4. Assemble Line Items
        const lines = [
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
        const subtotalSantim = lines.reduce((acc, l) => acc + l.totalSantim, 0);
        // 5. VAT (15% standard Ethiopian VAT)
        const vatSantim = (0, shared_1.calculateVatSantim)(subtotalSantim, 1500);
        // 6. Check Available Credit Notes
        const creditNotes = await CreditNote_js_1.CreditNoteModel.find({ orgId, remainingSantim: { $gt: 0 } }, null, { unscopedForPlatformJob: true, platformJobName: 'billing_credits' });
        let creditAppliedSantim = 0;
        const totalBeforeCredit = subtotalSantim + vatSantim;
        for (const cn of creditNotes) {
            const deduction = Math.min(cn.remainingSantim, totalBeforeCredit - creditAppliedSantim);
            if (deduction > 0) {
                creditAppliedSantim += deduction;
                cn.remainingSantim -= deduction;
                await cn.save();
            }
            if (creditAppliedSantim >= totalBeforeCredit)
                break;
        }
        const totalSantim = Math.max(0, totalBeforeCredit - creditAppliedSantim);
        // 7. Atomic Gap-Free Sequential Invoice Number
        const seq = await (0, Counter_js_1.getNextSequence)(`inv_${year}`);
        const invoiceNumber = `INV-${year}-${String(seq).padStart(6, '0')}`;
        // Net 7 Due Date
        const dueDate = new Date(targetDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        await Invoice_js_1.InvoiceModel.create({
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
    logger_js_1.logger.info({ periodKey, invoicesCreated: createdCount }, 'Billing cycle run completed');
    return { invoicesCreated: createdCount };
}
//# sourceMappingURL=billingCycle.job.js.map