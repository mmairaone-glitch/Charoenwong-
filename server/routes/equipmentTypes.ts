import { Router, Response } from 'express';
import { db } from '../db.js';
import { authMiddleware, requireRoles, AuthenticatedRequest } from '../middleware.js';
import { EquipmentType, MasterDepartment, MasterLocation } from '../../src/types/index.js';

const router = Router();

// GET /api/equipment-types
router.get('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const types = db.getData().equipment_types;
  return res.json({ types });
});

// POST /api/equipment-types
router.post('/', authMiddleware, requireRoles(['Admin', 'QA/QC']), (req: AuthenticatedRequest, res: Response) => {
  const { code, name, description, standard_frequency_months, mpe_standard } = req.body;

  if (!code || !name) {
    return res.status(400).json({ error: 'Type code and name are required.' });
  }

  const types = db.getData().equipment_types;
  const exists = types.some((t) => t.code.toLowerCase() === String(code).trim().toLowerCase());
  if (exists) {
    return res.status(400).json({ error: `Equipment type code '${code}' already exists.` });
  }

  const newType: EquipmentType = {
    id: 'ET-' + Date.now(),
    code: String(code).trim().toUpperCase(),
    name: String(name).trim(),
    description: description ? String(description).trim() : '',
    standard_frequency_months: Number(standard_frequency_months) || 12,
    mpe_standard: mpe_standard ? String(mpe_standard).trim() : '',
  };

  types.push(newType);
  db.persist();

  db.logAudit({
    userId: req.user!.id,
    userName: req.user!.name,
    employeeId: req.user!.employee_id,
    action: 'CREATE_EQUIPMENT_TYPE',
    module: 'MASTER_DATA',
    recordId: newType.code,
    newValue: newType,
    ipAddress: req.ip,
  });

  return res.status(201).json({ type: newType });
});

// PUT /api/equipment-types/:id
router.put('/:id', authMiddleware, requireRoles(['Admin', 'QA/QC']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const type = db.getData().equipment_types.find((t) => t.id === id || t.code === id);

  if (!type) {
    return res.status(404).json({ error: 'Equipment type not found.' });
  }

  const oldValues = { ...type };
  const { name, description, standard_frequency_months, mpe_standard } = req.body;

  if (name) type.name = String(name).trim();
  if (description !== undefined) type.description = String(description).trim();
  if (standard_frequency_months !== undefined) type.standard_frequency_months = Number(standard_frequency_months);
  if (mpe_standard !== undefined) type.mpe_standard = String(mpe_standard).trim();

  db.persist();

  db.logAudit({
    userId: req.user!.id,
    userName: req.user!.name,
    employeeId: req.user!.employee_id,
    action: 'UPDATE_EQUIPMENT_TYPE',
    module: 'MASTER_DATA',
    recordId: type.code,
    oldValue: oldValues,
    newValue: type,
    ipAddress: req.ip,
  });

  return res.json({ type });
});

// DELETE /api/equipment-types/:id
router.delete('/:id', authMiddleware, requireRoles(['Admin', 'QA/QC']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const index = db.getData().equipment_types.findIndex((t) => t.id === id || t.code.toUpperCase() === id.toUpperCase());

  if (index === -1) {
    return res.status(404).json({ error: 'Equipment type not found.' });
  }

  const targetCode = db.getData().equipment_types[index].code;
  const deleteEquipment = req.query.deleteEquipment === 'true';

  // Check if any equipment is using this type
  const linkedEquipment = db.getData().equipment.filter((e) => e.equipment_type_code.toUpperCase() === targetCode.toUpperCase());

  if (deleteEquipment) {
    const linkedIds = new Set(linkedEquipment.map((e) => e.equipment_id));
    db.getData().equipment = db.getData().equipment.filter((e) => !linkedIds.has(e.equipment_id));
    db.getData().calibration_records = db.getData().calibration_records.filter((c) => !linkedIds.has(c.equipment_id));
  } else if (linkedEquipment.length > 0) {
    // Decouple to 'GENERAL' fallback so equipment data stays valid
    let fallback = db.getData().equipment_types.find((t) => t.code === 'GENERAL');
    if (!fallback && targetCode !== 'GENERAL') {
      fallback = {
        id: 'ET-GENERAL',
        code: 'GENERAL',
        name: 'General Instruments',
        description: 'General measuring tools',
        standard_frequency_months: 12,
      };
      db.getData().equipment_types.push(fallback);
    }
    const fallbackCode = fallback ? fallback.code : 'OTHER';
    linkedEquipment.forEach((e) => {
      e.equipment_type_code = fallbackCode;
      e.updated_at = new Date().toISOString();
    });
  }

  const deleted = db.getData().equipment_types.splice(index, 1)[0];
  db.persist();

  db.logAudit({
    userId: req.user!.id,
    userName: req.user!.name,
    employeeId: req.user!.employee_id,
    action: 'DELETE_EQUIPMENT_TYPE',
    module: 'MASTER_DATA',
    recordId: deleted.code,
    oldValue: deleted,
    ipAddress: req.ip,
  });

  return res.json({
    success: true,
    message: `Equipment type ${deleted.code} deleted successfully.`,
    reassignedCount: deleteEquipment ? 0 : linkedEquipment.length,
    deletedEquipmentCount: deleteEquipment ? linkedEquipment.length : 0,
  });
});

// ==========================================
// Departments endpoints (CRUD)
// ==========================================
router.get('/departments', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ departments: db.getData().departments });
});

router.post('/departments', authMiddleware, requireRoles(['Admin', 'QA/QC']), (req: AuthenticatedRequest, res: Response) => {
  const { code, name } = req.body;
  if (!code || !name) {
    return res.status(400).json({ error: 'Department code and name are required.' });
  }

  const trimmedCode = String(code).trim();
  const trimmedName = String(name).trim();

  const departments = db.getData().departments;
  const exists = departments.some(
    (d) => d.code.toLowerCase() === trimmedCode.toLowerCase() || d.name.toLowerCase() === trimmedName.toLowerCase()
  );
  if (exists) {
    return res.status(400).json({ error: `Department code '${trimmedCode}' or name '${trimmedName}' already exists.` });
  }

  const newDept: MasterDepartment = {
    id: 'D-' + Date.now(),
    code: trimmedCode,
    name: trimmedName,
  };

  departments.push(newDept);
  db.persist();

  db.logAudit({
    userId: req.user!.id,
    userName: req.user!.name,
    employeeId: req.user!.employee_id,
    action: 'CREATE_DEPARTMENT',
    module: 'MASTER_DATA',
    recordId: newDept.code,
    newValue: newDept,
    ipAddress: req.ip,
  });

  return res.status(201).json({ department: newDept });
});

router.put('/departments/:id', authMiddleware, requireRoles(['Admin', 'QA/QC']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const dept = db.getData().departments.find((d) => d.id === id || d.code === id);

  if (!dept) {
    return res.status(404).json({ error: 'Department not found.' });
  }

  const oldValues = { ...dept };
  const { code, name } = req.body;

  if (code) dept.code = String(code).trim();
  if (name) dept.name = String(name).trim();

  db.persist();

  db.logAudit({
    userId: req.user!.id,
    userName: req.user!.name,
    employeeId: req.user!.employee_id,
    action: 'UPDATE_DEPARTMENT',
    module: 'MASTER_DATA',
    recordId: dept.code,
    oldValue: oldValues,
    newValue: dept,
    ipAddress: req.ip,
  });

  return res.json({ department: dept });
});

router.delete('/departments/:id', authMiddleware, requireRoles(['Admin', 'QA/QC']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const departments = db.getData().departments;
  const index = departments.findIndex((d) => d.id === id || d.code.toUpperCase() === id.toUpperCase());

  if (index === -1) {
    return res.status(404).json({ error: 'Department not found.' });
  }

  const target = departments[index];

  // Gracefully decouple equipment assigned to this department
  const equipmentInDept = db.getData().equipment.filter(
    (e) => e.department.toLowerCase() === target.code.toLowerCase() || e.department.toLowerCase() === target.name.toLowerCase()
  );
  equipmentInDept.forEach((e) => {
    e.department = 'General';
    e.updated_at = new Date().toISOString();
  });

  // Gracefully decouple users registered under this department
  const usersInDept = db.getData().users.filter(
    (u) => u.department.toLowerCase() === target.code.toLowerCase() || u.department.toLowerCase() === target.name.toLowerCase()
  );
  usersInDept.forEach((u) => {
    u.department = 'General';
  });

  const deleted = departments.splice(index, 1)[0];
  db.persist();

  db.logAudit({
    userId: req.user!.id,
    userName: req.user!.name,
    employeeId: req.user!.employee_id,
    action: 'DELETE_DEPARTMENT',
    module: 'MASTER_DATA',
    recordId: deleted.code,
    oldValue: deleted,
    ipAddress: req.ip,
  });

  return res.json({
    success: true,
    message: `Department '${deleted.name}' deleted successfully.`,
    reassignedCount: equipmentInDept.length,
  });
});

// ==========================================
// Locations endpoints (CRUD)
// ==========================================
router.get('/locations', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ locations: db.getData().locations });
});

router.post('/locations', authMiddleware, requireRoles(['Admin', 'QA/QC']), (req: AuthenticatedRequest, res: Response) => {
  const { code, name } = req.body;
  if (!code || !name) {
    return res.status(400).json({ error: 'Location code and name are required.' });
  }

  const trimmedCode = String(code).trim();
  const trimmedName = String(name).trim();

  const locations = db.getData().locations;
  const exists = locations.some(
    (l) => l.code.toLowerCase() === trimmedCode.toLowerCase() || l.name.toLowerCase() === trimmedName.toLowerCase()
  );
  if (exists) {
    return res.status(400).json({ error: `Location code '${trimmedCode}' or name '${trimmedName}' already exists.` });
  }

  const newLoc: MasterLocation = {
    id: 'L-' + Date.now(),
    code: trimmedCode,
    name: trimmedName,
  };

  locations.push(newLoc);
  db.persist();

  db.logAudit({
    userId: req.user!.id,
    userName: req.user!.name,
    employeeId: req.user!.employee_id,
    action: 'CREATE_LOCATION',
    module: 'MASTER_DATA',
    recordId: newLoc.code,
    newValue: newLoc,
    ipAddress: req.ip,
  });

  return res.status(201).json({ location: newLoc });
});

router.put('/locations/:id', authMiddleware, requireRoles(['Admin', 'QA/QC']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const loc = db.getData().locations.find((l) => l.id === id || l.code === id);

  if (!loc) {
    return res.status(404).json({ error: 'Location not found.' });
  }

  const oldValues = { ...loc };
  const { code, name } = req.body;

  if (code) loc.code = String(code).trim();
  if (name) loc.name = String(name).trim();

  db.persist();

  db.logAudit({
    userId: req.user!.id,
    userName: req.user!.name,
    employeeId: req.user!.employee_id,
    action: 'UPDATE_LOCATION',
    module: 'MASTER_DATA',
    recordId: loc.code,
    oldValue: oldValues,
    newValue: loc,
    ipAddress: req.ip,
  });

  return res.json({ location: loc });
});

router.delete('/locations/:id', authMiddleware, requireRoles(['Admin', 'QA/QC']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const locations = db.getData().locations;
  const index = locations.findIndex((l) => l.id === id || l.code.toUpperCase() === id.toUpperCase());

  if (index === -1) {
    return res.status(404).json({ error: 'Location not found.' });
  }

  const target = locations[index];

  // Gracefully decouple equipment assigned to this location
  const equipmentInLoc = db.getData().equipment.filter(
    (e) => e.location.toLowerCase() === target.code.toLowerCase() || e.location.toLowerCase() === target.name.toLowerCase()
  );
  equipmentInLoc.forEach((e) => {
    e.location = 'General Storage';
    e.updated_at = new Date().toISOString();
  });

  const deleted = locations.splice(index, 1)[0];
  db.persist();

  db.logAudit({
    userId: req.user!.id,
    userName: req.user!.name,
    employeeId: req.user!.employee_id,
    action: 'DELETE_LOCATION',
    module: 'MASTER_DATA',
    recordId: deleted.code,
    oldValue: deleted,
    ipAddress: req.ip,
  });

  return res.json({
    success: true,
    message: `Location '${deleted.name}' deleted successfully.`,
    reassignedCount: equipmentInLoc.length,
  });
});

export default router;
