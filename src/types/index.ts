export type Role = 'Admin' | 'QA/QC' | 'Viewer';

export interface User {
  id: string;
  employee_id: string;
  name: string;
  username: string;
  department: string;
  position: string;
  role: Role;
  is_active: boolean;
  last_login?: string | null;
  created_at: string;
}

export interface EquipmentType {
  id: string;
  code: string;
  name: string;
  description: string;
  standard_frequency_months: number;
  mpe_standard?: string;
}

export type CalibrationStatus =
  | 'CALIBRATION OK'
  | 'DUE IN 10 DAYS'
  | 'DUE IN 7 DAYS'
  | 'DUE IN 5 DAYS'
  | 'DUE TODAY'
  | 'OVERDUE'
  | 'INACTIVE';

export interface Equipment {
  id: string;
  equipment_id: string;
  equipment_name: string;
  equipment_type_code: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  asset_number: string;
  location: string;
  department: string;
  responsible_person: string;
  range: string;
  resolution: string;
  accuracy: string;
  calibration_frequency: number; // in months
  last_calibration_date: string; // YYYY-MM-DD
  next_calibration_date: string; // YYYY-MM-DD
  status: CalibrationStatus;
  calibration_certificate_no: string;
  calibration_lab: string;
  remarks: string;
  is_active: boolean;
  remaining_days?: number;
  created_at: string;
  updated_at: string;
}

export type CalibrationResult =
  | 'PASS'
  | 'FAIL'
  | 'ADJUSTED'
  | 'LIMITED USE'
  | 'OUT OF SERVICE';

export interface AxisActualData {
  uncertainty?: string | number; // e.g. "0.0008 mm" or 0.0008
  error_max?: string | number;   // e.g. "0.0012 mm" or 0.0012
  result?: string | number;      // e.g. "0.0020 mm" or 0.0020
}

export interface CalibrationRecord {
  id: string;
  calibration_id: string;
  equipment_id: string;
  equipment_name?: string;
  equipment_type?: string;
  calibration_date: string;
  previous_calibration_date?: string;
  next_calibration_date: string;
  result: CalibrationResult;
  certificate_number: string;
  calibration_lab: string;
  calibration_source?: string; // Cal. Source (In-House, External Lab, etc.)
  calibration_method: string;
  calibration_standard: string;
  as_found_result: string;
  as_left_result: string;
  cost?: number;
  technician: string;
  approved_by: string;
  remarks: string;
  attachment_url?: string;
  attachment_name?: string;
  created_at: string;

  // Actual Metrology fields (Axis X, Y, Z, MPE, Judgement, Authorized Signature):
  axis_x?: AxisActualData;
  axis_y?: AxisActualData;
  axis_z?: AxisActualData;
  overall_result?: string | number;
  mpe_standard?: string;
  judgement?: 'PASS' | 'FAIL' | string;
  authorized_by?: string;
  authorized_signature?: string;
  authorized_title?: string;
}

export type NotificationType =
  | 'DUE_10_DAYS'
  | 'DUE_7_DAYS'
  | 'DUE_5_DAYS'
  | 'DUE_TODAY'
  | 'OVERDUE';

export interface NotificationItem {
  id: string;
  equipment_id: string;
  equipment_name: string;
  equipment_type: string;
  due_date: string;
  remaining_days: number;
  notification_type: NotificationType;
  message: string;
  is_read: boolean;
  notification_date: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  employee_id: string;
  action: string;
  module: string;
  record_id: string;
  old_value?: any;
  new_value?: any;
  details?: any;
  timestamp: string;
  ip_address?: string;
}

export interface DashboardStats {
  totalEquipment: number;
  calibrationOk: number;
  dueSoon: number; // <= 10 days
  due10Days: number;
  due7Days: number;
  due5Days: number;
  dueToday: number;
  overdue: number;
  expired: number;
  completedThisMonth: number;
  byType: {
    type: string;
    typeName: string;
    total: number;
    ok: number;
    dueSoon: number;
    overdue: number;
  }[];
  byStatus: {
    status: CalibrationStatus;
    count: number;
    color: string;
  }[];
  dueByMonth: {
    month: string;
    count: number;
  }[];
  urgentList: Equipment[];
}

export interface MasterDepartment {
  id: string;
  code: string;
  name: string;
}

export interface MasterLocation {
  id: string;
  code: string;
  name: string;
}
