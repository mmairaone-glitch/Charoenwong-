import { Router, Response } from 'express';
import { db, getTodayDateStr } from '../db.js';
import { authMiddleware, requireRoles, AuthenticatedRequest } from '../middleware.js';

const router = Router();

router.post('/run', authMiddleware, requireRoles(['Admin', 'QA/QC']), (req: AuthenticatedRequest, res: Response) => {
  const { simulatedDate } = req.body;
  const targetDate = simulatedDate || getTodayDateStr();

  const result = db.runNotificationScheduler(targetDate);

  db.logAudit({
    userId: req.user!.id,
    userName: req.user!.name,
    employeeId: req.user!.employee_id,
    action: 'RUN_DAILY_SCHEDULER',
    module: 'SCHEDULER',
    recordId: 'SCHEDULER-' + targetDate,
    newValue: { ...result, targetDate },
    ipAddress: req.ip,
  });

  return res.json({
    success: true,
    message: `Daily scheduler executed for date: ${targetDate}. Checked ${result.checkedCount} equipment items. Generated ${result.newNotificationsCount} new notification(s).`,
    ...result,
    date: targetDate,
  });
});

export default router;
