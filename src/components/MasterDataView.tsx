import React, { useState, useEffect } from 'react';
import { EquipmentType, MasterDepartment, MasterLocation, Equipment } from '../types/index.js';
import { api } from '../services/api.js';
import {
  Database,
  PlusCircle,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  Building,
  MapPin,
  Sliders,
  CheckCircle,
  AlertCircle,
  Wrench,
  ShieldAlert,
  Sparkles,
  Target,
  Search,
  Layers,
  Calendar,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';
import { ConfirmModal } from './ConfirmModal.js';

interface DeleteTarget {
  type: 'equipment_type' | 'department' | 'location';
  id: string;
  code: string;
  name: string;
  linkedCount: number;
}

type MasterTab = 'all' | 'types' | 'departments' | 'locations';

export const MasterDataView: React.FC = () => {
  const { t, lang } = useLanguage();
  const [types, setTypes] = useState<EquipmentType[]>([]);
  const [departments, setDepartments] = useState<MasterDepartment[]>([]);
  const [locations, setLocations] = useState<MasterLocation[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<MasterTab>('types');
  const [searchQuery, setSearchQuery] = useState('');

  // Equipment Type Modal State
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<EquipmentType | null>(null);
  const [typeCode, setTypeCode] = useState('');
  const [typeName, setTypeName] = useState('');
  const [typeDescription, setTypeDescription] = useState('');
  const [typeFrequency, setTypeFrequency] = useState<number>(12); // Default 12 months, selectable 1 to 12
  const [typeMpeStandard, setTypeMpeStandard] = useState(''); // MPE (Standard)
  const [typeModalError, setTypeModalError] = useState<string | null>(null);
  const [typeSubmitting, setTypeSubmitting] = useState(false);

  // Department Modal State
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<MasterDepartment | null>(null);
  const [deptCode, setDeptCode] = useState('');
  const [deptName, setDeptName] = useState('');
  const [deptModalError, setDeptModalError] = useState<string | null>(null);
  const [deptSubmitting, setDeptSubmitting] = useState(false);

  // Location Modal State
  const [isLocModalOpen, setIsLocModalOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState<MasterLocation | null>(null);
  const [locCode, setLocCode] = useState('');
  const [locName, setLocName] = useState('');
  const [locModalError, setLocModalError] = useState<string | null>(null);
  const [locSubmitting, setLocSubmitting] = useState(false);

  // Unified Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleteLinkedEquipment, setDeleteLinkedEquipment] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const [typeRes, deptRes, locRes, eqRes] = await Promise.all([
        api.getEquipmentTypes(),
        api.getDepartments(),
        api.getLocations(),
        api.getEquipment({ active: 'all' }),
      ]);
      setTypes(typeRes.types || []);
      setDepartments(deptRes.departments || []);
      setLocations(locRes.locations || []);
      setEquipmentList(eqRes.equipment || []);
    } catch (err: any) {
      console.error('Failed to load master data', err);
      setActionError(err.message || 'Failed to load master data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerSuccess = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => {
      setActionSuccess(null);
    }, 4000);
  };

  // Helper count of tools per equipment type
  const getToolCountForType = (code: string) => {
    return equipmentList.filter(
      (e) => e.equipment_type_code.toUpperCase() === code.toUpperCase()
    ).length;
  };

  // Helper count of tools per department
  const getToolCountForDept = (dept: MasterDepartment) => {
    return equipmentList.filter(
      (e) =>
        e.department?.toLowerCase() === dept.code.toLowerCase() ||
        e.department?.toLowerCase() === dept.name.toLowerCase()
    ).length;
  };

  // Helper count of tools per location
  const getToolCountForLoc = (loc: MasterLocation) => {
    return equipmentList.filter(
      (e) =>
        e.location?.toLowerCase() === loc.code.toLowerCase() ||
        e.location?.toLowerCase() === loc.name.toLowerCase()
    ).length;
  };

  // ----------------------------------------------------
  // Equipment Type Handlers
  // ----------------------------------------------------
  const handleOpenAddType = () => {
    setEditingType(null);
    setTypeCode('');
    setTypeName('');
    setTypeDescription('');
    setTypeFrequency(12);
    setTypeMpeStandard('±0.0050 mm');
    setTypeModalError(null);
    setIsTypeModalOpen(true);
  };

  const handleOpenEditType = (tItem: EquipmentType) => {
    setEditingType(tItem);
    setTypeCode(tItem.code);
    setTypeName(tItem.name);
    setTypeDescription(tItem.description || '');
    setTypeFrequency(tItem.standard_frequency_months || 12);
    setTypeMpeStandard(tItem.mpe_standard || '');
    setTypeModalError(null);
    setIsTypeModalOpen(true);
  };

  const handleSubmitType = async (e: React.FormEvent) => {
    e.preventDefault();
    setTypeModalError(null);

    if (!typeCode.trim() || !typeName.trim()) {
      setTypeModalError(lang === 'th' ? 'กรุณากรอกรหัสและชื่อประเภท' : 'Code and Name are required.');
      return;
    }

    setTypeSubmitting(true);
    try {
      if (editingType) {
        await api.updateEquipmentType(editingType.id, {
          name: typeName.trim(),
          description: typeDescription.trim(),
          standard_frequency_months: Number(typeFrequency),
          mpe_standard: typeMpeStandard.trim(),
        });
        triggerSuccess(
          lang === 'th'
            ? `อัปเดตประเภท '${editingType.code}' สำเร็จ`
            : `Equipment type '${editingType.code}' updated.`
        );
      } else {
        await api.createEquipmentType({
          code: typeCode.trim().toUpperCase(),
          name: typeName.trim(),
          description: typeDescription.trim(),
          standard_frequency_months: Number(typeFrequency),
          mpe_standard: typeMpeStandard.trim(),
        });
        triggerSuccess(
          lang === 'th'
            ? `สร้างประเภท '${typeCode.trim().toUpperCase()}' พร้อมรอบสอบเทียบ ${typeFrequency} เดือน และ MPE ${typeMpeStandard.trim()} สำเร็จ`
            : `Equipment type '${typeCode.trim().toUpperCase()}' created successfully.`
        );
      }
      setIsTypeModalOpen(false);
      loadData();
    } catch (err: any) {
      setTypeModalError(err.message || 'Operation failed.');
    } finally {
      setTypeSubmitting(false);
    }
  };

  const initiateDeleteType = (tItem: EquipmentType) => {
    const linked = getToolCountForType(tItem.code);
    setDeleteTarget({
      type: 'equipment_type',
      id: tItem.id,
      code: tItem.code,
      name: tItem.name,
      linkedCount: linked,
    });
    setDeleteLinkedEquipment(false);
  };

  // ----------------------------------------------------
  // Department Handlers (Add, Edit, Delete)
  // ----------------------------------------------------
  const handleOpenAddDept = () => {
    setEditingDept(null);
    setDeptCode('');
    setDeptName('');
    setDeptModalError(null);
    setIsDeptModalOpen(true);
  };

  const handleOpenEditDept = (d: MasterDepartment) => {
    setEditingDept(d);
    setDeptCode(d.code);
    setDeptName(d.name);
    setDeptModalError(null);
    setIsDeptModalOpen(true);
  };

  const handleSubmitDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeptModalError(null);

    if (!deptCode.trim() || !deptName.trim()) {
      setDeptModalError(lang === 'th' ? 'กรุณากรอกรหัสและชื่อแผนก' : 'Department Code and Name are required.');
      return;
    }

    setDeptSubmitting(true);
    try {
      if (editingDept) {
        await api.updateDepartment(editingDept.id, {
          code: deptCode.trim(),
          name: deptName.trim(),
        });
        triggerSuccess(lang === 'th' ? `อัปเดตแผนก '${deptName.trim()}' สำเร็จ` : `Department '${deptName.trim()}' updated.`);
      } else {
        await api.createDepartment({
          code: deptCode.trim(),
          name: deptName.trim(),
        });
        triggerSuccess(lang === 'th' ? `เพิ่มแผนก '${deptName.trim()}' สำเร็จ` : `Department '${deptName.trim()}' added successfully.`);
      }
      setIsDeptModalOpen(false);
      loadData();
    } catch (err: any) {
      setDeptModalError(err.message || 'Failed to save department.');
    } finally {
      setDeptSubmitting(false);
    }
  };

  const initiateDeleteDept = (d: MasterDepartment) => {
    const linked = getToolCountForDept(d);
    setDeleteTarget({
      type: 'department',
      id: d.id,
      code: d.code,
      name: d.name,
      linkedCount: linked,
    });
    setDeleteLinkedEquipment(false);
  };

  // ----------------------------------------------------
  // Location Handlers (Add, Edit, Delete)
  // ----------------------------------------------------
  const handleOpenAddLoc = () => {
    setEditingLoc(null);
    setLocCode('');
    setLocName('');
    setLocModalError(null);
    setIsLocModalOpen(true);
  };

  const handleOpenEditLoc = (l: MasterLocation) => {
    setEditingLoc(l);
    setLocCode(l.code);
    setLocName(l.name);
    setLocModalError(null);
    setIsLocModalOpen(true);
  };

  const handleSubmitLoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocModalError(null);

    if (!locCode.trim() || !locName.trim()) {
      setLocModalError(lang === 'th' ? 'กรุณากรอกรหัสและชื่อสถานที่' : 'Location Code and Name are required.');
      return;
    }

    setLocSubmitting(true);
    try {
      if (editingLoc) {
        await api.updateLocation(editingLoc.id, {
          code: locCode.trim(),
          name: locName.trim(),
        });
        triggerSuccess(lang === 'th' ? `อัปเดตสถานที่ '${locName.trim()}' สำเร็จ` : `Location '${locName.trim()}' updated.`);
      } else {
        await api.createLocation({
          code: locCode.trim(),
          name: locName.trim(),
        });
        triggerSuccess(lang === 'th' ? `เพิ่มสถานที่ '${locName.trim()}' สำเร็จ` : `Location '${locName.trim()}' added successfully.`);
      }
      setIsLocModalOpen(false);
      loadData();
    } catch (err: any) {
      setLocModalError(err.message || 'Failed to save location.');
    } finally {
      setLocSubmitting(false);
    }
  };

  const initiateDeleteLoc = (l: MasterLocation) => {
    const linked = getToolCountForLoc(l);
    setDeleteTarget({
      type: 'location',
      id: l.id,
      code: l.code,
      name: l.name,
      linkedCount: linked,
    });
    setDeleteLinkedEquipment(false);
  };

  // ----------------------------------------------------
  // Unified Delete Execution
  // ----------------------------------------------------
  const handleExecuteDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setActionError(null);
    try {
      if (deleteTarget.type === 'equipment_type') {
        await api.deleteEquipmentType(deleteTarget.id, { deleteEquipment: deleteLinkedEquipment });
        triggerSuccess(
          lang === 'th'
            ? `ลบประเภทเครื่องมือวัด '${deleteTarget.code}' เรียบร้อยแล้ว`
            : `Equipment type '${deleteTarget.code}' deleted successfully.`
        );
      } else if (deleteTarget.type === 'department') {
        await api.deleteDepartment(deleteTarget.id);
        triggerSuccess(
          lang === 'th'
            ? `ลบแผนก '${deleteTarget.name}' เรียบร้อยแล้ว`
            : `Department '${deleteTarget.name}' deleted successfully.`
        );
      } else if (deleteTarget.type === 'location') {
        await api.deleteLocation(deleteTarget.id);
        triggerSuccess(
          lang === 'th'
            ? `ลบสถานที่ '${deleteTarget.name}' เรียบร้อยแล้ว`
            : `Location '${deleteTarget.name}' deleted successfully.`
        );
      }
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      setActionError(err.message || 'Delete operation failed.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter lists based on search query
  const q = searchQuery.toLowerCase().trim();
  const filteredTypes = types.filter(
    (t) =>
      !q ||
      t.code.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q)) ||
      (t.mpe_standard && t.mpe_standard.toLowerCase().includes(q))
  );

  const filteredDepts = departments.filter(
    (d) => !q || d.code.toLowerCase().includes(q) || d.name.toLowerCase().includes(q)
  );

  const filteredLocs = locations.filter(
    (l) => !q || l.code.toLowerCase().includes(q) || l.name.toLowerCase().includes(q)
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Top Header - Glassmorphism banner */}
      <div className="relative p-6 rounded-3xl liquid-glass-panel border border-white/15 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-300 text-[11px] font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>{lang === 'th' ? 'ระบบตั้งค่าข้อมูลหลัก & มาตรวิทยา (Master Data & Metrology Standards)' : 'Master Data & Metrology Standard Engine'}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Database className="w-7 h-7 text-teal-400 drop-shadow-[0_0_12px_rgba(20,184,166,0.6)]" />
              <span>{t('navMasterData')}</span>
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              {lang === 'th'
                ? 'กำหนดค่าประเภทเครื่องมือวัด (Equipment Types), เกณฑ์มาตรฐาน MPE (Standard), รอบการสอบเทียบ 1-12 เดือน, แผนก และสถานที่จัดเก็บ'
                : 'Configure precision measurement instrument classifications, MPE (Standard) tolerances, 1-12 months calibration cycles, plant departments, and metrology labs.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={loadData}
              title={t('refresh')}
              className="p-2.5 liquid-glass-button rounded-2xl text-slate-300 hover:text-white transition flex items-center gap-2 text-xs font-medium"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-400' : ''}`} />
              <span className="hidden sm:inline">{t('refresh')}</span>
            </button>

            <button
              onClick={handleOpenAddType}
              className="flex items-center gap-2 px-4 py-2.5 liquid-glass-primary text-white text-xs font-bold rounded-2xl transition shadow-lg shadow-teal-950/60 hover:shadow-teal-500/25"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{lang === 'th' ? '+ เพิ่มประเภทเครื่องมือ' : '+ Add Equipment Type'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Success / Error Feedback */}
      {actionSuccess && (
        <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs rounded-2xl flex items-center gap-2.5 animate-in fade-in shadow-[0_0_20px_rgba(16,185,129,0.25)] backdrop-blur-md">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs rounded-2xl flex items-center gap-2.5 shadow-[0_0_20px_rgba(244,63,94,0.25)] backdrop-blur-md">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="font-medium">{actionError}</span>
        </div>
      )}

      {/* Overview Stat Badges (Liquid Glassmorphism) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('types')}
          className={`cursor-pointer p-4 rounded-2xl transition-all border ${
            activeTab === 'types'
              ? 'liquid-glass-card border-teal-500/50 shadow-[0_0_20px_rgba(20,184,166,0.25)]'
              : 'liquid-glass-card border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 shadow-[0_0_12px_rgba(20,184,166,0.3)]">
              <Sliders className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
              1-12 Mo / MPE
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-mono font-extrabold text-white tracking-tight drop-shadow-sm">
              {types.length}
            </div>
            <div className="text-xs text-slate-300 font-medium mt-0.5">
              {lang === 'th' ? 'ประเภทเครื่องมือวัด (Classifications)' : 'Equipment Types'}
            </div>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('departments')}
          className={`cursor-pointer p-4 rounded-2xl transition-all border ${
            activeTab === 'departments'
              ? 'liquid-glass-card border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.25)]'
              : 'liquid-glass-card border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.3)]">
              <Building className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
              Plant Units
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-mono font-extrabold text-white tracking-tight drop-shadow-sm">
              {departments.length}
            </div>
            <div className="text-xs text-slate-300 font-medium mt-0.5">
              {lang === 'th' ? 'แผนกที่ใช้งาน (Departments)' : 'Departments'}
            </div>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('locations')}
          className={`cursor-pointer p-4 rounded-2xl transition-all border ${
            activeTab === 'locations'
              ? 'liquid-glass-card border-sky-500/50 shadow-[0_0_20px_rgba(14,165,233,0.25)]'
              : 'liquid-glass-card border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-300 shadow-[0_0_12px_rgba(14,165,233,0.3)]">
              <MapPin className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
              Metrology Labs
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-mono font-extrabold text-white tracking-tight drop-shadow-sm">
              {locations.length}
            </div>
            <div className="text-xs text-slate-300 font-medium mt-0.5">
              {lang === 'th' ? 'สถานที่จัดเก็บ / ห้องสอบเทียบ' : 'Locations & Labs'}
            </div>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('all')}
          className={`cursor-pointer p-4 rounded-2xl transition-all border ${
            activeTab === 'all'
              ? 'liquid-glass-card border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
              : 'liquid-glass-card border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
              <Wrench className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              Registered
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-mono font-extrabold text-white tracking-tight drop-shadow-sm">
              {equipmentList.length}
            </div>
            <div className="text-xs text-slate-300 font-medium mt-0.5">
              {lang === 'th' ? 'เครื่องมือวัดในระบบทั้งหมด' : 'Total Active Instruments'}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Segmented Controls & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2 rounded-2xl liquid-glass-panel border border-white/10">
        <div className="flex items-center gap-1.5 overflow-x-auto p-1">
          <button
            onClick={() => setActiveTab('types')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'types'
                ? 'liquid-glass-primary text-white shadow-md shadow-teal-950'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{lang === 'th' ? 'ประเภทเครื่องมือ & MPE' : 'Equipment Types & MPE'}</span>
            <span className="px-1.5 py-0.2 rounded-md bg-white/15 text-[10px] font-mono">{types.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('departments')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'departments'
                ? 'bg-indigo-600/80 text-white shadow-md shadow-indigo-950 border border-indigo-400/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>{t('departmentsHeading')}</span>
            <span className="px-1.5 py-0.2 rounded-md bg-white/15 text-[10px] font-mono">{departments.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('locations')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'locations'
                ? 'bg-sky-600/80 text-white shadow-md shadow-sky-950 border border-sky-400/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{t('locationsHeading')}</span>
            <span className="px-1.5 py-0.2 rounded-md bg-white/15 text-[10px] font-mono">{locations.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-amber-600/80 text-white shadow-md shadow-amber-950 border border-amber-400/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{lang === 'th' ? 'แสดงทั้งหมด (All)' : 'Overview All'}</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[220px] max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'th' ? 'ค้นหาข้อมูลหลัก...' : 'Search master data...'}
            className="w-full pl-9 pr-3 py-1.5 text-xs liquid-glass-input rounded-xl text-white placeholder:text-slate-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. Equipment Types Table (with MPE (Standard) & Cycle 1-12 Months)        */}
      {/* ========================================================================= */}
      {(activeTab === 'types' || activeTab === 'all') && (
        <div className="liquid-glass-panel rounded-3xl overflow-hidden border border-white/15 shadow-2xl">
          <div className="p-4 bg-slate-950/60 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                  <span>{t('equipmentTypesHeading')}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    {filteredTypes.length}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  {lang === 'th'
                    ? 'กำหนดรอบการสอบเทียบมาตรฐาน (1 - 12 เดือน) และเกณฑ์ความเผื่อ MPE (Standard) ของแต่ละกลุ่ม'
                    : 'Standard calibration cycles (1-12 months) and MPE (Standard) precision thresholds'}
                </p>
              </div>
            </div>

            <button
              onClick={handleOpenAddType}
              className="flex items-center gap-1.5 px-3.5 py-1.5 liquid-glass-primary text-white text-xs font-bold rounded-xl transition shadow-md shadow-teal-950"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{t('addEquipmentType')}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-300 uppercase tracking-wider text-[10px] border-b border-white/10">
                <tr>
                  <th className="py-3.5 px-4 font-bold">{lang === 'th' ? 'รหัสประเภท' : 'Code'}</th>
                  <th className="py-3.5 px-4 font-bold">{lang === 'th' ? 'ชื่อประเภทเครื่องมือวัด' : 'Equipment Type Name'}</th>
                  <th className="py-3.5 px-4 font-bold">{lang === 'th' ? 'รายละเอียด / ขอบเขต' : 'Scope / Description'}</th>
                  <th className="py-3.5 px-4 font-bold text-cyan-300">
                    <div className="flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{lang === 'th' ? 'MPE (Standard)' : 'MPE (Standard)'}</span>
                    </div>
                  </th>
                  <th className="py-3.5 px-4 font-bold text-teal-300">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-teal-400" />
                      <span>{lang === 'th' ? 'รอบสอบเทียบ (1-12 เดือน)' : 'Cycle (1-12 Mo)'}</span>
                    </div>
                  </th>
                  <th className="py-3.5 px-4 font-bold">{lang === 'th' ? 'เครื่องมือที่ผูก' : 'Linked Tools'}</th>
                  <th className="py-3.5 px-4 text-right font-bold">{lang === 'th' ? 'จัดการ' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                      <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      {t('loading')}
                    </td>
                  </tr>
                ) : filteredTypes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                      <Sliders className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <div>{lang === 'th' ? 'ไม่พบข้อมูลประเภทเครื่องมือวัด' : 'No equipment types matched your query.'}</div>
                    </td>
                  </tr>
                ) : (
                  filteredTypes.map((tItem) => {
                    const linkedCount = getToolCountForType(tItem.code);
                    const freq = tItem.standard_frequency_months || 12;
                    return (
                      <tr key={tItem.id} className="hover:bg-white/[0.04] transition group">
                        <td className="py-3.5 px-4 font-mono font-bold text-teal-300 text-sm">
                          {tItem.code}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white text-xs">{tItem.name}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 text-[11px] max-w-xs truncate">
                          {tItem.description || '-'}
                        </td>
                        <td className="py-3.5 px-4">
                          {tItem.mpe_standard ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                              <Target className="w-3 h-3 text-cyan-400" />
                              <span>{tItem.mpe_standard}</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 italic text-[11px]">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-bold border ${
                              freq <= 3
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : freq <= 6
                                ? 'bg-teal-500/15 text-teal-300 border-teal-500/30'
                                : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                            }`}
                          >
                            <Calendar className="w-3 h-3" />
                            <span>
                              {freq} {lang === 'th' ? 'เดือน' : 'Mo'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({freq === 1 ? '1 Mo' : freq === 12 ? '1 Yr' : `${freq}M`})
                            </span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px]">
                          {linkedCount > 0 ? (
                            <span className="px-2.5 py-0.5 rounded-lg bg-teal-500/15 text-teal-300 border border-teal-500/30 font-bold">
                              {linkedCount} {lang === 'th' ? 'เครื่อง' : 'tools'}
                            </span>
                          ) : (
                            <span className="text-slate-500">0</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditType(tItem)}
                              className="p-1.5 text-slate-400 hover:text-white rounded-xl liquid-glass-button transition"
                              title={lang === 'th' ? 'แก้ไขประเภทและเกณฑ์ MPE' : 'Edit Type & MPE'}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => initiateDeleteType(tItem)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-xl liquid-glass-button hover:bg-rose-500/20 transition"
                              title={lang === 'th' ? 'ลบประเภทนี้' : 'Delete Type'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
      )}

      {/* ========================================================================= */}
      {/* 2. Departments & Locations Grid (Glassmorphism Cards)                     */}
      {/* ========================================================================= */}
      {(activeTab === 'departments' || activeTab === 'locations' || activeTab === 'all') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Departments Panel */}
          {(activeTab === 'departments' || activeTab === 'all') && (
            <div className="liquid-glass-panel rounded-3xl overflow-hidden border border-white/15 shadow-2xl flex flex-col">
              <div className="p-4 bg-slate-950/60 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      {t('departmentsHeading')} ({filteredDepts.length})
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      {lang === 'th' ? 'แผนกและสายการผลิตที่ใช้เครื่องมือ' : 'Production and Quality departments'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleOpenAddDept}
                  className="flex items-center gap-1.5 px-3 py-1.5 liquid-glass-button bg-indigo-500/20 hover:bg-indigo-500/30 border-indigo-400/30 text-indigo-200 text-xs font-bold rounded-xl transition shadow-sm"
                  title="Add New Department"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{t('addDepartment')}</span>
                </button>
              </div>

              <div className="divide-y divide-white/5 text-xs flex-1 max-h-[460px] overflow-y-auto">
                {filteredDepts.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 text-xs">
                    {lang === 'th' ? 'ไม่พบข้อมูลแผนก' : 'No departments found.'}
                  </div>
                ) : (
                  filteredDepts.map((d) => {
                    const toolCount = getToolCountForDept(d);
                    return (
                      <div
                        key={d.id}
                        className="p-4 flex items-center justify-between hover:bg-white/[0.04] transition group"
                      >
                        <div className="space-y-1">
                          <div className="font-semibold text-white flex items-center gap-2">
                            <span>{d.name}</span>
                            <span className="px-2 py-0.5 rounded-lg font-mono text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              {d.code}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                            <Wrench className="w-3 h-3 text-slate-400" />
                            <span>
                              {toolCount > 0 ? (
                                <span className="text-teal-400 font-mono font-medium">
                                  {toolCount} {lang === 'th' ? 'เครื่องมือประจำอยู่' : 'instruments assigned'}
                                </span>
                              ) : (
                                <span className="text-slate-500 font-mono">0 {lang === 'th' ? 'เครื่องมือ' : 'instruments'}</span>
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditDept(d)}
                            className="p-1.5 text-slate-400 hover:text-white rounded-xl liquid-glass-button transition"
                            title={lang === 'th' ? 'แก้ไขแผนก' : 'Edit Department'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => initiateDeleteDept(d)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-xl liquid-glass-button hover:bg-rose-500/20 transition"
                            title={lang === 'th' ? 'ลบแผนก' : 'Delete Department'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Locations Panel */}
          {(activeTab === 'locations' || activeTab === 'all') && (
            <div className="liquid-glass-panel rounded-3xl overflow-hidden border border-white/15 shadow-2xl flex flex-col">
              <div className="p-4 bg-slate-950/60 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-300">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      {t('locationsHeading')} ({filteredLocs.length})
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      {lang === 'th' ? 'ห้องสอบเทียบและตำแหน่งจัดเก็บเครื่องมือ' : 'Metrology rooms and storage cribs'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleOpenAddLoc}
                  className="flex items-center gap-1.5 px-3 py-1.5 liquid-glass-button bg-sky-500/20 hover:bg-sky-500/30 border-sky-400/30 text-sky-200 text-xs font-bold rounded-xl transition shadow-sm"
                  title="Add New Location"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{t('addLocation')}</span>
                </button>
              </div>

              <div className="divide-y divide-white/5 text-xs flex-1 max-h-[460px] overflow-y-auto">
                {filteredLocs.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 text-xs">
                    {lang === 'th' ? 'ไม่พบข้อมูลสถานที่' : 'No locations found.'}
                  </div>
                ) : (
                  filteredLocs.map((l) => {
                    const toolCount = getToolCountForLoc(l);
                    return (
                      <div
                        key={l.id}
                        className="p-4 flex items-center justify-between hover:bg-white/[0.04] transition group"
                      >
                        <div className="space-y-1">
                          <div className="font-semibold text-white flex items-center gap-2">
                            <span>{l.name}</span>
                            <span className="px-2 py-0.5 rounded-lg font-mono text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                              {l.code}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                            <Wrench className="w-3 h-3 text-slate-400" />
                            <span>
                              {toolCount > 0 ? (
                                <span className="text-teal-400 font-mono font-medium">
                                  {toolCount} {lang === 'th' ? 'เครื่องมือประจำอยู่' : 'instruments located'}
                                </span>
                              ) : (
                                <span className="text-slate-500 font-mono">0 {lang === 'th' ? 'เครื่องมือ' : 'instruments'}</span>
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditLoc(l)}
                            className="p-1.5 text-slate-400 hover:text-white rounded-xl liquid-glass-button transition"
                            title={lang === 'th' ? 'แก้ไขสถานที่' : 'Edit Location'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => initiateDeleteLoc(l)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-xl liquid-glass-button hover:bg-rose-500/20 transition"
                            title={lang === 'th' ? 'ลบสถานที่' : 'Delete Location'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: Add / Edit Equipment Type (With 1-12 Mo & MPE Standard) */}
      {/* ============================================================== */}
      {isTypeModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="liquid-glass-panel border border-white/20 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] max-w-lg w-full overflow-hidden">
            <div className="p-4 bg-slate-950/70 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-teal-400" />
                <span>
                  {editingType
                    ? `${lang === 'th' ? 'แก้ไขประเภท' : 'Edit Type'}: ${editingType.code}`
                    : lang === 'th'
                    ? 'เพิ่มประเภทเครื่องมือวัด & กำหนดค่า MPE'
                    : 'Add Equipment Classification & MPE'}
                </span>
              </h2>
              <button
                onClick={() => setIsTypeModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-xl liquid-glass-button transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitType} className="p-6 space-y-4 text-xs">
              {typeModalError && (
                <div className="p-3 bg-rose-950/70 border border-rose-500/40 text-rose-200 rounded-xl flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{typeModalError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    {lang === 'th' ? 'รหัสประเภทเครื่องมือ (Code) *' : 'Type Code *'}
                  </label>
                  <input
                    type="text"
                    disabled={Boolean(editingType)}
                    value={typeCode}
                    onChange={(e) => setTypeCode(e.target.value.toUpperCase())}
                    placeholder="e.g. CMM, VMM, MM, VC, DG"
                    className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white font-mono uppercase disabled:opacity-60 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    {lang === 'th' ? 'ชื่อประเภทเครื่องมือวัด *' : 'Equipment Type Name *'}
                  </label>
                  <input
                    type="text"
                    value={typeName}
                    onChange={(e) => setTypeName(e.target.value)}
                    placeholder="e.g. Coordinate Measuring Machine"
                    className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white"
                    required
                  />
                </div>
              </div>

              {/* MPE (Standard) Field - Requested by user */}
              <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-cyan-300 font-bold flex items-center gap-1.5 text-xs">
                    <Target className="w-4 h-4 text-cyan-400" />
                    <span>{lang === 'th' ? 'MPE (Standard) เกณฑ์ความคลาดเคลื่อนมาตรฐาน' : 'MPE (Standard) Maximum Permissible Error'}</span>
                  </label>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-cyan-500/20 text-cyan-200 border border-cyan-500/30 font-bold">
                    Result ≤ MPE
                  </span>
                </div>
                <input
                  type="text"
                  value={typeMpeStandard}
                  onChange={(e) => setTypeMpeStandard(e.target.value)}
                  placeholder={lang === 'th' ? 'เช่น ±0.0030 mm, ±0.0050 mm หรือ ±0.02 mm' : 'e.g. ±0.0030 mm, ±0.0050 mm, or ±0.02 mm'}
                  className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white font-mono placeholder:text-slate-500 font-bold text-xs"
                />
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  {lang === 'th'
                    ? 'เกณฑ์ความเผื่อสูงสุด (Maximum Permissible Error) ประจำประเภทเครื่องมือนี้ ระบบจะนำไปใช้ตัดสินผล Judgement (PASS/FAIL) อัตโนมัติเมื่อทำการสอบเทียบ'
                    : 'Permissible error standard assigned to this classification for automated PASS/FAIL metrology calibration judgements.'}
                </p>
              </div>

              {/* Calibration Cycle: 1 Month to 12 Months - Requested by user */}
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-200 font-bold flex items-center gap-1.5 text-xs">
                    <Calendar className="w-4 h-4 text-teal-400" />
                    <span>{lang === 'th' ? 'รอบในการสอบเทียบ (เลือกได้ 1 - 12 เดือน) *' : 'Calibration Frequency (1 - 12 Months) *'}</span>
                  </label>
                  <span className="font-mono text-teal-300 font-bold bg-teal-500/20 px-2.5 py-0.5 rounded-lg border border-teal-500/30 text-xs">
                    {typeFrequency} {lang === 'th' ? 'เดือน' : 'Months'}
                  </span>
                </div>

                {/* 1-12 Month Quick Selection Pills (Liquid Glass) */}
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                    const isSelected = typeFrequency === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setTypeFrequency(m)}
                        className={`py-1.5 text-xs font-mono font-bold rounded-xl transition text-center border ${
                          isSelected
                            ? 'bg-teal-500 text-white shadow-[0_0_12px_rgba(20,184,166,0.5)] border-teal-300'
                            : 'liquid-glass-button text-slate-300 hover:text-white hover:border-teal-500/40 border-white/10'
                        }`}
                      >
                        {m} {lang === 'th' ? 'ด.' : 'Mo'}
                      </button>
                    );
                  })}
                </div>

                {/* Select Dropdown with Descriptions */}
                <select
                  value={typeFrequency}
                  onChange={(e) => setTypeFrequency(Number(e.target.value))}
                  className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white font-mono text-xs"
                >
                  <option value={1}>1 {lang === 'th' ? 'เดือน (High Critical / รายเดือน)' : 'Month (High Critical / Monthly)'}</option>
                  <option value={2}>2 {lang === 'th' ? 'เดือน (ทุก 2 เดือน)' : 'Months (Bi-Monthly)'}</option>
                  <option value={3}>3 {lang === 'th' ? 'เดือน (Quarterly / รายไตรมาส)' : 'Months (Quarterly)'}</option>
                  <option value={4}>4 {lang === 'th' ? 'เดือน (ทุก 4 เดือน)' : 'Months (Every 4 Months)'}</option>
                  <option value={5}>5 {lang === 'th' ? 'เดือน (ทุก 5 เดือน)' : 'Months (Every 5 Months)'}</option>
                  <option value={6}>6 {lang === 'th' ? 'เดือน (Semi-Annually / ครึ่งปี)' : 'Months (Semi-Annually)'}</option>
                  <option value={7}>7 {lang === 'th' ? 'เดือน (ทุก 7 เดือน)' : 'Months (Every 7 Months)'}</option>
                  <option value={8}>8 {lang === 'th' ? 'เดือน (ทุก 8 เดือน)' : 'Months (Every 8 Months)'}</option>
                  <option value={9}>9 {lang === 'th' ? 'เดือน (ทุก 9 เดือน)' : 'Months (Every 9 Months)'}</option>
                  <option value={10}>10 {lang === 'th' ? 'เดือน (ทุก 10 เดือน)' : 'Months (Every 10 Months)'}</option>
                  <option value={11}>11 {lang === 'th' ? 'เดือน (ทุก 11 เดือน)' : 'Months (Every 11 Months)'}</option>
                  <option value={12}>12 {lang === 'th' ? 'เดือน (Annually / รายปีมาตรฐาน)' : 'Months (Annually / Standard 1 Year)'}</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  {lang === 'th' ? 'คำอธิบาย / ขอบเขตการใช้งาน' : 'Description / Scope'}
                </label>
                <textarea
                  value={typeDescription}
                  onChange={(e) => setTypeDescription(e.target.value)}
                  rows={2}
                  placeholder={lang === 'th' ? 'เช่น เครื่องวัดพิกัด 3 มิติความแม่นยำสูง...' : 'Tool usage scope and standard calibration requirements...'}
                  className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white text-xs"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsTypeModalOpen(false)}
                  className="px-4 py-2 liquid-glass-button text-slate-300 rounded-xl transition"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={typeSubmitting}
                  className="px-5 py-2 liquid-glass-primary text-white rounded-xl font-bold transition shadow-lg shadow-teal-950"
                >
                  {typeSubmitting
                    ? t('saving')
                    : editingType
                    ? t('save')
                    : lang === 'th'
                    ? 'บันทึกประเภทใหม่'
                    : 'Create Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: Add / Edit Department                                  */}
      {/* ============================================================== */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="liquid-glass-panel border border-white/20 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-4 bg-slate-950/70 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-400" />
                <span>{editingDept ? `${lang === 'th' ? 'แก้ไขแผนก' : 'Edit Department'}: ${editingDept.code}` : t('addDepartment')}</span>
              </h2>
              <button
                onClick={() => setIsDeptModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-xl liquid-glass-button transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDept} className="p-6 space-y-4 text-xs">
              {deptModalError && (
                <div className="p-3 bg-rose-950/70 border border-rose-500/40 text-rose-200 rounded-xl flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{deptModalError}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  {lang === 'th' ? 'รหัส / ตัวย่อแผนก *' : 'Department Code / Abbreviation *'}
                </label>
                <input
                  type="text"
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value)}
                  placeholder="e.g. QA/QC, Machining, Tooling, Heat-Treat"
                  className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  {lang === 'th' ? 'ชื่อแผนกแบบเต็ม *' : 'Department Full Name *'}
                </label>
                <input
                  type="text"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="e.g. Quality Assurance & Metrology Division"
                  className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white"
                  required
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="px-4 py-2 liquid-glass-button text-slate-300 rounded-xl transition"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={deptSubmitting}
                  className="px-5 py-2 liquid-glass-primary text-white rounded-xl font-bold transition"
                >
                  {deptSubmitting ? t('saving') : editingDept ? t('save') : (lang === 'th' ? 'บันทึกแผนก' : 'Create Department')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: Add / Edit Quality & Tool Location                     */}
      {/* ============================================================== */}
      {isLocModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="liquid-glass-panel border border-white/20 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-4 bg-slate-950/70 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-400" />
                <span>{editingLoc ? `${lang === 'th' ? 'แก้ไขสถานที่' : 'Edit Location'}: ${editingLoc.code}` : t('addLocation')}</span>
              </h2>
              <button
                onClick={() => setIsLocModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-xl liquid-glass-button transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitLoc} className="p-6 space-y-4 text-xs">
              {locModalError && (
                <div className="p-3 bg-rose-950/70 border border-rose-500/40 text-rose-200 rounded-xl flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{locModalError}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  {lang === 'th' ? 'รหัสสถานที่ / ป้ายระบุ *' : 'Location Code / Tag *'}
                </label>
                <input
                  type="text"
                  value={locCode}
                  onChange={(e) => setLocCode(e.target.value)}
                  placeholder="e.g. QA Room, CMM Room, Tool Crib, Cleanroom-1"
                  className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  {lang === 'th' ? 'ชื่อสถานที่หรือห้องสอบเทียบเต็ม *' : 'Location Description / Full Room Name *'}
                </label>
                <input
                  type="text"
                  value={locName}
                  onChange={(e) => setLocName(e.target.value)}
                  placeholder="e.g. Primary Metrology & Inspection Laboratory"
                  className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white"
                  required
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsLocModalOpen(false)}
                  className="px-4 py-2 liquid-glass-button text-slate-300 rounded-xl transition"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={locSubmitting}
                  className="px-5 py-2 liquid-glass-primary text-white rounded-xl font-bold transition"
                >
                  {locSubmitting ? t('saving') : editingLoc ? t('save') : (lang === 'th' ? 'บันทึกสถานที่' : 'Create Location')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* IN-APP CONFIRM DELETE MODAL                                    */}
      {/* ============================================================== */}
      {deleteTarget && (
        <ConfirmModal
          isOpen={Boolean(deleteTarget)}
          variant="danger"
          isSubmitting={isDeleting}
          title={
            deleteTarget.type === 'equipment_type'
              ? (lang === 'th' ? `ลบประเภทเครื่องมือวัด: ${deleteTarget.code}` : `Delete Equipment Type: ${deleteTarget.code}`)
              : deleteTarget.type === 'department'
              ? (lang === 'th' ? `ลบแผนก: ${deleteTarget.name}` : `Delete Department: ${deleteTarget.name}`)
              : (lang === 'th' ? `ลบสถานที่: ${deleteTarget.name}` : `Delete Location: ${deleteTarget.name}`)
          }
          message={
            lang === 'th'
              ? `คุณแน่ใจหรือไม่ว่าต้องการลบ "${deleteTarget.name}" (${deleteTarget.code}) ออกจากข้อมูลหลักของระบบ?`
              : `Are you sure you want to delete "${deleteTarget.name}" (${deleteTarget.code}) from Master Data?`
          }
          detailMessage={
            deleteTarget.linkedCount > 0
              ? (lang === 'th'
                  ? `ตรวจพบเครื่องมือวัด ${deleteTarget.linkedCount} รายการที่ผูกกับข้อมูลนี้อยู่ ระบบจะทำการปลดการผูกและเปลี่ยนเป็นค่าทั่วไป (General) อัตโนมัติเพื่อให้การลบเสร็จสมบูรณ์`
                  : `There are ${deleteTarget.linkedCount} measuring instrument(s) currently linked to this item. The system will decouple and safely reassign them to General so the deletion proceeds smoothly.`)
              : undefined
          }
          checkboxLabel={
            deleteTarget.type === 'equipment_type' && deleteTarget.linkedCount > 0
              ? (lang === 'th'
                  ? `ลบเครื่องมือวัดที่ใช้ประเภทนี้ออกไปด้วย (${deleteTarget.linkedCount} รายการ)`
                  : `Also delete all ${deleteTarget.linkedCount} linked equipment items permanently`)
              : undefined
          }
          checkboxChecked={deleteLinkedEquipment}
          onCheckboxChange={setDeleteLinkedEquipment}
          confirmText={lang === 'th' ? 'ยืนยันการลบ' : 'Confirm Delete'}
          cancelText={lang === 'th' ? 'ยกเลิก' : 'Cancel'}
          onConfirm={handleExecuteDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};
