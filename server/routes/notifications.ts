import { Router, Response } from 'express';
import { db } from '../db.js';
import { authMiddleware, requireRoles, AuthenticatedRequest } from '../middleware.js';

const router = Router();

// GET /api/notifications
router.get('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { filter } = req.query;
  const notifs = db.getData().notifications;

  let filtered = [...notifs];

  if (filter === 'unread') {
    filtered = filtered.filter((n) => !n.is_read);
  } else if (
    filter === 'DUE_10_DAYS' ||
    filter === 'DUE_7_DAYS' ||
    filter === 'DUE_5_DAYS' ||
    filter === 'DUE_TODAY' ||
    filter === 'OVERDUE'
  ) {
    filtered = filtered.filter((n) => n.notification_type === filter);
  }

  const unreadCount = notifs.filter((n) => !n.is_read).length;

  const countsByType = {
    all: notifs.length,
    unread: unreadCount,
    DUE_10_DAYS: notifs.filter((n) => n.notification_type === 'DUE_10_DAYS').length,
    DUE_7_DAYS: notifs.filter((n) => n.notification_type === 'DUE_7_DAYS').length,
    DUE_5_DAYS: notifs.filter((n) => n.notification_type === 'DUE_5_DAYS').length,
    DUE_TODAY: notifs.filter((n) => n.notification_type === 'DUE_TODAY').length,
    OVERDUE: notifs.filter((n) => n.notification_type === 'OVERDUE').length,
  };

  return res.json({
    notifications: filtered,
    unreadCount,
    countsByType,
  });
});

// PUT /api/notifications/:id/read
router.put('/:id/read', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const notif = db.getData().notifications.find((n) => n.id === id);

  if (!notif) {
    return res.status(404).json({ error: 'Notification not found.' });
  }

  notif.is_read = true;
  db.persist();

  return res.json({ success: true, notification: notif });
});

// POST /api/notifications/read-all
router.post('/read-all', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  db.getData().notifications.forEach((n) => {
    n.is_read = true;
  });
  db.persist();

  return res.json({ success: true, message: 'All notifications marked as read.' });
});

// DELETE /api/notifications/:id
router.delete('/:id', authMiddleware, requireRoles(['Admin']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const index = db.getData().notifications.findIndex((n) => n.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Notification not found.' });
  }

  db.getData().notifications.splice(index, 1);
  db.persist();

  return res.json({ success: true, message: 'Notification deleted.' });
});

export default router;
