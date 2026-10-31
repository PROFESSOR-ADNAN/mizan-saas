import { BillingService } from '../../../server/dist/services/billing.service.js';

export async function runBillingCycleJob(targetDate = new Date()): Promise<{ invoicesCreated: number }> {
  return BillingService.runBillingCycle(targetDate);
}
