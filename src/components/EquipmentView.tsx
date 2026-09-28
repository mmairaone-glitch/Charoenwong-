import React, { useState, useEffect } from 'react';
import { Equipment, EquipmentType, MasterDepartment, MasterLocation, CalibrationStatus } from '../types/index.js';
import { api } from '../services/api.js';
import { exportToCSV, exportToExcel, printReport } from '../services/export.js';
import {
  Search,
  Filter,
  ArrowUpDown,
  PlusCircle,
  Eye,
  Wrench,
  Edit2,
  Trash2,
  Download,
  FileSpreadsheet,
  Printer,
  FileText,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';
import { ConfirmModal } from './ConfirmModal.js';

interface EquipmentViewProps {
  initialFilter?: { status?: string; type?: string };
  onViewDetails: (equipment: Equipment) => void;
  onRecordCalibration: (equipment: Equipment) => void;
  onOpenAddEquipment: () => void;
  onEditEquipment: (equipment: Equipment) => void;
  onOpenGoogleSheetsExport: (data: { title: string; headers: string[]; rows: (string | number)[][] }) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export const EquipmentView: React.FC<EquipmentViewProps> = ({
  initialFilter,
  onViewDetails,
  onRecordCalibration,
  onOpenAddEquipment,
  onEditEquipment,
  onOpenGoogleSheetsExport,
  canEdit,
  canDelete,
}) => {
  const { t, lang } = useLanguage();
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [types, setTypes] = useState<EquipmentType[]>([]);
  const [departments, setDepartments] = useState<MasterDepartment[]>([]);
  const [locations, setLocations] = useState<MasterLocation[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>(initialFilter?.type || 'all');
  const [selectedStatus, setSelectedStatus] = useState<string>(initialFilter?.status || 'all');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('true'); // Default active only
  const [sortBy, setSortBy] = useState<string>('next_calibration_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = useState<Equipment | null>(null);
  const [isDeletingEquipment, setIsDeletingEquipment] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Sync initial filter from props if set
  useEffect(() => {
    if (initialFilter?.status) setSelectedStatus(initialFilter.status);
    if (initialFilter?.type) setSelectedType(initialFilter.type);
  }, [initialFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        search,
        type: selectedType,
        status: selectedStatus,
        department: selectedDept,
        location: selectedLocation,
        active: activeFilter,
        sortBy,
        sortOrder,
      };

      const [eqRes, typeRes, deptRes, locRes] = await Promise.all([
        api.getEquipment(params),
        api.getEquipmentTypes(),
        api.getDepartments(),
        api.getLocations(),
      ]);

      setEquipmentList(eqRes.equipment);
      setTypes(typeRes.types);
      setDepartments(deptRes.departments);
      setLocations(locRes.locations);
    } catch (err) {
      console.error('Failed to load equipment list', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, selectedType, selectedStatus, selectedDept, selectedLocation, activeFilter, sortBy, sortOrder]);

  const handleDelete = (eq: Equipment) => {
    setDeleteError(null);
    setEquipmentToDelete(eq);
  };

  const handleConfirmDelete = async () => {
    if (!equipmentToDelete) return;
    setIsDeletingEquipment(true);
    setDeleteError(null);
    try {
      await api.deleteEquipment(equipmentToDelete.id);
      setEquipmentToDelete(null);
      loadData();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete equipment.');
    } finally {
      setIsDeletingEquipment(false);
    }
  };

  const getExportMatrix = () => {
    const headers = [
      'Equipment ID',
      'Equipment Name',
      'Type',
      'Manufacturer',
      'Model',
      'Serial Number',
      'Asset Number',
      'Location',
      'Department',
      'Responsible Person',
      'Frequency (Mo)',
      'Last Cal Date',
      'Next Due Date',
      'Remaining Days',
      'Status',
      'Certificate No.',
      'Calibration Lab',
    ];

    const rows = equipmentList.map((eq) => [
      eq.equipment_id,
      eq.equipment_name,
      eq.equipment_type_code,
      eq.manufacturer,
      eq.model,
      eq.serial_number,
      eq.asset_number,
      eq.location,
      eq.department,
      eq.responsible_person,
      eq.calibration_frequency,
      eq.last_calibration_date,
      eq.next_calibration_date,
      eq.remaining_days ?? 0,
      eq.status,
      eq.calibration_certificate_no,
      eq.calibration_lab,
    ]);

    return { headers, rows };
  };

  const handleExportCSV = () => {
    const { headers, rows } = getExportMatrix();
    exportToCSV({
      filename: `PCS_NISSIN_Equipment_Register_${new Date().toISOString().slice(0, 10)}`,
      headers,
      rows,
    });
    setIsExportMenuOpen(false);
  };

  const handleExportExcel = () => {
    const { headers, rows } = getExportMatrix();
    exportToExcel({
      filename: `PCS_NISSIN_Equipment_Register_${new Date().toISOString().slice(0, 10)}`,
      sheetName: 'Equipment Master',
      headers,
      rows,
    });
    setIsExportMenuOpen(false);
  };

  const handlePrintPDF = () => {
    const { headers, rows } = getExportMatrix();
    printReport('Equipment Calibration Master Register', headers, rows);
    setIsExportMenuOpen(false);
  };

  const handleGoogleSheets = () => {
    const { headers, rows } = getExportMatrix();
    onOpenGoogleSheetsExport({
      title: 'Equipment Calibration Register',
      headers,
      rows,
    });
    setIsExportMenuOpen(false);
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>{t('navEquipment')}</span>
            <Sparkles className="w-4 h-4 text-teal-400 hidden sm:inline" />
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {lang === 'th'
              ? `ทะเบียนเครื่องมือวัดอุตสาหกรรม, เกจตรวจสอบ และรอบกำหนดการสอบเทียบ (${equipmentList.length} รายการ)`
              : `Directory of plant measuring instruments, inspection gauges, and calibration schedules (${equipmentList.length} items)`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-2 liquid-glass-button text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-teal-400" />
              <span>{t('exportData')}</span>
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 liquid-glass-panel border border-white/15 rounded-2xl shadow-2xl py-1.5 z-30 overflow-hidden">
                <button
                  onClick={handleGoogleSheets}
                  className="w-full px-3.5 py-2.5 text-left text-xs text-emerald-300 hover:bg-emerald-500/15 flex items-center gap-2 font-medium transition"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Export to Google Sheets</span>
                </button>
                <button
                  onClick={handleExportExcel}
                  className="w-full px-3.5 py-2.5 text-left text-xs text-slate-200 hover:bg-white/[0.06] flex items-center gap-2 transition"
                >
                  <FileSpreadsheet className="w-4 h-4 text-teal-400" />
                  <span>Download Excel (.xlsx)</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="w-full px-3.5 py-2.5 text-left text-xs text-slate-200 hover:bg-white/[0.06] flex items-center gap-2 transition"
                >
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span>Download CSV (.csv)</span>
                </button>
                <button
                  onClick={handlePrintPDF}
                  className="w-full px-3.5 py-2.5 text-left text-xs text-slate-200 hover:bg-white/[0.06] flex items-center gap-2 border-t border-white/10 mt-1 pt-1.5 transition"
                >
                  <Printer className="w-4 h-4 text-slate-400" />
                  <span>Print / Save as PDF</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={loadData}
            title={t('refresh')}
            className="p-2 liquid-glass-button text-slate-300 rounded-xl transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {canEdit && (
            <button
              onClick={onOpenAddEquipment}
              className="flex items-center gap-1.5 px-4 py-2 liquid-glass-primary text-white text-xs font-bold rounded-xl transition shadow-lg shadow-teal-950 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t('addEquipment')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="liquid-glass-panel rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
          {/* Search box */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-3.5 py-2 liquid-glass-input rounded-xl text-white text-xs placeholder-slate-400"
            />
          </div>

          {/* Type filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 liquid-glass-input rounded-xl text-slate-200 text-xs font-mono"
            >
              <option value="all">{lang === 'th' ? 'ทุกประเภท (All Types)' : 'All Types'}</option>
              {types.map((tItem) => (
                <option key={tItem.id} value={tItem.code}>
                  {tItem.code} ({tItem.name})
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 liquid-glass-input rounded-xl text-slate-200 text-xs"
            >
              <option value="all">{lang === 'th' ? 'ทุกสถานะ (All Statuses)' : 'All Statuses'}</option>
              <option value="CALIBRATION OK">CALIBRATION OK</option>
              <option value="DUE_SOON">DUE SOON (≤ 10 Days)</option>
              <option value="DUE IN 10 DAYS">DUE IN 10 DAYS</option>
              <option value="DUE IN 7 DAYS">DUE IN 7 DAYS</option>
              <option value="DUE IN 5 DAYS">DUE IN 5 DAYS</option>
              <option value="DUE TODAY">DUE TODAY</option>
              <option value="OVERDUE">OVERDUE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          {/* Location filter */}
          <div>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-2 liquid-glass-input rounded-xl text-slate-200 text-xs"
            >
              <option value="all">{lang === 'th' ? 'ทุกสถานที่ (All Locations)' : 'All Locations'}</option>
              {locations.map((l) => (
                <option key={l.id} value={l.code}>
                  {l.code}
                </option>
              ))}
            </select>
          </div>

          {/* Department filter */}
          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 liquid-glass-input rounded-xl text-slate-200 text-xs"
            >
              <option value="all">{lang === 'th' ? 'ทุกแผนก (All Depts)' : 'All Departments'}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.code}>
                  {d.code}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Secondary Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-white/10 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-slate-400 text-[11px]">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {t('status')}:
            </span>
            <button
              onClick={() => setActiveFilter('true')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                activeFilter === 'true'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-400/30 shadow-[0_0_8px_rgba(20,184,166,0.2)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('activeOnly')}
            </button>
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                activeFilter === 'all'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-400/30 shadow-[0_0_8px_rgba(20,184,166,0.2)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('all')}
            </button>
            <button
              onClick={() => setActiveFilter('false')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                activeFilter === 'false'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-400/30 shadow-[0_0_8px_rgba(20,184,166,0.2)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('inactiveOnly')}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">{lang === 'th' ? 'เรียงตาม:' : 'Sort By:'}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-1 liquid-glass-input rounded-lg text-slate-200 text-[11px]"
            >
              <option value="next_calibration_date">Due Date</option>
              <option value="remaining_days">Remaining Days</option>
              <option value="equipment_id">Equipment ID</option>
              <option value="status">Calibration Status</option>
              <option value="equipment_type_code">Equipment Type</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1 text-slate-400 hover:text-white rounded-lg liquid-glass-button"
              title="Toggle sort direction"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Equipment Table (Liquid Glass) */}
      <div className="liquid-glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] border-b border-white/10">
              <tr>
                <th className="py-3 px-3.5">{t('colEquipmentId')}</th>
                <th className="py-3 px-3.5">{t('colNameSpecs')}</th>
                <th className="py-3 px-3.5">{t('colType')}</th>
                <th className="py-3 px-3.5">{t('colLocationDept')}</th>
                <th className="py-3 px-3.5">Frequency</th>
                <th className="py-3 px-3.5">{t('colLastCal')}</th>
                <th className="py-3 px-3.5">{t('colNextDue')}</th>
                <th className="py-3 px-3.5">{t('colDaysLeft')}</th>
                <th className="py-3 px-3.5">{t('colStatus')}</th>
                <th className="py-3 px-3.5 text-right">{t('actions')}</th>
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
              ) : equipmentList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 text-xs">
                    {lang === 'th' ? 'ไม่พบเครื่องมือวัดตามเงื่อนไขที่ค้นหา' : 'No equipment found matching current filter criteria.'}
                  </td>
                </tr>
              ) : (
                equipmentList.map((eq) => {
                  const remaining = eq.remaining_days ?? 0;
                  return (
                    <tr
                      key={eq.id}
                      className="hover:bg-white/[0.04] transition group cursor-pointer"
                      onClick={() => onViewDetails(eq)}
                    >
                      <td className="py-3 px-3.5 font-mono font-bold text-teal-300 whitespace-nowrap">
                        {eq.equipment_id}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-white">{eq.equipment_name}</div>
                        <div className="text-[11px] text-slate-400">
                          {eq.manufacturer} {eq.model} {eq.serial_number ? `• S/N: ${eq.serial_number}` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 font-mono font-medium">{eq.equipment_type_code}</td>
                      <td className="py-3 px-3.5">
                        <div className="text-slate-200">{eq.location}</div>
                        <div className="text-[11px] text-slate-400">{eq.department}</div>
                      </td>
                      <td className="py-3 px-3.5 font-mono">{eq.calibration_frequency} Mo</td>
                      <td className="py-3 px-3.5 font-mono text-slate-400">{eq.last_calibration_date}</td>
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-100">{eq.next_calibration_date}</td>
                      <td className="py-3 px-3.5 font-mono font-bold whitespace-nowrap">
                        {remaining < 0 ? (
                          <span className="text-rose-400 drop-shadow-[0_0_6px_rgba(244,63,94,0.4)]">{remaining}d (Overdue)</span>
                        ) : remaining === 0 ? (
                          <span className="text-rose-400 drop-shadow-[0_0_6px_rgba(244,63,94,0.4)]">0d (Today)</span>
                        ) : remaining <= 5 ? (
                          <span className="text-orange-400">{remaining}d</span>
                        ) : remaining <= 10 ? (
                          <span className="text-amber-400">{remaining}d</span>
                        ) : (
                          <span className="text-emerald-400">{remaining}d</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider inline-block backdrop-blur-md ${
                            eq.status === 'CALIBRATION OK'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                              : eq.status === 'OVERDUE'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                              : eq.status === 'DUE TODAY'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                              : eq.status === 'DUE IN 5 DAYS'
                              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-[0_0_8px_rgba(249,115,22,0.3)]'
                              : eq.status === 'INACTIVE'
                              ? 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                          }`}
                        >
                          {eq.status}
                        </span>
                      </td>
                      <td
                        className="py-3 px-3.5 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onViewDetails(eq)}
                            title="View Instrument Details"
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg liquid-glass-button transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {canEdit && (
                            <>
                              <button
                                onClick={() => onRecordCalibration(eq)}
                                title="Record New Calibration"
                                className="p-1.5 text-teal-300 hover:text-white rounded-lg liquid-glass-button hover:bg-teal-500/20 transition"
                              >
                                <Wrench className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onEditEquipment(eq)}
                                title="Edit Instrument Specs"
                                className="p-1.5 text-slate-400 hover:text-white rounded-lg liquid-glass-button transition"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(eq)}
                              title="Delete Instrument"
                              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg liquid-glass-button hover:bg-rose-500/20 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Delete Equipment Modal */}
      {equipmentToDelete && (
        <ConfirmModal
          isOpen={Boolean(equipmentToDelete)}
          variant="danger"
          isSubmitting={isDeletingEquipment}
          title={
            lang === 'th'
              ? `ลบเครื่องมือวัด: ${equipmentToDelete.equipment_id}`
              : `Delete Equipment: ${equipmentToDelete.equipment_id}`
          }
          message={
            lang === 'th'
              ? `คุณแน่ใจหรือไม่ว่าต้องการลบเครื่องมือ "${equipmentToDelete.equipment_name}" (${equipmentToDelete.equipment_id}) ออกจากระบบอย่างถาวร?`
              : `Are you sure you want to permanently delete equipment "${equipmentToDelete.equipment_name}" (${equipmentToDelete.equipment_id})?`
          }
          detailMessage={
            lang === 'th'
              ? 'ประวัติการสอบเทียบที่เกี่ยวข้องกับเครื่องมือนี้ทั้งหมดจะถูกลบออกจากฐานข้อมูลอย่างสมบูรณ์'
              : 'All historical calibration records and associated data for this equipment will be permanently removed.'
          }
          confirmText={lang === 'th' ? 'ยืนยันการลบเครื่องมือ' : 'Confirm Delete'}
          cancelText={lang === 'th' ? 'ยกเลิก' : 'Cancel'}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            if (!isDeletingEquipment) setEquipmentToDelete(null);
          }}
        />
      )}
    </div>
  );
};
