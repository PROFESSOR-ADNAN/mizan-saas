import { Router, Request, Response, NextFunction } from 'express';
import { Readable } from 'node:stream';
import { ImportService } from '../services/import.service.js';
import { requirePermission } from '../middleware/rbac.js';
import { recordAuditLog } from '../middleware/audit.js';

const router = Router({ mergeParams: true });

// Upload and stream CSV import
router.post('/', requirePermission('data:read'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sourceId = (req.headers['x-source-id'] as string) || req.query.sourceId as string;
    if (!sourceId) {
      res.status(400).json({ message: 'x-source-id header or query param is required' });
      return;
    }

    const filename = (req.headers['x-filename'] as string) || 'import.csv';

    // Stream directly from req stream
    const job = await ImportService.processCsvStream(req.orgId!, sourceId, filename, req);
    await recordAuditLog(req, 'import.completed', 'ImportJob', job._id.toString(), { filename, rows: job.totalRows });

    res.status(202).json({ job });
  } catch (err) {
    next(err);
  }
});

// Check import job progress
router.get('/:jobId', requirePermission('data:read'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = await ImportService.getJob(req.orgId!, req.params.jobId);
    res.status(200).json({ job });
  } catch (err) {
    next(err);
  }
});

export default router;
