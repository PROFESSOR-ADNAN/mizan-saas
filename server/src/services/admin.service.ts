import { OrganizationModel } from '../models/Organization.js';
import { SubscriptionModel } from '../models/Subscription.js';
import { InvoiceModel } from '../models/Invoice.js';
import { CreditNoteModel } from '../models/CreditNote.js';
import { CounterModel, getNextSequence } from '../models/Counter.js';
import { NotFoundError } from '../utils/errors.js';

export class AdminService {
  /**
   * Lists all platform tenants with search, pagination, and status filters.
   */
  static async listTenants(params: { search?: string; status?: string; page?: number; limit?: number }): Promise<any> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (params.status) filter.status = params.status;
    if (params.search) {
      filter.$or = [
        { name: { $regex: params.search, $options: 'i' } },
        { slug: { $regex: params.search, $options: 'i' } },
        { tin: { $regex: params.search, $options: 'i' } },
      ];
    }

    const [tenants, total] = await Promise.all([
      OrganizationModel.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      OrganizationModel.countDocuments(filter),
    ]);

    return {
      tenants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Suspends an organization. Dashboards become read-only.
   */
  static async suspendTenant(orgId: string, reason: string): Promise<any> {
    const org = await OrganizationModel.findByIdAndUpdate(
      orgId,
      { $set: { status: 'suspended', suspensionReason: reason } },
      { new: true }
    );
    if (!org) throw new NotFoundError('Organization not found');
    return org;
  }

  /**
   * Unsuspends an organization, restoring active status.
   */
  static async unsuspendTenant(orgId: string): Promise<any> {
    const org = await OrganizationModel.findByIdAndUpdate(
      orgId,
      { $set: { status: 'active' }, $unset: { suspensionReason: 1 } },
      { new: true }
    );
    if (!org) throw new NotFoundError('Organization not found');
    return org;
  }

  /**
   * Extends Business trial for a tenant.
   */
  static async extendTrial(orgId: string, days: number): Promise<any> {
    const sub = await SubscriptionModel.findOne({ orgId });
    if (!sub) throw new NotFoundError('Subscription not found');

    const currentTrialEnd = sub.trialEndsAt ? new Date(sub.trialEndsAt) : new Date();
    const newTrialEnd = new Date(currentTrialEnd.getTime() + days * 24 * 60 * 60 * 1000);

    sub.trialEndsAt = newTrialEnd;
    sub.currentPeriodEnd = newTrialEnd;
    sub.status = 'trialing';
    await sub.save();

    return sub;
  }

  /**
   * Issues an append-only credit note to an organization.
   */
  static async issueCreditNote(orgId: string, amountSantim: number, reason: string): Promise<any> {
    const year = new Date().getFullYear();
    const seq = await getNextSequence(`cn_${year}`);
    const creditNoteNumber = `CN-${year}-${String(seq).padStart(6, '0')}`;

    return CreditNoteModel.create({
      orgId,
      creditNoteNumber,
      amountSantim,
      currency: 'ETB',
      reason,
      remainingSantim: amountSantim,
    });
  }
}
