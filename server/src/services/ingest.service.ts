import { EventModel, eventRepo } from '../models/Event.js';
import { OrganizationModel } from '../models/Organization.js';
import { SubscriptionModel } from '../models/Subscription.js';
import { PLANS } from '@mizan/shared';
import { getQuotaCounter, incrQuotaCounter, markDirtyBucket } from '../config/redis.js';
import { getBillingPeriodKey, getHourlyBucketStart, getDailyBucketStart } from '@mizan/shared';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export interface EventIngestResult {
  eventId: string;
  status: 'accepted' | 'duplicate' | 'rejected';
  reason?: string;
}

export interface BatchIngestResponse {
  accepted: number;
  duplicates: number;
  rejected: number;
  results: EventIngestResult[];
}

export class IngestService {
  /**
   * High-volume batch ingestion processing up to 100 events per request.
   */
  static async processBatch(
    orgId: string,
    sourceId: string,
    rawEvents: any[],
    options: { isBackfill?: boolean } = {}
  ): Promise<BatchIngestResponse> {
    const org = await OrganizationModel.findById(orgId);
    if (!org) {
      throw new AppError('Organization not found', 404, 'NOT_FOUND');
    }

    if (org.status === 'deleted' || org.status === 'pending_deletion') {
      throw new AppError('Organization is deleted or pending deletion', 403, 'ORG_INACTIVE');
    }

    const sub = await SubscriptionModel.findOne({ orgId });
    const planId = sub ? sub.planId : 'free';
    const planConfig = PLANS[planId] || PLANS.free;

    const now = new Date();
    const periodKey = getBillingPeriodKey(now);

    // 1. Quota Check via fast Redis counter
    const currentUsage = await getQuotaCounter(orgId, periodKey);

    // Free plan hard cap
    if (planId === 'free' && currentUsage >= planConfig.includedEvents) {
      throw new AppError(
        `Monthly event quota of ${planConfig.includedEvents.toLocaleString()} exceeded on Free plan. Upgrade to Starter to continue.`,
        429,
        'QUOTA_EXCEEDED'
      );
    }

    // Spend cap check on paid plans
    if (org.spendCapSantim && org.spendCapSantim > 0 && currentUsage > planConfig.includedEvents) {
      const overageEvents = currentUsage - planConfig.includedEvents;
      const overageCostSantim = Math.round((overageEvents * planConfig.overagePricePerThousandSantim) / 1000);
      if (overageCostSantim >= org.spendCapSantim) {
        throw new AppError(
          `Monthly overage spend cap of ${org.spendCapSantim / 100} ETB reached. Raise spend cap in billing settings to continue ingestion.`,
          429,
          'SPEND_CAP_REACHED'
        );
      }
    }

    // Safety cap check during suspension
    if (org.status === 'suspended') {
      const safetyCap = parseInt(process.env.INGEST_SAFETY_CAP || '500000', 10);
      if (currentUsage >= safetyCap) {
        throw new AppError(
          'Ingestion safety cap reached during account suspension. Pay outstanding invoices to restore full ingestion.',
          429,
          'SUSPENDED_SAFETY_CAP_EXCEEDED'
        );
      }
    }

    const results: EventIngestResult[] = [];
    const validDocumentsToInsert: any[] = [];
    const dirtyBucketKeys = new Set<string>();

    const fiveMinutesFuture = now.getTime() + 5 * 60 * 1000;
    const ninetyDaysAgo = now.getTime() - 90 * 24 * 60 * 60 * 1000;

    for (const raw of rawEvents) {
      const occurredAtDate = new Date(raw.occurredAt);
      const occurredTime = occurredAtDate.getTime();

      // Time Validation Rules
      if (occurredTime > fiveMinutesFuture) {
        results.push({
          eventId: raw.eventId,
          status: 'rejected',
          reason: 'Event occurredAt cannot be more than 5 minutes in the future',
        });
        continue;
      }

      if (!options.isBackfill && occurredTime < ninetyDaysAgo) {
        results.push({
          eventId: raw.eventId,
          status: 'rejected',
          reason: 'Event occurredAt is older than 90 days. Historical backfills require CSV import with backfill flag.',
        });
        continue;
      }

      // Compute dirty buckets
      const hourStart = getHourlyBucketStart(occurredAtDate).toISOString();
      const dayStart = getDailyBucketStart(occurredAtDate).toISOString();
      dirtyBucketKeys.add(`hour:${hourStart}`);
      dirtyBucketKeys.add(`day:${dayStart}`);

      // Sanitize custom properties: limit keys to 20, length <= 200, no $ or .
      let sanitizedProps: Record<string, any> | undefined;
      if (raw.props && typeof raw.props === 'object') {
        sanitizedProps = {};
        const entries = Object.entries(raw.props).slice(0, 20);
        for (const [k, v] of entries) {
          if (!k.startsWith('$') && !k.includes('.')) {
            const cleanKey = k.slice(0, 40);
            sanitizedProps[cleanKey] = typeof v === 'string' ? v.slice(0, 200) : v;
          }
        }
      }

      validDocumentsToInsert.push({
        orgId,
        sourceId: raw.sourceId || sourceId,
        eventId: raw.eventId,
        type: raw.type,
        occurredAt: occurredAtDate,
        receivedAt: now,
        period: periodKey,
        amount: typeof raw.amount === 'number' ? Math.max(0, Math.round(raw.amount)) : 0,
        currency: 'ETB',
        channel: raw.channel ? String(raw.channel).slice(0, 100) : undefined,
        branch: raw.branch ? String(raw.branch).slice(0, 100) : undefined,
        customerRef: raw.customerRef ? String(raw.customerRef).slice(0, 128) : undefined,
        items: Array.isArray(raw.items) ? raw.items.slice(0, 50) : [],
        props: sanitizedProps,
      });
    }

    let newlyInsertedCount = 0;
    let duplicateCount = 0;

    if (validDocumentsToInsert.length > 0) {
      try {
        // Bulk insert with unordered: true (so one duplicate does not abort the rest)
        const insertRes = await EventModel.collection.insertMany(validDocumentsToInsert, {
          ordered: false,
          writeConcern: { w: 'majority' },
        });

        newlyInsertedCount = insertRes.insertedCount;

        // All inserted successfully
        for (const doc of validDocumentsToInsert) {
          results.push({ eventId: doc.eventId, status: 'accepted' });
        }
      } catch (err: any) {
        // Bulk write error handling: distinguish duplicate keys (code 11000)
        if (err.name === 'MongoBulkWriteError' || err.code === 11000) {
          const writeErrors = err.writeErrors || [];
          const duplicateIndices = new Set(
            writeErrors
              .filter((e: any) => e.code === 11000)
              .map((e: any) => e.index)
          );

          duplicateCount = duplicateIndices.size;
          newlyInsertedCount = validDocumentsToInsert.length - writeErrors.length;

          for (let i = 0; i < validDocumentsToInsert.length; i++) {
            const doc = validDocumentsToInsert[i];
            if (duplicateIndices.has(i)) {
              results.push({ eventId: doc.eventId, status: 'duplicate', reason: 'Event already ingested' });
            } else {
              const otherError = writeErrors.find((e: any) => e.index === i);
              if (otherError) {
                results.push({ eventId: doc.eventId, status: 'rejected', reason: otherError.errmsg });
              } else {
                results.push({ eventId: doc.eventId, status: 'accepted' });
              }
            }
          }
        } else {
          logger.error({ err, orgId }, 'Unexpected bulk write failure in event ingestion');
          throw err;
        }
      }
    }

    // 2. Increment fast Redis usage counter by newly inserted events ONLY
    if (newlyInsertedCount > 0) {
      await incrQuotaCounter(orgId, periodKey, newlyInsertedCount);

      // 3. Mark dirty buckets in Redis
      for (const bucketKey of dirtyBucketKeys) {
        await markDirtyBucket(orgId, bucketKey);
      }
    }

    return {
      accepted: newlyInsertedCount,
      duplicates: duplicateCount,
      rejected: rawEvents.length - (newlyInsertedCount + duplicateCount),
      results,
    };
  }
}
