import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  Equipment,
  EquipmentType,
  CalibrationRecord,
  NotificationItem,
  AuditLog,
  MasterDepartment,
  MasterLocation,
  Role,
  CalibrationStatus,
} from '../src/types/index.js';

export interface DbUser {
  id: string;
  employee_id: string;
  name: string;
  username: string;
  pin_hash: string;
  salt: string;
  department: string;
  position: string;
  role: Role;
  is_active: boolean;
  failed_attempts: number;
  lockout_until?: number | null;
  last_login?: string | null;
  created_at: string;
}

export interface DatabaseSchema {
  users: DbUser[];
  equipment_types: EquipmentType[];
  departments: MasterDepartment[];
  locations: MasterLocation[];
  equipment: Equipment[];
  calibration_records: CalibrationRecord[];
  notifications: NotificationItem[];
  audit_logs: AuditLog[];
  sessions: { [token: string]: { userId: string; role: Role; expiresAt: number } };
}

const DB_FILE = path.resolve(process.cwd(), 'database.json');

// Helper to hash PIN
export function hashPin(pin: string, salt: string): string {
  return crypto.pbkdf2Sync(pin, salt, 10000, 64, 'sha256').toString('hex');
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function getTodayDateStr(): string {
  // Use ISO date YYYY-MM-DD
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

// Compute status and remaining days
export function computeStatusAndDays(
  nextCalDateStr: string,
  isActive: boolean,
  currentDateStr: string = getTodayDateStr()
): { status: CalibrationStatus; remaining_days: number } {
  if (!isActive) {
    return { status: 'INACTIVE', remaining_days: 0 };
  }

  const cur = new Date(currentDateStr + 'T00:00:00Z');
  const due = new Date(nextCalDateStr + 'T00:00:00Z');
  const diffTime = due.getTime() - cur.getTime();
  const remaining_days = Math.round(diffTime / (1000 * 3600 * 24));

  let status: CalibrationStatus = 'CALIBRATION OK';
  if (remaining_days < 0) {
    status = 'OVERDUE';
  } else if (remaining_days === 0) {
    status = 'DUE TODAY';
  } else if (remaining_days <= 5) {
    status = 'DUE IN 5 DAYS';
  } else if (remaining_days <= 7) {
    status = 'DUE IN 7 DAYS';
  } else if (remaining_days <= 10) {
    status = 'DUE IN 10 DAYS';
  } else {
    status = 'CALIBRATION OK';
  }

  return { status, remaining_days };
}

function createInitialDatabase(): DatabaseSchema {
  const adminSalt = generateSalt();
  const qaSalt = generateSalt();
  const viewerSalt = generateSalt();

  const today = getTodayDateStr();

  const users: DbUser[] = [
    {
      id: 'USR-001',
      employee_id: 'ADMIN001',
      name: 'System Admin',
      username: 'ADMIN001',
      pin_hash: hashPin('2097', adminSalt),
      salt: adminSalt,
      department: 'QA/QC',
      position: 'QA Manager & System Administrator',
      role: 'Admin',
      is_active: true,
      failed_attempts: 0,
      lockout_until: null,
      last_login: today,
      created_at: '2026-01-01T08:00:00.000Z',
    },
    {
      id: 'USR-002',
      employee_id: 'QA001',
      name: 'Somsak QA Engineer',
      username: 'QA001',
      pin_hash: hashPin('1234', qaSalt),
      salt: qaSalt,
      department: 'QA/QC',
      position: 'Senior QA / Calibration Engineer',
      role: 'QA/QC',
      is_active: true,
      failed_attempts: 0,
      lockout_until: null,
      last_login: today,
      created_at: '2026-01-05T08:00:00.000Z',
    },
    {
      id: 'USR-003',
      employee_id: 'VIEW001',
      name: 'Wichai Production Lead',
      username: 'VIEW001',
      pin_hash: hashPin('2099', viewerSalt),
      salt: viewerSalt,
      department: 'Production',
      position: 'Production Line 1 Supervisor',
      role: 'Viewer',
      is_active: true,
      failed_attempts: 0,
      lockout_until: null,
      last_login: today,
      created_at: '2026-02-01T08:00:00.000Z',
    },
  ];

  const equipment_types: EquipmentType[] = [
    { id: 'ET-1', code: 'CMM', name: 'Coordinate Measuring Machine', description: 'เครื่องวัดพิกัด 3 มิติความแม่นยำสูง', standard_frequency_months: 12, mpe_standard: '±0.0030 mm' },
    { id: 'ET-2', code: 'VMM', name: 'Vision Measuring Machine', description: 'เครื่องวัดขนาดด้วยแสงและกล้องความละเอียดสูง', standard_frequency_months: 12, mpe_standard: '±0.0025 mm' },
    { id: 'ET-3', code: 'DG', name: 'Digital Gauge', description: 'เกจวัดดิจิตอล ไดอัลเกจ เกจความลึก', standard_frequency_months: 6, mpe_standard: '±0.0050 mm' },
    { id: 'ET-4', code: 'MM', name: 'Micrometer', description: 'ไมโครมิเตอร์วัดนอก วัดใน และวัดลึก', standard_frequency_months: 6, mpe_standard: '±0.0020 mm' },
    { id: 'ET-5', code: 'VC', name: 'Vernier Caliper', description: 'เวอร์เนียร์คาลิปเปอร์ ดิจิตอลและอนาล็อก', standard_frequency_months: 6, mpe_standard: '±0.0200 mm' },
    { id: 'ET-6', code: 'PG', name: 'Pin Gauge', description: 'พินเกจวัดรูและขนาดภายใน', standard_frequency_months: 12, mpe_standard: '±0.0010 mm' },
    { id: 'ET-7', code: 'BG', name: 'Block Gauge', description: 'เกจบล็อคมาตรฐานอ้างอิงความแม่นยำ Grade 0, 1', standard_frequency_months: 12, mpe_standard: '±0.0005 mm' },
    { id: 'ET-8', code: 'Height Gauge', name: 'Digital Height Gauge', description: 'เครื่องวัดความสูงดิจิตอลอเนกประสงค์', standard_frequency_months: 12, mpe_standard: '±0.0100 mm' },
    { id: 'ET-9', code: 'Surface Roughness Tester', name: 'Surface Roughness Tester', description: 'เครื่องทดสอบความหยาบผิวชิ้นงาน', standard_frequency_months: 12, mpe_standard: '±0.0500 µm' },
    { id: 'ET-10', code: 'Profile Projector', name: 'Profile Projector / Optical Comparator', description: 'เครื่องฉายภาพตรวจสอบขนาดชิ้นงานอุตสาหกรรม', standard_frequency_months: 12, mpe_standard: '±0.0080 mm' },
    { id: 'ET-11', code: 'Torque Gauge', name: 'Torque Gauge & Screwdriver', description: 'เกจวัดแรงบิดมาตรฐานการประกอบ', standard_frequency_months: 6, mpe_standard: '±0.5% F.S.' },
    { id: 'ET-12', code: 'Force Gauge', name: 'Digital Force Gauge', description: 'เกจวัดแรงดึงและแรงกดชิ้นงาน', standard_frequency_months: 6, mpe_standard: '±0.2% F.S.' },
  ];

  const departments: MasterDepartment[] = [
    { id: 'D-1', code: 'QA/QC', name: 'Quality Assurance & Quality Control' },
    { id: 'D-2', code: 'Machining', name: 'CNC Machining Division' },
    { id: 'D-3', code: 'Assembly', name: 'Precision Assembly Line' },
    { id: 'D-4', code: 'Tooling', name: 'Tool & Die Maintenance' },
    { id: 'D-5', code: 'R&D', name: 'Research & Metrology Lab' },
  ];

  const locations: MasterLocation[] = [
    { id: 'L-1', code: 'QA Room', name: 'QA Main Metrology Lab' },
    { id: 'L-2', code: 'CMM Room', name: 'CMM Controlled Environment Room' },
    { id: 'L-3', code: 'Line 1', name: 'Production Line 1 Inspection Station' },
    { id: 'L-4', code: 'Line 2', name: 'Production Line 2 Machining Station' },
    { id: 'L-5', code: 'Line 3', name: 'Production Line 3 Assembly Station' },
    { id: 'L-6', code: 'Tool Crib', name: 'Tool & Gauge Storage Crib A' },
  ];

  // Helper date offset function relative to current date (2026-09-28)
  const addDays = (days: number): string => {
    const d = new Date(today + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  };

  const rawEquipment = [
    {
      id: 'EQ-001',
      equipment_id: 'VC-001',
      equipment_name: 'Digital Vernier Caliper 150mm',
      equipment_type_code: 'VC',
      manufacturer: 'Mitutoyo',
      model: '500-196-30 AOS',
      serial_number: '21098471',
      asset_number: 'AST-QC-2024-001',
      location: 'QA Room',
      department: 'QA/QC',
      responsible_person: 'Somsak QA Engineer',
      range: '0 - 150 mm',
      resolution: '0.01 mm',
      accuracy: '±0.02 mm',
      calibration_frequency: 6,
      last_calibration_date: addDays(-175),
      next_calibration_date: addDays(5), // Due in 5 Days
      status: 'DUE IN 5 DAYS' as CalibrationStatus,
      calibration_certificate_no: 'CERT-2026-0391',
      calibration_lab: 'Mitutoyo Thailand Cal Lab',
      remarks: 'Primary inspection tool for Line 1 sampling',
      is_active: true,
      created_at: '2025-01-10T09:00:00.000Z',
      updated_at: '2026-03-25T10:00:00.000Z',
    },
    {
      id: 'EQ-002',
      equipment_id: 'CAL-CMM-001',
      equipment_name: 'Coordinate Measuring Machine',
      equipment_type_code: 'CMM',
      manufacturer: 'ZEISS',
      model: 'CONTURA 7/10/6 RDS',
      serial_number: '123456',
      asset_number: 'AST-QC-CMM-01',
      location: 'CMM Room',
      department: 'QA/QC',
      responsible_person: 'System Admin',
      range: '700 x 1000 x 600 mm',
      resolution: '0.0001 mm',
      accuracy: '1.5 + L/350 µm',
      calibration_frequency: 12,
      last_calibration_date: addDays(-358),
      next_calibration_date: addDays(7), // Due in 7 Days
      status: 'DUE IN 7 DAYS' as CalibrationStatus,
      calibration_certificate_no: 'ZEISS-CAL-2025-882',
      calibration_lab: 'ZEISS Metrology Services (ISO/IEC 17025)',
      remarks: 'Laser interferometer calibrated, high precision room 20±0.5°C',
      is_active: true,
      created_at: '2024-09-15T09:00:00.000Z',
      updated_at: '2025-09-15T09:00:00.000Z',
    },
    {
      id: 'EQ-003',
      equipment_id: 'MM-023',
      equipment_name: 'Digital Outside Micrometer',
      equipment_type_code: 'MM',
      manufacturer: 'Mitutoyo',
      model: '293-240-30 IP65',
      serial_number: '8839201',
      asset_number: 'AST-PRD-MM-023',
      location: 'Line 2',
      department: 'Machining',
      responsible_person: 'Wichai Production Lead',
      range: '0 - 25 mm',
      resolution: '0.001 mm',
      accuracy: '±1 µm',
      calibration_frequency: 6,
      last_calibration_date: addDays(-180),
      next_calibration_date: addDays(0), // Due Today!
      status: 'DUE TODAY' as CalibrationStatus,
      calibration_certificate_no: 'CERT-2026-0344',
      calibration_lab: 'Thai-German Institute (TGI)',
      remarks: 'Requires immediate recalibration today before night shift',
      is_active: true,
      created_at: '2025-03-28T09:00:00.000Z',
      updated_at: '2026-03-28T09:00:00.000Z',
    },
    {
      id: 'EQ-004',
      equipment_id: 'DG-021',
      equipment_name: 'Digital Indicator Gauge',
      equipment_type_code: 'DG',
      manufacturer: 'Mitutoyo',
      model: 'ID-C112XB Digimatic',
      serial_number: '5542019',
      asset_number: 'AST-PRD-DG-021',
      location: 'Line 3',
      department: 'Assembly',
      responsible_person: 'Prasit Assembly Lead',
      range: '12.7 mm / 0.5 in',
      resolution: '0.001 mm',
      accuracy: '±0.003 mm',
      calibration_frequency: 6,
      last_calibration_date: addDays(-183),
      next_calibration_date: addDays(-3), // Overdue by 3 days!
      status: 'OVERDUE' as CalibrationStatus,
      calibration_certificate_no: 'CERT-2026-0129',
      calibration_lab: 'In-House Metrology Lab',
      remarks: 'Calibration expired 3 days ago. QA hold tag placed.',
      is_active: true,
      created_at: '2025-03-25T09:00:00.000Z',
      updated_at: '2026-03-25T09:00:00.000Z',
    },
    {
      id: 'EQ-005',
      equipment_id: 'MM-010',
      equipment_name: 'Blade Outside Micrometer',
      equipment_type_code: 'MM',
      manufacturer: 'Mitutoyo',
      model: '122-101 Non-rotating',
      serial_number: '7192031',
      asset_number: 'AST-MCH-MM-010',
      location: 'Line 2',
      department: 'Machining',
      responsible_person: 'Somsak QA Engineer',
      range: '0 - 25 mm',
      resolution: '0.01 mm',
      accuracy: '±3 µm',
      calibration_frequency: 6,
      last_calibration_date: addDays(-170),
      next_calibration_date: addDays(10), // Due in 10 Days
      status: 'DUE IN 10 DAYS' as CalibrationStatus,
      calibration_certificate_no: 'CERT-2026-0412',
      calibration_lab: 'Thai-German Institute (TGI)',
      remarks: 'Key tool for narrow groove measurements',
      is_active: true,
      created_at: '2025-04-05T09:00:00.000Z',
      updated_at: '2026-04-05T09:00:00.000Z',
    },
    {
      id: 'EQ-006',
      equipment_id: 'VC-008',
      equipment_name: 'Dial Caliper 200mm',
      equipment_type_code: 'VC',
      manufacturer: 'Mahr',
      model: 'MarCal 16 FN',
      serial_number: '4410982',
      asset_number: 'AST-TOL-VC-008',
      location: 'Tool Crib',
      department: 'Tooling',
      responsible_person: 'Anan Tooling Officer',
      range: '0 - 200 mm',
      resolution: '0.02 mm',
      accuracy: '±0.03 mm',
      calibration_frequency: 6,
      last_calibration_date: addDays(-176),
      next_calibration_date: addDays(4), // Due in 5 Days
      status: 'DUE IN 5 DAYS' as CalibrationStatus,
      calibration_certificate_no: 'CERT-2026-0388',
      calibration_lab: 'National Institute of Metrology (Thailand) NIMT',
      remarks: 'Used for tooling insert verification',
      is_active: true,
      created_at: '2025-04-01T09:00:00.000Z',
      updated_at: '2026-04-01T09:00:00.000Z',
    },
    {
      id: 'EQ-007',
      equipment_id: 'SRT-001',
      equipment_name: 'Surface Roughness Tester',
      equipment_type_code: 'Surface Roughness Tester',
      manufacturer: 'Taylor Hobson',
      model: 'Surtronic S-128',
      serial_number: 'TH-99412',
      asset_number: 'AST-QC-SRT-01',
      location: 'QA Room',
      department: 'QA/QC',
      responsible_person: 'System Admin',
      range: 'Ra: 0.01 - 40 µm',
      resolution: '0.001 µm',
      accuracy: '±2% of reading',
      calibration_frequency: 12,
      last_calibration_date: addDays(-372),
      next_calibration_date: addDays(-7), // Overdue by 7 days!
      status: 'OVERDUE' as CalibrationStatus,
      calibration_certificate_no: 'CERT-TH-2025-104',
      calibration_lab: 'NIMT Thailand Calibration Center',
      remarks: 'Calibration overdue by 7 days. Scheduled for vendor pick-up.',
      is_active: true,
      created_at: '2024-09-20T09:00:00.000Z',
      updated_at: '2025-09-20T09:00:00.000Z',
    },
    {
      id: 'EQ-008',
      equipment_id: 'BG-005',
      equipment_name: 'Rectangular Gauge Block Set 87 pcs',
      equipment_type_code: 'BG',
      manufacturer: 'Mitutoyo',
      model: '516-946-10 Steel Grade 0',
      serial_number: 'GB-887102',
      asset_number: 'AST-QC-BG-005',
      location: 'QA Room',
      department: 'QA/QC',
      responsible_person: 'Somsak QA Engineer',
      range: '1.001 - 100.000 mm',
      resolution: 'Grade 0 ISO 3650',
      accuracy: '±0.12 µm to ±0.20 µm',
      calibration_frequency: 12,
      last_calibration_date: addDays(-197),
      next_calibration_date: addDays(168), // OK, ~5.5 months remaining
      status: 'CALIBRATION OK' as CalibrationStatus,
      calibration_certificate_no: 'NIMT-DIM-2026-0811',
      calibration_lab: 'National Institute of Metrology (Thailand) NIMT',
      remarks: 'Primary factory reference standard. Handled with gloves only.',
      is_active: true,
      created_at: '2024-03-15T09:00:00.000Z',
      updated_at: '2026-03-15T09:00:00.000Z',
    },
    {
      id: 'EQ-009',
      equipment_id: 'PG-012',
      equipment_name: 'Precision Pin Gauge Set 0.01 Step',
      equipment_type_code: 'PG',
      manufacturer: 'Eisen',
      model: 'EP Series Class 1',
      serial_number: 'ES-12009',
      asset_number: 'AST-TOL-PG-012',
      location: 'Tool Crib',
      department: 'Tooling',
      responsible_person: 'Anan Tooling Officer',
      range: '1.000 - 10.000 mm',
      resolution: '0.010 mm step',
      accuracy: '±0.5 µm',
      calibration_frequency: 12,
      last_calibration_date: addDays(-251),
      next_calibration_date: addDays(114), // OK
      status: 'CALIBRATION OK' as CalibrationStatus,
      calibration_certificate_no: 'CERT-2026-0155',
      calibration_lab: 'Mitutoyo Thailand Cal Lab',
      remarks: 'Calibrated pin by pin. No corrosion detected.',
      is_active: true,
      created_at: '2024-01-20T09:00:00.000Z',
      updated_at: '2026-01-20T09:00:00.000Z',
    },
    {
      id: 'EQ-010',
      equipment_id: 'VMM-002',
      equipment_name: 'Vision Measuring System CNC',
      equipment_type_code: 'VMM',
      manufacturer: 'Nikon',
      model: 'iNEXIV VMA-2520',
      serial_number: 'NK-55102',
      asset_number: 'AST-QC-VMM-002',
      location: 'QA Room',
      department: 'QA/QC',
      responsible_person: 'Somsak QA Engineer',
      range: '250 x 200 x 200 mm',
      resolution: '0.1 µm',
      accuracy: '2 + 8L/1000 µm',
      calibration_frequency: 12,
      last_calibration_date: addDays(-292),
      next_calibration_date: addDays(73), // OK
      status: 'CALIBRATION OK' as CalibrationStatus,
      calibration_certificate_no: 'NIKON-CAL-2025-419',
      calibration_lab: 'Nikon Authorized Calibration Lab',
      remarks: 'Laser autofocus and stage squareness calibrated',
      is_active: true,
      created_at: '2024-12-10T09:00:00.000Z',
      updated_at: '2025-12-10T09:00:00.000Z',
    },
    {
      id: 'EQ-011',
      equipment_id: 'HG-001',
      equipment_name: 'Digital Height Gauge 600mm',
      equipment_type_code: 'Height Gauge',
      manufacturer: 'TESA',
      model: 'Micro-Hite 600',
      serial_number: 'TESA-9011',
      asset_number: 'AST-QC-HG-001',
      location: 'QA Room',
      department: 'QA/QC',
      responsible_person: 'System Admin',
      range: '0 - 615 mm',
      resolution: '0.001 mm',
      accuracy: '2 + 3L/1000 µm',
      calibration_frequency: 12,
      last_calibration_date: addDays(-169),
      next_calibration_date: addDays(196), // OK
      status: 'CALIBRATION OK' as CalibrationStatus,
      calibration_certificate_no: 'CERT-2026-0499',
      calibration_lab: 'Thai-German Institute (TGI)',
      remarks: 'Granite surface plate zero verified',
      is_active: true,
      created_at: '2024-04-12T09:00:00.000Z',
      updated_at: '2026-04-12T09:00:00.000Z',
    },
    {
      id: 'EQ-012',
      equipment_id: 'DG-003',
      equipment_name: 'Bore Gauge with Digital Indicator',
      equipment_type_code: 'DG',
      manufacturer: 'Mitutoyo',
      model: '511-723 Digimatic',
      serial_number: '4881023',
      asset_number: 'AST-PRD-DG-003',
      location: 'Line 1',
      department: 'QA/QC',
      responsible_person: 'Wichai Production Lead',
      range: '50 - 150 mm',
      resolution: '0.001 mm',
      accuracy: '±0.003 mm',
      calibration_frequency: 6,
      last_calibration_date: addDays(-135),
      next_calibration_date: addDays(48), // OK
      status: 'CALIBRATION OK' as CalibrationStatus,
      calibration_certificate_no: 'CERT-2026-0610',
      calibration_lab: 'In-House Metrology Lab',
      remarks: 'Cylinder bore diameter verification tool',
      is_active: true,
      created_at: '2025-05-15T09:00:00.000Z',
      updated_at: '2026-05-15T09:00:00.000Z',
    },
    {
      id: 'EQ-013',
      equipment_id: 'VC-014',
      equipment_name: 'Digital Caliper IP67 200mm',
      equipment_type_code: 'VC',
      manufacturer: 'Mitutoyo',
      model: '500-703-20 Coolant Proof',
      serial_number: '6610992',
      asset_number: 'AST-MCH-VC-014',
      location: 'Line 2',
      department: 'Machining',
      responsible_person: 'Somsak QA Engineer',
      range: '0 - 200 mm',
      resolution: '0.01 mm',
      accuracy: '±0.02 mm',
      calibration_frequency: 6,
      last_calibration_date: addDays(-172),
      next_calibration_date: addDays(8), // Due in 10 Days
      status: 'DUE IN 10 DAYS' as CalibrationStatus,
      calibration_certificate_no: 'CERT-2026-0420',
      calibration_lab: 'Mitutoyo Thailand Cal Lab',
      remarks: 'Waterproof coolant proof caliper on CNC Line 2',
      is_active: true,
      created_at: '2025-04-08T09:00:00.000Z',
      updated_at: '2026-04-08T09:00:00.000Z',
    },
    {
      id: 'EQ-014',
      equipment_id: 'TG-001',
      equipment_name: 'Digital Torque Screwdriver',
      equipment_type_code: 'Torque Gauge',
      manufacturer: 'Tohnichi',
      model: 'STC200CN2-G',
      serial_number: 'TN-44219',
      asset_number: 'AST-ASM-TG-001',
      location: 'Line 3',
      department: 'Assembly',
      responsible_person: 'Prasit Assembly Lead',
      range: '40 - 200 cN·m',
      resolution: '0.1 cN·m',
      accuracy: '±1%',
      calibration_frequency: 6,
      last_calibration_date: addDays(-174),
      next_calibration_date: addDays(6), // Due in 7 Days
      status: 'DUE IN 7 DAYS' as CalibrationStatus,
      calibration_certificate_no: 'CERT-2026-0399',
      calibration_lab: 'Thai-German Institute (TGI)',
      remarks: 'Critical fastener torque control station',
      is_active: true,
      created_at: '2025-03-30T09:00:00.000Z',
      updated_at: '2026-03-30T09:00:00.000Z',
    },
    {
      id: 'EQ-015',
      equipment_id: 'PP-001',
      equipment_name: 'Profile Projector 300mm',
      equipment_type_code: 'Profile Projector',
      manufacturer: 'Mitutoyo',
      model: 'PJ-A3000',
      serial_number: 'PJ-8831',
      asset_number: 'AST-QC-PP-001',
      location: 'QA Room',
      department: 'QA/QC',
      responsible_person: 'System Admin',
      range: 'XY Stage: 150 x 50 mm',
      resolution: '0.001 mm',
      accuracy: '3 + 0.02L µm',
      calibration_frequency: 12,
      last_calibration_date: addDays(-10), // Calibrated 10 days ago (completed this month)
      next_calibration_date: addDays(355),
      status: 'CALIBRATION OK' as CalibrationStatus,
      calibration_certificate_no: 'CERT-2026-0915',
      calibration_lab: 'Mitutoyo Thailand Cal Lab',
      remarks: 'Recently calibrated with 10X lens magnification verification',
      is_active: true,
      created_at: '2024-09-18T09:00:00.000Z',
      updated_at: addDays(-10) + 'T10:00:00.000Z',
    },
  ];

  // Recompute exact status and remaining_days
  const equipment: Equipment[] = rawEquipment.map((eq) => {
    const { status, remaining_days } = computeStatusAndDays(eq.next_calibration_date, eq.is_active, today);
    return {
      ...eq,
      status,
      remaining_days,
    };
  });

  const calibration_records: CalibrationRecord[] = [
    {
      id: 'CAL-REC-001',
      calibration_id: 'CAL-2026-001',
      equipment_id: 'PP-001',
      equipment_name: 'Profile Projector 300mm',
      equipment_type: 'Profile Projector',
      calibration_date: addDays(-10),
      previous_calibration_date: addDays(-375),
      next_calibration_date: addDays(355),
      result: 'PASS',
      certificate_number: 'CERT-2026-0915',
      calibration_lab: 'Mitutoyo Thailand Cal Lab',
      calibration_source: 'External Accredited Lab (Mitutoyo)',
      calibration_method: 'ISO/IEC 17025 Accredited Standard Optical Comparison',
      calibration_standard: 'Glass Scale Standard JIS Grade 1 #GS-9901',
      as_found_result: 'Within allowable error limit (Max deviation +0.0012mm)',
      as_left_result: 'Standard calibrated and verified (Deviation +0.0006mm)',
      cost: 5500,
      technician: 'Kittipong Metrology Spec',
      approved_by: 'System Admin',
      remarks: 'Magnification 10X, 20X, 50X checked. Protractor screen aligned.',
      attachment_url: '',
      attachment_name: 'Mitutoyo_CERT_2026_0915.pdf',
      axis_x: { uncertainty: '0.0008 mm', error_max: '0.0011 mm', result: '0.0019 mm' },
      axis_y: { uncertainty: '0.0008 mm', error_max: '0.0012 mm', result: '0.0020 mm' },
      axis_z: { uncertainty: '0.0006 mm', error_max: '0.0009 mm', result: '0.0015 mm' },
      overall_result: '0.0020 mm',
      mpe_standard: '±0.0030 mm',
      judgement: 'PASS',
      authorized_by: 'System Admin',
      authorized_signature: 'Dr. Somchai P. (QA Director)',
      authorized_title: 'Head of Quality Assurance & Metrology',
      created_at: addDays(-10) + 'T11:00:00.000Z',
    },
    {
      id: 'CAL-REC-002',
      calibration_id: 'CAL-2026-002',
      equipment_id: 'BG-005',
      equipment_name: 'Rectangular Gauge Block Set 87 pcs',
      equipment_type: 'BG',
      calibration_date: addDays(-197),
      previous_calibration_date: addDays(-562),
      next_calibration_date: addDays(168),
      result: 'PASS',
      certificate_number: 'NIMT-DIM-2026-0811',
      calibration_lab: 'National Institute of Metrology (Thailand) NIMT',
      calibration_source: 'National Metrology Institute (NIMT)',
      calibration_method: 'Interferometric and Mechanical Comparison ISO 3650',
      calibration_standard: 'NIMT Primary Length Standard Iodine-stabilized He-Ne Laser',
      as_found_result: 'All 87 blocks within Grade 0 tolerance envelope',
      as_left_result: 'Passed Grade 0 standard specifications with expanded uncertainty k=2',
      cost: 18500,
      technician: 'Dr. Prasert NIMT Metrologist',
      approved_by: 'System Admin',
      remarks: 'Wringing test passed, thermal expansion coefficient 11.5x10^-6/K verified',
      attachment_url: '',
      attachment_name: 'NIMT_Gauge_Block_Grade0_Cert.pdf',
      axis_x: { uncertainty: '0.04 µm', error_max: '0.08 µm', result: '0.12 µm' },
      axis_y: { uncertainty: '0.04 µm', error_max: '0.07 µm', result: '0.11 µm' },
      axis_z: { uncertainty: '0.03 µm', error_max: '0.06 µm', result: '0.09 µm' },
      overall_result: '0.12 µm',
      mpe_standard: '±0.20 µm',
      judgement: 'PASS',
      authorized_by: 'System Admin',
      authorized_signature: 'Dr. Prasert NIMT (Chief Signatory)',
      authorized_title: 'Senior Metrologist / NIMT Lead Certifier',
      created_at: addDays(-197) + 'T14:30:00.000Z',
    },
    {
      id: 'CAL-REC-003',
      calibration_id: 'CAL-2026-003',
      equipment_id: 'CAL-CMM-001',
      equipment_name: 'Coordinate Measuring Machine',
      equipment_type: 'CMM',
      calibration_date: addDays(-358),
      previous_calibration_date: addDays(-723),
      next_calibration_date: addDays(7),
      result: 'ADJUSTED',
      certificate_number: 'ZEISS-CAL-2025-882',
      calibration_lab: 'ZEISS Metrology Services (ISO/IEC 17025)',
      calibration_source: 'OEM Certified Lab (ZEISS Metrology)',
      calibration_method: 'ISO 10360-2 Volumetric Length Measurement Error Calibration',
      calibration_standard: 'Step Gauge 1000mm & Ball Plate Reference Standard',
      as_found_result: 'Y-axis pitch deviation at 800mm exceeded 2.2 µm',
      as_left_result: 'CAA (Computer Aided Accuracy) compensation adjusted. E0,MPE = 1.3 µm',
      cost: 45000,
      technician: 'Martin Weigel (ZEISS Lead Service Specialist)',
      approved_by: 'System Admin',
      remarks: 'Annual complete preventive maintenance and geometric calibration completed',
      attachment_url: '',
      attachment_name: 'ZEISS_CONTURA_CalReport_2025.pdf',
      axis_x: { uncertainty: '0.45 µm', error_max: '0.82 µm', result: '1.27 µm' },
      axis_y: { uncertainty: '0.50 µm', error_max: '0.91 µm', result: '1.41 µm' },
      axis_z: { uncertainty: '0.48 µm', error_max: '0.85 µm', result: '1.33 µm' },
      overall_result: '1.41 µm',
      mpe_standard: '1.50 + L/350 µm (Max 2.5 µm)',
      judgement: 'PASS',
      authorized_by: 'System Admin',
      authorized_signature: 'Martin Weigel (ZEISS Cert. #8812)',
      authorized_title: 'Accredited Lead Metrology Engineer',
      created_at: addDays(-358) + 'T16:00:00.000Z',
    },
    {
      id: 'CAL-REC-004',
      calibration_id: 'CAL-2026-004',
      equipment_id: 'VC-001',
      equipment_name: 'Digital Vernier Caliper 150mm',
      equipment_type: 'VC',
      calibration_date: addDays(-175),
      previous_calibration_date: addDays(-355),
      next_calibration_date: addDays(5),
      result: 'PASS',
      certificate_number: 'CERT-2026-0391',
      calibration_lab: 'Mitutoyo Thailand Cal Lab',
      calibration_source: 'Mitutoyo Authorized Lab',
      calibration_method: 'JIS B 7507 Standard Calibration Protocol',
      calibration_standard: 'Gauge Block Set Grade 1 & Caliper Checker',
      as_found_result: 'Outside jaw parallelism: 0.004mm, Reading: ±0.01mm',
      as_left_result: 'Passed all 5 calibration points (20, 50, 80, 100, 150 mm)',
      cost: 450,
      technician: 'Charnchai K.',
      approved_by: 'Somsak QA Engineer',
      remarks: 'Cleaned sliding guide and replaced battery SR44',
      attachment_url: '',
      attachment_name: 'VC001_Mitutoyo_Cert.pdf',
      axis_x: { uncertainty: '0.005 mm', error_max: '0.008 mm', result: '0.013 mm' },
      axis_y: { uncertainty: '0.004 mm', error_max: '0.006 mm', result: '0.010 mm' },
      axis_z: { uncertainty: '0.003 mm', error_max: '0.005 mm', result: '0.008 mm' },
      overall_result: '0.013 mm',
      mpe_standard: '±0.020 mm',
      judgement: 'PASS',
      authorized_by: 'Somsak QA Engineer',
      authorized_signature: 'Somsak QA Engineer (Verified)',
      authorized_title: 'Senior QA / Calibration Engineer',
      created_at: addDays(-175) + 'T10:00:00.000Z',
    },
    {
      id: 'CAL-REC-005',
      calibration_id: 'CAL-2026-005',
      equipment_id: 'VMM-002',
      equipment_name: 'Vision Measuring System CNC',
      equipment_type: 'VMM',
      calibration_date: addDays(-292),
      previous_calibration_date: addDays(-657),
      next_calibration_date: addDays(73),
      result: 'PASS',
      certificate_number: 'NIKON-CAL-2025-419',
      calibration_lab: 'Nikon Authorized Calibration Lab',
      calibration_source: 'External Lab - Nikon Metrology',
      calibration_method: 'VDI/VDE 2617 Accuracy of Optical Measuring Systems',
      calibration_standard: 'Nikon 2D Calibration Glass Plate Standard #N-77',
      as_found_result: 'Stage repeat error 0.6 µm, optical center deviation 0.4 µm',
      as_left_result: 'Fully aligned and calibrated within Class 1 limits',
      cost: 28000,
      technician: 'Kenji Takahashi',
      approved_by: 'System Admin',
      remarks: 'Optical zoom lens 1X-8X calibrated. Autofocus laser verification passed.',
      attachment_url: '',
      attachment_name: 'Nikon_VMA2520_Cert.pdf',
      axis_x: { uncertainty: '0.60 µm', error_max: '0.95 µm', result: '1.55 µm' },
      axis_y: { uncertainty: '0.55 µm', error_max: '0.88 µm', result: '1.43 µm' },
      axis_z: { uncertainty: '0.70 µm', error_max: '1.10 µm', result: '1.80 µm' },
      overall_result: '1.80 µm',
      mpe_standard: '2.0 + 8L/1000 µm (Max 2.8 µm)',
      judgement: 'PASS',
      authorized_by: 'System Admin',
      authorized_signature: 'Kenji Takahashi (Nikon Cert.)',
      authorized_title: 'Nikon Metrology Senior Specialist',
      created_at: addDays(-292) + 'T11:20:00.000Z',
    },
  ];

  // Initial Notifications generated based on current status
  const notifications: NotificationItem[] = [
    {
      id: 'NOTIF-001',
      equipment_id: 'DG-021',
      equipment_name: 'Digital Indicator Gauge',
      equipment_type: 'DG',
      due_date: addDays(-3),
      remaining_days: -3,
      notification_type: 'OVERDUE',
      message: 'Equipment DG-021 is OVERDUE by 3 days! Calibration due date was ' + addDays(-3),
      is_read: false,
      notification_date: today,
      created_at: today + 'T08:00:00.000Z',
    },
    {
      id: 'NOTIF-002',
      equipment_id: 'SRT-001',
      equipment_name: 'Surface Roughness Tester',
      equipment_type: 'Surface Roughness Tester',
      due_date: addDays(-7),
      remaining_days: -7,
      notification_type: 'OVERDUE',
      message: 'Equipment SRT-001 is OVERDUE by 7 days! Calibration due date was ' + addDays(-7),
      is_read: false,
      notification_date: today,
      created_at: today + 'T08:00:00.000Z',
    },
    {
      id: 'NOTIF-003',
      equipment_id: 'MM-023',
      equipment_name: 'Digital Outside Micrometer',
      equipment_type: 'MM',
      due_date: addDays(0),
      remaining_days: 0,
      notification_type: 'DUE_TODAY',
      message: 'Equipment MM-023 is DUE TODAY! Recalibration required on ' + today,
      is_read: false,
      notification_date: today,
      created_at: today + 'T08:00:00.000Z',
    },
    {
      id: 'NOTIF-004',
      equipment_id: 'VC-008',
      equipment_name: 'Dial Caliper 200mm',
      equipment_type: 'VC',
      due_date: addDays(4),
      remaining_days: 4,
      notification_type: 'DUE_5_DAYS',
      message: 'Equipment VC-008 is DUE IN 4 DAYS! Due date: ' + addDays(4),
      is_read: false,
      notification_date: today,
      created_at: today + 'T08:00:00.000Z',
    },
    {
      id: 'NOTIF-005',
      equipment_id: 'VC-001',
      equipment_name: 'Digital Vernier Caliper 150mm',
      equipment_type: 'VC',
      due_date: addDays(5),
      remaining_days: 5,
      notification_type: 'DUE_5_DAYS',
      message: 'Equipment VC-001 is DUE IN 5 DAYS! Due date: ' + addDays(5),
      is_read: false,
      notification_date: today,
      created_at: today + 'T08:00:00.000Z',
    },
    {
      id: 'NOTIF-006',
      equipment_id: 'TG-001',
      equipment_name: 'Digital Torque Screwdriver',
      equipment_type: 'Torque Gauge',
      due_date: addDays(6),
      remaining_days: 6,
      notification_type: 'DUE_7_DAYS',
      message: 'Equipment TG-001 is DUE IN 6 DAYS! Due date: ' + addDays(6),
      is_read: false,
      notification_date: today,
      created_at: today + 'T08:00:00.000Z',
    },
    {
      id: 'NOTIF-007',
      equipment_id: 'CAL-CMM-001',
      equipment_name: 'Coordinate Measuring Machine',
      equipment_type: 'CMM',
      due_date: addDays(7),
      remaining_days: 7,
      notification_type: 'DUE_7_DAYS',
      message: 'Equipment CAL-CMM-001 is DUE IN 7 DAYS! Due date: ' + addDays(7),
      is_read: false,
      notification_date: today,
      created_at: today + 'T08:00:00.000Z',
    },
    {
      id: 'NOTIF-008',
      equipment_id: 'VC-014',
      equipment_name: 'Digital Caliper IP67 200mm',
      equipment_type: 'VC',
      due_date: addDays(8),
      remaining_days: 8,
      notification_type: 'DUE_10_DAYS',
      message: 'Equipment VC-014 is DUE IN 8 DAYS! Due date: ' + addDays(8),
      is_read: true,
      notification_date: today,
      created_at: today + 'T07:30:00.000Z',
    },
    {
      id: 'NOTIF-009',
      equipment_id: 'MM-010',
      equipment_name: 'Blade Outside Micrometer',
      equipment_type: 'MM',
      due_date: addDays(10),
      remaining_days: 10,
      notification_type: 'DUE_10_DAYS',
      message: 'Equipment MM-010 is DUE IN 10 DAYS! Due date: ' + addDays(10),
      is_read: true,
      notification_date: today,
      created_at: today + 'T07:30:00.000Z',
    },
  ];

  const audit_logs: AuditLog[] = [
    {
      id: 'AUD-001',
      user_id: 'USR-001',
      user_name: 'System Admin',
      employee_id: 'ADMIN001',
      action: 'SYSTEM_INITIALIZATION',
      module: 'SYSTEM',
      record_id: 'SYS-INIT',
      old_value: null,
      new_value: { message: 'ICMS Industrial Calibration Management System initialized with master data' },
      timestamp: '2026-01-01T08:00:00.000Z',
      ip_address: '127.0.0.1',
    },
    {
      id: 'AUD-002',
      user_id: 'USR-001',
      user_name: 'System Admin',
      employee_id: 'ADMIN001',
      action: 'CREATE_EQUIPMENT',
      module: 'EQUIPMENT',
      record_id: 'CAL-CMM-001',
      old_value: null,
      new_value: { equipment_id: 'CAL-CMM-001', type: 'CMM', manufacturer: 'ZEISS', model: 'CONTURA' },
      timestamp: '2026-01-05T09:30:00.000Z',
      ip_address: '192.168.1.100',
    },
    {
      id: 'AUD-003',
      user_id: 'USR-002',
      user_name: 'Somsak QA Engineer',
      employee_id: 'QA001',
      action: 'CREATE_CALIBRATION',
      module: 'CALIBRATION',
      record_id: 'CAL-2026-001',
      old_value: null,
      new_value: { equipment_id: 'PP-001', result: 'PASS', cert: 'CERT-2026-0915' },
      timestamp: addDays(-10) + 'T11:00:00.000Z',
      ip_address: '192.168.1.105',
    },
  ];

  return {
    users,
    equipment_types,
    departments,
    locations,
    equipment,
    calibration_records,
    notifications,
    audit_logs,
    sessions: {},
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
    // Backfill standard MPE values if not present
    if (this.data && this.data.equipment_types) {
      const mpeDefaults: Record<string, string> = {
        'CMM': '±0.0030 mm',
        'VMM': '±0.0025 mm',
        'DG': '±0.0050 mm',
        'MM': '±0.0020 mm',
        'VC': '±0.0200 mm',
        'PG': '±0.0010 mm',
        'BG': '±0.0005 mm',
        'Height Gauge': '±0.0100 mm',
        'Surface Roughness Tester': '±0.0500 µm',
        'Profile Projector': '±0.0080 mm',
        'Torque Gauge': '±0.5% F.S.',
        'Force Gauge': '±0.2% F.S.',
      };
      for (const t of this.data.equipment_types) {
        if (!t.mpe_standard && mpeDefaults[t.code]) {
          t.mpe_standard = mpeDefaults[t.code];
        }
      }
    }
    this.refreshAllStatuses();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Error loading DB file, creating initial DB:', err);
    }
    const initial = createInitialDatabase();
    this.save(initial);
    return initial;
  }

  private save(dataToSave?: DatabaseSchema) {
    try {
      const data = dataToSave || this.data;
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving DB file:', err);
    }
  }

  public getData(): DatabaseSchema {
    return this.data;
  }

  public persist() {
    this.save();
  }

  // Recalculate status for all equipment based on today
  public refreshAllStatuses(currentDateStr: string = getTodayDateStr()) {
    for (const eq of this.data.equipment) {
      const { status, remaining_days } = computeStatusAndDays(eq.next_calibration_date, eq.is_active, currentDateStr);
      eq.status = status;
      eq.remaining_days = remaining_days;
    }
    this.persist();
  }

  // Audit Log helper
  public logAudit(params: {
    userId: string;
    userName: string;
    employeeId: string;
    action: string;
    module: string;
    recordId: string;
    oldValue?: any;
    newValue?: any;
    ipAddress?: string;
  }) {
    const log: AuditLog = {
      id: 'AUD-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      user_id: params.userId,
      user_name: params.userName,
      employee_id: params.employeeId,
      action: params.action,
      module: params.module,
      record_id: params.recordId,
      old_value: params.oldValue ?? null,
      new_value: params.newValue ?? null,
      timestamp: new Date().toISOString(),
      ip_address: params.ipAddress || '127.0.0.1',
    };
    this.data.audit_logs.unshift(log);
    // Keep max 1000 audit logs
    if (this.data.audit_logs.length > 1000) {
      this.data.audit_logs = this.data.audit_logs.slice(0, 1000);
    }
    this.persist();
    return log;
  }

  // Daily Scheduler: check equipment and trigger notifications
  public runNotificationScheduler(currentDateStr: string = getTodayDateStr()): {
    newNotificationsCount: number;
    checkedCount: number;
  } {
    this.refreshAllStatuses(currentDateStr);
    let newNotificationsCount = 0;

    for (const eq of this.data.equipment) {
      if (!eq.is_active) continue;

      const remaining = eq.remaining_days ?? 0;
      let notificationType: NotificationItem['notification_type'] | null = null;
      let message = '';

      if (remaining < 0) {
        notificationType = 'OVERDUE';
        message = `Equipment ${eq.equipment_id} (${eq.equipment_name}) is OVERDUE by ${Math.abs(remaining)} days! Due was ${eq.next_calibration_date}`;
      } else if (remaining === 0) {
        notificationType = 'DUE_TODAY';
        message = `Equipment ${eq.equipment_id} (${eq.equipment_name}) is DUE TODAY! Recalibration required immediately.`;
      } else if (remaining <= 5) {
        notificationType = 'DUE_5_DAYS';
        message = `Equipment ${eq.equipment_id} (${eq.equipment_name}) is DUE IN ${remaining} DAYS! Due date: ${eq.next_calibration_date}`;
      } else if (remaining <= 7) {
        notificationType = 'DUE_7_DAYS';
        message = `Equipment ${eq.equipment_id} (${eq.equipment_name}) is DUE IN ${remaining} DAYS! Due date: ${eq.next_calibration_date}`;
      } else if (remaining <= 10) {
        notificationType = 'DUE_10_DAYS';
        message = `Equipment ${eq.equipment_id} (${eq.equipment_name}) is DUE IN ${remaining} DAYS! Due date: ${eq.next_calibration_date}`;
      }

      if (notificationType) {
        // Prevent duplicate notification on the same date for the same equipment and type
        const exists = this.data.notifications.some(
          (n) =>
            n.equipment_id === eq.equipment_id &&
            n.notification_type === notificationType &&
            n.notification_date === currentDateStr
        );

        if (!exists) {
          const newNotif: NotificationItem = {
            id: 'NOTIF-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            equipment_id: eq.equipment_id,
            equipment_name: eq.equipment_name,
            equipment_type: eq.equipment_type_code,
            due_date: eq.next_calibration_date,
            remaining_days: remaining,
            notification_type: notificationType,
            message,
            is_read: false,
            notification_date: currentDateStr,
            created_at: new Date().toISOString(),
          };
          this.data.notifications.unshift(newNotif);
          newNotificationsCount++;
        }
      }
    }

    this.persist();
    return {
      newNotificationsCount,
      checkedCount: this.data.equipment.length,
    };
  }
}

export const db = new Database();
