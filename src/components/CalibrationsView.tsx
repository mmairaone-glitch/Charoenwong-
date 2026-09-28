import React, { useState, useEffect } from 'react';
import { CalibrationRecord } from '../types/index.js';
import { api } from '../services/api.js';
import {
  ClipboardCheck,
  PlusCircle,
  Search,
  RefreshCw,
  FileText,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';
import { ConfirmModal } from './ConfirmModal.js';
import { CalibrationHistorySection } from './CalibrationHistorySection.js';

interface CalibrationsViewProps {
  onOpenRecordModal: () => void;
  canEdit: boolean;
  canDelete: boolean;
}

export const CalibrationsView: React.FC<CalibrationsViewProps> = ({
  onOpenRecordModal,
  canEdit,
  canDelete,
}) => {
  const { t, lang } = useLanguage();
  const [records, setRecords] = useState<CalibrationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [resultFilter, setResultFilter] = useState('all');

  const [recordToDelete, setRecordToDelete] = useState<CalibrationRecord | null>(null);
  const [isDeletingRecord, setIsDeletingRecord] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await api.getCalibrations({
        result: resultFilter,
      });
      setRecords(data.records);
    } catch (err) {
      console.error('Failed to load calibrations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [resultFilter]);

  const handleDelete = (rec: CalibrationRecord) => {
    setActionError(null);
    setRecordToDelete(rec);
  };

  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;
    setIsDeletingRecord(true);
    setActionError(null);
    try {
      await api.deleteCalibration(recordToDelete.id);
      setRecordToDelete(null);
      loadRecords();
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete record.');
    } finally {
      setIsDeletingRecord(false);
    }
  };

  const filtered = records.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.calibration_id.toLowerCase().includes(q) ||
      r.equipment_id.toLowerCase().includes(q) ||
      (r.equipment_name && r.equipment_name.toLowerCase().includes(q)) ||
      (r.certificate_number && r.certificate_number.toLowerCase().includes(q)) ||
      (r.calibration_lab && r.calibration_lab.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>{t('navCalibrations')}</span>
            <Sparkles className="w-4 h-4 text-teal-400 hidden sm:inline" />
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {lang === 'th'
              ? 'บันทึกประวัติการสอบเทียบ ใบรับรองผล (Certificates) ค่าพิกัดความคลาดเคลื่อน และมาตรฐานการสอบเทียบ'
              : 'Detailed log of physical calibration certificates, laboratories, standards, and tolerance assessments'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadRecords}
            title={t('refresh')}
            className="p-2 liquid-glass-button rounded-xl text-slate-300 hover:text-white transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-400' : ''}`} />
          </button>

          {canEdit && (
            <button
              onClick={onOpenRecordModal}
              className="flex items-center gap-1.5 px-3.5 py-2 liquid-glass-primary text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-teal-950"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t('recordCalibration')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 liquid-glass-panel rounded-2xl">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === 'th' ? 'ค้นหาเลขที่ใบเซอร์, รหัสเครื่องมือ, ห้องแล็บ, ผู้ตรวจสอบ...' : 'Search Certificate #, Equipment ID, Lab, Technician...'}
            className="w-full pl-9 pr-3 py-1.5 liquid-glass-input rounded-xl text-white text-xs placeholder-slate-400"
          />
        </div>

        <div>
          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 liquid-glass-input rounded-xl text-slate-200 text-xs font-semibold"
          >
            <option value="all">{lang === 'th' ? 'ทุกผลการสอบเทียบ (All Results)' : 'All Results'}</option>
            <option value="PASS">PASS</option>
            <option value="ADJUSTED">ADJUSTED</option>
            <option value="LIMITED USE">LIMITED USE</option>
            <option value="FAIL">FAIL</option>
            <option value="OUT OF SERVICE">OUT OF SERVICE</option>
          </select>
        </div>
      </div>

      {/* Calibration Records Section (Table & Cards with Actual Metrology Data) */}
      {loading ? (
        <div className="liquid-glass-panel p-12 text-center text-slate-400 text-xs rounded-2xl">
          <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          {t('loading')}
        </div>
      ) : (
        <CalibrationHistorySection
          records={filtered}
          canDelete={canDelete}
          onDeleteRecord={handleDelete}
          showEquipmentInfo={true}
        />
      )}

      {/* Confirm Delete Calibration Modal */}
      {recordToDelete && (
        <ConfirmModal
          isOpen={Boolean(recordToDelete)}
          variant="danger"
          isSubmitting={isDeletingRecord}
          title={
            lang === 'th'
              ? `ลบบันทึกการสอบเทียบ: ${recordToDelete.calibration_id}`
              : `Delete Calibration Record: ${recordToDelete.calibration_id}`
          }
          message={
            lang === 'th'
              ? `คุณแน่ใจหรือไม่ว่าต้องการลบบันทึกการสอบเทียบ ${recordToDelete.calibration_id} ของเครื่องมือ ${recordToDelete.equipment_id}?`
              : `Are you sure you want to permanently delete calibration record ${recordToDelete.calibration_id} for ${recordToDelete.equipment_id}?`
          }
          confirmText={lang === 'th' ? 'ยืนยันการลบ' : 'Confirm Delete'}
          cancelText={lang === 'th' ? 'ยกเลิก' : 'Cancel'}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            if (!isDeletingRecord) setRecordToDelete(null);
          }}
        />
      )}
    </div>
  );
};
