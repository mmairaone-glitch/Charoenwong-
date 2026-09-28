import { Router, Response } from 'express';
import { db } from '../db.js';
import { authMiddleware, requireRoles, AuthenticatedRequest } from '../middleware.js';

const router = Router();

router.get('/', authMiddleware, requireRoles(['Admin']), (req: AuthenticatedRequest, res: Response) => {
  const { module, action, search } = req.query;
  let logs = [...db.getData().audit_logs];

  if (module && typeof module === 'string' && module !== 'all') {
    logs = logs.filter((l) => l.module.toLowerCase() === module.toLowerCase());
  }

  if (action && typeof action === 'string' && action !== 'all') {
    logs = logs.filter((l) => l.action.toLowerCase() === action.toLowerCase());
  }

  if (search && typeof search === 'string' && search.trim() !== '') {
    const q = search.trim().toLowerCase();
    logs = logs.filter(
      (l) =>
        l.user_name.toLowerCase().includes(q) ||
        l.employee_id.toLowerCase().includes(q) ||
        l.record_id.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q)
    );
  }

  logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return res.json({ logs, total: logs.length });
});

export default router;
