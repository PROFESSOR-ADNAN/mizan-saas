import crypto from 'node:crypto';
import { OrganizationModel, OrganizationDocument } from '../models/Organization.js';
import { MembershipModel, MembershipDocument } from '../models/Membership.js';
import { SubscriptionModel } from '../models/Subscription.js';
import { DataSourceModel } from '../models/DataSource.js';
import { DashboardModel } from '../models/Dashboard.js';
import { TRIAL_DURATION_DAYS } from '@mizan/shared';
import { NotFoundError, ForbiddenError, AppError } from '../utils/errors.js';

// Define helper error if needed
class OrgOperationError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export class OrgService {
  /**
   * Lists all organizations where the user is an active member.
   */
  static async listUserOrgs(userId: string): Promise<Array<{ org: OrganizationDocument; role: string }>> {
    const memberships = await MembershipModel.find(
      { userId },
      null,
      { unscopedForPlatformJob: true, platformJobName: 'list_user_orgs' } as any
    );

    const orgIds = memberships.map((m) => m.orgId);
    const orgs = await OrganizationModel.find({
      _id: { $in: orgIds },
      status: { $ne: 'deleted' },
    });

    const orgMap = new Map(orgs.map((o) => [o._id.toString(), o]));

    return memberships
      .filter((m) => orgMap.has(m.orgId.toString()))
      .map((m) => ({
        org: orgMap.get(m.orgId.toString())!,
        role: m.role,
      }));
  }

  /**
   * Retrieves organization by ID.
   */
  static async getOrgById(orgId: string): Promise<OrganizationDocument> {
    const org = await OrganizationModel.findById(orgId);
    if (!org || org.status === 'deleted') {
      throw new NotFoundError('Organization not found');
    }
    return org;
  }

  /**
   * Creates a new organization for an existing user.
   */
  static async createOrg(userId: string, data: { name: string; tin?: string; preferredLanguage?: 'en' | 'am' }): Promise<OrganizationDocument> {
    const baseSlug = data.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30);
    const slug = `${baseSlug}-${crypto.randomBytes(2).toString('hex')}`;

    const org = await OrganizationModel.create({
      name: data.name,
      slug,
      tin: data.tin,
      status: 'active',
      vatRegistered: true,
      fiscalYearStartDay: 8,
      fiscalYearStartMonth: 7,
      timezone: 'Africa/Addis_Ababa',
      preferredLanguage: data.preferredLanguage || 'en',
    });

    await MembershipModel.create({
      orgId: org._id,
      userId,
      role: 'owner',
    });

    const now = new Date();
    const trialEnd = new Date(now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);
    await SubscriptionModel.create({
      orgId: org._id,
      planId: 'business',
      planVersion: 1,
      status: 'trialing',
      currentPeriodStart: now,
      currentPeriodEnd: trialEnd,
      trialEndsAt: trialEnd,
    });

    await DataSourceModel.create({
      orgId: org._id,
      name: 'Main Store',
      type: 'pos',
    });

    await DashboardModel.create({
      orgId: org._id,
      name: 'Sales Overview',
      isDefault: true,
      widgets: [
        { id: 'w1', type: 'stat_tile', title: 'Total Revenue', metric: 'revenue', gridPos: { x: 0, y: 0, w: 3, h: 2 } },
        { id: 'w2', type: 'stat_tile', title: 'Orders', metric: 'orders', gridPos: { x: 3, y: 0, w: 3, h: 2 } },
        { id: 'w3', type: 'stat_tile', title: 'Units Sold', metric: 'units', gridPos: { x: 6, y: 0, w: 3, h: 2 } },
        { id: 'w4', type: 'stat_tile', title: 'Expenses', metric: 'expenses', gridPos: { x: 9, y: 0, w: 3, h: 2 } },
      ],
    });

    return org;
  }

  /**
   * Updates organization details.
   */
  static async updateOrg(orgId: string, updates: Partial<OrganizationDocument>): Promise<OrganizationDocument> {
    const org = await OrganizationModel.findByIdAndUpdate(orgId, { $set: updates }, { new: true });
    if (!org) throw new NotFoundError('Organization not found');
    return org;
  }

  /**
   * Requests organization deletion with a 30-day grace period.
   */
  static async requestDeletion(orgId: string): Promise<OrganizationDocument> {
    const pendingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const org = await OrganizationModel.findByIdAndUpdate(
      orgId,
      {
        $set: {
          status: 'pending_deletion',
          pendingDeletionAt: pendingDate,
        },
      },
      { new: true }
    );
    if (!org) throw new NotFoundError('Organization not found');
    return org;
  }

  /**
   * Enforces last-owner rule: checks if user is the sole owner.
   */
  static async isSoleOwner(orgId: string, userId: string): Promise<boolean> {
    const ownerCount = await MembershipModel.countDocuments({
      orgId,
      role: 'owner',
    } as any);

    if (ownerCount <= 1) {
      const isOwner = await MembershipModel.findOne({ orgId, userId, role: 'owner' } as any);
      return Boolean(isOwner);
    }
    return false;
  }

  /**
   * Transfers ownership to another existing member.
   */
  static async transferOwnership(orgId: string, currentOwnerId: string, newOwnerId: string): Promise<void> {
    const targetMember = await MembershipModel.findOne({ orgId, userId: newOwnerId } as any);
    if (!targetMember) {
      throw new NotFoundError('Target user is not a member of this organization');
    }

    // Demote current owner to admin
    await MembershipModel.updateOne({ orgId, userId: currentOwnerId }, { $set: { role: 'admin' } } as any);
    // Promote target member to owner
    await MembershipModel.updateOne({ orgId, userId: newOwnerId }, { $set: { role: 'owner' } } as any);
  }
}
