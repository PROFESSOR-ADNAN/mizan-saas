import { RollupHourlyModel, RollupDailyModel, rollupHourlyRepo, rollupDailyRepo } from '../models/Rollup.js';
import { EventModel, eventRepo } from '../models/Event.js';
import { redis, getOrgDataVersion } from '../config/redis.js';
import { sha256 } from '../utils/crypto.js';
import { TeamService } from './team.service.js';

// In-flight request coalescing map
const inFlightQueries = new Map<string, Promise<any>>();

export class AnalyticsService {
  /**
   * Queries aggregated metrics with automatic rollup planning, team scoping, and caching.
   */
  static async queryMetrics(
    orgId: string,
    userId: string | null,
    params: {
      metric: string;
      granularity: 'hour' | 'day' | 'month';
      startDate: Date;
      endDate: Date;
      channel?: string;
      branch?: string;
      sourceId?: string;
    }
  ): Promise<any[]> {
    // 1. Team Scoping: check if user is restricted to specific data sources
    let allowedSources: string[] | null = null;
    if (userId) {
      allowedSources = await TeamService.getUserTeamDataSources(orgId, userId);
    }

    // 2. Build Cache Key with dataVersion
    const dataVersion = await getOrgDataVersion(orgId);
    const querySignature = JSON.stringify({
      params,
      allowedSources,
      dataVersion,
    });
    const cacheKey = `query:${orgId}:${sha256(querySignature)}`;

    // Check Redis Cache (TTL 60s)
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // 3. Request Coalescing (avoid cache stampede)
    if (inFlightQueries.has(cacheKey)) {
      return inFlightQueries.get(cacheKey)!;
    }

    const queryPromise = this.executePlannedQuery(orgId, params, allowedSources)
      .then(async (result) => {
        // Cache result for 60 seconds
        await redis.set(cacheKey, JSON.stringify(result), 'EX', 60);
        inFlightQueries.delete(cacheKey);
        return result;
      })
      .catch((err) => {
        inFlightQueries.delete(cacheKey);
        throw err;
      });

    inFlightQueries.set(cacheKey, queryPromise);
    return queryPromise;
  }

  private static async executePlannedQuery(
    orgId: string,
    params: {
      metric: string;
      granularity: 'hour' | 'day' | 'month';
      startDate: Date;
      endDate: Date;
      channel?: string;
      branch?: string;
      sourceId?: string;
    },
    allowedSources: string[] | null
  ): Promise<any[]> {
    const diffHours = (params.endDate.getTime() - params.startDate.getTime()) / (1000 * 60 * 60);

    // Filter condition for rollups
    const filter: any = {
      bucketStart: { $gte: params.startDate, $lte: params.endDate },
    };

    // If granularity is hour or date range <= 7 days, pick hourly rollups
    if (params.granularity === 'hour' || (diffHours <= 168 && !params.channel && !params.branch)) {
      const records = await rollupHourlyRepo.find(
        orgId,
        filter,
        null,
        { sort: { bucketStart: 1 }, limit: 5000, maxTimeMS: 3000 }
      );

      return records.map((r) => ({
        timestamp: r.bucketStart,
        value: (r as any)[`${params.metric}Santim`] !== undefined
          ? (r as any)[`${params.metric}Santim`]
          : (r as any)[`${params.metric}Count`] || 0,
        revenue: r.revenueSantim,
        expenses: r.expensesSantim,
        orders: r.ordersCount,
        units: r.unitsCount,
      }));
    }

    // Pick daily rollups for larger ranges
    if (params.granularity === 'day' && !params.channel && !params.branch) {
      const records = await rollupDailyRepo.find(
        orgId,
        filter,
        null,
        { sort: { bucketStart: 1 }, limit: 5000, maxTimeMS: 3000 }
      );

      return records.map((r) => ({
        timestamp: r.bucketStart,
        value: (r as any)[`${params.metric}Santim`] !== undefined
          ? (r as any)[`${params.metric}Santim`]
          : (r as any)[`${params.metric}Count`] || 0,
        revenue: r.revenueSantim,
        expenses: r.expensesSantim,
        orders: r.ordersCount,
        units: r.unitsCount,
      }));
    }

    // Fall back to bounded raw aggregation (with team scoping and dimension filters)
    const matchStage: any = {
      occurredAt: { $gte: params.startDate, $lte: params.endDate },
    };

    if (params.channel) matchStage.channel = params.channel;
    if (params.branch) matchStage.branch = params.branch;
    if (params.sourceId) matchStage.sourceId = params.sourceId;

    if (allowedSources && allowedSources.length > 0) {
      matchStage.sourceId = { $in: allowedSources };
    }

    const groupDateFormat = (params.granularity as string) === 'hour' ? '%Y-%m-%dT%H:00:00.000Z' : '%Y-%m-%d';

    const pipeline: any[] = [
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: groupDateFormat, date: '$occurredAt' } },
          revenue: { $sum: { $cond: [{ $eq: ['$type', 'sale'] }, '$amount', 0] } },
          expenses: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } },
          orders: { $sum: { $cond: [{ $eq: ['$type', 'sale'] }, 1, 0] } },
          units: { $sum: { $size: { $ifNull: ['$items', []] } } },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 5000 },
    ];

    const results = await eventRepo.aggregate(orgId, pipeline, { maxTimeMS: 3000 });
    return results.map((row: any) => ({
      timestamp: row._id,
      revenue: row.revenue,
      expenses: row.expenses,
      orders: row.orders,
      units: row.units,
      profit: row.revenue - row.expenses,
    }));
  }
}
