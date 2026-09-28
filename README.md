# Industrial Calibration Management System (ICMS)

ระบบบริหารจัดการและติดตามการสอบเทียบเครื่องมือวัดในโรงงานอุตสาหกรรม (ISO/IEC 17025 & ISO 9001 Compliant)

---

## 1. ข้อมูลผู้ใช้งานเริ่มต้น (Default Test Accounts)

| Role | Employee ID / Username | Password PIN (4 หลัก) | สิทธิ์การใช้งาน |
| :--- | :--- | :--- | :--- |
| **Admin** | `ADMIN001` | `2097` | สิทธิ์สูงสุด: เพิ่ม/แก้/ลบ Equipment, จัดการ User, Reset PIN, ดู Audit Log, Master Data |
| **QA/QC** | `QA001` | `1234` | เพิ่ม/แก้ไข Equipment, บันทึกผลสอบเทียบ, จัดการการแจ้งเตือน, Export รายงาน |
| **Viewer** | `VIEW001` | `2099` | อ่านอย่างเดียว: ดู Dashboard, ดูสถานะเครื่องมือ, ดูประวัติ, Export รายงาน |

> **หมายเหตุความปลอดภัย:** รหัสผ่าน 4 หลักถูกจัดเก็บแบบ Hash (PBKDF2 SHA-256 + Salt 10,000 รอบ) พร้อมระบบ Rate-limiting และป้องกันการเดารหัสผ่าน (หากผิดติดต่อกัน 5 ครั้ง จะล็อกบัญชี 15 นาทีอัตโนมัติ)

---

## 2. โครงสร้างเครื่องมือวัดเริ่มต้น (Initial Equipment Types)

* **CMM** (Coordinate Measuring Machine) — รอบมาตรฐาน 12 เดือน
* **VMM** (Vision Measuring Machine) — รอบมาตรฐาน 12 เดือน
* **DG** (Digital Gauge / Indicator) — รอบมาตรฐาน 6 เดือน
* **MM** (Micrometer) — รอบมาตรฐาน 6 เดือน
* **VC** (Vernier Caliper) — รอบมาตรฐาน 6 เดือน
* **PG** (Pin Gauge Set) — รอบมาตรฐาน 12 เดือน
* **BG** (Block Gauge Set Grade 0) — รอบมาตรฐาน 12 เดือน
* **Height Gauge** — รอบมาตรฐาน 12 เดือน
* **Surface Roughness Tester** — รอบมาตรฐาน 12 เดือน
* **Profile Projector** — รอบมาตรฐาน 12 เดือน
* **Torque Gauge** & **Force Gauge**

---

## 3. กฎการคำนวณสถานะการสอบเทียบ (Calibration Due Logic)

ระบบคำนวณจำนวนวันที่เหลืออัตโนมัติจาก `next_calibration_date - current_date`:

* **CALIBRATION OK**: เหลือมากกว่า 10 วัน (สีเขียว)
* **DUE IN 10 DAYS**: เหลือ 8–10 วัน (สีเหลือง)
* **DUE IN 7 DAYS**: เหลือ 6–7 วัน (สีเหลืองอำพัน)
* **DUE IN 5 DAYS**: เหลือ 1–5 วัน (สีส้ม)
* **DUE TODAY**: ครบกำหนดวันนี้พอดี Remaining = 0 วัน (สีแดง/ชมพู)
* **OVERDUE**: เกินวันครบกำหนดแล้ว Remaining < 0 วัน (สีแดงเข้ม)
* **INACTIVE**: เครื่องมือถูกปิดใช้งาน / ปลดระวาง (สีเทา)

---

## 4. ระบบแจ้งเตือนและ Daily Scheduler (Cron Job)

1. **Daily Cron Trigger**: ระบบรันตรวจนับวันอัตโนมัติทุกวันเวลา 00:00 (และสามารถกดปุ่ม "Run Daily Check" จากหน้าเว็บได้ทันที)
2. **Duplicate Prevention**: ระบบมีกลไกป้องกันการส่งการแจ้งเตือนซ้ำสำหรับเครื่องมือชิ้นเดิมและประเภทเดิมในวันเดียวกัน
3. **Alert Thresholds**:
   - แจ้งเตือนล่วงหน้า 10 วัน (`DUE_10_DAYS`)
   - แจ้งเตือนล่วงหน้า 7 วัน (`DUE_7_DAYS`)
   - แจ้งเตือนล่วงหน้า 5 วัน (`DUE_5_DAYS`)
   - แจ้งเตือนวันที่ครบกำหนด (`DUE_TODAY`)
   - แจ้งเตือนหลังครบกำหนด (`OVERDUE`)
4. **Notification Bell**: แสดงตัวเลข Unread บน Header พร้อม Dropdown แจ้งเตือนด่วน

---

## 5. การเชื่อมต่อ Google Sheets (Google Workspace Integration)

ระบบเชื่อมต่อ Google Sheets API v4 ผ่าน Google Workspace OAuth:
1. เมื่อผู้ใช้งานเลือก **"Export to Google Sheets"** ในหน้า Equipment Register หรือ Reports
2. หากยังไม่ได้ Sign-in ระบบจะแสดงปุ่มมาตรฐาน **"Sign in with Google"**
3. ระบบจะแสดงหน้าต่างยืนยันการดำเนินการ (User Confirmation Dialog) ตามข้อกำหนดความปลอดภัย
4. เมื่อกดยืนยัน ระบบจะสร้าง Spreadsheet ใหม่ใน Google Drive ของผู้ใช้ อัตโนมัติ:
   - ตกแต่ง Header สไตล์ Industrial Navy/Teal
   - Freeze บรรทัดส่วนหัว
   - Auto-resize ความกว้างคอลัมน์อัตโนมัติ
   - แสดงปุ่มคลิกเปิด **"Open in Google Sheets ↗"** ทันที
5. รองรับการ Export แบบ **Excel (.xlsx)**, **CSV**, และ **Print / PDF** ในตัว

---

## 6. โครงสร้างโฟลเดอร์ (Folder Structure)

```
/
├── server.ts                       # Full-Stack Express Server (API + Vite Middleware)
├── database.json                   # Relational JSON File-backed Database Store
├── firebase-applet-config.json     # Firebase OAuth & Project Configuration
├── package.json                    # Dependencies & Scripts
├── server/
│   ├── db.ts                       # Database engine, Hashing, Seed Data & Scheduler
│   ├── middleware.ts               # Session Bearer Token Auth & RBAC Middleware
│   └── routes/
│       ├── auth.ts                 # /api/auth (Login, Logout, Change PIN)
│       ├── equipment.ts            # /api/equipment (CRUD, Search, Filter, Sort)
│       ├── calibration.ts          # /api/calibrations (Record calibration events)
│       ├── dashboard.ts            # /api/dashboard/stats (KPI & Chart Analytics)
│       ├── notifications.ts        # /api/notifications (Alerts, Read states)
│       ├── users.ts                # /api/users (Admin user management)
│       ├── equipmentTypes.ts       # /api/equipment-types & Master Data
│       ├── auditLogs.ts            # /api/audit-logs (QA/QC Audit trail)
│       ├── reports.ts              # /api/reports (Status, Overdue, Due Soon, History)
│       ├── scheduler.ts            # /api/scheduler/run (Daily cron trigger)
│       └── upload.ts               # /api/upload (Certificate file attachments)
└── src/
    ├── App.tsx                     # Main layout & route navigation
    ├── types/index.ts              # TypeScript Domain Types
    ├── services/
    │   ├── api.ts                  # REST API Client with token storage
    │   ├── auth.ts                 # Firebase Auth for Google Sheets Token
    │   ├── sheets.ts               # Google Sheets API v4 Integration
    │   └── export.ts               # Excel, CSV, PDF generator
    └── components/
        ├── LoginView.tsx           # Masked 4-digit PIN login & Demo chips
        ├── Header.tsx              # System bar, Bell alert dropdown, User info
        ├── Sidebar.tsx             # QA/QC Navigation & Role-based menu
        ├── DashboardView.tsx       # KPI cards, Drilldown, Status charts
        ├── EquipmentView.tsx       # Equipment Master with search, filter, export
        ├── EquipmentDetailModal.tsx# Countdown banner, specs, history & audit
        ├── EquipmentFormModal.tsx  # Add/Edit instrument modal
        ├── CalibrationRecordModal.tsx # Record calibration & certificate upload
        ├── NotificationsView.tsx   # Alert dashboard & scheduler trigger
        ├── ReportsView.tsx         # Calibration status, overdue, due soon reports
        ├── GoogleSheetsExportModal.tsx # Workspace confirmed export modal
        ├── AuditLogView.tsx        # Immutable QA modification audit log
        ├── UserManagementView.tsx  # Admin user and role management
        ├── MasterDataView.tsx      # Equipment types, departments, locations
        └── CalibrationsView.tsx    # Calibration verification log register
```

---

## 7. คู่มือการติดตั้งและ Deploy (Setup & Deployment)

### การรันในโหมดพัฒนา (Development)
```bash
# ติดตั้ง dependencies
npm install

# เริ่มต้นระบบแบบ Full-Stack (Express Backend + React Vite Frontend บนพอร์ต 3000)
npm run dev
```

### การ Build สำหรับ Production
```bash
npm run build
npm run start
```

---

## 8. การสำรองข้อมูล (Database Backup)

ข้อมูลทั้งหมดถูกจัดเก็บในโครงสร้าง Relational ในไฟล์ `database.json`:
* **Manual Backup**: คัดลอกไฟล์ `database.json` เก็บไว้ในที่ปลอดภัย
* **Automated Backup**: สามารถตั้ง Cron Job สำรองไฟล์ `database.json` ไปยัง Cloudflare R2 หรือ Object Storage ได้ทุกวัน
