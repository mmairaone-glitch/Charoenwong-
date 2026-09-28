import React, { useState, useEffect } from 'react';
import { Equipment, EquipmentType, MasterDepartment, MasterLocation } from '../types/index.js';
import { api } from '../services/api.js';
import { X, Save, AlertTriangle, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';

interface EquipmentFormModalProps {
  initialEquipment?: Equipment | null;
  onClose: () => void;
  onSaved: () => void;
}

export const EquipmentFormModal: React.FC<EquipmentFormModalProps> = ({
  initialEquipment,
  onClose,
  onSaved,
}) => {
  const { t, lang } = useLanguage();
  const isEdit = Boolean(initialEquipment);

  const [equipmentId, setEquipmentId] = useState(initialEquipment?.equipment_id || '');
  const [equipmentName, setEquipmentName] = useState(initialEquipment?.equipment_name || '');
  const [typeCode, setTypeCode] = useState(initialEquipment?.equipment_type_code || 'VC');
  const [manufacturer, setManufacturer] = useState(initialEquipment?.manufacturer || '');
  const [model, setModel] = useState(initialEquipment?.model || '');
  const [serialNumber, setSerialNumber] = useState(initialEquipment?.serial_number || '');
  const [assetNumber, setAssetNumber] = useState(initialEquipment?.asset_number || '');
  const [location, setLocation] = useState(initialEquipment?.location || 'QA Room');
  const [department, setDepartment] = useState(initialEquipment?.department || 'QA/QC');
  const [responsiblePerson, setResponsiblePerson] = useState(initialEquipment?.responsible_person || '');
  const [range, setRange] = useState(initialEquipment?.range || '');
  const [resolution, setResolution] = useState(initialEquipment?.resolution || '');
  const [accuracy, setAccuracy] = useState(initialEquipment?.accuracy || '');
  const [frequency, setFrequency] = useState<number>(initialEquipment?.calibration_frequency || 12);
  const [lastCalDate, setLastCalDate] = useState(
    initialEquipment?.last_calibration_date || new Date().toISOString().slice(0, 10)
  );
  const [nextCalDate, setNextCalDate] = useState(initialEquipment?.next_calibration_date || '');
  const [certNo, setCertNo] = useState(initialEquipment?.calibration_certificate_no || '');
  const [lab, setLab] = useState(initialEquipment?.calibration_lab || '');
  const [remarks, setRemarks] = useState(initialEquipment?.remarks || '');
  const [isActive, setIsActive] = useState<boolean>(
    initialEquipment?.is_active !== undefined ? initialEquipment.is_active : true
  );

  const [types, setTypes] = useState<EquipmentType[]>([]);
  const [departments, setDepartments] = useState<MasterDepartment[]>([]);
  const [locations, setLocations] = useState<MasterLocation[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-calculate next due date when last date or frequency changes
  useEffect(() => {
    if (lastCalDate && frequency) {
      const d = new Date(lastCalDate + 'T00:00:00Z');
      d.setUTCMonth(d.getUTCMonth() + Number(frequency));
      setNextCalDate(d.toISOString().slice(0, 10));
    }
  }, [lastCalDate, frequency]);

  // Load master dropdown options
  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [typesRes, deptRes, locRes] = await Promise.all([
          api.getEquipmentTypes(),
          api.getDepartments(),
          api.getLocations(),
        ]);
        setTypes(typesRes.types);
        setDepartments(deptRes.departments);
        setLocations(locRes.locations);

        if (!isEdit) {
          if (typesRes.types.length > 0 && (!typeCode || !typesRes.types.some((t) => t.code === typeCode))) {
            setTypeCode(typesRes.types[0].code);
          }
          if (deptRes.departments.length > 0 && (!department || !deptRes.departments.some((d) => d.code === department || d.name === department))) {
            setDepartment(deptRes.departments[0].code);
          }
          if (locRes.locations.length > 0 && (!location || !locRes.locations.some((l) => l.code === location || l.name === location))) {
            setLocation(locRes.locations[0].code);
          }
        }
      } catch (err) {
        console.error('Failed to load masters', err);
      }
    };
    loadMasters();
  }, [isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!equipmentId.trim() || !equipmentName.trim() || !typeCode) {
      setError(lang === 'th' ? 'กรุณากรอกรหัสเครื่องมือ, ชื่อเครื่องมือ และประเภทเครื่องมือ' : 'Equipment ID, Name, and Equipment Type are required.');
      return;
    }

    setLoading(true);
    try {
      const payload: Partial<Equipment> = {
        equipment_id: equipmentId.trim().toUpperCase(),
        equipment_name: equipmentName.trim(),
        equipment_type_code: typeCode,
        manufacturer: manufacturer.trim(),
        model: model.trim(),
        serial_number: serialNumber.trim(),
        asset_number: assetNumber.trim(),
        location: location.trim(),
        department: department.trim(),
        responsible_person: responsiblePerson.trim(),
        range: range.trim(),
        resolution: resolution.trim(),
        accuracy: accuracy.trim(),
        calibration_frequency: Number(frequency),
        last_calibration_date: lastCalDate,
        next_calibration_date: nextCalDate,
        calibration_certificate_no: certNo.trim(),
        calibration_lab: lab.trim(),
        remarks: remarks.trim(),
        is_active: isActive,
      };

      if (isEdit && initialEquipment) {
        await api.updateEquipment(initialEquipment.id, payload);
      } else {
        await api.createEquipment(payload);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save equipment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="liquid-glass-panel border border-white/20 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-950/60 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>
              {isEdit
                ? (lang === 'th' ? `แก้ไขข้อมูลเครื่องมือวัด: ${initialEquipment?.equipment_id}` : `Edit Equipment: ${initialEquipment?.equipment_id}`)
                : (lang === 'th' ? 'ลงทะเบียนเครื่องมือวัดใหม่' : 'Register New Calibration Equipment')}
            </span>
            <Sparkles className="w-4 h-4 text-teal-400" />
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl liquid-glass-button transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t('colEquipmentId')} *
              </label>
              <input
                type="text"
                disabled={isEdit}
                value={equipmentId}
                onChange={(e) => setEquipmentId(e.target.value.toUpperCase())}
                placeholder="e.g. CAL-CMM-001"
                className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white font-mono text-xs disabled:opacity-60"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {lang === 'th' ? 'ชื่อเครื่องมือวัด *' : 'Equipment Name *'}
              </label>
              <input
                type="text"
                value={equipmentName}
                onChange={(e) => setEquipmentName(e.target.value)}
                placeholder="e.g. Coordinate Measuring Machine"
                className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t('colType')} *
              </label>
              <select
                value={typeCode}
                onChange={(e) => {
                  const val = e.target.value;
                  setTypeCode(val);
                  if (!isEdit) {
                    const matched = types.find((t) => t.code === val);
                    if (matched) {
                      if (matched.standard_frequency_months) {
                        setFrequency(matched.standard_frequency_months);
                      }
                      if (matched.mpe_standard && !accuracy) {
                        setAccuracy(matched.mpe_standard);
                      }
                    }
                  }
                }}
                className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white text-xs"
              >
                {types.map((tItem) => (
                  <option key={tItem.id} value={tItem.code}>
                    {tItem.code} - {tItem.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {lang === 'th' ? 'ผู้ผลิต (Manufacturer)' : 'Manufacturer'}
              </label>
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="e.g. ZEISS, Mitutoyo"
                className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {lang === 'th' ? 'รุ่น (Model)' : 'Model Number'}
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. CONTURA 7/10/6"
                className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {lang === 'th' ? 'หมายเลขซีเรียล (Serial Number)' : 'Serial Number'}
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="e.g. 123456"
                className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Asset Number / Tag
              </label>
              <input
                type="text"
                value={assetNumber}
                onChange={(e) => setAssetNumber(e.target.value)}
                placeholder="e.g. AST-2026-90"
                className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t('location')}
              </label>
              {locations.length > 0 ? (
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white text-xs"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white text-xs"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t('department')}
              </label>
              {departments.length > 0 ? (
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white text-xs"
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.name}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white text-xs"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {lang === 'th' ? 'ผู้รับผิดชอบ' : 'Responsible Person'}
              </label>
              <input
                type="text"
                value={responsiblePerson}
                onChange={(e) => setResponsiblePerson(e.target.value)}
                placeholder="e.g. Somsak T."
                className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {lang === 'th' ? 'ช่วงการวัด (Range)' : 'Measurement Range'}
              </label>
              <input
                type="text"
                value={range}
                onChange={(e) => setRange(e.target.value)}
                placeholder="e.g. 0-150 mm"
                className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {lang === 'th' ? 'ความละเอียด (Resolution)' : 'Resolution'}
              </label>
              <input
                type="text"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="e.g. 0.01 mm"
                className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {lang === 'th' ? 'ความแม่นยำ (Accuracy)' : 'Accuracy'}
              </label>
              <input
                type="text"
                value={accuracy}
                onChange={(e) => setAccuracy(e.target.value)}
                placeholder="e.g. ±0.02 mm"
                className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {lang === 'th' ? 'รอบสอบเทียบ (เดือน) *' : 'Calibration Frequency (Mo) *'}
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={frequency}
                onChange={(e) => setFrequency(Number(e.target.value))}
                className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white text-xs font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t('colLastCal')} *
              </label>
              <input
                type="date"
                value={lastCalDate}
                onChange={(e) => setLastCalDate(e.target.value)}
                className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white text-xs font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t('colNextDue')} *
              </label>
              <input
                type="date"
                value={nextCalDate}
                onChange={(e) => setNextCalDate(e.target.value)}
                className="w-full px-3 py-2 liquid-glass-input rounded-xl text-teal-300 font-bold text-xs font-mono"
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
                placeholder="e.g. CERT-2026-0891"
                className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t('colLab')}
              </label>
              <input
                type="text"
                value={lab}
                onChange={(e) => setLab(e.target.value)}
                placeholder="e.g. Internal Metrology Lab / NIMT"
                className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {lang === 'th' ? 'หมายเหตุ (Remarks)' : 'Remarks'}
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={lang === 'th' ? 'ข้อมูลเพิ่มเติม เช่น หมายเหตุการใช้งาน สภาพเครื่องมือ...' : 'Additional notes regarding usage, tolerances, condition...'}
              className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white text-xs"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActiveCheck"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded bg-slate-950 border-white/20 text-teal-500 focus:ring-teal-400 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="isActiveCheck" className="text-xs font-medium text-slate-300 cursor-pointer">
              {lang === 'th' ? 'เครื่องมือวัดเปิดใช้งานอยู่ (Active in Service)' : 'Instrument Active in Service (Uncheck to retire or mark inactive)'}
            </label>
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
              <span>{loading ? t('saving') : t('save')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
