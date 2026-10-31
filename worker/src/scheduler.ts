import { Queue } from 'bullmq';
import { redis } from '../../server/dist/config/redis.js';
import { logger } from '../../server/dist/utils/logger.js';

export async function initScheduler(): Promise<void> {
  const schedulerQueue = new Queue('scheduler_recurring', {
    connection: redis as any,
  });

  // 1. Hourly Metering Reconciliation Job
  await schedulerQueue.add(
    'metering_reconcile',
    {},
    {
      repeat: { pattern: '0 * * * *' },
      jobId: 'repeat_metering_reconcile',
    }
  );

  // 2. Daily Seat Snapshot (21:00 UTC = 00:00 Addis Ababa)
  await schedulerQueue.add(
    'daily_seat_snapshot',
    {},
    {
      repeat: { pattern: '0 21 * * *' },
      jobId: 'repeat_seat_snapshot',
    }
  );

  // 3. Nightly Data Retention Pruning (02:00 UTC)
  await schedulerQueue.add(
    'nightly_retention',
    {},
    {
      repeat: { pattern: '0 2 * * *' },
      jobId: 'repeat_nightly_retention',
    }
  );

  // 4. Monthly Billing Cycle Run (Midnight UTC on 1st of month)
  await schedulerQueue.add(
    'monthly_billing_cycle',
    {},
    {
      repeat: { pattern: '0 0 1 * *' },
      jobId: 'repeat_monthly_billing_cycle',
    }
  );

  logger.info('Mizan recurring job scheduler initialized with stable deterministic IDs');
}
