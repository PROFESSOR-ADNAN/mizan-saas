import { Router, Request, Response, NextFunction } from 'express';
import { TeamService } from '../services/team.service.js';
import { CreateTeamSchema } from '@mizan/shared';
import { requirePermission } from '../middleware/rbac.js';
import { recordAuditLog } from '../middleware/audit.js';

const router = Router({ mergeParams: true });

router.get('/', requirePermission('members:read'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const teams = await TeamService.listTeams(req.orgId!);
    res.status(200).json({ teams });
  } catch (err) {
    next(err);
  }
});

router.post('/', requirePermission('teams:manage'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = CreateTeamSchema.parse(req.body);
    const team = await TeamService.createTeam(req.orgId!, data);
    await recordAuditLog(req, 'team.created', 'Team', team._id.toString(), { name: data.name });
    res.status(201).json({ team });
  } catch (err) {
    next(err);
  }
});

router.post('/:teamId/members', requirePermission('teams:manage'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.body;
    await TeamService.addMember(req.orgId!, req.params.teamId, userId);
    await recordAuditLog(req, 'team.member_added', 'Team', req.params.teamId, { userId });
    res.status(201).json({ message: 'Member added to team' });
  } catch (err) {
    next(err);
  }
});

router.delete('/:teamId/members/:userId', requirePermission('teams:manage'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await TeamService.removeMember(req.orgId!, req.params.teamId, req.params.userId);
    await recordAuditLog(req, 'team.member_removed', 'Team', req.params.teamId, { userId: req.params.userId });
    res.status(200).json({ message: 'Member removed from team' });
  } catch (err) {
    next(err);
  }
});

export default router;
