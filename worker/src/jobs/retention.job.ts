import { EventModel } from '../../../server/dist/models/Event.js';
import { SubscriptionModel } from '../../../server/dist/models/Subscription.js';
import { OrganizationModel } from '../../../server/dist/models/Organization.js';
import { PLANS, PlanId } from '@mizan/shared';
import { logger } from '../../../server/dist/utils/logger.js';

export async function runRetentionPruningJob(): Promise<{ deletedEventsCount: number }> {
  const orgs = await OrganizationModel.find({ status: { $ne: 'deleted' } });
  let totalDeleted = 0;

  for (const org of orgs) {
    const orgId = org._id.toString();
    const sub = await SubscriptionModel.findOne({ orgId });
    const plan = PLANS[(sub?.planId as PlanId) || 'free'] || PLANS.free;

    const retentionCutoff = new Date(Date.now() - plan.rawRetentionDays * 24 * 60 * 60 * 1000);

    const result = await EventModel.deleteMany({
      orgId,
      occurredAt: { $lt: retentionCutoff },
    } as any);

    totalDeleted += result.deletedCount || 0;
  }

  logger.info({ totalDeleted }, 'Nightly retention pruning job complete');
  return { deletedEventsCount: totalDeleted };
}
