import { Router, Request, Response, NextFunction } from 'express';
import { DataSourceService } from '../services/datasource.service.js';
import { CreateDataSourceSchema } from '@mizan/shared';
import { requirePermission } from '../middleware/rbac.js';
import { recordAuditLog } from '../middleware/audit.js';

const router = Router({ mergeParams: true });

router.get('/', requirePermission('data:read'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sources = await DataSourceService.list(req.orgId!);
    res.status(200).json({ dataSources: sources });
  } catch (err) {
    next(err);
  }
});

router.post('/', requirePermission('sources:manage'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = CreateDataSourceSchema.parse(req.body);
    const source = await DataSourceService.create(req.orgId!, data);
    await recordAuditLog(req, 'source.created', 'DataSource', source._id.toString(), { name: data.name });
    res.status(201).json({ dataSource: source });
  } catch (err) {
    next(err);
  }
});

export default router;
