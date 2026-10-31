import mongoose from 'mongoose';
import { EventModel } from '../../../server/dist/models/Event.js';
import { RollupHourlyModel, RollupDailyModel } from '../../../server/dist/models/Rollup.js';
import { getAndClearDirtyBuckets, bumpOrgDataVersion } from '../../../server/dist/config/redis.js';
import { logger } from '../../../server/dist/utils/logger.js';

export async function processDirtyBucketsForOrg(orgId: string): Promise<void> {
  const dirtyBuckets = await getAndClearDirtyBuckets(orgId);
  if (dirtyBuckets.length === 0) return;

  for (const bucketKey of dirtyBuckets) {
    const [granularity, isoStart] = bucketKey.split(':');
    const bucketStart = new Date(isoStart);
    if (isNaN(bucketStart.getTime())) continue;

    const bucketEnd = new Date(
      bucketStart.getTime() + (granularity === 'hour' ? 3600000 : 86400000)
    );

    const pipeline: any[] = [
      {
        $match: {
          orgId: new mongoose.Types.ObjectId(orgId),
          occurredAt: { $gte: bucketStart, $lt: bucketEnd },
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: { $cond: [{ $eq: ['$type', 'sale'] }, '$amount', 0] } },
          expenses: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } },
          orders: { $sum: { $cond: [{ $eq: ['$type', 'sale'] }, 1, 0] } },
          units: { $sum: { $size: { $ifNull: ['$items', []] } } },
          customers: { $addToSet: '$customerRef' },
        },
      },
    ];

    const results = await EventModel.aggregate(pipeline).option({
      unscopedForPlatformJob: true,
      platformJobName: 'rollup_recomputation',
    } as any);

    const agg = results[0] || { revenue: 0, expenses: 0, orders: 0, units: 0, customers: [] };
    const uniqueCustomers = (agg.customers || []).filter(Boolean).length;

    const targetModel = granularity === 'hour' ? RollupHourlyModel : RollupDailyModel;

    await targetModel.findOneAndUpdate(
      { orgId, bucketStart },
      {
        $set: {
          granularity,
          revenueSantim: agg.revenue || 0,
          expensesSantim: agg.expenses || 0,
          ordersCount: agg.orders || 0,
          unitsCount: agg.units || 0,
          uniqueCustomersCount: uniqueCustomers,
        },
        $inc: { version: 1 },
      },
      { upsert: true, new: true, unscopedForPlatformJob: true, platformJobName: 'rollup_upsert' } as any
    );
  }

  await bumpOrgDataVersion(orgId);
}
