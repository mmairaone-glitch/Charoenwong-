import { Router, Response } from 'express';
import { db } from '../db.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware.js';

const router = Router();

router.get('/status', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  db.refreshAllStatuses();
  const list = db.getData().equipment;
  return res.json({ report: list, total: list.length });
});

router.get('/overdue', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  db.refreshAllStatuses();
  const list = db.getData().equipment.filter((e) => e.status === 'OVERDUE' && e.is_active);
  return res.json({ report: list, total: list.length });
});

router.get('/due-soon', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  db.refreshAllStatuses();
  const list = db
    .getData()
    .equipment.filter(
      (e) =>
        ['DUE IN 10 DAYS', 'DUE IN 7 DAYS', 'DUE IN 5 DAYS', 'DUE TODAY'].includes(e.status) &&
        e.is_active
    )
    .sort((a, b) => (a.remaining_days ?? 999) - (b.remaining_days ?? 999));
  return res.json({ report: list, total: list.length });
});

router.get('/history', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const records = [...db.getData().calibration_records].sort((a, b) =>
    b.calibration_date.localeCompare(a.calibration_date)
  );
  return res.json({ report: records, total: records.length });
});

export default router;
