# Cloud Attendance & Payroll Management Platform (Excel to Web & PWA)

A full-stack, cloud-synchronized attendance and payroll platform that preserves and enhances all attendance tracking, shift hours, leave management, holiday calendars, and salary calculation formulas from Excel workbooks, packaged as an installable Progressive Web App (PWA) with multi-device synchronization and per-user workspace isolation.

### User Review & Critical Decisions

> [!IMPORTANT]
> The clarifying questions were skipped; recommended defaults have been established as the baseline:
> 1. **Excel Integration**: Pre-loaded with full business attendance templates, realistic sample data, and a flexible Excel file importer/exporter (`.xlsx`/`.csv`) with automatic column detection, preview, and validation.
> 2. **Salary Calculation Engine**: Default calculation uses Pro-Rata Daily Rate = (Monthly Basic / Calendar or Working Days) with precise deductions for unpaid absences and half-days, plus overtime hour calculations, configurable per workspace.
> 3. **Shift & Schedule Rules**: 8-hour workday, 6-day week with Sunday as weekly off, recognized paid public holidays, and custom shift overrides.

- **Confirmed Decision 1**: Per-user multi-tenant workspace architecture with real server-side authentication (unique username + hashed password with bcrypt, session tokens), ensuring User A's employee and salary data can never be accessed by User B.
- **Confirmed Decision 2**: Dual-mode data storage: Persistent server-side database (Express + SQLite with WAL mode) with REST API, coupled with offline client cache and background sync indicators.
- **Confirmed Decision 3**: Complete Excel parity: Monthly matrix view (Day 1..31 attendance grid), Daily check-in/out logger, Employee master, Leave register, Holiday manager, and Printable & Exportable Salary Slips.

---

### 1. Overview & Core Concept

- **What It Does**: Transforms manual spreadsheet-based attendance into an automated, responsive web and mobile application. Small business owners, HR managers, and team leads can log daily check-ins/outs, manage shift hours, track leaves and public holidays, generate monthly attendance register sheets, calculate exact salaries with deductions, and seamlessly import/export `.xlsx` spreadsheets.
- **Target Audience / Persona**: Small and medium business owners, workshop supervisors, retail store managers, and HR administrators managing 5 to 500+ employees.
- **Key Value**: Eliminates spreadsheet corruption, broken formulas, and device lock-in while preserving familiar Excel register formats, offering instant payroll computation and offline-ready mobile installation.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Onboarding & Auth**:
   - User signs up with a unique username and password.
   - Choice to **Import Existing Excel Workbook** or **Start Fresh Workspace** (with optional pre-loaded sample dataset).
2. **Daily Attendance Flow**:
   - Quick Batch Mark: Select date, click "Mark All Present", toggle individual exceptions (Absent, Half-Day, Sick Leave).
   - Detailed Clock-In/Out: Record check-in time, check-out time, break duration; automatic calculation of gross and net working hours.
3. **Monthly Attendance Register**:
   - Full 31-day Excel-style interactive grid showing each staff member with status codes (`P`, `A`, `HD`, `L`, `WO`, `H`) and live monthly totals.
4. **Leave & Holiday Management**:
   - Calendar view of public holidays; leave requests with approval workflow and balance tracking.
5. **Salary Calculation & Payroll**:
   - Live computation of gross salary, daily rate, unpaid deductions, overtime pay, and net payout with detailed formula breakdown.
   - One-click PDF/Print slip generator and monthly payroll Excel export.
6. **Excel Importer & Exporter**:
   - Upload any attendance `.xlsx` workbook -> Column auto-mapping -> Validation preview with error flagging -> One-click import.
   - Export full attendance registers, salary slips, and blank import templates.
7. **PWA Mobile Experience**:
   - "Install App" button in header, responsive bottom navigation bar on mobile, offline sync status indicator.

#### Visual Identity & Theme
- **Aesthetic Direction**: Utilitarian, crisp, high-density enterprise dashboard inspired by modern financial tools (Linear + Stripe aesthetic).
- **Color Palette**:
  - Dominant Canvas: Crisp neutral white (`#FFFFFF`) / dark slate (`#0B0F17`)
  - Structural Surfaces: Subtle gray (`#F8FAFC`) / dark card slate (`#131926`), hairline borders (`#E2E8F0` / `#1E293B`)
  - Accents: Deep Indigo / Electric Blue (`#2563EB`) for primary actions; Emerald (`#16A34A`) for Present/On-time; Crimson (`#DC2626`) for Absent/Deduction; Amber (`#D97706`) for Half-day/Pending.
- **Typography**: `Plus Jakarta Sans` for clean, professional headers and labels; `JetBrains Mono` / tabular figures (`tabular-nums`) for all clock times, hours, percentages, and salary figures.
- **Zero-Pill Discipline**: Metadata displayed as unboxed text with `·` separators; interactive buttons styled with clean segmented borders.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Full-Stack Express Server with SQLite Database**
  - *Chosen Approach*: Node.js Express server running with SQLite (`better-sqlite3` or persistent JSON DB engine) on port 3000, serving the Vite build and API endpoints (`/api/*`).
  - *Why*: Provides genuine server-side authentication, per-user workspace row isolation (`user_id` enforced in database queries), prevents frontend-only data leaks, and works reliably without external cloud billing hurdles.
  - *Alternatives Considered*: Pure browser `localStorage` (violates requirement of cross-device login and multi-user isolation).
- **Decision 2: High-Performance SheetJS (`xlsx`) for Bi-Directional Excel Support**
  - *Chosen Approach*: Client and server-side `.xlsx` parsing and generation with styled column headers, number formats, and date formatting.
  - *Why*: Gives users 100% interoperability with their existing Excel files and allows offline export of formatted attendance matrices.
- **Decision 3: PWA Compliance with `vite-plugin-pwa` & Service Worker**
  - *Chosen Approach*: Web app manifest with standalone display mode, maskable and standard PNG icons, and an interactive in-app install modal with iOS Safari guidance.
  - *Why*: Allows the app to be installed onto home screens of Android, iPhone, Windows, and macOS like a native app.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

#### Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Client (React 19 + PWA)                         │
│                                                                        │
│  ┌───────────────────────┐  ┌────────────────────────────────────────┐ │
│  │   Auth / Workspace    │  │        Interactive Views               │ │
│  │  - Username Login     │  │  - Dashboard & Metrics                 │ │
│  │  - Multi-tenant Guard │  │  - Daily Attendance Logger             │ │
│  │  - Offline Cache Hook │  │  - Monthly Register Matrix (1..31)     │ │
│  └───────────────────────┘  │  - Staff Master CRUD                   │ │
│                             │  - Leaves & Holiday Calendar           │ │
│  ┌───────────────────────┐  │  - Salary & Payroll Engine             │ │
│  │ Excel Import / Export │  │  - App Settings & Rules                │ │
│  │ - SheetJS Parser/Gen  │  └────────────────────────────────────────┘ │
│  │ - Validation Preview  │  ┌────────────────────────────────────────┐ │
│  └───────────────────────┘  │ PWA Engine (Service Worker, Manifest)  │ │
│                             └────────────────────────────────────────┘ │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ JSON API Requests (Bearer Token)
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Server (Node.js / Express API)                       │
│                                                                        │
│  ┌────────────────────┐  ┌───────────────────┐  ┌───────────────────┐  │
│  │ /api/auth          │  │ /api/attendance   │  │ /api/salary       │  │
│  │ - Register/Login   │  │ - Daily Logs      │  │ - Formulas        │  │
│  │ - Password Hash    │  │ - Monthly Matrix  │  │ - Deductions      │  │
│  └────────────────────┘  └───────────────────┘  └───────────────────┘  │
│  ┌────────────────────┐  ┌───────────────────┐  ┌───────────────────┐  │
│  │ /api/staff         │  │ /api/leaves       │  │ /api/holidays     │  │
│  │ - Employees CRUD   │  │ - Applications    │  │ - Official List   │  │
│  └────────────────────┘  └───────────────────┘  └───────────────────┘  │
│                                    │                                   │
│             Row-Level Authorization Middleware (`req.userId`)          │
│                                    ▼                                   │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                 Persistent Relational SQLite Database            │  │
│  │ - users (id, username, password_hash, created_at)                │  │
│  │ - settings (user_id, business_name, work_hours, salary_rules)    │  │
│  │ - staff (id, user_id, emp_id, name, dept, base_salary, hours...) │  │
│  │ - attendance (id, user_id, staff_id, date, in, out, hours, stat) │  │
│  │ - leaves (id, user_id, staff_id, start_date, end_date, type...)  │  │
│  │ - holidays (id, user_id, date, name, is_paid)                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

#### Data Model & State Entities
- **Users**: Unique `id`, `username`, `password_hash`, `created_at`.
- **Workspaces & Settings**: Business name, financial year, daily standard hours (default 8), weekly off days (default Sunday), salary calculation base (Calendar days vs Working days), overtime multiplier (e.g. 1.5x).
- **Staff (Employees)**: Unique ID, Employee Code (e.g., EMP001), Full Name, Designation, Department, Phone, Joining Date, Basic Monthly Salary, Standard Shift Hours, Status (Active/Inactive).
- **Attendance Records**: Unique compound key (`user_id`, `staff_id`, `date`), Check-in Time, Check-out Time, Break Minutes, Gross Hours, Net Hours, Status (`PRESENT`, `ABSENT`, `HALF_DAY`, `LEAVE`, `WEEKLY_OFF`, `HOLIDAY`), Overtime Hours, Remarks.
- **Leaves**: Leave ID, Staff ID, Leave Type (`SICK`, `CASUAL`, `EARNED`, `UNPAID`), Start Date, End Date, Reason, Status (`APPROVED`, `PENDING`, `REJECTED`).
- **Holidays**: Date, Holiday Title, Is Paid.

#### Step-by-Step Implementation Sequence
1. **Server & Database Infrastructure**: Implement Express server with SQLite storage, secure password hashing (bcrypt), token authentication, and data isolation middleware where all queries enforce `WHERE user_id = ?`.
2. **PWA & Build Configuration**: Configure Vite with `vite-plugin-pwa`, web manifest, app icons, and offline connectivity hook.
3. **Core Data Services & Excel Engine**: Implement Excel workbook parser/exporter using `xlsx` with column mapping, preview, validation, and sample templates.
4. **Staff Management Module**: Full employee roster with search, department filtering, profile editor, and salary parameters.
5. **Daily Attendance Logger & Monthly Register**: Build rapid batch check-in, detailed time calculator, and the full 31-day Excel register matrix view.
6. **Payroll & Salary Calculation Module**: Implement dynamic payroll calculation with transparent breakdown of earnings, absences, half-days, overtime, and printable pay slips.
7. **Testing & Verification**: Verify registration, login, data isolation between accounts, Excel import/export integrity, and compile the full applet.
