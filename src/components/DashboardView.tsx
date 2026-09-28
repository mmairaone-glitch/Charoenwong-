import React, { useState, useEffect } from 'react';
import { DashboardStats, Equipment } from '../types/index.js';
import { api } from '../services/api.js';
import {
  Gauge,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  CalendarCheck,
  ArrowRight,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  RefreshCw,
  PlusCircle,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';

interface DashboardViewProps {
  onNavigateToEquipment: (filter?: { status?: string; type?: string }) => void;
  onOpenRecordCalibration: (equipment: Equipment) => void;
  onOpenAddEquipment: () => void;
  canEdit: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToEquipment,
  onOpenRecordCalibration,
  onOpenAddEquipment,
  canEdit,
}) => {
  const { t, lang } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading && !stats) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-slate-300">
        <div className="w-10 h-10 rounded-2xl liquid-glass-panel flex items-center justify-center shadow-[0_0_25px_rgba(20,184,166,0.3)] mb-4">
          <div className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
        </div>
        <span className="text-xs font-semibold tracking-wide text-slate-300">
          {t('loading', 'Calculating metrology calibration statistics...')}
        </span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6">
        <div className="p-4 bg-rose-950/50 border border-rose-500/40 rounded-2xl liquid-glass-panel text-rose-200 text-sm flex items-center justify-between shadow-[0_0_20px_rgba(244,63,94,0.2)]">
          <span>{error || 'Unable to retrieve dashboard data.'}</span>
          <button
            onClick={loadStats}
            className="px-3.5 py-1.5 liquid-glass-button rounded-xl text-xs text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Maximum value for bar scaling in charts
  const maxTypeCount = Math.max(...stats.byType.map((t) => t.total), 1);
  const maxMonthCount = Math.max(...stats.dueByMonth.map((m) => m.count), 1);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Top Banner & Actions (Liquid Glass) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>{t('navDashboard')}</span>
            <Sparkles className="w-4 h-4 text-teal-400 hidden sm:inline" />
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('appSubTitle')}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadStats}
            title={t('refresh')}
            className="p-2 liquid-glass-button rounded-xl text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-400' : ''}`} />
            <span className="hidden sm:inline">{t('refresh')}</span>
          </button>
          {canEdit && (
            <button
              onClick={onOpenAddEquipment}
              className="flex items-center gap-1.5 px-4 py-2 liquid-glass-primary text-white text-xs font-bold rounded-xl transition shadow-lg shadow-teal-950"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t('addEquipment')}</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid with Liquid Glass Refraction & Drill-down */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-3">
        {/* Total Equipment */}
        <div
          onClick={() => onNavigateToEquipment()}
          className="col-span-2 sm:col-span-1 p-3.5 liquid-glass-card rounded-2xl cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">{t('totalEquipment')}</span>
            <Gauge className="w-4 h-4 text-slate-400 group-hover:text-teal-300 transition" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{stats.totalEquipment}</div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
            <span>{t('viewAllEquipment')}</span>
            <ArrowRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition text-teal-400" />
          </div>
        </div>

        {/* Calibration OK (Green Glow) */}
        <div
          onClick={() => onNavigateToEquipment({ status: 'CALIBRATION OK' })}
          className="col-span-1 p-3.5 liquid-glass-card bg-emerald-500/[0.07] border-emerald-500/30 hover:border-emerald-500/50 rounded-2xl cursor-pointer group shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]"
        >
          <div className="flex items-center justify-between text-emerald-400 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">{t('calibrationOk')}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-300 font-mono drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">{stats.calibrationOk}</div>
          <div className="text-[10px] text-emerald-400/80 mt-1 flex items-center gap-1">
            <span>{lang === 'th' ? 'ปกติ / ใช้งานได้' : 'In specification'}</span>
            <ArrowRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition" />
          </div>
        </div>

        {/* Due Soon (Combined <= 10 days) */}
        <div
          onClick={() => onNavigateToEquipment({ status: 'DUE_SOON' })}
          className="col-span-1 p-3.5 liquid-glass-card bg-amber-500/[0.07] border-amber-500/30 hover:border-amber-500/50 rounded-2xl cursor-pointer group shadow-[0_0_15px_rgba(245,158,11,0.1)]"
        >
          <div className="flex items-center justify-between text-amber-400 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">{t('dueSoon')}</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300 font-mono drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]">{stats.dueSoon}</div>
          <div className="text-[10px] text-amber-400/80 mt-1 flex items-center gap-1">
            <span>{lang === 'th' ? 'ภายใน 10 วัน' : 'Within 10 days'}</span>
            <ArrowRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition" />
          </div>
        </div>

        {/* Due in 10 Days */}
        <div
          onClick={() => onNavigateToEquipment({ status: 'DUE IN 10 DAYS' })}
          className="col-span-1 p-3.5 liquid-glass-card rounded-2xl cursor-pointer group"
        >
          <div className="flex items-center justify-between text-yellow-400 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">{t('dueIn10Days')}</span>
            <span className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.8)]" />
          </div>
          <div className="text-2xl font-bold text-yellow-300 font-mono">{stats.due10Days}</div>
          <div className="text-[10px] text-yellow-400/80 mt-1">{lang === 'th' ? 'เหลือ 7 - 10 วัน' : '7 - 10 days left'}</div>
        </div>

        {/* Due in 7 Days */}
        <div
          onClick={() => onNavigateToEquipment({ status: 'DUE IN 7 DAYS' })}
          className="col-span-1 p-3.5 liquid-glass-card rounded-2xl cursor-pointer group"
        >
          <div className="flex items-center justify-between text-amber-400 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">{t('dueIn7Days')}</span>
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
          </div>
          <div className="text-2xl font-bold text-amber-300 font-mono">{stats.due7Days}</div>
          <div className="text-[10px] text-amber-400/80 mt-1">{lang === 'th' ? 'เหลือ 5 - 7 วัน' : '5 - 7 days left'}</div>
        </div>

        {/* Due in 5 Days */}
        <div
          onClick={() => onNavigateToEquipment({ status: 'DUE IN 5 DAYS' })}
          className="col-span-1 p-3.5 liquid-glass-card bg-orange-500/[0.05] border-orange-500/25 rounded-2xl cursor-pointer group"
        >
          <div className="flex items-center justify-between text-orange-400 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">{t('dueIn5Days')}</span>
            <span className="w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_6px_rgba(251,146,60,0.8)]" />
          </div>
          <div className="text-2xl font-bold text-orange-300 font-mono drop-shadow-[0_0_6px_rgba(251,146,60,0.3)]">{stats.due5Days}</div>
          <div className="text-[10px] text-orange-400/80 mt-1">{lang === 'th' ? 'เหลือ 1 - 5 วัน' : '1 - 5 days left'}</div>
        </div>

        {/* Due Today */}
        <div
          onClick={() => onNavigateToEquipment({ status: 'DUE TODAY' })}
          className="col-span-1 p-3.5 liquid-glass-card bg-rose-500/[0.08] border-rose-500/40 rounded-2xl cursor-pointer group shadow-[0_0_15px_rgba(244,63,94,0.15)]"
        >
          <div className="flex items-center justify-between text-rose-400 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">{t('dueToday')}</span>
            <AlertCircle className="w-4 h-4 text-rose-400 animate-pulse drop-shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
          </div>
          <div className="text-2xl font-bold text-rose-300 font-mono drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]">{stats.dueToday}</div>
          <div className="text-[10px] text-rose-400/80 mt-1">{lang === 'th' ? 'ต้องสอบเทียบวันนี้' : 'Recalibrate now'}</div>
        </div>

        {/* Overdue (Red Luminous) */}
        <div
          onClick={() => onNavigateToEquipment({ status: 'OVERDUE' })}
          className="col-span-1 p-3.5 liquid-glass-card bg-red-500/[0.1] border-red-500/40 hover:border-red-500/60 rounded-2xl cursor-pointer group shadow-[0_0_20px_rgba(239,68,68,0.2)]"
        >
          <div className="flex items-center justify-between text-red-400 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">{t('overdue')}</span>
            <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          </div>
          <div className="text-2xl font-bold text-red-300 font-mono drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]">{stats.overdue}</div>
          <div className="text-[10px] text-red-400/80 mt-1">{lang === 'th' ? 'ด่วน! เกินกำหนด' : 'Action required'}</div>
        </div>

        {/* Completed This Month */}
        <div className="col-span-1 p-3.5 liquid-glass-card bg-cyan-500/[0.06] border-cyan-500/30 rounded-2xl shadow-[0_0_15px_rgba(6,182,212,0.1)]">
          <div className="flex items-center justify-between text-cyan-400 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">{t('completedThisMonth')}</span>
            <CalendarCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-300 font-mono drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]">{stats.completedThisMonth}</div>
          <div className="text-[10px] text-cyan-400/80 mt-1">{lang === 'th' ? 'สอบเทียบสำเร็จ' : 'Recalibrated'}</div>
        </div>
      </div>

      {/* Charts Section with Liquid Glass styling */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Equipment by Type */}
        <div className="p-5 liquid-glass-panel rounded-2xl flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm font-semibold text-white">{t('equipmentByType')}</h3>
            </div>
            <span className="text-[11px] text-slate-400">{lang === 'th' ? 'คลิกแท่งกราฟเพื่อดูรายการ' : 'Click to drill down'}</span>
          </div>

          <div className="space-y-3.5 flex-1">
            {stats.byType.map((tItem) => {
              const pct = Math.round((tItem.total / maxTypeCount) * 100);
              return (
                <div
                  key={tItem.type}
                  onClick={() => onNavigateToEquipment({ type: tItem.type })}
                  className="cursor-pointer group"
                >
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-300 group-hover:text-teal-300 transition">
                      {tItem.type} <span className="text-slate-400 font-normal">({tItem.typeName})</span>
                    </span>
                    <span className="font-mono text-slate-200">{tItem.total} units</span>
                  </div>
                  {/* Fluid glass progress bar */}
                  <div className="h-3 w-full bg-slate-950/70 rounded-full overflow-hidden flex border border-white/5">
                    <div
                      style={{ width: `${pct}%` }}
                      className="bg-gradient-to-r from-teal-500 to-cyan-400 group-hover:from-teal-400 group-hover:to-cyan-300 transition-all duration-300 shadow-[0_0_10px_rgba(20,184,166,0.4)]"
                    />
                  </div>
                  <div className="flex gap-3 text-[10px] text-slate-400 mt-1 font-mono">
                    <span className="text-emerald-400">OK: {tItem.ok}</span>
                    {tItem.dueSoon > 0 && <span className="text-amber-400">Due Soon: {tItem.dueSoon}</span>}
                    {tItem.overdue > 0 && <span className="text-rose-400">Overdue: {tItem.overdue}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Calibration Status Breakdown */}
        <div className="p-5 liquid-glass-panel rounded-2xl flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm font-semibold text-white">{t('calibrationStatusBreakdown')}</h3>
            </div>
            <span className="text-[11px] text-slate-400">{lang === 'th' ? 'มุมมอง QA/QC' : 'QA/QC View'}</span>
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-2.5">
            {stats.byStatus
              .filter((s) => s.count > 0 || ['CALIBRATION OK', 'OVERDUE', 'DUE TODAY'].includes(s.status))
              .map((s) => {
                const total = stats.totalEquipment || 1;
                const percentage = Math.round((s.count / total) * 100);
                return (
                  <div
                    key={s.status}
                    onClick={() => onNavigateToEquipment({ status: s.status })}
                    className="p-3 liquid-glass-card rounded-xl cursor-pointer transition flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-[0_0_8px_currentColor]"
                        style={{ backgroundColor: s.color, color: s.color }}
                      />
                      <span className="text-xs font-medium text-slate-200">{s.status}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="text-slate-400">{percentage}%</span>
                      <strong className="text-white w-6 text-right">{s.count}</strong>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Chart 3: Calibration Due by Month */}
        <div className="p-5 liquid-glass-panel rounded-2xl flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm font-semibold text-white">{t('upcomingScheduleByMonth')}</h3>
            </div>
            <span className="text-[11px] text-slate-400">Forecast</span>
          </div>

          <div className="flex-1 flex items-end justify-between gap-3 pt-6 pb-2">
            {stats.dueByMonth.map((m) => {
              const heightPct = Math.max(Math.round((m.count / maxMonthCount) * 100), 12);
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-200">{m.count}</span>
                  <div className="w-full bg-slate-950/60 rounded-t-xl h-36 flex items-end justify-center p-1 border border-white/5">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full bg-gradient-to-t from-teal-500/80 to-cyan-400/90 rounded-t-lg transition-all duration-500 shadow-[0_0_15px_rgba(20,184,166,0.3)]"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 text-center whitespace-nowrap font-medium">
                    {m.month.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Overdue & Urgent Equipment Table (Liquid Glass Table) */}
      <div className="liquid-glass-panel rounded-2xl overflow-hidden">
        <div className="p-4 bg-slate-950/40 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
            <h3 className="text-sm font-bold text-white">
              {t('urgentOverdueList')}
            </h3>
          </div>
          <button
            onClick={() => onNavigateToEquipment({ status: 'OVERDUE' })}
            className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 font-semibold transition"
          >
            <span>{t('viewAllEquipment')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] border-b border-white/10">
              <tr>
                <th className="py-3 px-4">{t('colEquipmentId')}</th>
                <th className="py-3 px-4">{t('colNameSpecs')}</th>
                <th className="py-3 px-4">{t('colType')}</th>
                <th className="py-3 px-4">{t('colLocationDept')}</th>
                <th className="py-3 px-4">{t('colNextDue')}</th>
                <th className="py-3 px-4">{t('colDaysLeft')}</th>
                <th className="py-3 px-4">{t('colStatus')}</th>
                {canEdit && <th className="py-3 px-4 text-right">{t('actions')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {stats.urgentList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    {lang === 'th'
                      ? 'ไม่มีเครื่องมือที่เกินกำหนดหรือใกล้กำหนด เครื่องมือทั้งหมดอยู่ในสถานะปกติ!'
                      : 'No overdue or urgent equipment. All instruments are within calibration specifications!'}
                  </td>
                </tr>
              ) : (
                stats.urgentList.slice(0, 8).map((eq) => {
                  const remaining = eq.remaining_days ?? 0;
                  return (
                    <tr key={eq.id} className="hover:bg-white/[0.04] transition">
                      <td className="py-3 px-4 font-mono font-bold text-teal-300">{eq.equipment_id}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{eq.equipment_name}</div>
                        <div className="text-[11px] text-slate-400">
                          {eq.manufacturer} {eq.model}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium">{eq.equipment_type_code}</td>
                      <td className="py-3 px-4 text-slate-300">{eq.location}</td>
                      <td className="py-3 px-4 font-mono">{eq.next_calibration_date}</td>
                      <td className="py-3 px-4 font-mono font-bold">
                        {remaining < 0 ? (
                          <span className="text-rose-400 drop-shadow-[0_0_6px_rgba(244,63,94,0.4)]">
                            {remaining} {lang === 'th' ? 'วัน (เกินกำหนด)' : 'Days (Overdue)'}
                          </span>
                        ) : remaining === 0 ? (
                          <span className="text-rose-400 drop-shadow-[0_0_6px_rgba(244,63,94,0.4)]">
                            {lang === 'th' ? 'วันนี้ (Today)' : '0 Days (Today)'}
                          </span>
                        ) : (
                          <span className="text-amber-400">
                            {remaining} {lang === 'th' ? 'วัน' : 'Days'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider inline-block backdrop-blur-md ${
                            eq.status === 'OVERDUE'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                              : eq.status === 'DUE TODAY'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                              : eq.status === 'DUE IN 5 DAYS'
                              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-[0_0_8px_rgba(249,115,22,0.3)]'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                          }`}
                        >
                          {eq.status}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => onOpenRecordCalibration(eq)}
                            className="px-3 py-1.5 liquid-glass-button hover:bg-teal-500/30 text-teal-300 hover:text-white rounded-xl text-[11px] font-semibold transition"
                          >
                            {t('recordCalibration')}
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
