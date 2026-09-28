import React, { useState, useEffect } from 'react';
import { Equipment, CalibrationRecord, AuditLog } from '../types/index.js';
import { api } from '../services/api.js';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileText,
  Clock,
  Wrench,
  Building,
  MapPin,
  User as UserIcon,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';
import { CalibrationHistorySection } from './CalibrationHistorySection.js';

interface EquipmentDetailModalProps {
  equipmentId: string;
  onClose: () => void;
  onRecordCalibration: (equipment: Equipment) => void;
  onEditEquipment: (equipment: Equipment) => void;
  canEdit: boolean;
}

export const EquipmentDetailModal: React.FC<EquipmentDetailModalProps> = ({
  equipmentId,
  onClose,
  onRecordCalibration,
  onEditEquipment,
  canEdit,
}) => {
  const { t, lang } = useLanguage();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [history, setHistory] = useState<CalibrationRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'audit'>('info');

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const data = await api.getEquipmentById(equipmentId);
        setEquipment(data.equipment);
        setHistory(data.history);
        setAuditLogs(data.auditLogs);
      } catch (err) {
        console.error('Failed to load equipment details', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [equipmentId]);

  if (loading || !equipment) {
    return (
      <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50">
        <div className="liquid-glass-panel p-8 rounded-3xl flex items-center gap-3 text-slate-300">
          <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
          <span>{t('loading')}</span>
        </div>
      </div>
    );
  }

  const remaining = equipment.remaining_days ?? 0;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="liquid-glass-panel border border-white/20 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-950/60 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 liquid-glass-switcher text-teal-300 font-mono font-bold text-sm rounded-xl">
              {equipment.equipment_id}
            </span>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">{equipment.equipment_name}</h2>
              <div className="text-xs text-slate-400">
                {equipment.manufacturer} • {equipment.model} (S/N: {equipment.serial_number || 'N/A'})
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <>
                <button
                  onClick={() => onRecordCalibration(equipment)}
                  className="px-3 py-1.5 liquid-glass-primary text-white rounded-xl text-xs font-semibold transition"
                >
                  {t('recordCalibration')}
                </button>
                <button
                  onClick={() => onEditEquipment(equipment)}
                  className="px-3 py-1.5 liquid-glass-button text-slate-200 rounded-xl text-xs transition"
                >
                  {t('edit')}
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl liquid-glass-button transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Countdown Status Banner */}
        <div className="p-4 bg-slate-950/40 border-b border-white/10">
          {equipment.status === 'OVERDUE' ? (
            <div className="p-3.5 bg-red-500/15 border border-red-500/40 rounded-2xl flex items-center justify-between shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-400 shrink-0 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                <div>
                  <div className="font-bold text-red-200 text-sm">🔴 {lang === 'th' ? 'เกินกำหนดสอบเทียบ (Overdue)' : 'Calibration Overdue'}</div>
                  <div className="text-xs text-red-300/80">
                    {lang === 'th'
                      ? `เกินกำหนดมาแล้ว ${Math.abs(remaining)} วัน (กำหนดเดิม: ${equipment.next_calibration_date}) ต้องระงับการใช้งานและกักกันเครื่องมือทันที`
                      : `Overdue by ${Math.abs(remaining)} Days. Due date was ${equipment.next_calibration_date}. Immediate QA quarantine required.`}
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 bg-red-500/30 text-white text-xs font-bold rounded-full font-mono uppercase border border-red-500/50">
                OVERDUE
              </span>
            </div>
          ) : equipment.status === 'DUE TODAY' ? (
            <div className="p-3.5 bg-rose-500/15 border border-rose-500/40 rounded-2xl flex items-center justify-between shadow-[0_0_20px_rgba(244,63,94,0.2)]">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 animate-pulse drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                <div>
                  <div className="font-bold text-rose-200 text-sm">⚠ {lang === 'th' ? 'ครบกำหนดสอบเทียบวันนี้' : 'Calibration Due Today'}</div>
                  <div className="text-xs text-rose-300/80">
                    {lang === 'th'
                      ? `ครบกำหนดวันนี้ (${equipment.next_calibration_date}) ต้องดำเนินการสอบเทียบภายในวันนี้`
                      : `Due Today (${equipment.next_calibration_date}). Unit must be recalibrated before shift end.`}
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 bg-rose-500/30 text-white text-xs font-bold rounded-full font-mono uppercase border border-rose-500/50">
                DUE TODAY
              </span>
            </div>
          ) : remaining <= 10 ? (
            <div className="p-3.5 bg-amber-500/15 border border-amber-500/40 rounded-2xl flex items-center justify-between shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-amber-400 shrink-0" />
                <div>
                  <div className="font-bold text-amber-200 text-sm">⚠ {lang === 'th' ? 'ใกล้ครบกำหนดสอบเทียบ' : 'Calibration Due Soon'}</div>
                  <div className="text-xs text-amber-300/80">
                    {lang === 'th'
                      ? `คงเหลือ: ${remaining} วัน (กำหนด: ${equipment.next_calibration_date}) เตรียมมาตรฐานการสอบเทียบหรือส่งแล็บภายนอก`
                      : `Remaining: ${remaining} Days (Due: ${equipment.next_calibration_date}). Prepare calibration standard or contact external lab.`}
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 bg-amber-500/30 text-white text-xs font-bold rounded-full font-mono uppercase border border-amber-500/50">
                {equipment.status}
              </span>
            </div>
          ) : (
            <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl flex items-center justify-between shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-emerald-200 text-sm">✅ {lang === 'th' ? 'สถานะปกติ พร้อมใช้งาน (Valid)' : 'Calibration Valid & In Tolerance'}</div>
                  <div className="text-xs text-emerald-300/80">
                    {lang === 'th'
                      ? `คงเหลือ: ${remaining} วัน (กำหนดถัดไป: ${equipment.next_calibration_date}) เครื่องมือวัดผ่านการรับรองใช้ในไลน์ผลิตได้`
                      : `Remaining: ${remaining} Days (Next Due Date: ${equipment.next_calibration_date}). Instrument certified for production use.`}
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 bg-emerald-500/30 text-white text-xs font-bold rounded-full font-mono uppercase border border-emerald-500/50">
                VALID OK
              </span>
            </div>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-white/10 px-4 bg-slate-950/30">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === 'info'
                ? 'border-teal-400 text-teal-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {lang === 'th' ? 'ข้อมูลสเปกเครื่องมือ' : 'Technical Specifications'}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-teal-400 text-teal-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{lang === 'th' ? 'ประวัติการสอบเทียบ' : 'Calibration History'}</span>
            <span className="px-1.5 py-0.5 liquid-glass-switcher text-[10px] rounded-full text-slate-300 font-mono">
              {history.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'border-teal-400 text-teal-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{lang === 'th' ? 'ประวัติการแก้ไข (Audit)' : 'Audit Trail'}</span>
            <span className="px-1.5 py-0.5 liquid-glass-switcher text-[10px] rounded-full text-slate-300 font-mono">
              {auditLogs.length}
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Box 1: Technical & Metrology Specs */}
              <div className="liquid-glass-card p-4 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>{lang === 'th' ? 'คุณลักษณะทางมาตรวิทยา' : 'Metrological Characteristics'}</span>
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px]">{lang === 'th' ? 'ช่วงการวัด (Range):' : 'Measurement Range:'}</span>
                    <div className="font-semibold text-white">{equipment.range || '-'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">{lang === 'th' ? 'ความละเอียด (Resolution):' : 'Resolution / Least Count:'}</span>
                    <div className="font-semibold text-white">{equipment.resolution || '-'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">{lang === 'th' ? 'ความแม่นยำ (Accuracy):' : 'Permissible Error / Accuracy:'}</span>
                    <div className="font-semibold text-white">{equipment.accuracy || '-'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">{lang === 'th' ? 'ความถี่รอบการสอบเทียบ:' : 'Calibration Frequency:'}</span>
                    <div className="font-semibold text-white">{equipment.calibration_frequency} Months</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">{t('colLastCal')}:</span>
                    <div className="font-mono font-semibold text-slate-200">{equipment.last_calibration_date}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">{t('colNextDue')}:</span>
                    <div className="font-mono font-bold text-teal-300">{equipment.next_calibration_date}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">{t('colCertNo')}:</span>
                    <div className="font-mono text-slate-200">{equipment.calibration_certificate_no || 'None'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">{t('colLab')}:</span>
                    <div className="text-slate-200">{equipment.calibration_lab || '-'}</div>
                  </div>
                </div>
              </div>

              {/* Box 2: Location & Asset Ownership */}
              <div className="liquid-glass-card p-4 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5" />
                  <span>{lang === 'th' ? 'สถานที่และหน่วยงานครอบครอง' : 'Asset & Location Register'}</span>
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px]">Asset Tag / Number:</span>
                    <div className="font-mono font-semibold text-white">{equipment.asset_number || '-'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">{t('colType')}:</span>
                    <div className="font-semibold text-white">{equipment.equipment_type_code}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">{t('location')}:</span>
                    <div className="text-slate-200 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {equipment.location || '-'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">{t('department')}:</span>
                    <div className="text-slate-200">{equipment.department || '-'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">{lang === 'th' ? 'ผู้รับผิดชอบ:' : 'Responsible Person:'}</span>
                    <div className="text-slate-200 flex items-center gap-1">
                      <UserIcon className="w-3 h-3 text-slate-400" />
                      {equipment.responsible_person || '-'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">{t('status')}:</span>
                    <div className="text-slate-200">
                      {equipment.is_active ? (
                        <span className="text-emerald-400 font-semibold">{lang === 'th' ? 'เปิดใช้งาน' : 'Active in Service'}</span>
                      ) : (
                        <span className="text-slate-500 font-semibold">{lang === 'th' ? 'ระงับการใช้งาน' : 'Inactive'}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <CalibrationHistorySection
              records={history}
              showEquipmentInfo={false}
            />
          )}

          {activeTab === 'audit' && (
            <div className="space-y-2">
              {auditLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs liquid-glass-panel rounded-2xl">
                  {lang === 'th' ? 'ไม่มีบันทึกประวัติการเปลี่ยนแปลง' : 'No audit trail logs recorded for this equipment.'}
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-3 liquid-glass-card rounded-xl text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-teal-400 font-bold">{log.action}</span>
                      <span className="text-slate-400 text-[11px] font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="text-slate-300">
                      User: <strong>{log.user_name}</strong> ({log.employee_id})
                    </div>
                    <pre className="p-2 bg-black/60 rounded-xl text-[10px] font-mono text-slate-400 overflow-x-auto">
                      {JSON.stringify(log.details || { old_value: log.old_value, new_value: log.new_value }, null, 2)}
                    </pre>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
