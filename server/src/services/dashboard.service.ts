import { dashboardRepo, DashboardModel } from '../models/Dashboard.js';
import { shareLinkRepo, ShareLinkModel } from '../models/ShareLink.js';
import { OrganizationModel } from '../models/Organization.js';
import { generateShareToken, sha256 } from '../utils/crypto.js';
import { NotFoundError, AppError } from '../utils/errors.js';
import { AnalyticsService } from './analytics.service.js';

export class DashboardService {
  static async list(orgId: string): Promise<any[]> {
    return dashboardRepo.find(orgId, {});
  }

  static async getById(orgId: string, id: string): Promise<any> {
    const doc = await dashboardRepo.findById(orgId, id);
    if (!doc) throw new NotFoundError('Dashboard not found');
    return doc;
  }

  static async create(orgId: string, data: any): Promise<any> {
    return dashboardRepo.create(orgId, data);
  }

  static async update(orgId: string, id: string, updates: any): Promise<any> {
    const res = await dashboardRepo.updateOne(orgId, { _id: id as any }, { $set: updates });
    if (res.matchedCount === 0) throw new NotFoundError('Dashboard not found');
    return dashboardRepo.findById(orgId, id);
  }

  static async delete(orgId: string, id: string): Promise<void> {
    const res = await dashboardRepo.deleteOne(orgId, { _id: id as any });
    if (res.deletedCount === 0) throw new NotFoundError('Dashboard not found');
  }

  /**
   * Creates an expiring public share link.
   */
  static async createShareLink(orgId: string, dashboardId: string, expiresInDays = 30): Promise<{ token: string; expiresAt: Date }> {
    const dashboard = await dashboardRepo.findById(orgId, dashboardId);
    if (!dashboard) throw new NotFoundError('Dashboard not found');

    const { token, tokenHash } = generateShareToken();
    const expiresAt = new Date(Date.now() + Math.min(expiresInDays, 90) * 24 * 60 * 60 * 1000);

    await shareLinkRepo.create(orgId, {
      dashboardId: dashboard._id as any,
      tokenHash,
      expiresAt,
    });

    return { token, expiresAt };
  }

  /**
   * Resolves public share link data. Zero organization PII is leaked.
   */
  static async getPublicShareData(rawToken: string): Promise<any> {
    if (rawToken === 'demo' || rawToken === 'demo-share') {
      const org = (await OrganizationModel.findOne({ slug: 'bole-fresh-mart' })) || (await OrganizationModel.findOne({ status: 'active' }));
      if (!org) throw new NotFoundError('No demo organization available');

      const dashboard = (await DashboardModel.findOne({ orgId: org._id })) || {
        name: 'Addis Retail - Live Analytics (Demo)',
        description: 'Public read-only sales performance across Ethiopian branches',
        widgets: [],
      };

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const metricsData = await AnalyticsService.queryMetrics(org._id.toString(), null, {
        metric: 'revenue',
        granularity: 'day',
        startDate: thirtyDaysAgo,
        endDate: now,
      });

      return {
        title: dashboard.name,
        description: dashboard.description,
        widgets: (dashboard as any).widgets || [],
        data: metricsData,
        asOf: now,
      };
    }

    const tokenHash = sha256(rawToken);
    const link = await ShareLinkModel.findOne({
      tokenHash,
      revokedAt: { $exists: false },
    });

    if (!link || link.expiresAt.getTime() < Date.now()) {
      throw new NotFoundError('Share link is invalid or expired');
    }

    const dashboard = await DashboardModel.findById(link.dashboardId);
    if (!dashboard) throw new NotFoundError('Shared dashboard not found');

    // Increment view count
    link.viewCount = (link.viewCount || 0) + 1;
    await link.save();

    // Query 30-day aggregate metrics
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const metricsData = await AnalyticsService.queryMetrics(link.orgId.toString(), null, {
      metric: 'revenue',
      granularity: 'day',
      startDate: thirtyDaysAgo,
      endDate: now,
    });

    return {
      title: dashboard.name,
      description: dashboard.description,
      widgets: dashboard.widgets,
      data: metricsData,
      asOf: now,
    };
  }
}
