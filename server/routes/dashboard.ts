import { Router, Response } from 'express';
import { db, getTodayDateStr } from '../db.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware.js';
import { DashboardStats, CalibrationStatus } from '../../src/types/index.js';

const router = Router();

router.get('/stats', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  db.refreshAllStatuses();

  const allEq = db.getData().equipment;
  const activeEq = allEq.filter((e) => e.is_active);
  const records = db.getData().calibration_records;
  const types = db.getData().equipment_types;

  const todayStr = getTodayDateStr();
  const currentYearMonth = todayStr.slice(0, 7); // 'YYYY-MM'

  const totalEquipment = allEq.length;
  const calibrationOk = activeEq.filter((e) => e.status === 'CALIBRATION OK').length;
  const due10Days = activeEq.filter((e) => e.status === 'DUE IN 10 DAYS').length;
  const due7Days = activeEq.filter((e) => e.status === 'DUE IN 7 DAYS').length;
  const due5Days = activeEq.filter((e) => e.status === 'DUE IN 5 DAYS').length;
  const dueToday = activeEq.filter((e) => e.status === 'DUE TODAY').length;
  const overdue = activeEq.filter((e) => e.status === 'OVERDUE').length;
  const dueSoon = due10Days + due7Days + due5Days + dueToday;

  const completedThisMonth = records.filter((r) => r.calibration_date.startsWith(currentYearMonth)).length;

  // Equipment by Type
  const byType = types.map((t) => {
    const matching = activeEq.filter((e) => e.equipment_type_code.toLowerCase() === t.code.toLowerCase());
    const ok = matching.filter((e) => e.status === 'CALIBRATION OK').length;
    const over = matching.filter((e) => e.status === 'OVERDUE').length;
    const soon = matching.filter((e) =>
      ['DUE IN 10 DAYS', 'DUE IN 7 DAYS', 'DUE IN 5 DAYS', 'DUE TODAY'].includes(e.status)
    ).length;

    return {
      type: t.code,
      typeName: t.name,
      total: matching.length,
      ok,
      dueSoon: soon,
      overdue: over,
    };
  }).filter((item) => item.total > 0 || ['CMM', 'VMM', 'DG', 'MM', 'VC', 'PG', 'BG'].includes(item.type));

  // Equipment by Status
  const statusColorMap: Record<CalibrationStatus, string> = {
    'CALIBRATION OK': '#10b981', // Emerald Green
    'DUE IN 10 DAYS': '#eab308', // Yellow
    'DUE IN 7 DAYS': '#f59e0b',  // Amber
    'DUE IN 5 DAYS': '#f97316',  // Orange
    'DUE TODAY': '#ef4444',      // Red
    'OVERDUE': '#dc2626',        // Dark Red
    'INACTIVE': '#9ca3af',       // Gray
  };

  const statusCounts: Record<CalibrationStatus, number> = {
    'CALIBRATION OK': calibrationOk,
    'DUE IN 10 DAYS': due10Days,
    'DUE IN 7 DAYS': due7Days,
    'DUE IN 5 DAYS': due5Days,
    'DUE TODAY': dueToday,
    'OVERDUE': overdue,
    'INACTIVE': allEq.filter((e) => !e.is_active).length,
  };

  const byStatus = (Object.keys(statusCounts) as CalibrationStatus[]).map((st) => ({
    status: st,
    count: statusCounts[st],
    color: statusColorMap[st],
  }));

  // Due by Month (Next 6 months)
  const monthMap: Record<string, number> = {};
  const currentMonthDate = new Date(todayStr + 'T00:00:00Z');

  for (let i = 0; i < 6; i++) {
    const d = new Date(currentMonthDate);
    d.setUTCMonth(d.getUTCMonth() + i);
    const key = d.toISOString().slice(0, 7); // 'YYYY-MM'
    monthMap[key] = 0;
  }

  activeEq.forEach((e) => {
    const m = e.next_calibration_date.slice(0, 7);
    if (monthMap[m] !== undefined) {
      monthMap[m]++;
    }
  });

  const dueByMonth = Object.keys(monthMap).map((m) => {
    const [year, month] = m.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const label = `${monthNames[parseInt(month, 10) - 1]} ${year}`;
    return {
      month: label,
      count: monthMap[m],
    };
  });

  // Urgent Equipment list (Overdue, Due Today, Due in 5, 7, 10 days)
  const urgentList = activeEq
    .filter((e) => e.status !== 'CALIBRATION OK')
    .sort((a, b) => (a.remaining_days ?? 999) - (b.remaining_days ?? 999));

  const stats: DashboardStats = {
    totalEquipment,
    calibrationOk,
    dueSoon,
    due10Days,
    due7Days,
    due5Days,
    dueToday,
    overdue,
    expired: overdue,
    completedThisMonth,
    byType,
    byStatus,
    dueByMonth,
    urgentList,
  };

  return res.json(stats);
});

export default router;
