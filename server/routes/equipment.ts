import { Router, Response } from 'express';
import { db, computeStatusAndDays, getTodayDateStr } from '../db.js';
import { authMiddleware, requireRoles, AuthenticatedRequest } from '../middleware.js';
import { Equipment } from '../../src/types/index.js';

const router = Router();

// Helper to compute next date from last date + frequency months
function calculateNextDueDate(lastCalDate: string, frequencyMonths: number): string {
  const d = new Date(lastCalDate + 'T00:00:00Z');
  d.setUTCMonth(d.getUTCMonth() + frequencyMonths);
  return d.toISOString().slice(0, 10);
}

// GET /api/equipment
router.get('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  // Always refresh statuses to current date
  db.refreshAllStatuses();

  let list = [...db.getData().equipment];
  const { search, type, department, location, status, lab, responsible, active, sortBy, sortOrder } = req.query;

  // Active filter
  if (active !== undefined && active !== 'all') {
    const isActive = active === 'true';
    list = list.filter((eq) => eq.is_active === isActive);
  }

  // Search
  if (search && typeof search === 'string' && search.trim() !== '') {
    const q = search.trim().toLowerCase();
    list = list.filter(
      (eq) =>
        eq.equipment_id.toLowerCase().includes(q) ||
        eq.equipment_name.toLowerCase().includes(q) ||
        eq.serial_number.toLowerCase().includes(q) ||
        eq.asset_number.toLowerCase().includes(q) ||
        eq.manufacturer.toLowerCase().includes(q) ||
        eq.model.toLowerCase().includes(q)
    );
  }

  // Type filter
  if (type && typeof type === 'string' && type !== 'all') {
    list = list.filter((eq) => eq.equipment_type_code.toLowerCase() === type.toLowerCase());
  }

  // Department filter
  if (department && typeof department === 'string' && department !== 'all') {
    list = list.filter((eq) => eq.department.toLowerCase() === department.toLowerCase());
  }

  // Location filter
  if (location && typeof location === 'string' && location !== 'all') {
    list = list.filter((eq) => eq.location.toLowerCase() === location.toLowerCase());
  }

  // Lab filter
  if (lab && typeof lab === 'string' && lab !== 'all') {
    list = list.filter((eq) => eq.calibration_lab.toLowerCase().includes(lab.toLowerCase()));
  }

  // Responsible person filter
  if (responsible && typeof responsible === 'string' && responsible !== 'all') {
    list = list.filter((eq) => eq.responsible_person.toLowerCase().includes(responsible.toLowerCase()));
  }

  // Status filter
  if (status && typeof status === 'string' && status !== 'all') {
    if (status === 'DUE_SOON') {
      list = list.filter((eq) => (eq.remaining_days ?? 999) <= 10 && (eq.remaining_days ?? 999) >= 0 && eq.is_active);
    } else {
      list = list.filter((eq) => eq.status === status);
    }
  }

  // Sorting
  const order = sortOrder === 'desc' ? -1 : 1;
  const key = (sortBy as string) || 'equipment_id';

  list.sort((a, b) => {
    if (key === 'next_calibration_date') {
      return a.next_calibration_date.localeCompare(b.next_calibration_date) * order;
    }
    if (key === 'remaining_days') {
      return ((a.remaining_days ?? 0) - (b.remaining_days ?? 0)) * order;
    }
    if (key === 'status') {
      return a.status.localeCompare(b.status) * order;
    }
    if (key === 'equipment_type_code') {
      return a.equipment_type_code.localeCompare(b.equipment_type_code) * order;
    }
    return a.equipment_id.localeCompare(b.equipment_id) * order;
  });

  return res.json({ equipment: list, total: list.length });
});

// GET /api/equipment/:id
router.get('/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const eq = db.getData().equipment.find((e) => e.id === id || e.equipment_id.toLowerCase() === id.toLowerCase());

  if (!eq) {
    return res.status(404).json({ error: 'Equipment not found.' });
  }

  // Calibration history
  const history = db
    .getData()
    .calibration_records.filter((c) => c.equipment_id === eq.equipment_id)
    .sort((a, b) => b.calibration_date.localeCompare(a.calibration_date));

  // Audit history for this equipment
  const auditLogs = db
    .getData()
    .audit_logs.filter((a) => a.record_id === eq.equipment_id || a.record_id === eq.id)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return res.json({
    equipment: eq,
    history,
    auditLogs,
  });
});

// POST /api/equipment
router.post('/', authMiddleware, requireRoles(['Admin', 'QA/QC']), (req: AuthenticatedRequest, res: Response) => {
  const {
    equipment_id,
    equipment_name,
    equipment_type_code,
    manufacturer,
    model,
    serial_number,
    asset_number,
    location,
    department,
    responsible_person,
    range,
    resolution,
    accuracy,
    calibration_frequency,
    last_calibration_date,
    next_calibration_date,
    calibration_certificate_no,
    calibration_lab,
    remarks,
    is_active,
  } = req.body;

  if (!equipment_id || !equipment_name || !equipment_type_code) {
    return res.status(400).json({ error: 'Equipment ID, Name, and Equipment Type are required.' });
  }

  // Check unique equipment_id
  const exists = db.getData().equipment.some((e) => e.equipment_id.toLowerCase() === String(equipment_id).trim().toLowerCase());
  if (exists) {
    return res.status(400).json({ error: `Equipment ID '${equipment_id}' already exists. Please choose a unique ID.` });
  }

  const freq = Number(calibration_frequency) || 12;
  const lastCal = last_calibration_date || getTodayDateStr();
  const nextCal = next_calibration_date || calculateNextDueDate(lastCal, freq);
  const activeStatus = is_active !== undefined ? Boolean(is_active) : true;

  const { status, remaining_days } = computeStatusAndDays(nextCal, activeStatus);

  const newEquipment: Equipment = {
    id: 'EQ-' + Date.now(),
    equipment_id: String(equipment_id).trim().toUpperCase(),
    equipment_name: String(equipment_name).trim(),
    equipment_type_code: String(equipment_type_code).trim(),
    manufacturer: manufacturer ? String(manufacturer).trim() : '',
    model: model ? String(model).trim() : '',
    serial_number: serial_number ? String(serial_number).trim() : '',
    asset_number: asset_number ? String(asset_number).trim() : '',
    location: location ? String(location).trim() : '',
    department: department ? String(department).trim() : '',
    responsible_person: responsible_person ? String(responsible_person).trim() : '',
    range: range ? String(range).trim() : '',
    resolution: resolution ? String(resolution).trim() : '',
    accuracy: accuracy ? String(accuracy).trim() : '',
    calibration_frequency: freq,
    last_calibration_date: lastCal,
    next_calibration_date: nextCal,
    status,
    remaining_days,
    calibration_certificate_no: calibration_certificate_no ? String(calibration_certificate_no).trim() : '',
    calibration_lab: calibration_lab ? String(calibration_lab).trim() : '',
    remarks: remarks ? String(remarks).trim() : '',
    is_active: activeStatus,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.getData().equipment.unshift(newEquipment);
  db.persist();

  db.logAudit({
    userId: req.user!.id,
    userName: req.user!.name,
    employeeId: req.user!.employee_id,
    action: 'CREATE_EQUIPMENT',
    module: 'EQUIPMENT',
    recordId: newEquipment.equipment_id,
    newValue: newEquipment,
    ipAddress: req.ip,
  });

  return res.status(201).json({ equipment: newEquipment });
});

// PUT /api/equipment/:id
router.put('/:id', authMiddleware, requireRoles(['Admin', 'QA/QC']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const eq = db.getData().equipment.find((e) => e.id === id || e.equipment_id.toLowerCase() === id.toLowerCase());

  if (!eq) {
    return res.status(404).json({ error: 'Equipment not found.' });
  }

  const oldValues = { ...eq };
  const b = req.body;

  if (b.equipment_name) eq.equipment_name = String(b.equipment_name).trim();
  if (b.equipment_type_code) eq.equipment_type_code = String(b.equipment_type_code).trim();
  if (b.manufacturer !== undefined) eq.manufacturer = String(b.manufacturer).trim();
  if (b.model !== undefined) eq.model = String(b.model).trim();
  if (b.serial_number !== undefined) eq.serial_number = String(b.serial_number).trim();
  if (b.asset_number !== undefined) eq.asset_number = String(b.asset_number).trim();
  if (b.location !== undefined) eq.location = String(b.location).trim();
  if (b.department !== undefined) eq.department = String(b.department).trim();
  if (b.responsible_person !== undefined) eq.responsible_person = String(b.responsible_person).trim();
  if (b.range !== undefined) eq.range = String(b.range).trim();
  if (b.resolution !== undefined) eq.resolution = String(b.resolution).trim();
  if (b.accuracy !== undefined) eq.accuracy = String(b.accuracy).trim();
  if (b.calibration_frequency !== undefined) eq.calibration_frequency = Number(b.calibration_frequency);
  if (b.last_calibration_date) eq.last_calibration_date = b.last_calibration_date;
  if (b.next_calibration_date) {
    eq.next_calibration_date = b.next_calibration_date;
  } else if (b.last_calibration_date && b.calibration_frequency) {
    eq.next_calibration_date = calculateNextDueDate(eq.last_calibration_date, eq.calibration_frequency);
  }
  if (b.calibration_certificate_no !== undefined) eq.calibration_certificate_no = String(b.calibration_certificate_no).trim();
  if (b.calibration_lab !== undefined) eq.calibration_lab = String(b.calibration_lab).trim();
  if (b.remarks !== undefined) eq.remarks = String(b.remarks).trim();
  if (b.is_active !== undefined) eq.is_active = Boolean(b.is_active);

  const { status, remaining_days } = computeStatusAndDays(eq.next_calibration_date, eq.is_active);
  eq.status = status;
  eq.remaining_days = remaining_days;
  eq.updated_at = new Date().toISOString();

  db.persist();

  db.logAudit({
    userId: req.user!.id,
    userName: req.user!.name,
    employeeId: req.user!.employee_id,
    action: 'UPDATE_EQUIPMENT',
    module: 'EQUIPMENT',
    recordId: eq.equipment_id,
    oldValue: oldValues,
    newValue: eq,
    ipAddress: req.ip,
  });

  return res.json({ equipment: eq });
});

// DELETE /api/equipment/:id
router.delete('/:id', authMiddleware, requireRoles(['Admin', 'QA/QC']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const index = db.getData().equipment.findIndex((e) => e.id === id || e.equipment_id.toLowerCase() === id.toLowerCase());

  if (index === -1) {
    return res.status(404).json({ error: 'Equipment not found.' });
  }

  const deleted = db.getData().equipment.splice(index, 1)[0];

  // Also remove associated calibration records
  const recordsBefore = db.getData().calibration_records.length;
  db.getData().calibration_records = db.getData().calibration_records.filter(
    (c) => c.equipment_id !== deleted.equipment_id
  );
  const deletedRecordsCount = recordsBefore - db.getData().calibration_records.length;

  db.persist();

  db.logAudit({
    userId: req.user!.id,
    userName: req.user!.name,
    employeeId: req.user!.employee_id,
    action: 'DELETE_EQUIPMENT',
    module: 'EQUIPMENT',
    recordId: deleted.equipment_id,
    oldValue: deleted,
    ipAddress: req.ip,
  });

  return res.json({
    success: true,
    message: `Equipment ${deleted.equipment_id} deleted successfully.`,
    deletedCalibrationRecords: deletedRecordsCount,
  });
});

export default router;
