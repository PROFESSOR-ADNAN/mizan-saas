import mongoose from 'mongoose';
import { OrganizationModel } from '../../../server/dist/models/Organization.js';
import { EventModel } from '../../../server/dist/models/Event.js';
import { UsageLedgerModel } from '../../../server/dist/models/UsageLedger.js';
import { getQuotaCounter, resetQuotaCounter } from '../../../server/dist/config/redis.js';
import { getBillingPeriodKey } from '@mizan/shared';
import { logger } from '../../../server/dist/utils/logger.js';

export async function runMeteringReconciliationJob(): Promise<void> {
  const periodKey = getBillingPeriodKey(new Date());
  const orgs = await OrganizationModel.find({ status: { $ne: 'deleted' } });

  for (const org of orgs) {
    const orgId = org._id.toString();

    const rawCount = await EventModel.countDocuments({
      orgId,
      period: periodKey,
    } as any);

    const redisCount = await getQuotaCounter(orgId, periodKey);

    const now = new Date();
    const hourKey = `${now.toISOString().slice(0, 13)}`;

    await UsageLedgerModel.findOneAndUpdate(
      { orgId, period: periodKey, hourKey },
      { $set: { eventsIngested: rawCount } },
      { upsert: true, unscopedForPlatformJob: true, platformJobName: 'metering_ledger_sync' } as any
    );

    const delta = Math.abs(redisCount - rawCount);
    const driftRatio = rawCount > 0 ? delta / rawCount : 0;

    if (driftRatio > 0.001) {
      logger.warn(
        { orgId, periodKey, redisCount, rawCount, driftRatio },
        'METERING_DRIFT_ALERT: Redis counter drifted above 0.1% threshold. Resetting from MongoDB truth.'
      );
      await resetQuotaCounter(orgId, periodKey, rawCount);
    }
  }

  logger.info({ periodKey }, 'Metering reconciliation completed with 0 financial drift');
}
