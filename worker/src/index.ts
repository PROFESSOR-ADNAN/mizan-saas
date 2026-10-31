import { Worker } from 'bullmq';
import { connectDb, disconnectDb } from '../../server/dist/config/db.js';
import { connectRedis, disconnectRedis, redis } from '../../server/dist/config/redis.js';
import { processDirtyBucketsForOrg } from './jobs/rollup.job.js';
import { runBillingCycleJob } from './jobs/billingCycle.job.js';
import { runMeteringReconciliationJob } from './jobs/meteringReconcile.job.js';
import { runDailySeatSnapshotJob } from './jobs/seatSnapshot.job.js';
import { runRetentionPruningJob } from './jobs/retention.job.js';
import { dispatchWebhookJob } from './jobs/webhookDispatcher.job.js';
import { initScheduler } from './scheduler.js';
import { logger } from '../../server/dist/utils/logger.js';

async function bootstrapWorker() {
  await connectDb();
  await connectRedis();

  logger.info('Mizan BullMQ background worker engine starting...');

  // 1. Rollup Worker
  const rollupWorker = new Worker(
    'rollups',
    async (job) => {
      const { orgId } = job.data;
      if (orgId) {
        await processDirtyBucketsForOrg(orgId);
      }
    },
    { connection: redis as any, concurrency: 5 }
  );

  // 2. Webhook Worker
  const webhookWorker = new Worker(
    'webhooks',
    async (job) => {
      const { deliveryId } = job.data;
      if (deliveryId) {
        await dispatchWebhookJob(deliveryId);
      }
    },
    { connection: redis as any, concurrency: 5 }
  );

  // 3. Billing & Invoicing Worker
  const billingWorker = new Worker(
    'billing',
    async (job) => {
      const targetDate = job.data?.date ? new Date(job.data.date) : new Date();
      await runBillingCycleJob(targetDate);
    },
    { connection: redis as any, concurrency: 1 }
  );

  // 4. Recurring Scheduler Worker
  const schedulerWorker = new Worker(
    'scheduler_recurring',
    async (job) => {
      switch (job.name) {
        case 'metering_reconcile':
          await runMeteringReconciliationJob();
          break;
        case 'daily_seat_snapshot':
          await runDailySeatSnapshotJob();
          break;
        case 'nightly_retention':
          await runRetentionPruningJob();
          break;
        case 'monthly_billing_cycle':
          await runBillingCycleJob();
          break;
        default:
          logger.warn({ jobName: job.name }, 'Unknown scheduler recurring job');
      }
    },
    { connection: redis as any }
  );

  await initScheduler();

  logger.info('Mizan BullMQ workers running and listening for jobs');

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Graceful shutdown initiated for workers');
    await Promise.all([
      rollupWorker.close(),
      webhookWorker.close(),
      billingWorker.close(),
      schedulerWorker.close(),
    ]);
    await disconnectDb();
    await disconnectRedis();
    logger.info('Workers successfully shut down');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrapWorker().catch((err) => {
  logger.error({ err }, 'Fatal error booting Mizan background worker');
  process.exit(1);
});
