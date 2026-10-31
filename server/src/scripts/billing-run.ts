import { connectDb, disconnectDb } from '../config/db.js';
import { connectRedis, disconnectRedis } from '../config/redis.js';
import { BillingService } from '../services/billing.service.js';
import { logger } from '../utils/logger.js';

async function main() {
  const dateArg = process.argv.find((arg) => arg.startsWith('--date='));
  const dateStr = dateArg ? dateArg.split('=')[1] : undefined;
  const targetDate = dateStr ? new Date(dateStr) : new Date();

  await connectDb();
  await connectRedis();

  logger.info({ targetDate: targetDate.toISOString() }, 'Manual trigger: starting monthly billing cycle run...');
  const result = await BillingService.runBillingCycle(targetDate);
  logger.info({ result }, 'Manual billing cycle run completed successfully.');

  await disconnectDb();
  await disconnectRedis();
}

main().catch((err) => {
  console.error('Billing run error:', err);
  process.exit(1);
});
