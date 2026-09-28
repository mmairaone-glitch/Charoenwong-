import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './server/db.js';

import authRouter from './server/routes/auth.js';
import equipmentRouter from './server/routes/equipment.js';
import calibrationRouter from './server/routes/calibration.js';
import dashboardRouter from './server/routes/dashboard.js';
import notificationsRouter from './server/routes/notifications.js';
import usersRouter from './server/routes/users.js';
import equipmentTypesRouter from './server/routes/equipmentTypes.js';
import auditLogsRouter from './server/routes/auditLogs.js';
import reportsRouter from './server/routes/reports.js';
import schedulerRouter from './server/routes/scheduler.js';
import uploadRouter from './server/routes/upload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // JSON Body parser
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/equipment', equipmentRouter);
  app.use('/api/calibrations', calibrationRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/equipment-types', equipmentTypesRouter);
  app.use('/api/audit-logs', auditLogsRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/scheduler', schedulerRouter);
  app.use('/api/upload', uploadRouter);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'ICMS Industrial Calibration Management System', time: new Date().toISOString() });
  });

  // Run initial scheduler check on server boot
  try {
    const schedResult = db.runNotificationScheduler();
    console.log(`[ICMS Scheduler] Initial boot check completed: Checked ${schedResult.checkedCount} items, generated ${schedResult.newNotificationsCount} notifications.`);
  } catch (err) {
    console.error('[ICMS Scheduler] Boot check error:', err);
  }

  // Periodic daily scheduler trigger (every 24 hours)
  setInterval(() => {
    try {
      console.log('[ICMS Scheduler] Running 24h cron check...');
      db.runNotificationScheduler();
    } catch (err) {
      console.error('[ICMS Scheduler] Interval error:', err);
    }
  }, 24 * 60 * 60 * 1000);

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Mount Vite middlewares for HMR/dev
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static frontend assets in production
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 ICMS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup failure:', err);
  process.exit(1);
});
