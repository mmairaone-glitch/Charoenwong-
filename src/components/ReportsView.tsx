import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { exportToCSV, exportToExcel, printReport } from '../services/export.js';
import {
  FileSpreadsheet,
  Printer,
  FileText,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';

interface ReportsViewProps {
  onOpenGoogleSheetsExport: (data: { title: string; headers: string[]; rows: (string | number)[][] }) => void;
}

export type ReportType = 'status' | 'overdue' | 'due-soon' | 'history';

export const ReportsView: React.FC<ReportsViewProps> = ({ onOpenGoogleSheetsExport }) => {
  const { t, lang } = useLanguage();
  const [reportType, setReportType] = useState<ReportType>('status');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadReport = async (type: ReportType) => {
    setLoading(true);
    try {
      const res = await api.getReport(type);
      setData(res.report);
    } catch (err) {
      console.error('Failed to load report data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport(reportType);
  }, [reportType]);

  // Headers based on report type
  const getHeadersAndRows = () => {
    if (reportType === 'history') {
      const headers = [
        'Cal ID',
        'Equipment ID',
        'Instrument Name',
        'Cal Date',
        'Cal Source',
        'Certification No.',
        'Axis X (U + E = Res)',
        'Axis Y (U + E = Res)',
        'Axis Z (U + E = Res)',
        'MPE (Standard)',
        'Judgement (Result < MPE)',
        'Authorized (Signature)',
        'Next Due Date',
        'Method',
        'Cost (THB)',
      ];
      const rows = filteredData.map((r: any) => [
        r.calibration_id,
        r.equipment_id,
        r.equipment_name || '-',
        r.calibration_date,
        r.calibration_source || r.calibration_lab || '-',
        r.certificate_number || '-',
        r.axis_x ? `${r.axis_x.uncertainty || '-'} + ${r.axis_x.error_max || '-'} = ${r.axis_x.result || '-'}` : '-',
        r.axis_y ? `${r.axis_y.uncertainty || '-'} + ${r.axis_y.error_max || '-'} = ${r.axis_y.result || '-'}` : '-',
        r.axis_z ? `${r.axis_z.uncertainty || '-'} + ${r.axis_z.error_max || '-'} = ${r.axis_z.result || '-'}` : '-',
        r.mpe_standard || '±0.0030 mm',
        r.judgement || r.result,
        r.authorized_signature || r.authorized_by || r.approved_by || '-',
        r.next_calibration_date,
        r.calibration_method || '-',
        r.cost || 0,
      ]);
      return { headers, rows, title: 'PCS-NISSIN Calibration History Audit Report' };
    }

    const headers = [
      'Equipment ID',
      'Equipment Name',
      'Type',
      'Manufacturer',
      'Model',
      'Serial Number',
      'Location',
      'Department',
      'Last Cal Date',
      'Next Due Date',
      'Remaining Days',
      'Calibration Status',
      'Certificate #',
      'Laboratory',
    ];

    const rows = filteredData.map((e: any) => [
      e.equipment_id,
      e.equipment_name,
      e.equipment_type_code,
      e.manufacturer,
      e.model,
      e.serial_number,
      e.location,
      e.department,
      e.last_calibration_date,
      e.next_calibration_date,
      e.remaining_days ?? 0,
      e.status,
      e.calibration_certificate_no,
      e.calibration_lab,
    ]);

    let title = 'Equipment Calibration Status Report';
    if (reportType === 'overdue') title = 'Calibration Overdue Incident Report';
    if (reportType === 'due-soon') title = 'Upcoming Recalibration Due Soon (5/7/10 Days) Report';

    return { headers, rows, title };
  };

  const filteredData = data.filter((item: any) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (item.equipment_id && item.equipment_id.toLowerCase().includes(q)) ||
      (item.equipment_name && item.equipment_name.toLowerCase().includes(q)) ||
      (item.calibration_id && item.calibration_id.toLowerCase().includes(q)) ||
      (item.certificate_number && item.certificate_number.toLowerCase().includes(q)) ||
      (item.manufacturer && item.manufacturer.toLowerCase().includes(q))
    );
  });

  const handleExportCSV = () => {
    const { headers, rows, title } = getHeadersAndRows();
    exportToCSV({
      filename: `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`,
      headers,
      rows,
    });
  };

  const handleExportExcel = () => {
    const { headers, rows, title } = getHeadersAndRows();
    exportToExcel({
      filename: `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`,
      sheetName: 'Report',
      headers,
      rows,
    });
  };

  const handlePrintPDF = () => {
    const { headers, rows, title } = getHeadersAndRows();
    printReport(title, headers, rows);
  };

  const handleExportGoogleSheets = () => {
    const { headers, rows, title } = getHeadersAndRows();
    onOpenGoogleSheetsExport({
      title,
      headers,
      rows,
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>{t('navReports')}</span>
            <Sparkles className="w-4 h-4 text-teal-400 hidden sm:inline" />
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {lang === 'th'
              ? 'จัดทำรายงานผลการสอบเทียบ รายการวิกฤต และส่งออกข้อมูลไปยัง Google Sheets, Excel, CSV หรือพิมพ์เอกสาร'
              : 'Generate and export official metrology control records to Google Sheets, Excel, CSV, or PDF'}
          </p>
        </div>

        {/* Export Buttons Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportGoogleSheets}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 text-xs font-semibold rounded-xl transition shadow-[0_0_15px_rgba(16,185,129,0.2)]"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Google Sheets</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 liquid-glass-button text-slate-200 text-xs font-semibold rounded-xl transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-400" />
            <span>Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 liquid-glass-button text-slate-200 text-xs font-semibold rounded-xl transition"
          >
            <FileText className="w-4 h-4 text-slate-400" />
            <span>CSV</span>
          </button>

          <button
            onClick={handlePrintPDF}
            className="flex items-center gap-1.5 px-3 py-2 liquid-glass-button text-slate-200 text-xs font-semibold rounded-xl transition"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>PDF</span>
          </button>

          <button
            onClick={() => loadReport(reportType)}
            title={t('refresh')}
            className="p-2 liquid-glass-button rounded-xl text-slate-300 hover:text-white transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          onClick={() => setReportType('status')}
          className={`p-3.5 rounded-2xl border text-left transition ${
            reportType === 'status'
              ? 'liquid-glass-card border-teal-400/50 bg-teal-500/[0.1] shadow-[0_0_20px_rgba(20,184,166,0.2)]'
              : 'liquid-glass-panel text-slate-400 hover:border-white/20'
          }`}
        >
          <div className="font-bold text-white text-xs">
            {lang === 'th' ? 'รายงานสถานะเครื่องมือวัดทั้งหมด' : 'Calibration Status Report'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {lang === 'th' ? 'ทะเบียนเครื่องมือที่ใช้งานอยู่และกำหนดการ' : 'Complete register of active equipment and due dates'}
          </div>
        </button>

        <button
          onClick={() => setReportType('overdue')}
          className={`p-3.5 rounded-2xl border text-left transition ${
            reportType === 'overdue'
              ? 'liquid-glass-card border-red-400/50 bg-red-500/[0.1] shadow-[0_0_20px_rgba(239,68,68,0.2)]'
              : 'liquid-glass-panel text-slate-400 hover:border-white/20'
          }`}
        >
          <div className="font-bold text-red-300 text-xs">
            🔴 {lang === 'th' ? 'รายงานเครื่องมือเกินกำหนด (Overdue)' : 'Overdue Equipment Report'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {lang === 'th' ? 'เครื่องมือที่หมดอายุการสอบเทียบ ต้องกักกัน' : 'Instruments with expired calibration requiring QA hold'}
          </div>
        </button>

        <button
          onClick={() => setReportType('due-soon')}
          className={`p-3.5 rounded-2xl border text-left transition ${
            reportType === 'due-soon'
              ? 'liquid-glass-card border-amber-400/50 bg-amber-500/[0.1] shadow-[0_0_20px_rgba(245,158,11,0.2)]'
              : 'liquid-glass-panel text-slate-400 hover:border-white/20'
          }`}
        >
          <div className="font-bold text-amber-300 text-xs">
            ⚠ {lang === 'th' ? 'รายงานใกล้ครบกำหนด (5/7/10 วัน)' : 'Due Soon Report (5/7/10 Days)'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {lang === 'th' ? 'รายการที่ต้องส่งสอบเทียบในอีก 10 วันข้างหน้า' : 'Schedules due within the next 10 days for proactive planning'}
          </div>
        </button>

        <button
          onClick={() => setReportType('history')}
          className={`p-3.5 rounded-2xl border text-left transition ${
            reportType === 'history'
              ? 'liquid-glass-card border-indigo-400/50 bg-indigo-500/[0.1] shadow-[0_0_20px_rgba(99,102,241,0.2)]'
              : 'liquid-glass-panel text-slate-400 hover:border-white/20'
          }`}
        >
          <div className="font-bold text-indigo-300 text-xs">
            {lang === 'th' ? 'ประวัติการสอบเทียบย้อนหลัง (Audit)' : 'Calibration History Audit'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {lang === 'th' ? 'ใบรับรองผล ผลการสอบเทียบ ค่าใช้จ่าย และแล็บ' : 'Past calibration certificates, results, costs, and labs'}
          </div>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4 p-3 liquid-glass-panel rounded-2xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === 'th' ? 'กรองข้อมูลในรายงาน...' : 'Filter report rows...'}
            className="w-full pl-9 pr-3 py-1.5 liquid-glass-input rounded-xl text-white text-xs placeholder-slate-400"
          />
        </div>
        <div className="text-xs text-slate-400 font-mono">
          {lang === 'th'
            ? <>แสดง <strong>{filteredData.length}</strong> จากทั้งหมด <strong>{data.length}</strong> แถว</>
            : <>Showing <strong>{filteredData.length}</strong> of <strong>{data.length}</strong> records</>}
        </div>
      </div>

      {/* Preview Table */}
      <div className="liquid-glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider text-[10px] border-b border-white/10 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                {reportType === 'history' ? (
                  <>
                    <th className="py-3 px-3.5">Cal ID</th>
                    <th className="py-3 px-3.5">{t('colEquipmentId')}</th>
                    <th className="py-3 px-3.5">{t('colNameSpecs')}</th>
                    <th className="py-3 px-3.5">{t('calDate')}</th>
                    <th className="py-3 px-3.5">{t('calSource')}</th>
                    <th className="py-3 px-3.5">{t('certNo')}</th>
                    <th className="py-3 px-3.5 text-teal-400">{t('axisX')}</th>
                    <th className="py-3 px-3.5 text-indigo-300">{t('axisY')}</th>
                    <th className="py-3 px-3.5 text-purple-300">{t('axisZ')}</th>
                    <th className="py-3 px-3.5 text-center">{t('mpeStandard')}</th>
                    <th className="py-3 px-3.5 text-center">{t('judgement')}</th>
                    <th className="py-3 px-3.5">{t('authorizedSignature')}</th>
                    <th className="py-3 px-3.5">{t('nextCalibration')}</th>
                  </>
                ) : (
                  <>
                    <th className="py-3 px-3.5">{t('colEquipmentId')}</th>
                    <th className="py-3 px-3.5">{t('colNameSpecs')}</th>
                    <th className="py-3 px-3.5">{t('colType')}</th>
                    <th className="py-3 px-3.5">{t('colLocationDept')}</th>
                    <th className="py-3 px-3.5">{t('colLastCal')}</th>
                    <th className="py-3 px-3.5">{t('colNextDue')}</th>
                    <th className="py-3 px-3.5">{t('colDaysLeft')}</th>
                    <th className="py-3 px-3.5">{t('colStatus')}</th>
                    <th className="py-3 px-3.5">{t('colCertNo')}</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 text-xs">
                    <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    {t('loading')}
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 text-xs">
                    {lang === 'th' ? 'ไม่พบข้อมูลที่ตรงกับเงื่อนไข' : 'No records found matching criteria.'}
                  </td>
                </tr>
              ) : reportType === 'history' ? (
                filteredData.map((rec: any) => {
                  const isPass = rec.judgement === 'PASS' || rec.result === 'PASS';
                  const isAdjusted = rec.result === 'ADJUSTED';
                  const formatAxis = (ax?: any) => {
                    if (!ax || (!ax.uncertainty && !ax.error_max && !ax.result)) return '-';
                    return `${ax.uncertainty || '-'} + ${ax.error_max || '-'} = ${ax.result || '-'}`;
                  };

                  return (
                    <tr key={rec.id} className="hover:bg-white/[0.03] transition font-mono text-[11px]">
                      <td className="py-3 px-3.5 font-bold text-teal-400">{rec.calibration_id}</td>
                      <td className="py-3 px-3.5 text-white font-bold">{rec.equipment_id}</td>
                      <td className="py-3 px-3.5 font-sans">{rec.equipment_name || '-'}</td>
                      <td className="py-3 px-3.5 text-slate-300">{rec.calibration_date}</td>
                      <td className="py-3 px-3.5 font-sans text-slate-300">{rec.calibration_source || rec.calibration_lab || '-'}</td>
                      <td className="py-3 px-3.5 text-slate-200">{rec.certificate_number || '-'}</td>
                      <td className="py-3 px-3.5 text-teal-300 font-semibold">{formatAxis(rec.axis_x)}</td>
                      <td className="py-3 px-3.5 text-indigo-300 font-semibold">{formatAxis(rec.axis_y)}</td>
                      <td className="py-3 px-3.5 text-purple-300 font-semibold">{formatAxis(rec.axis_z)}</td>
                      <td className="py-3 px-3.5 text-center text-slate-300">{rec.mpe_standard || '±0.0030 mm'}</td>
                      <td className="py-3 px-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                            isPass
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : isAdjusted
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          }`}
                        >
                          {rec.judgement || rec.result}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-slate-200 font-sans">{rec.authorized_signature || rec.authorized_by || rec.approved_by || '-'}</td>
                      <td className="py-3 px-3.5 text-teal-300 font-bold">{rec.next_calibration_date}</td>
                    </tr>
                  );
                })
              ) : (
                filteredData.map((eq: any) => {
                  const rem = eq.remaining_days ?? 0;
                  return (
                    <tr key={eq.id} className="hover:bg-white/[0.03] transition">
                      <td className="py-3 px-3.5 font-mono font-bold text-teal-400">{eq.equipment_id}</td>
                      <td className="py-3 px-3.5 font-medium text-white">{eq.equipment_name}</td>
                      <td className="py-3 px-3.5 font-mono">{eq.equipment_type_code}</td>
                      <td className="py-3 px-3.5 text-slate-300">{eq.location}</td>
                      <td className="py-3 px-3.5 font-mono text-slate-400">{eq.last_calibration_date}</td>
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-100">{eq.next_calibration_date}</td>
                      <td className="py-3 px-3.5 font-mono font-bold">
                        {rem < 0 ? (
                          <span className="text-red-400">{rem}d</span>
                        ) : rem === 0 ? (
                          <span className="text-rose-400">0d</span>
                        ) : rem <= 5 ? (
                          <span className="text-orange-400">{rem}d</span>
                        ) : rem <= 10 ? (
                          <span className="text-amber-400">{rem}d</span>
                        ) : (
                          <span className="text-emerald-400">{rem}d</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider inline-block border ${
                            eq.status === 'CALIBRATION OK'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                              : eq.status === 'OVERDUE'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.2)]'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_8px_rgba(251,191,36,0.2)]'
                          }`}
                        >
                          {eq.status}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 font-mono text-slate-400">{eq.calibration_certificate_no || '-'}</td>
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
