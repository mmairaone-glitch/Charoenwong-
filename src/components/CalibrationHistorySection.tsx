import React, { useState } from 'react';
import { CalibrationRecord } from '../types/index.js';
import {
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  Calendar,
  Layers,
  Table as TableIcon,
  LayoutGrid,
  Download,
  ShieldCheck,
  Building2,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';

interface CalibrationHistorySectionProps {
  records: CalibrationRecord[];
  canDelete?: boolean;
  onDeleteRecord?: (record: CalibrationRecord) => void;
  showEquipmentInfo?: boolean; // if showing equipment ID & Name in the table (e.g. on full CalibrationsView)
}

export const CalibrationHistorySection: React.FC<CalibrationHistorySectionProps> = ({
  records,
  canDelete = false,
  onDeleteRecord,
  showEquipmentInfo = false,
}) => {
  const { t, lang } = useLanguage();
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Format axis display string: Uncertainty + Error Max = Result
  const renderAxisFormula = (axisData?: { uncertainty?: string | number; error_max?: string | number; result?: string | number }, axisLabel?: string) => {
    if (!axisData || (!axisData.uncertainty && !axisData.error_max && !axisData.result)) {
      return <span className="text-slate-500 font-mono text-[11px]">-</span>;
    }

    const u = axisData.uncertainty ?? '-';
    const e = axisData.error_max ?? '-';
    const r = axisData.result ?? '-';

    return (
      <div className="flex flex-col gap-0.5 leading-tight text-[11px] font-mono">
        <div className="flex items-center gap-1 text-slate-300">
          <span className="text-slate-400 text-[10px]">U:</span>
          <span>{u}</span>
          <span className="text-slate-500">+</span>
          <span className="text-slate-400 text-[10px]">E:</span>
          <span>{e}</span>
        </div>
        <div className="text-teal-300 font-semibold flex items-center gap-1">
          <span className="text-slate-400 text-[10px]">= Res:</span>
          <span>{r}</span>
        </div>
      </div>
    );
  };

  if (records.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs liquid-glass-panel rounded-2xl border border-white/10">
        <Sparkles className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
        <p>{lang === 'th' ? 'ยังไม่มีประวัติการสอบเทียบที่บันทึกไว้ในระบบ' : 'No calibration records registered yet.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* View Switcher Bar */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-teal-400" />
            <span>{lang === 'th' ? 'รายการประวัติการสอบเทียบ Actual' : 'Actual Calibration History Records'}</span>
          </span>
          <span className="px-2 py-0.5 liquid-glass-switcher text-teal-300 font-mono text-[11px] rounded-lg">
            {records.length} {lang === 'th' ? 'รายการ' : 'records'}
          </span>
        </div>

        {/* Segmented Toggle for Table / Cards */}
        <div className="flex items-center p-0.5 liquid-glass-switcher rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              viewMode === 'table'
                ? 'liquid-glass-primary text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title={t('viewModeTable')}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('viewModeTable')}</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              viewMode === 'cards'
                ? 'liquid-glass-primary text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title={t('viewModeCards')}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('viewModeCards')}</span>
          </button>
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="liquid-glass-panel rounded-2xl border border-white/15 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950/80 text-slate-300 uppercase tracking-wider text-[10px] border-b border-white/15">
                {/* Multi-tier Header */}
                <tr>
                  <th rowSpan={2} className="py-2.5 px-3 border-r border-white/10 whitespace-nowrap">
                    {t('calDate')}
                  </th>
                  {showEquipmentInfo && (
                    <th rowSpan={2} className="py-2.5 px-3 border-r border-white/10 whitespace-nowrap">
                      {t('colEquipmentId')}
                    </th>
                  )}
                  <th rowSpan={2} className="py-2.5 px-3 border-r border-white/10 whitespace-nowrap">
                    {t('calSource')}
                  </th>
                  <th rowSpan={2} className="py-2.5 px-3 border-r border-white/10 whitespace-nowrap">
                    {t('certNo')}
                  </th>
                  <th
                    colSpan={3}
                    className="py-1 px-3 text-center bg-teal-950/40 text-teal-300 font-semibold border-r border-white/10 tracking-normal normal-case text-xs"
                  >
                    Uncertainty + Error Max = result
                  </th>
                  <th rowSpan={2} className="py-2.5 px-3 border-r border-white/10 whitespace-nowrap text-center">
                    {t('mpeStandard')}
                  </th>
                  <th rowSpan={2} className="py-2.5 px-3 border-r border-white/10 whitespace-nowrap text-center">
                    {t('judgement')}
                  </th>
                  <th rowSpan={2} className="py-2.5 px-3 border-r border-white/10 whitespace-nowrap">
                    {t('authorizedSignature')}
                  </th>
                  <th rowSpan={2} className="py-2.5 px-3 border-r border-white/10 whitespace-nowrap">
                    {t('nextCalibration')}
                  </th>
                  <th rowSpan={2} className="py-2.5 px-3 whitespace-nowrap text-center">
                    Cert File
                  </th>
                  {canDelete && (
                    <th rowSpan={2} className="py-2.5 px-3 whitespace-nowrap text-right">
                      {t('actions')}
                    </th>
                  )}
                </tr>
                {/* Sub-columns for Axes */}
                <tr className="bg-slate-950/90 text-[10px] text-slate-400 border-t border-white/5">
                  <th className="py-1.5 px-2.5 border-r border-white/10 text-teal-400 font-mono font-bold whitespace-nowrap">
                    {lang === 'th' ? 'แกน X (Axis X)' : 'Axis X'}
                  </th>
                  <th className="py-1.5 px-2.5 border-r border-white/10 text-indigo-300 font-mono font-bold whitespace-nowrap">
                    {lang === 'th' ? 'แกน Y (Axis Y)' : 'Axis Y'}
                  </th>
                  <th className="py-1.5 px-2.5 border-r border-white/10 text-purple-300 font-mono font-bold whitespace-nowrap">
                    {lang === 'th' ? 'แกน Z (Axis Z)' : 'Axis Z'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {records.map((rec) => {
                  const isPass = rec.judgement === 'PASS' || rec.result === 'PASS';
                  const isAdjusted = rec.result === 'ADJUSTED';
                  const source = rec.calibration_source || rec.calibration_lab || '-';
                  const authorized = rec.authorized_signature || rec.authorized_by || rec.approved_by || '-';

                  return (
                    <tr
                      key={rec.id}
                      className="hover:bg-white/[0.04] transition group"
                    >
                      {/* Cal. Date */}
                      <td className="py-3 px-3 font-mono font-semibold text-slate-200 whitespace-nowrap border-r border-white/5">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                          <span>{rec.calibration_date}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          ID: {rec.calibration_id}
                        </span>
                      </td>

                      {/* Equipment ID (optional) */}
                      {showEquipmentInfo && (
                        <td className="py-3 px-3 font-mono font-bold text-white whitespace-nowrap border-r border-white/5">
                          <div>{rec.equipment_id}</div>
                          <div className="text-[10px] font-sans font-normal text-slate-400 truncate max-w-[120px]">
                            {rec.equipment_name || '-'}
                          </div>
                        </td>
                      )}

                      {/* Cal. Source */}
                      <td className="py-3 px-3 border-r border-white/5">
                        <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                          <span className="truncate max-w-[160px]" title={source}>
                            {source}
                          </span>
                        </div>
                      </td>

                      {/* Certification No. */}
                      <td className="py-3 px-3 font-mono text-slate-200 border-r border-white/5 whitespace-nowrap">
                        <span className="px-2 py-0.5 liquid-glass-switcher text-teal-200 rounded-md border border-teal-500/20 text-[11px]">
                          {rec.certificate_number || '-'}
                        </span>
                      </td>

                      {/* Axis X: Uncertainty + Error Max = Result */}
                      <td className="py-3 px-2.5 border-r border-white/5 bg-teal-950/10 whitespace-nowrap">
                        {renderAxisFormula(rec.axis_x, 'X')}
                      </td>

                      {/* Axis Y: Uncertainty + Error Max = Result */}
                      <td className="py-3 px-2.5 border-r border-white/5 bg-indigo-950/10 whitespace-nowrap">
                        {renderAxisFormula(rec.axis_y, 'Y')}
                      </td>

                      {/* Axis Z: Uncertainty + Error Max = Result */}
                      <td className="py-3 px-2.5 border-r border-white/5 bg-purple-950/10 whitespace-nowrap">
                        {renderAxisFormula(rec.axis_z, 'Z')}
                      </td>

                      {/* MPE (Standard) */}
                      <td className="py-3 px-3 font-mono text-center text-slate-200 border-r border-white/5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-800/80 text-slate-300 border border-white/10 font-bold text-[11px]">
                          {rec.mpe_standard || '±0.0030 mm'}
                        </span>
                      </td>

                      {/* Judgement (Result < MPE) */}
                      <td className="py-3 px-3 border-r border-white/5 text-center whitespace-nowrap">
                        {isPass ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold border bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.25)] flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>PASS</span>
                            </span>
                            <span className="text-[9px] text-emerald-400/80 font-mono mt-0.5">
                              (Result &lt; MPE)
                            </span>
                          </div>
                        ) : isAdjusted ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold border bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)] flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                              <span>ADJUSTED</span>
                            </span>
                            <span className="text-[9px] text-amber-400/80 font-mono mt-0.5">
                              (Compensated)
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold border bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.25)] flex items-center gap-1">
                              <XCircle className="w-3 h-3 text-rose-400" />
                              <span>FAIL</span>
                            </span>
                            <span className="text-[9px] text-rose-400/80 font-mono mt-0.5">
                              (Result ≥ MPE)
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Authorized (Signature) */}
                      <td className="py-3 px-3 border-r border-white/5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-400">
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-100 text-xs truncate max-w-[140px]" title={authorized}>
                              {authorized}
                            </div>
                            <div className="text-[9px] text-teal-300/80 font-mono flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 inline-block animate-pulse" />
                              <span>Authorized Signature</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Next Calibration */}
                      <td className="py-3 px-3 font-mono font-bold text-teal-300 border-r border-white/5 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{rec.next_calibration_date}</span>
                        </div>
                      </td>

                      {/* Cert File */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {rec.attachment_name ? (
                          <a
                            href={rec.attachment_url || '#'}
                            download={rec.attachment_name}
                            className="inline-flex items-center gap-1 px-2.5 py-1 liquid-glass-button text-[10px] rounded-lg text-teal-300 hover:text-white transition"
                            title={rec.attachment_name}
                          >
                            <FileText className="w-3 h-3" />
                            <Download className="w-2.5 h-2.5" />
                          </a>
                        ) : (
                          <span className="text-slate-600 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Delete Action (Optional) */}
                      {canDelete && (
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => onDeleteRecord?.(rec)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg liquid-glass-button transition"
                            title={t('delete')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CARDS VIEW (Glassmorphic Cards) */}
      {viewMode === 'cards' && (
        <div className="space-y-3">
          {records.map((rec) => {
            const isPass = rec.judgement === 'PASS' || rec.result === 'PASS';
            const isAdjusted = rec.result === 'ADJUSTED';
            const source = rec.calibration_source || rec.calibration_lab || '-';
            const authorized = rec.authorized_signature || rec.authorized_by || rec.approved_by || '-';

            return (
              <div
                key={rec.id}
                className="liquid-glass-card p-4 rounded-2xl border border-white/15 space-y-3.5 relative overflow-hidden shadow-xl"
              >
                {/* Glowing ambient background corner */}
                <div
                  className={`absolute -right-12 -top-12 w-32 h-32 rounded-full blur-3xl pointer-events-none ${
                    isPass ? 'bg-emerald-500/10' : 'bg-rose-500/10'
                  }`}
                />

                {/* Card Top Row: Cal. Date, Cal. Source, Cert No, Judgement */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="px-2.5 py-1 liquid-glass-switcher text-teal-300 font-mono font-bold text-xs rounded-xl flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-teal-400" />
                      <span>{rec.calibration_date}</span>
                    </span>

                    <span className="text-xs text-slate-300 font-medium flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-teal-400" />
                      <span>{source}</span>
                    </span>

                    <span className="px-2.5 py-0.5 rounded-lg font-mono text-[11px] bg-slate-900/60 text-slate-300 border border-white/10">
                      Cert #: <strong>{rec.certificate_number || '-'}</strong>
                    </span>
                  </div>

                  {/* Judgement Badge */}
                  <div className="flex items-center gap-2">
                    {isPass ? (
                      <span className="px-3 py-1 rounded-xl text-xs font-bold border bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)] flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>PASS (Result &lt; MPE)</span>
                      </span>
                    ) : isAdjusted ? (
                      <span className="px-3 py-1 rounded-xl text-xs font-bold border bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.3)] flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span>ADJUSTED (Compensated)</span>
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-xl text-xs font-bold border bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.3)] flex items-center gap-1.5">
                        <XCircle className="w-4 h-4 text-rose-400" />
                        <span>FAIL (Result ≥ MPE)</span>
                      </span>
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => onDeleteRecord?.(rec)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded-lg liquid-glass-button transition"
                        title={t('delete')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 3 Axes Grid: Uncertainty + Error Max = result */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold text-teal-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-teal-400" />
                      <span>Uncertainty + Error Max = result (Actual)</span>
                    </span>
                    <span className="font-mono text-slate-400">
                      MPE (Standard): <strong className="text-white">{rec.mpe_standard || '±0.0030 mm'}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Axis X */}
                    <div className="p-2.5 rounded-xl liquid-glass-panel border border-teal-500/25 bg-teal-950/20 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wide">
                          {lang === 'th' ? 'แกน X (Axis X)' : 'Axis X'}
                        </span>
                        <span className="text-[10px] font-mono text-teal-300/80">Primary</span>
                      </div>
                      <div className="text-xs space-y-0.5">
                        <div className="flex justify-between text-[11px] text-slate-300 font-mono">
                          <span className="text-slate-400">Uncertainty (U):</span>
                          <span>{rec.axis_x?.uncertainty ?? '-'}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-300 font-mono">
                          <span className="text-slate-400">Error Max (E):</span>
                          <span>{rec.axis_x?.error_max ?? '-'}</span>
                        </div>
                        <div className="pt-1 border-t border-teal-500/20 flex justify-between text-xs font-mono font-bold text-teal-300">
                          <span>Result X:</span>
                          <span>{rec.axis_x?.result ?? '-'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Axis Y */}
                    <div className="p-2.5 rounded-xl liquid-glass-panel border border-indigo-500/25 bg-indigo-950/20 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wide">
                          {lang === 'th' ? 'แกน Y (Axis Y)' : 'Axis Y'}
                        </span>
                        <span className="text-[10px] font-mono text-indigo-300/80">Secondary</span>
                      </div>
                      <div className="text-xs space-y-0.5">
                        <div className="flex justify-between text-[11px] text-slate-300 font-mono">
                          <span className="text-slate-400">Uncertainty (U):</span>
                          <span>{rec.axis_y?.uncertainty ?? '-'}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-300 font-mono">
                          <span className="text-slate-400">Error Max (E):</span>
                          <span>{rec.axis_y?.error_max ?? '-'}</span>
                        </div>
                        <div className="pt-1 border-t border-indigo-500/20 flex justify-between text-xs font-mono font-bold text-indigo-300">
                          <span>Result Y:</span>
                          <span>{rec.axis_y?.result ?? '-'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Axis Z */}
                    <div className="p-2.5 rounded-xl liquid-glass-panel border border-purple-500/25 bg-purple-950/20 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wide">
                          {lang === 'th' ? 'แกน Z (Axis Z)' : 'Axis Z'}
                        </span>
                        <span className="text-[10px] font-mono text-purple-300/80">Vertical</span>
                      </div>
                      <div className="text-xs space-y-0.5">
                        <div className="flex justify-between text-[11px] text-slate-300 font-mono">
                          <span className="text-slate-400">Uncertainty (U):</span>
                          <span>{rec.axis_z?.uncertainty ?? '-'}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-300 font-mono">
                          <span className="text-slate-400">Error Max (E):</span>
                          <span>{rec.axis_z?.error_max ?? '-'}</span>
                        </div>
                        <div className="pt-1 border-t border-purple-500/20 flex justify-between text-xs font-mono font-bold text-purple-300">
                          <span>Result Z:</span>
                          <span>{rec.axis_z?.result ?? '-'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Authorized Stamp + Next Due + Cert Link */}
                <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                  {/* Authorized (Signature) Stamp */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-[0_0_12px_rgba(20,184,166,0.2)]">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400">
                        {t('authorizedSignature')}:
                      </div>
                      <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                        <span>{authorized}</span>
                        <span className="text-[10px] font-mono text-teal-400 px-1.5 py-0.2 bg-teal-500/15 rounded border border-teal-500/30">
                          Verified
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Next Due Date & Cert Attachment */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">{t('nextCalibration')}:</span>
                      <span className="font-mono font-bold text-teal-300 text-xs">
                        {rec.next_calibration_date}
                      </span>
                    </div>

                    {rec.attachment_name && (
                      <a
                        href={rec.attachment_url || '#'}
                        download={rec.attachment_name}
                        className="px-3 py-1.5 liquid-glass-button text-xs rounded-xl text-teal-300 hover:text-white flex items-center gap-1.5 transition"
                        title={rec.attachment_name}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Download Cert</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
