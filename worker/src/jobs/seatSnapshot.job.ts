import { MembershipModel } from '../../../server/dist/models/Membership.js';
import { SeatSnapshotModel } from '../../../server/dist/models/SeatSnapshot.js';
import { OrganizationModel } from '../../../server/dist/models/Organization.js';
import { getBillingPeriodKey } from '@mizan/shared';
import { logger } from '../../../server/dist/utils/logger.js';

export async function runDailySeatSnapshotJob(): Promise<void> {
  const now = new Date();
  const period = getBillingPeriodKey(now);
  const snapshotDate = new Date(now.toISOString().slice(0, 10));

  const orgs = await OrganizationModel.find({ status: { $ne: 'deleted' } });

  for (const org of orgs) {
    const orgId = org._id.toString();

    const activeSeats = await MembershipModel.countDocuments({
      orgId,
    } as any);

    await SeatSnapshotModel.findOneAndUpdate(
      { orgId, period, snapshotDate },
      { $set: { activeSeatCount: activeSeats } },
      { upsert: true, unscopedForPlatformJob: true, platformJobName: 'seat_snapshot' } as any
    );
  }

  logger.info({ snapshotDate: snapshotDate.toISOString() }, 'Daily seat snapshot job complete');
}
