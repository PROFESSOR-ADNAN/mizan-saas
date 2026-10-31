import crypto from 'node:crypto';
import { MembershipModel, membershipRepo } from '../models/Membership.js';
import { InvitationModel, invitationRepo } from '../models/Invitation.js';
import { UserModel } from '../models/User.js';
import { OrgRole } from '@mizan/shared';
import { sha256 } from '../utils/crypto.js';
import { NotFoundError, ConflictError, AppError } from '../utils/errors.js';
import { invalidateMembershipCache } from '../middleware/tenancy.js';
import { OrgService } from './org.service.js';

export class MemberService {
  /**
   * Lists all members of an organization with user profiles.
   */
  static async listMembers(orgId: string): Promise<any[]> {
    const memberships = await membershipRepo.find(orgId, {});
    const userIds = memberships.map((m) => m.userId);

    const users = await UserModel.find({ _id: { $in: userIds } }).select('name email');
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    return memberships.map((m) => ({
      id: m._id,
      userId: m.userId,
      role: m.role,
      user: userMap.get(m.userId.toString()) || { name: 'Unknown', email: '' },
      createdAt: m.createdAt,
    }));
  }

  /**
   * Creates an email-bound invitation token expiring in 7 days.
   */
  static async inviteMember(
    orgId: string,
    invitedByUserId: string,
    email: string,
    role: OrgRole
  ): Promise<{ inviteId: string; rawToken: string; expiresAt: Date }> {
    // Check if user is already a member
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      const existingMember = await membershipRepo.findOne(orgId, { userId: existingUser._id as any });
      if (existingMember) {
        throw new ConflictError('User is already a member of this organization');
      }
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = sha256(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await invitationRepo.create(orgId, {
      email,
      role,
      tokenHash,
      invitedByUserId: invitedByUserId as any,
      status: 'pending',
      expiresAt,
    });

    return {
      inviteId: invite._id.toString(),
      rawToken,
      expiresAt,
    };
  }

  /**
   * Accepts invitation ensuring email matches the authenticated user.
   */
  static async acceptInvite(rawToken: string, currentUserId: string, currentUserEmail: string): Promise<void> {
    const tokenHash = sha256(rawToken);
    const invite = await InvitationModel.findOne({
      tokenHash,
      status: 'pending',
    });

    if (!invite || invite.expiresAt.getTime() < Date.now()) {
      throw new NotFoundError('Invitation is invalid or has expired');
    }

    if (invite.email.toLowerCase() !== currentUserEmail.toLowerCase()) {
      throw new AppError('Invitation was issued for a different email address', 403, 'EMAIL_MISMATCH');
    }

    // Add membership
    try {
      await MembershipModel.create({
        orgId: invite.orgId,
        userId: currentUserId,
        role: invite.role,
      });
    } catch (err: any) {
      if (err.code !== 11000) throw err;
      // If duplicate, membership already exists, proceed to mark invite accepted
    }

    invite.status = 'accepted';
    invite.acceptedAt = new Date();
    await invite.save();
  }

  /**
   * Updates a member's role with last-owner protection.
   */
  static async updateRole(orgId: string, targetUserId: string, newRole: OrgRole): Promise<void> {
    const isSole = await OrgService.isSoleOwner(orgId, targetUserId);
    if (isSole && newRole !== 'owner') {
      throw new AppError('Cannot demote the sole owner of an organization', 400, 'LAST_OWNER_PROTECTION');
    }

    const result = await membershipRepo.updateOne(
      orgId,
      { userId: targetUserId as any },
      { $set: { role: newRole } }
    );

    if (result.matchedCount === 0) {
      throw new NotFoundError('Member not found');
    }

    await invalidateMembershipCache(targetUserId, orgId);
  }

  /**
   * Removes a member from an organization with last-owner protection.
   */
  static async removeMember(orgId: string, targetUserId: string): Promise<void> {
    const isSole = await OrgService.isSoleOwner(orgId, targetUserId);
    if (isSole) {
      throw new AppError('Cannot remove the sole owner of an organization', 400, 'LAST_OWNER_PROTECTION');
    }

    const result = await membershipRepo.deleteOne(orgId, { userId: targetUserId as any });
    if (result.deletedCount === 0) {
      throw new NotFoundError('Member not found');
    }

    await invalidateMembershipCache(targetUserId, orgId);
  }
}
