import { Router, Response } from 'express';
import { db, computeStatusAndDays, getTodayDateStr } from '../db.js';
import { authMiddleware, requireRoles, AuthenticatedRequest } from '../middleware.js';
import { CalibrationRecord } from '../../src/types/index.js';

const router = Router();

// GET /api/calibrations
router.get('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { equipment_id, result, from_date, to_date } = req.query;
  let records = [...db.getData().calibration_records];

  if (equipment_id && typeof equipment_id === 'string') {
    records = records.filter((r) => r.equipment_id.toLowerCase() === equipment_id.toLowerCase());
  }

  if (result && typeof result === 'string' && result !== 'all') {
    records = records.filter((r) => r.result === result);
  }

  if (from_date && typeof from_date === 'string') {
    records = records.filter((r) => r.calibration_date >= from_date);
  }

  if (to_date && typeof to_date === 'string') {
    records = records.filter((r) => r.calibration_date <= to_date);
  }

  records.sort((a, b) => b.calibration_date.localeCompare(a.calibration_date));
  return res.json({ records, total: records.length });
});

// GET /api/calibrations/:id
router.get('/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const record = db.getData().calibration_records.find((r) => r.id === id || r.calibration_id === id);

  if (!record) {
    return res.status(404).json({ error: 'Calibration record not found.' });
  }

  return res.json({ record });
});

// POST /api/calibrations
router.post('/', authMiddleware, requireRoles(['Admin', 'QA/QC']), (req: AuthenticatedRequest, res: Response) => {
  const {
    equipment_id,
    calibration_date,
    previous_calibration_date,
    next_calibration_date,
    result,
    certificate_number,
    calibration_lab,
    calibration_source,
    calibration_method,
    calibration_standard,
    as_found_result,
    as_left_result,
    cost,
    technician,
    approved_by,
    remarks,
    attachment_url,
    attachment_name,
    axis_x,
    axis_y,
    axis_z,
    overall_result,
    mpe_standard,
    judgement,
    authorized_by,
    authorized_signature,
    authorized_title,
  } = req.body;

  if (!equipment_id || !calibration_date || !result) {
    return res.status(400).json({ error: 'Equipment ID, Calibration Date, and Result are required.' });
  }

  // Find equipment
  const eq = db.getData().equipment.find((e) => e.equipment_id.toLowerCase() === String(equipment_id).trim().toLowerCase());
  if (!eq) {
    return res.status(404).json({ error: `Equipment '${equipment_id}' not found.` });
  }

  const year = new Date(calibration_date).getFullYear() || new Date().getFullYear();
  const count = db.getData().calibration_records.length + 1;
  const calId = `CAL-${year}-${String(count).padStart(3, '0')}`;

  // If next_calibration_date is not passed, compute from equipment frequency
  let nextDate = next_calibration_date;
  if (!nextDate) {
    const d = new Date(calibration_date + 'T00:00:00Z');
    d.setUTCMonth(d.getUTCMonth() + (eq.calibration_frequency || 12));
    nextDate = d.toISOString().slice(0, 10);
  }

  const newRecord: CalibrationRecord = {
    id: 'CAL-REC-' + Date.now(),
    calibration_id: calId,
    equipment_id: eq.equipment_id,
    equipment_name: eq.equipment_name,
    equipment_type: eq.equipment_type_code,
    calibration_date,
    previous_calibration_date: previous_calibration_date || eq.last_calibration_date,
    next_calibration_date: nextDate,
    result,
    certificate_number: certificate_number ? String(certificate_number).trim() : '',
    calibration_lab: calibration_lab ? String(calibration_lab).trim() : eq.calibration_lab,
    calibration_source: calibration_source ? String(calibration_source).trim() : (calibration_lab || eq.calibration_lab),
    calibration_method: calibration_method ? String(calibration_method).trim() : '',
    calibration_standard: calibration_standard ? String(calibration_standard).trim() : '',
    as_found_result: as_found_result ? String(as_found_result).trim() : '',
    as_left_result: as_left_result ? String(as_left_result).trim() : '',
    cost: cost ? Number(cost) : undefined,
    technician: technician ? String(technician).trim() : req.user!.name,
    approved_by: approved_by ? String(approved_by).trim() : '',
    remarks: remarks ? String(remarks).trim() : '',
    attachment_url: attachment_url || '',
    attachment_name: attachment_name || '',
    axis_x: axis_x || undefined,
    axis_y: axis_y || undefined,
    axis_z: axis_z || undefined,
    overall_result: overall_result !== undefined ? overall_result : undefined,
    mpe_standard: mpe_standard ? String(mpe_standard).trim() : undefined,
    judgement: judgement || (result === 'PASS' ? 'PASS' : 'FAIL'),
    authorized_by: authorized_by ? String(authorized_by).trim() : (approved_by || req.user!.name),
    authorized_signature: authorized_signature ? String(authorized_signature).trim() : (authorized_by || req.user!.name),
    authorized_title: authorized_title ? String(authorized_title).trim() : req.user!.position,
    created_at: new Date().toISOString(),
  };

  db.getData().calibration_records.unshift(newRecord);

  // Workflow update: Equipment last_cal_date & next_cal_date updated!
  // Status reverts back to Normal / OK
  const oldEq = { ...eq };
  eq.last_calibration_date = calibration_date;
  eq.next_calibration_date = nextDate;
  if (certificate_number) eq.calibration_certificate_no = certificate_number;
  if (calibration_lab) eq.calibration_lab = calibration_lab;

  const { status, remaining_days } = computeStatusAndDays(eq.next_calibration_date, eq.is_active);
  eq.status = status;
  eq.remaining_days = remaining_days;
  eq.updated_at = new Date().toISOString();

  db.persist();

  // Audit log
  db.logAudit({
    userId: req.user!.id,
    userName: req.user!.name,
    employeeId: req.user!.employee_id,
    action: 'CREATE_CALIBRATION',
    module: 'CALIBRATION',
    recordId: newRecord.calibration_id,
    newValue: newRecord,
    ipAddress: req.ip,
  });

  return res.status(201).json({ record: newRecord, updatedEquipment: eq });
});

// PUT /api/calibrations/:id
router.put('/:id', authMiddleware, requireRoles(['Admin', 'QA/QC']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const record = db.getData().calibration_records.find((r) => r.id === id || r.calibration_id === id);

  if (!record) {
    return res.status(404).json({ error: 'Calibration record not found.' });
  }

  const oldValues = { ...record };
  const b = req.body;

  if (b.calibration_date) record.calibration_date = b.calibration_date;
  if (b.next_calibration_date) record.next_calibration_date = b.next_calibration_date;
  if (b.result) record.result = b.result;
  if (b.certificate_number !== undefined) record.certificate_number = b.certificate_number;
  if (b.calibration_lab !== undefined) record.calibration_lab = b.calibration_lab;
  if (b.calibration_source !== undefined) record.calibration_source = b.calibration_source;
  if (b.calibration_method !== undefined) record.calibration_method = b.calibration_method;
  if (b.calibration_standard !== undefined) record.calibration_standard = b.calibration_standard;
  if (b.as_found_result !== undefined) record.as_found_result = b.as_found_result;
  if (b.as_left_result !== undefined) record.as_left_result = b.as_left_result;
  if (b.cost !== undefined) record.cost = Number(b.cost);
  if (b.technician !== undefined) record.technician = b.technician;
  if (b.approved_by !== undefined) record.approved_by = b.approved_by;
  if (b.remarks !== undefined) record.remarks = b.remarks;
  if (b.attachment_url !== undefined) record.attachment_url = b.attachment_url;
  if (b.attachment_name !== undefined) record.attachment_name = b.attachment_name;
  if (b.axis_x !== undefined) record.axis_x = b.axis_x;
  if (b.axis_y !== undefined) record.axis_y = b.axis_y;
  if (b.axis_z !== undefined) record.axis_z = b.axis_z;
  if (b.overall_result !== undefined) record.overall_result = b.overall_result;
  if (b.mpe_standard !== undefined) record.mpe_standard = b.mpe_standard;
  if (b.judgement !== undefined) record.judgement = b.judgement;
  if (b.authorized_by !== undefined) record.authorized_by = b.authorized_by;
  if (b.authorized_signature !== undefined) record.authorized_signature = b.authorized_signature;
  if (b.authorized_title !== undefined) record.authorized_title = b.authorized_title;

  db.persist();

  db.logAudit({
    userId: req.user!.id,
    userName: req.user!.name,
    employeeId: req.user!.employee_id,
    action: 'UPDATE_CALIBRATION',
    module: 'CALIBRATION',
    recordId: record.calibration_id,
    oldValue: oldValues,
    newValue: record,
    ipAddress: req.ip,
  });

  return res.json({ record });
});

// DELETE /api/calibrations/:id
router.delete('/:id', authMiddleware, requireRoles(['Admin']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const index = db.getData().calibration_records.findIndex((r) => r.id === id || r.calibration_id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Calibration record not found.' });
  }

  const deleted = db.getData().calibration_records.splice(index, 1)[0];
  db.persist();

  db.logAudit({
    userId: req.user!.id,
    userName: req.user!.name,
    employeeId: req.user!.employee_id,
    action: 'DELETE_CALIBRATION',
    module: 'CALIBRATION',
    recordId: deleted.calibration_id,
    oldValue: deleted,
    ipAddress: req.ip,
  });

  return res.json({ success: true, message: `Calibration record ${deleted.calibration_id} deleted.` });
});

export default router;
