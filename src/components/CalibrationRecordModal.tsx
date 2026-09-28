import React, { useState, useEffect } from 'react';
import { Equipment, CalibrationResult } from '../types/index.js';
import { api } from '../services/api.js';
import {
  X,
  Save,
  AlertTriangle,
  Upload,
  FileText,
  CheckCircle2,
  Sparkles,
  Award,
  ShieldCheck,
  Building2,
  Activity,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';

interface CalibrationRecordModalProps {
  equipment: Equipment | null;
  allEquipment: Equipment[];
  onClose: () => void;
  onSaved: () => void;
}

export const CalibrationRecordModal: React.FC<CalibrationRecordModalProps> = ({
  equipment,
  allEquipment,
  onClose,
  onSaved,
}) => {
  const { t, lang } = useLanguage();
  const [selectedEqId, setSelectedEqId] = useState(equipment?.equipment_id || allEquipment[0]?.equipment_id || '');
  const [currentEq, setCurrentEq] = useState<Equipment | null>(equipment || allEquipment[0] || null);

  const todayStr = new Date().toISOString().slice(0, 10);
  const [calDate, setCalDate] = useState(todayStr);
  const [nextDueDate, setNextDueDate] = useState('');
  const [result, setResult] = useState<CalibrationResult>('PASS');
  const [certNo, setCertNo] = useState('');
  const [lab, setLab] = useState(equipment?.calibration_lab || 'In-House Metrology Lab');
  const [calSource, setCalSource] = useState(equipment?.calibration_lab || 'In-House Metrology Lab');
  const [method, setMethod] = useState('Standard Direct Comparison ISO/IEC 17025');
  const [standard, setStandard] = useState('Gauge Block Set JIS B 7506 Class 0');
  const [asFound, setAsFound] = useState('Within permissible tolerance limit');
  const [asLeft, setAsLeft] = useState('Verified within manufacturer specification');
  const [cost, setCost] = useState<string>('500');
  const [technician, setTechnician] = useState('');
  const [approvedBy, setApprovedBy] = useState('System Admin');
  const [remarks, setRemarks] = useState('');

  // Actual Metrology Inspection Fields (Uncertainty + Error Max = result for Axis X, Y, Z)
  const [axisXUncertainty, setAxisXUncertainty] = useState('0.0008');
  const [axisXErrorMax, setAxisXErrorMax] = useState('0.0012');
  const [axisYUncertainty, setAxisYUncertainty] = useState('0.0007');
  const [axisYErrorMax, setAxisYErrorMax] = useState('0.0011');
  const [axisZUncertainty, setAxisZUncertainty] = useState('0.0009');
  const [axisZErrorMax, setAxisZErrorMax] = useState('0.0013');
  const [mpeStandard, setMpeStandard] = useState(equipment?.accuracy || '±0.0030 mm');
  const [authorizedBy, setAuthorizedBy] = useState('System Admin');
  const [authorizedSignature, setAuthorizedSignature] = useState('Dr. Somchai P. (QA Director)');
  const [authorizedTitle, setAuthorizedTitle] = useState('Head of Quality Assurance & Metrology');

  // Certificate attachment file
  const [fileName, setFileName] = useState('');
  const [fileData, setFileData] = useState('');
  const [fileType, setFileType] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper calculation for an axis: Uncertainty + Error Max = Result
  const calcResultStr = (uStr: string, eStr: string) => {
    const u = parseFloat(uStr);
    const e = parseFloat(eStr);
    if (!isNaN(u) && !isNaN(e)) {
      return (u + e).toFixed(4) + ' mm';
    }
    return '';
  };

  const resX = calcResultStr(axisXUncertainty, axisXErrorMax);
  const resY = calcResultStr(axisYUncertainty, axisYErrorMax);
  const resZ = calcResultStr(axisZUncertainty, axisZErrorMax);

  // Max result across axes
  const numX = (parseFloat(axisXUncertainty) || 0) + (parseFloat(axisXErrorMax) || 0);
  const numY = (parseFloat(axisYUncertainty) || 0) + (parseFloat(axisYErrorMax) || 0);
  const numZ = (parseFloat(axisZUncertainty) || 0) + (parseFloat(axisZErrorMax) || 0);
  const maxResultNum = Math.max(numX, numY, numZ);
  const overallResultStr = maxResultNum > 0 ? maxResultNum.toFixed(4) + ' mm' : '';

  // Extract MPE number to determine pass/fail
  const mpeMatch = mpeStandard.match(/[\d.]+/);
  const mpeNum = mpeMatch ? parseFloat(mpeMatch[0]) : null;
  const isPassByMpe = mpeNum !== null && maxResultNum > 0 ? maxResultNum <= mpeNum : true;

  // Update current equipment when selected ID changes
  useEffect(() => {
    const found = allEquipment.find((e) => e.equipment_id === selectedEqId);
    if (found) {
      setCurrentEq(found);
      if (found.calibration_lab) {
        setLab(found.calibration_lab);
        setCalSource(found.calibration_lab);
      }
      if (found.accuracy) {
        setMpeStandard(found.accuracy);
      }
      // Auto compute next due date
      const d = new Date(calDate + 'T00:00:00Z');
      d.setUTCMonth(d.getUTCMonth() + (found.calibration_frequency || 12));
      setNextDueDate(d.toISOString().slice(0, 10));
    }
  }, [selectedEqId, allEquipment, calDate]);

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError(lang === 'th' ? 'ไฟล์ใบรับรองต้องมีขนาดไม่เกิน 5MB' : 'Certificate file exceeds 5MB size limit.');
      return;
    }

    setFileName(file.name);
    setFileType(file.type);

    const reader = new FileReader();
    reader.onload = () => {
      setFileData(reader.result as string);
      setUploadSuccess(true);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedEqId || !calDate || !nextDueDate) {
      setError(lang === 'th' ? 'กรุณาเลือกเครื่องมือวัด, วันที่สอบเทียบ และกำหนดครั้งถัดไป' : 'Please select Equipment, Calibration Date, and Next Due Date.');
      return;
    }

    setLoading(true);
    try {
      let attachmentUrl = '';
      let attachmentName = '';

      if (fileData) {
        const uploadRes = await api.uploadCertificate(fileName, fileData, fileType);
        attachmentUrl = uploadRes.attachment_url;
        attachmentName = uploadRes.attachment_name;
      }

      const axisXData = axisXUncertainty || axisXErrorMax ? {
        uncertainty: axisXUncertainty ? `${axisXUncertainty} mm` : '',
        error_max: axisXErrorMax ? `${axisXErrorMax} mm` : '',
        result: resX || `${(parseFloat(axisXUncertainty || '0') + parseFloat(axisXErrorMax || '0')).toFixed(4)} mm`,
      } : undefined;

      const axisYData = axisYUncertainty || axisYErrorMax ? {
        uncertainty: axisYUncertainty ? `${axisYUncertainty} mm` : '',
        error_max: axisYErrorMax ? `${axisYErrorMax} mm` : '',
        result: resY || `${(parseFloat(axisYUncertainty || '0') + parseFloat(axisYErrorMax || '0')).toFixed(4)} mm`,
      } : undefined;

      const axisZData = axisZUncertainty || axisZErrorMax ? {
        uncertainty: axisZUncertainty ? `${axisZUncertainty} mm` : '',
        error_max: axisZErrorMax ? `${axisZErrorMax} mm` : '',
        result: resZ || `${(parseFloat(axisZUncertainty || '0') + parseFloat(axisZErrorMax || '0')).toFixed(4)} mm`,
      } : undefined;

      await api.createCalibration({
        equipment_id: selectedEqId,
        calibration_date: calDate,
        previous_calibration_date: currentEq?.last_calibration_date,
        next_calibration_date: nextDueDate,
        result,
        certificate_number: certNo.trim() || `CERT-${calDate.replace(/-/g, '')}-${selectedEqId}`,
        calibration_lab: lab.trim(),
        calibration_source: calSource.trim() || lab.trim(),
        calibration_method: method.trim(),
        calibration_standard: standard.trim(),
        as_found_result: asFound.trim(),
        as_left_result: asLeft.trim(),
        cost: cost ? Number(cost) : undefined,
        technician: technician.trim() || 'QA Calibration Technician',
        approved_by: approvedBy.trim(),
        remarks: remarks.trim(),
        attachment_url: attachmentUrl,
        attachment_name: attachmentName,
        axis_x: axisXData,
        axis_y: axisYData,
        axis_z: axisZData,
        overall_result: overallResultStr || undefined,
        mpe_standard: mpeStandard.trim() || undefined,
        judgement: result === 'FAIL' ? 'FAIL' : (isPassByMpe ? 'PASS' : 'FAIL'),
        authorized_by: authorizedBy.trim(),
        authorized_signature: authorizedSignature.trim() || authorizedBy.trim(),
        authorized_title: authorizedTitle.trim(),
      });

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit calibration record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="liquid-glass-panel border border-white/20 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-950/60 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>{lang === 'th' ? 'บันทึกประวัติการสอบเทียบเครื่องมือวัด' : 'Record Instrument Calibration'}</span>
              <Sparkles className="w-4 h-4 text-teal-400" />
            </h2>
            <p className="text-xs text-slate-400">
              {lang === 'th'
                ? 'อัปเดตใบรับรองผล ตรวจสอบค่าความเผื่อ และรีเซ็ตสถานะเครื่องมือวัดกลับสู่ปกติ (Valid OK)'
                : 'Update calibration certificate, verify tolerances, and reset instrument status to Valid OK'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl liquid-glass-button transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Equipment Selector */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {lang === 'th' ? 'เลือกเครื่องมือวัด *' : 'Select Equipment *'}
              </label>
              <select
                value={selectedEqId}
                onChange={(e) => setSelectedEqId(e.target.value)}
                className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white font-mono text-xs"
              >
                {allEquipment.map((eq) => (
                  <option key={eq.id} value={eq.equipment_id}>
                    {eq.equipment_id} — {eq.equipment_name} ({eq.location})
                  </option>
                ))}
              </select>
            </div>

            {/* Calibration Result */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t('colResult')} *
              </label>
              <select
                value={result}
                onChange={(e) => setResult(e.target.value as CalibrationResult)}
                className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white text-xs font-bold"
              >
                <option value="PASS">PASS (Within Tolerance)</option>
                <option value="ADJUSTED">ADJUSTED (Calibrated & Adjusted)</option>
                <option value="LIMITED USE">LIMITED USE (Restricted Range)</option>
                <option value="FAIL">FAIL (Out of Specification)</option>
                <option value="OUT OF SERVICE">OUT OF SERVICE (Scrap / Repair)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t('colLastCal')} *
              </label>
              <input
                type="date"
                value={calDate}
                onChange={(e) => setCalDate(e.target.value)}
                className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white font-mono text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t('colNextDue')} *
              </label>
              <input
                type="date"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="w-full px-3 py-2 liquid-glass-input rounded-xl text-teal-300 font-mono font-bold text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t('colCertNo')}
              </label>
              <input
                type="text"
                value={certNo}
                onChange={(e) => setCertNo(e.target.value)}
                placeholder="e.g. CERT-2026-0881"
                className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white font-mono text-xs"
              />
            </div>

            {/* ACTUAL METROLOGY INSPECTION DATA (Uncertainty + Error Max = result for Axis X, Y, Z) */}
            <div className="sm:col-span-3 liquid-glass-panel p-4 rounded-2xl border border-teal-500/25 bg-slate-900/60 space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{lang === 'th' ? 'ข้อมูลผลการวัดจริง (Actual Metrology Inspection)' : 'Actual Metrology Inspection'}</span>
                      <span className="text-[10px] text-teal-400 font-mono px-2 py-0.5 rounded-md bg-teal-500/10 border border-teal-500/20">
                        Uncertainty + Error Max = result
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {lang === 'th'
                        ? 'บันทึกค่าความไม่แน่นอน (Uncertainty) และค่าความคลาดเคลื่อนสูงสุด (Error Max) แยกตามแกน X, Y, Z เพื่อประเมินผลเทียบกับ MPE'
                        : 'Enter Uncertainty and Error Max for Axis X, Y, Z to evaluate against standard MPE limit'}
                    </p>
                  </div>
                </div>

                {/* Live Judgement Pill */}
                <div className="flex items-center gap-2">
                  {isPassByMpe ? (
                    <span className="px-3 py-1 rounded-xl text-xs font-bold border bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Judgement: PASS (Result &lt; MPE)</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-xl text-xs font-bold border bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.3)] flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      <span>Judgement: FAIL (Result ≥ MPE)</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Cal. Source & MPE (Standard) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-teal-400" />
                    <span>{t('calSource')} *</span>
                  </label>
                  <input
                    type="text"
                    value={calSource}
                    onChange={(e) => {
                      setCalSource(e.target.value);
                      setLab(e.target.value);
                    }}
                    placeholder="e.g. In-House Metrology Lab / External Lab (ZEISS) / NIMT / Mitutoyo"
                    className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t('mpeStandard')} (MPE limit) *
                  </label>
                  <input
                    type="text"
                    value={mpeStandard}
                    onChange={(e) => setMpeStandard(e.target.value)}
                    placeholder="e.g. ±0.0030 mm or 2.5 µm"
                    className="w-full px-3 py-2 liquid-glass-input rounded-xl text-teal-300 font-mono font-bold text-xs"
                    required
                  />
                </div>
              </div>

              {/* 3 Axes Grid: Uncertainty + Error Max = result */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-300 block">
                  {lang === 'th' ? 'แยกตามแกนวัด: แกน X , แกน Y , แกน Z' : 'By Axis: Axis X , Axis Y , Axis Z'}
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Axis X */}
                  <div className="p-3 rounded-xl liquid-glass-card border border-teal-500/30 bg-teal-950/20 space-y-2">
                    <div className="flex items-center justify-between border-b border-teal-500/20 pb-1.5">
                      <span className="font-bold text-teal-400 text-xs">
                        {lang === 'th' ? 'แกน X (Axis X)' : 'Axis X'}
                      </span>
                      <span className="text-[10px] font-mono text-teal-300/80">Primary</span>
                    </div>
                    <div className="space-y-1.5">
                      <div>
                        <label className="block text-[10px] text-slate-400">Uncertainty (U):</label>
                        <input
                          type="text"
                          value={axisXUncertainty}
                          onChange={(e) => setAxisXUncertainty(e.target.value)}
                          placeholder="0.0008"
                          className="w-full px-2 py-1 liquid-glass-input rounded-lg text-white font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400">Error Max (E):</label>
                        <input
                          type="text"
                          value={axisXErrorMax}
                          onChange={(e) => setAxisXErrorMax(e.target.value)}
                          placeholder="0.0012"
                          className="w-full px-2 py-1 liquid-glass-input rounded-lg text-white font-mono text-xs"
                        />
                      </div>
                      <div className="pt-1.5 border-t border-teal-500/20 flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400">Result X:</span>
                        <span className="font-bold text-teal-300">{resX || '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Axis Y */}
                  <div className="p-3 rounded-xl liquid-glass-card border border-indigo-500/30 bg-indigo-950/20 space-y-2">
                    <div className="flex items-center justify-between border-b border-indigo-500/20 pb-1.5">
                      <span className="font-bold text-indigo-300 text-xs">
                        {lang === 'th' ? 'แกน Y (Axis Y)' : 'Axis Y'}
                      </span>
                      <span className="text-[10px] font-mono text-indigo-300/80">Secondary</span>
                    </div>
                    <div className="space-y-1.5">
                      <div>
                        <label className="block text-[10px] text-slate-400">Uncertainty (U):</label>
                        <input
                          type="text"
                          value={axisYUncertainty}
                          onChange={(e) => setAxisYUncertainty(e.target.value)}
                          placeholder="0.0007"
                          className="w-full px-2 py-1 liquid-glass-input rounded-lg text-white font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400">Error Max (E):</label>
                        <input
                          type="text"
                          value={axisYErrorMax}
                          onChange={(e) => setAxisYErrorMax(e.target.value)}
                          placeholder="0.0011"
                          className="w-full px-2 py-1 liquid-glass-input rounded-lg text-white font-mono text-xs"
                        />
                      </div>
                      <div className="pt-1.5 border-t border-indigo-500/20 flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400">Result Y:</span>
                        <span className="font-bold text-indigo-300">{resY || '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Axis Z */}
                  <div className="p-3 rounded-xl liquid-glass-card border border-purple-500/30 bg-purple-950/20 space-y-2">
                    <div className="flex items-center justify-between border-b border-purple-500/20 pb-1.5">
                      <span className="font-bold text-purple-300 text-xs">
                        {lang === 'th' ? 'แกน Z (Axis Z)' : 'Axis Z'}
                      </span>
                      <span className="text-[10px] font-mono text-purple-300/80">Vertical</span>
                    </div>
                    <div className="space-y-1.5">
                      <div>
                        <label className="block text-[10px] text-slate-400">Uncertainty (U):</label>
                        <input
                          type="text"
                          value={axisZUncertainty}
                          onChange={(e) => setAxisZUncertainty(e.target.value)}
                          placeholder="0.0009"
                          className="w-full px-2 py-1 liquid-glass-input rounded-lg text-white font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400">Error Max (E):</label>
                        <input
                          type="text"
                          value={axisZErrorMax}
                          onChange={(e) => setAxisZErrorMax(e.target.value)}
                          placeholder="0.0013"
                          className="w-full px-2 py-1 liquid-glass-input rounded-lg text-white font-mono text-xs"
                        />
                      </div>
                      <div className="pt-1.5 border-t border-purple-500/20 flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400">Result Z:</span>
                        <span className="font-bold text-purple-300">{resZ || '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Overall Result Summary Row */}
              <div className="p-2.5 rounded-xl bg-slate-950/50 border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <span className="text-slate-400">
                  {lang === 'th' ? 'ค่าผลลัพธ์รวมสูงสุด (Max Axis Result):' : 'Overall Max Axis Result:'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-teal-300 text-sm">{overallResultStr || '-'}</span>
                  <span className="text-slate-500">vs</span>
                  <span className="text-slate-300">MPE {mpeStandard}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isPassByMpe ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {isPassByMpe ? 'PASS' : 'FAIL'}
                  </span>
                </div>
              </div>

              {/* Authorized (Signature) Inputs */}
              <div className="pt-2 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                    <span>{t('authorizedSignature')} *</span>
                  </label>
                  <input
                    type="text"
                    value={authorizedSignature}
                    onChange={(e) => setAuthorizedSignature(e.target.value)}
                    placeholder="e.g. Dr. Somchai P. (QA Director)"
                    className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white text-xs font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-teal-400" />
                    <span>{lang === 'th' ? 'ตำแหน่งผู้อนุมัติ (Signatory Title)' : 'Signatory Title'}</span>
                  </label>
                  <input
                    type="text"
                    value={authorizedTitle}
                    onChange={(e) => setAuthorizedTitle(e.target.value)}
                    placeholder="e.g. Head of Quality Assurance & Metrology"
                    className="w-full px-3 py-2 liquid-glass-input rounded-xl text-slate-300 text-xs"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {lang === 'th' ? 'ค่าใช้จ่ายการสอบเทียบ (บาท)' : 'Calibration Cost (THB)'}
              </label>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {lang === 'th' ? 'วิธีการสอบเทียบ (Method)' : 'Calibration Method'}
              </label>
              <input
                type="text"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                placeholder="e.g. ISO/IEC 17025 Direct Comparison"
                className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {lang === 'th' ? 'มาตรฐานอ้างอิง (Standard)' : 'Reference Standard'}
              </label>
              <input
                type="text"
                value={standard}
                onChange={(e) => setStandard(e.target.value)}
                placeholder="e.g. Block Gauge Set JIS Grade 0"
                className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t('colTechnician')}
              </label>
              <input
                type="text"
                value={technician}
                onChange={(e) => setTechnician(e.target.value)}
                placeholder="e.g. Narong S. (Metrology Specialist)"
                className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white text-xs"
              />
            </div>

            <div className="sm:col-span-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {lang === 'th' ? 'สภาพก่อนปรับแต่ง (As Found Result)' : 'As Found Result'}
                  </label>
                  <input
                    type="text"
                    value={asFound}
                    onChange={(e) => setAsFound(e.target.value)}
                    placeholder="e.g. Within permissible tolerance"
                    className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {lang === 'th' ? 'สภาพหลังปรับแต่ง (As Left Result)' : 'As Left Result'}
                  </label>
                  <input
                    type="text"
                    value={asLeft}
                    onChange={(e) => setAsLeft(e.target.value)}
                    placeholder="e.g. Verified and approved"
                    className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Certificate Upload */}
            <div className="sm:col-span-3 liquid-glass-card p-4 rounded-2xl">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-teal-400" />
                <span>{lang === 'th' ? 'แนบไฟล์ใบรับรองการสอบเทียบ (PDF/Images - Max 5MB)' : 'Attach Official Calibration Certificate (PDF / Image - Max 5MB)'}</span>
              </label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-500/20 file:text-teal-300 hover:file:bg-teal-500/30 file:cursor-pointer"
              />
              {uploadSuccess && (
                <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1.5 font-mono">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{fileName} loaded ({Math.round(fileData.length / 1024)} KB)</span>
                </div>
              )}
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {lang === 'th' ? 'หมายเหตุเพิ่มเติม (Remarks)' : 'Remarks'}
              </label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={lang === 'th' ? 'หมายเหตุทางเทคนิค ผลการวัด หรือคำแนะนำการใช้งาน...' : 'Technical observations, temperature/humidity conditions, calibration notes...'}
                className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white text-xs"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex justify-end gap-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 liquid-glass-button text-slate-300 rounded-xl"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-5 py-2 liquid-glass-primary text-white rounded-xl font-bold shadow-lg shadow-teal-950 transition"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? t('saving') : (lang === 'th' ? 'บันทึกผลการสอบเทียบ' : 'Save Calibration Record')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
