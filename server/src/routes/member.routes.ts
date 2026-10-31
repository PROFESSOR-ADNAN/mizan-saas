import { Router, Request, Response, NextFunction } from 'express';
import { MemberService } from '../services/member.service.js';
import { InviteMemberSchema, UpdateMemberRoleSchema } from '@mizan/shared';
import { requirePermission } from '../middleware/rbac.js';
import { recordAuditLog } from '../middleware/audit.js';

const router = Router({ mergeParams: true });

// List organization members
router.get('/', requirePermission('members:read'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const members = await MemberService.listMembers(req.orgId!);
    res.status(200).json({ members });
  } catch (err) {
    next(err);
  }
});

// Invite member
router.post('/invite', requirePermission('members:manage'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = InviteMemberSchema.parse(req.body);
    const invite = await MemberService.inviteMember(req.orgId!, req.user!.userId, data.email, data.role);
    await recordAuditLog(req, 'member.invited', 'Invitation', invite.inviteId, { email: data.email, role: data.role });
    res.status(201).json({
      message: 'Invitation created successfully',
      inviteToken: invite.rawToken,
      expiresAt: invite.expiresAt,
    });
  } catch (err) {
    next(err);
  }
});

// Update member role
router.patch('/:userId/role', requirePermission('members:manage'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = UpdateMemberRoleSchema.parse(req.body);
    await MemberService.updateRole(req.orgId!, req.params.userId, data.role);
    await recordAuditLog(req, 'member.role_updated', 'Membership', req.params.userId, { newRole: data.role });
    res.status(200).json({ message: 'Member role updated successfully' });
  } catch (err) {
    next(err);
  }
});

// Remove member
router.delete('/:userId', requirePermission('members:manage'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await MemberService.removeMember(req.orgId!, req.params.userId);
    await recordAuditLog(req, 'member.removed', 'Membership', req.params.userId);
    res.status(200).json({ message: 'Member removed successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
