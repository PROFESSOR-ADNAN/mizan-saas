import { Router, Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/admin.service.js';
import { requireAuth, requirePlatformAdmin } from '../middleware/auth.js';
import { recordAuditLog } from '../middleware/audit.js';

const router = Router();

router.use(requireAuth);
router.use(requirePlatformAdmin);

// List all tenants across platform
router.get('/tenants', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AdminService.listTenants({
      search: req.query.search as string,
      status: req.query.status as string,
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// Suspend organization
router.post('/tenants/:orgId/suspend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reason = req.body.reason || 'Administrative suspension';
    const org = await AdminService.suspendTenant(req.params.orgId, reason);
    res.status(200).json({ organization: org });
  } catch (err) {
    next(err);
  }
});

// Unsuspend organization
router.post('/tenants/:orgId/unsuspend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const org = await AdminService.unsuspendTenant(req.params.orgId);
    res.status(200).json({ organization: org });
  } catch (err) {
    next(err);
  }
});

// Extend trial
router.post('/tenants/:orgId/extend-trial', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = req.body.days || 14;
    const sub = await AdminService.extendTrial(req.params.orgId, days);
    res.status(200).json({ subscription: sub });
  } catch (err) {
    next(err);
  }
});

// Issue credit note
router.post('/tenants/:orgId/credit-notes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amountSantim, reason } = req.body;
    const note = await AdminService.issueCreditNote(req.params.orgId, amountSantim, reason);
    res.status(201).json({ creditNote: note });
  } catch (err) {
    next(err);
  }
});

export default router;
