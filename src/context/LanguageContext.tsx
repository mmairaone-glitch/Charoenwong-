import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'th' | 'en';

export interface Translations {
  [key: string]: {
    th: string;
    en: string;
  };
}

export const translations: Translations = {
  // Brand & Header
  appTitle: {
    th: 'ระบบบริหารจัดการการสอบเทียบเครื่องมือวัดอุตสาหกรรม',
    en: 'Industrial Calibration Management System',
  },
  appShortTitle: {
    th: 'ระบบสอบเทียบ PCS-NISSIN',
    en: 'PCS-NISSIN Calibration',
  },
  appSubTitle: {
    th: 'งานมาตรวิทยาโรงงานและการติดตามเครื่องมือวัดตามมาตรฐาน ISO/IEC 17025',
    en: 'ISO/IEC 17025 Factory Metrology & Instrument Tracking',
  },
  plantVersion: {
    th: 'เวอร์ชันระบบ 2.6.4 (Liquid Glass)',
    en: 'SYSTEM VER. 2.6.4 (Liquid Glass)',
  },

  // Navigation
  navOperations: {
    th: 'การปฏิบัติงาน QA/QC',
    en: 'QA/QC Operations',
  },
  navDashboard: {
    th: 'แดชบอร์ดภาพรวม',
    en: 'Dashboard',
  },
  navEquipment: {
    th: 'ทะเบียนเครื่องมือวัด (Master)',
    en: 'Equipment Master',
  },
  navCalibrations: {
    th: 'บันทึกประวัติการสอบเทียบ',
    en: 'Calibration Records',
  },
  navNotifications: {
    th: 'การแจ้งเตือนกำหนดสอบเทียบ',
    en: 'Notifications',
  },
  navReports: {
    th: 'รายงานและส่งออก (Export)',
    en: 'Reports & Export',
  },
  navAuditLog: {
    th: 'บันทึกประวัติระบบ (Audit Trail)',
    en: 'Audit Trail',
  },
  navUsers: {
    th: 'จัดการผู้ใช้งาน (Users)',
    en: 'User Management',
  },
  navMasterData: {
    th: 'ตั้งค่าข้อมูลหลัก (Master Data)',
    en: 'Master Data',
  },

  // Actions & Common Buttons
  signIn: { th: 'เข้าสู่ระบบ', en: 'Sign In' },
  signOut: { th: 'ออกจากระบบ', en: 'Sign Out' },
  runDailyCheck: { th: 'ตรวจสอบกำหนดวันนี้', en: 'Run Daily Check' },
  sheetsConnected: { th: 'เชื่อมต่อ Sheets แล้ว', en: 'Sheets Connected' },
  connectSheets: { th: 'เชื่อมต่อ Google Sheets', en: 'Google Sheets' },
  alerts: { th: 'การแจ้งเตือน', en: 'Alerts' },
  viewAllAndManage: { th: 'ดูทั้งหมดและจัดการ', en: 'View All & Manage' },
  noAlerts: { th: 'ไม่มีการแจ้งเตือนที่รอดำเนินการ', en: 'No active calibration alerts' },
  addEquipment: { th: 'เพิ่มเครื่องมือวัด', en: 'Add Equipment' },
  recordCalibration: { th: 'บันทึกผลสอบเทียบ', en: 'Record Calibration' },
  exportData: { th: 'ส่งออกข้อมูล', en: 'Export Data' },
  refresh: { th: 'รีเฟรชข้อมูล', en: 'Refresh' },
  searchPlaceholder: { th: 'ค้นหาด้วยรหัส, ชื่อ, ผู้ผลิต, ซีเรียล...', en: 'Search ID, name, model, serial...' },
  filter: { th: 'ตัวกรอง', en: 'Filter' },
  status: { th: 'สถานะ', en: 'Status' },
  department: { th: 'แผนก', en: 'Department' },
  location: { th: 'สถานที่จัดเก็บ', en: 'Location' },
  type: { th: 'ประเภทเครื่องมือ', en: 'Type' },
  all: { th: 'ทั้งหมด', en: 'All' },
  activeOnly: { th: 'ใช้งานอยู่เท่านั้น', en: 'Active Only' },
  inactiveOnly: { th: 'ระงับ/ยกเลิกใช้งาน', en: 'Inactive Only' },
  actions: { th: 'จัดการ', en: 'Actions' },
  details: { th: 'ดูรายละเอียด', en: 'View Details' },
  edit: { th: 'แก้ไข', en: 'Edit' },
  delete: { th: 'ลบ', en: 'Delete' },
  save: { th: 'บันทึกข้อมูล', en: 'Save Changes' },
  cancel: { th: 'ยกเลิก', en: 'Cancel' },
  confirm: { th: 'ยืนยัน', en: 'Confirm' },
  close: { th: 'ปิด', en: 'Close' },
  loading: { th: 'กำลังโหลดข้อมูล...', en: 'Loading data...' },
  saving: { th: 'กำลังบันทึก...', en: 'Saving...' },

  // Dashboard Stats
  totalEquipment: { th: 'เครื่องมือวัดทั้งหมด', en: 'Total Equipment' },
  calibrationOk: { th: 'สถานะปกติ (OK)', en: 'Calibration OK' },
  dueSoon: { th: 'ใกล้ครบกำหนด (≤ 10 วัน)', en: 'Due Soon (≤ 10 Days)' },
  dueIn10Days: { th: 'ครบกำหนดใน 10 วัน', en: 'Due in 10 Days' },
  dueIn7Days: { th: 'ครบกำหนดใน 7 วัน', en: 'Due in 7 Days' },
  dueIn5Days: { th: 'ครบกำหนดใน 5 วัน', en: 'Due in 5 Days' },
  dueToday: { th: 'ครบกำหนดวันนี้', en: 'Due Today' },
  overdue: { th: 'เกินกำหนดสอบเทียบ', en: 'Overdue' },
  expired: { th: 'หมดอายุการใช้งาน', en: 'Expired' },
  completedThisMonth: { th: 'สอบเทียบแล้วเดือนนี้', en: 'Completed this Month' },
  activeInstruments: { th: 'เครื่องมือที่ใช้งานอยู่', en: 'Active Instruments' },

  // Charts & Sections
  equipmentByType: { th: 'สัดส่วนเครื่องมือวัดแยกตามประเภท', en: 'Equipment by Classification' },
  calibrationStatusBreakdown: { th: 'สถานะการสอบเทียบเครื่องมือวัด', en: 'Calibration Status Distribution' },
  upcomingScheduleByMonth: { th: 'กำหนดการสอบเทียบตามรอบเดือน (Monthly Forecast)', en: 'Upcoming Calibration Schedule by Month' },
  urgentOverdueList: { th: 'รายการด่วน: เกินกำหนดและใกล้ครบกำหนดสอบเทียบ', en: 'Urgent Action: Overdue & Upcoming Calibrations' },
  viewAllEquipment: { th: 'ดูเครื่องมือทั้งหมดในระบบ', en: 'View All Equipment' },

  // Table Columns
  colEquipmentId: { th: 'รหัสเครื่องมือ (ID)', en: 'Equipment ID' },
  colNameSpecs: { th: 'ชื่อเครื่องมือและคุณลักษณะ', en: 'Name & Specifications' },
  colType: { th: 'ประเภท', en: 'Type' },
  colLocationDept: { th: 'สถานที่ / แผนก', en: 'Location / Dept' },
  colLastCal: { th: 'สอบเทียบล่าสุด', en: 'Last Calibration' },
  colNextDue: { th: 'กำหนดครั้งถัดไป', en: 'Next Due Date' },
  colStatus: { th: 'สถานะ', en: 'Status' },
  colCertNo: { th: 'เลขที่ใบรับรอง', en: 'Cert No.' },
  colLab: { th: 'ห้องปฏิบัติการ', en: 'Calibration Lab' },
  colResult: { th: 'ผลการสอบเทียบ', en: 'Result' },
  colTechnician: { th: 'ช่าง/วิศวกร', en: 'Technician' },
  colDaysLeft: { th: 'ระยะเวลาคงเหลือ', en: 'Remaining Time' },

  // Actual Metrology Calibration Columns & Fields
  calDate: { th: 'Cal. date (วันสอบเทียบ)', en: 'Cal. date' },
  calSource: { th: 'Cal. Source (แหล่งสอบเทียบ)', en: 'Cal. Source' },
  certNo: { th: 'Certification No. (เลขที่ใบเซอร์)', en: 'Certification No.' },
  uncertaintyErrorMax: { th: 'Uncertainty + Error Max = result', en: 'Uncertainty + Error Max = result' },
  axisX: { th: 'แกน X (Axis X)', en: 'Axis X' },
  axisY: { th: 'แกน Y (Axis Y)', en: 'Axis Y' },
  axisZ: { th: 'แกน Z (Axis Z)', en: 'Axis Z' },
  overallResult: { th: 'Result รวม', en: 'Result' },
  mpeStandard: { th: 'MPE (Standard)', en: 'MPE (Standard)' },
  judgement: { th: 'Judgement (Result < MPE)', en: 'Judgement (Result < MPE)' },
  authorizedSignature: { th: 'Authorized (Signature)', en: 'Authorized (Signature)' },
  nextCalibration: { th: 'Next Calibration (กำหนดถัดไป)', en: 'Next Calibration' },
  viewModeTable: { th: 'ตาราง Actual (Table)', en: 'Actual Table' },
  viewModeCards: { th: 'การ์ดประวัติ (Cards)', en: 'Glass Cards' },
  allAxes: { th: 'แสดงทุกแกนวัด', en: 'All 3 Axes' },

  // Status Labels
  statusOk: { th: 'ปกติ (CALIBRATION OK)', en: 'CALIBRATION OK' },
  statusDue10: { th: 'ครบกำหนดใน 10 วัน', en: 'DUE IN 10 DAYS' },
  statusDue7: { th: 'ครบกำหนดใน 7 วัน', en: 'DUE IN 7 DAYS' },
  statusDue5: { th: 'ครบกำหนดใน 5 วัน', en: 'DUE IN 5 DAYS' },
  statusDueToday: { th: 'ครบกำหนดวันนี้', en: 'DUE TODAY' },
  statusOverdue: { th: 'เกินกำหนดสอบเทียบ', en: 'OVERDUE' },
  statusInactive: { th: 'ระงับการใช้งานชั่วคราว', en: 'INACTIVE' },

  // Results
  resultPass: { th: 'ผ่าน (PASS)', en: 'PASS' },
  resultFail: { th: 'ไม่ผ่าน (FAIL)', en: 'FAIL' },
  resultAdjusted: { th: 'ปรับแต่งแล้วผ่าน (ADJUSTED)', en: 'ADJUSTED' },
  resultLimited: { th: 'ใช้งานแบบจำกัด (LIMITED USE)', en: 'LIMITED USE' },
  resultOutOfService: { th: 'ระงับการใช้งาน (OUT OF SERVICE)', en: 'OUT OF SERVICE' },

  // Login
  loginHeading: { th: 'เข้าสู่ระบบบริหารการสอบเทียบ', en: 'Metrology Portal Sign In' },
  loginDesc: { th: 'ระบบสำหรับฝ่าย QA/QC บันทึก ติดตาม และสอบเทียบเครื่องมือวัดอุตสาหกรรม', en: 'Factory QA/QC Industrial Metrology & Calibration Tracker' },
  usernameLabel: { th: 'ชื่อพนักงาน หรือ Employee ID / Username', en: 'Employee Name or Employee ID / Username' },
  pinLabel: { th: 'รหัสผ่าน PIN 4 หลัก (Password)', en: '4-Digit Password PIN' },
  pinHelp: { th: 'รหัสผ่านจะถูกเข้ารหัส Hash เพื่อความปลอดภัยสูงสุด (เช่น 2097, 1234)', en: 'Passwords are cryptographic PBKDF2 hashed (e.g. 2097, 1234)' },
  demoAccountsTitle: { th: 'บัญชีทดสอบระบบตาม Role สิทธิ์การใช้งาน:', en: 'Quick Demo Accounts by Role:' },
  loginButton: { th: 'เข้าสู่ระบบ (Sign In)', en: 'Sign In to Portal' },
  authenticating: { th: 'กำลังตรวจสอบสิทธิ์...', en: 'Verifying Credentials...' },
  lockoutWarning: { th: 'ระบบป้องกันการเดารหัสผ่าน: ล็อคบัญชีชั่วคราวหลังกรอกผิดเกิน 5 ครั้ง', en: 'Security feature: Account locked after 5 failed attempts' },

  // Master Data
  departmentsHeading: { th: 'แผนกที่เกี่ยวข้อง (Departments)', en: 'Departments' },
  addDepartment: { th: 'เพิ่มแผนกใหม่', en: 'Add Department' },
  locationsHeading: { th: 'สถานที่จัดเก็บและห้องสอบเทียบ (Locations)', en: 'Quality & Tool Locations' },
  addLocation: { th: 'เพิ่มสถานที่จัดเก็บ', en: 'Add Location' },
  equipmentTypesHeading: { th: 'ประเภทเครื่องมือวัด (Equipment Types)', en: 'Equipment Types' },
  addEquipmentType: { th: 'เพิ่มประเภทเครื่องมือ', en: 'Add Equipment Type' },

  // Languages
  langThai: { th: 'ภาษาไทย', en: 'Thai' },
  langEnglish: { th: 'English', en: 'English' },
  switchLanguage: { th: 'เปลี่ยนภาษา (Switch Language)', en: 'Switch Language' },
  deleteUser: { th: 'ลบผู้ใช้งาน', en: 'Delete User' },
  deleteUserConfirm: { th: 'ยืนยันการลบผู้ใช้งาน', en: 'Confirm User Deletion' },
  deleteUserDesc: { th: 'การกระทำนี้จะลบบัญชีผู้ใช้งานนี้ออกจากระบบอย่างถาวรและไม่สามารถกู้คืนได้', en: 'This action will permanently delete this user account and cannot be undone.' },
  adminOnlyPermission: { th: 'เฉพาะผู้ดูแลระบบ (Admin) เท่านั้น', en: 'Admin Privilege Only' },
  cannotDeleteSelf: { th: 'ไม่สามารถลบบัญชีของตนเองได้', en: 'Cannot delete your own account' },
  cycle1to12Months: { th: 'รอบสอบเทียบ (เลือกได้ 1 - 12 เดือน)', en: 'Calibration Cycle (1 - 12 Months)' },
  mpeStandardSpec: { th: 'MPE (Standard) เกณฑ์ความคลาดเคลื่อนมาตรฐาน', en: 'MPE (Standard) Maximum Permissible Error' },
};

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: string, defaultText?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'th',
  setLang: () => {},
  toggleLang: () => {},
  t: (key: string, defaultText?: string) => defaultText || key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('icms_lang');
      if (saved === 'th' || saved === 'en') return saved;
    } catch (e) {
      // ignore
    }
    return 'th'; // Default to Thai per user preference
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem('icms_lang', newLang);
    } catch (e) {
      // ignore
    }
  };

  const toggleLang = () => {
    setLang(lang === 'th' ? 'en' : 'th');
  };

  const t = (key: string, defaultText?: string): string => {
    const entry = translations[key];
    if (entry && entry[lang]) {
      return entry[lang];
    }
    return defaultText || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
