import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import { connectDb, disconnectDb } from '../config/db.js';
import { UserModel } from '../models/User.js';
import { OrganizationModel } from '../models/Organization.js';
import { MembershipModel } from '../models/Membership.js';
import { SubscriptionModel } from '../models/Subscription.js';
import { DataSourceModel } from '../models/DataSource.js';
import { DashboardModel } from '../models/Dashboard.js';
import { EventModel } from '../models/Event.js';
import { PlanModel } from '../models/Plan.js';
import { PLANS } from '@mizan/shared';
import { logger } from '../utils/logger.js';
import { getBillingPeriodKey } from '@mizan/shared';

const BCRYPT_SALT_ROUNDS = 10;

const ETHIOPIAN_SHOPS = [
  { name: 'Bole Fresh Mart', slug: 'bole-fresh-mart', tin: '0019283746' },
  { name: 'Yirgacheffe Coffee Roasters', slug: 'yirgacheffe-coffee', tin: '0028374655' },
  { name: 'Sheger Fashion & Leather', slug: 'sheger-fashion', tin: '0037465564' },
  { name: 'Habesha Electronics & Phones', slug: 'habesha-electronics', tin: '0046556473' },
  { name: 'Addis Supermarket Express', slug: 'addis-supermarket', tin: '0055647382' },
];

const PRODUCTS = [
  { sku: 'ETH-COF-01', name: 'Yirgacheffe Grade 1 Washed (500g)', price: 75000 },
  { sku: 'ETH-COF-02', name: 'Sidama Natural Roast (500g)', price: 68000 },
  { sku: 'ETH-TEF-01', name: 'Magna White Teff Flour (25kg)', price: 320000 },
  { sku: 'ETH-CLO-01', name: 'Handwoven Habesha Kemis Dress', price: 850000 },
  { sku: 'ETH-LEA-01', name: 'Ethiopian Full-Grain Leather Bag', price: 420000 },
  { sku: 'ETH-SPY-01', name: 'Addis Berbere Blend (1kg)', price: 45000 },
];

const CHANNELS = ['In-Store POS', 'Telegram Shop', 'Website', 'Phone Order'];
const BRANCHES = ['Bole Road', 'Piassa', 'Sarbet', 'CMC', 'Megenagna'];

async function runSeed() {
  await connectDb();
  logger.info('Starting Mizan development seeding...');

  // 1. Seed System Plans
  for (const plan of Object.values(PLANS)) {
    await PlanModel.findOneAndUpdate(
      { planId: plan.id, version: plan.version },
      {
        $set: {
          name: plan.name,
          basePriceSantim: plan.basePriceSantim,
          includedEvents: plan.includedEvents,
          includedSeats: plan.includedSeats,
          extraSeatPriceSantim: plan.extraSeatPriceSantim,
          overagePricePerThousandSantim: plan.overagePricePerThousandSantim,
          rawRetentionDays: plan.rawRetentionDays,
          rollupRetentionDays: plan.rollupRetentionDays,
          apiRateLimitPerSec: plan.apiRateLimitPerSec,
          maxCustomProps: plan.maxCustomProps,
          spendCapSupported: plan.spendCapSupported,
        },
      },
      { upsert: true }
    );
  }
  logger.info('Plans seeded.');

  // 2. Create Platform Admin and Seed Users
  const adminPasswordHash = await bcrypt.hash('AdminPassword123!', BCRYPT_SALT_ROUNDS);
  await UserModel.findOneAndUpdate(
    { email: 'admin@mizan.et' },
    {
      $set: {
        name: 'Platform Administrator',
        passwordHash: adminPasswordHash,
        platformRole: 'platform_admin',
        isEmailVerified: true,
        mfaEnabled: false,
      },
    },
    { upsert: true }
  );

  const defaultPasswordHash = await bcrypt.hash('ShopPassword123!', BCRYPT_SALT_ROUNDS);

  // 3. Seed 5 Organizations with Owners and realistic Events
  const isBig = process.argv.includes('--big');
  const eventsPerOrg = isBig ? 100000 : 2000;

  for (let i = 0; i < ETHIOPIAN_SHOPS.length; i++) {
    const shop = ETHIOPIAN_SHOPS[i];
    const ownerEmail = `owner${i + 1}@${shop.slug}.et`;

    const owner = await UserModel.findOneAndUpdate(
      { email: ownerEmail },
      {
        $set: {
          name: `Owner of ${shop.name}`,
          passwordHash: defaultPasswordHash,
          platformRole: 'user',
          isEmailVerified: true,
        },
      },
      { upsert: true, new: true }
    );

    const org = await OrganizationModel.findOneAndUpdate(
      { slug: shop.slug },
      {
        $set: {
          name: shop.name,
          tin: shop.tin,
          status: 'active',
          vatRegistered: true,
          fiscalYearStartDay: 8,
          fiscalYearStartMonth: 7,
          timezone: 'Africa/Addis_Ababa',
          preferredLanguage: 'en',
        },
      },
      { upsert: true, new: true }
    );

    await MembershipModel.findOneAndUpdate(
      { orgId: org._id, userId: owner._id },
      { $set: { role: 'owner' } },
      { upsert: true, unscopedForPlatformJob: true, platformJobName: 'seed' } as any
    );

    const source: any = await DataSourceModel.findOneAndUpdate(
      { orgId: org._id, name: 'Main POS' },
      { $set: { type: 'pos', description: 'Primary store counter POS' } },
      { upsert: true, new: true, unscopedForPlatformJob: true, platformJobName: 'seed' } as any
    );

    const planIds: any[] = ['business', 'starter', 'starter', 'free', 'business'];
    const chosenPlan = planIds[i % planIds.length];

    const now = new Date();
    await SubscriptionModel.findOneAndUpdate(
      { orgId: org._id },
      {
        $set: {
          planId: chosenPlan,
          planVersion: 1,
          status: 'active',
          currentPeriodStart: new Date(now.getFullYear(), now.getMonth(), 1),
          currentPeriodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        },
      },
      { upsert: true, unscopedForPlatformJob: true, platformJobName: 'seed' } as any
    );

    // Create Default Dashboard
    await DashboardModel.findOneAndUpdate(
      { orgId: org._id, name: 'Main Sales Dashboard' },
      {
        $set: {
          isDefault: true,
          widgets: [
            { id: 'w1', type: 'stat_tile', title: 'Revenue (ETB)', metric: 'revenue', gridPos: { x: 0, y: 0, w: 3, h: 2 } },
            { id: 'w2', type: 'stat_tile', title: 'Orders', metric: 'orders', gridPos: { x: 3, y: 0, w: 3, h: 2 } },
            { id: 'w3', type: 'stat_tile', title: 'Units', metric: 'units', gridPos: { x: 6, y: 0, w: 3, h: 2 } },
            { id: 'w4', type: 'stat_tile', title: 'Expenses', metric: 'expenses', gridPos: { x: 9, y: 0, w: 3, h: 2 } },
            { id: 'w5', type: 'line_chart', title: 'Daily Revenue Trend', metric: 'revenue', granularity: 'day', gridPos: { x: 0, y: 2, w: 8, h: 4 } },
            { id: 'w6', type: 'channel_breakdown', title: 'Sales by Channel', metric: 'revenue', gridPos: { x: 8, y: 2, w: 4, h: 4 } },
          ],
        },
      },
      { upsert: true, unscopedForPlatformJob: true, platformJobName: 'seed' } as any
    );

    // Generate Realistic Sales Events
    const events: any[] = [];
    const periodKey = getBillingPeriodKey(now);

    for (let j = 0; j < eventsPerOrg; j++) {
      const prod = PRODUCTS[j % PRODUCTS.length];
      const channel = CHANNELS[j % CHANNELS.length];
      const branch = BRANCHES[j % BRANCHES.length];
      const qty = (j % 3) + 1;
      const amount = prod.price * qty;

      // Spread occurredAt over the past 30 days
      const daysAgo = Math.floor(Math.random() * 28);
      const hoursAgo = Math.floor(Math.random() * 24);
      const occurredAt = new Date(Date.now() - (daysAgo * 86400000 + hoursAgo * 3600000));

      events.push({
        orgId: org._id,
        sourceId: source._id,
        eventId: `seed_${shop.slug}_${j}`,
        type: j % 15 === 0 ? 'expense' : 'sale',
        occurredAt,
        receivedAt: now,
        period: periodKey,
        amount,
        currency: 'ETB',
        channel,
        branch,
        customerRef: `cust_${(j % 50) + 1}`,
        items: [{ sku: prod.sku, name: prod.name, qty, unitPrice: prod.price }],
      });
    }

    try {
      await EventModel.collection.insertMany(events, { ordered: false });
    } catch (_err) {
      // Ignore duplicates on repeated seed
    }

    logger.info({ shop: shop.name, eventsGenerated: events.length }, 'Seeded organization events');
  }

  logger.info('Database seeding completed successfully.');
  await disconnectDb();
}

runSeed().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
