# AttendX Pro — Cloud Attendance & Payroll Management

A complete cloud-based attendance management system and installable Progressive Web App (PWA) converted from Excel staff attendance workbooks. Features real-time multi-device synchronization, per-user workspace isolation, daily shift tracking, interactive 31-day monthly attendance registers, pro-rata salary calculations, printable pay slips, and bi-directional Excel import/export.

---

## 🚀 Live Application
- **Development App URL**: https://ais-dev-x7peetdzotyrqukzksmpkp-570498639008.asia-northeast1.run.app
- **Production / Preview URL**: https://ais-pre-x7peetdzotyrqukzksmpkp-570498639008.asia-northeast1.run.app

---

## ✨ Features

- **🔐 Multi-Tenant Workspace & Auth**:
  - Unique username & hashed password authentication (via `bcryptjs`).
  - Strict row-level data isolation: each user's employees and attendance logs remain private.
  - Multi-device login: access the same account from phones, tablets, or computers.

- **📅 Daily Attendance Logger**:
  - One-click **"Mark All Present"** batch marker for fast shift clock-in.
  - Individual quick status buttons: `P` (Present), `A` (Absent), `HD` (Half-Day), `L` (Leave), `WO` (Weekly Off), `H` (Holiday).
  - Detailed time tracking with Clock-In, Clock-Out, break deductions, net hours, and overtime calculations.

- **📊 31-Day Monthly Attendance Register (Excel Parity)**:
  - Full interactive matrix displaying Day 1 to 31 for each employee with day-of-week indicators.
  - Click any day cell to quickly update attendance.
  - Live summary totals: Present, Absent, Half-Day, Leaves, Weekly Offs, Holidays, Paid Days, Hours, and Net Salary.
  - Export register directly to `.xlsx` or print with formatted CSS.

- **💰 Salary & Payroll Engine**:
  - Accurate pro-rata calculation matching business spreadsheet rules:
    - Daily Rate = `Monthly Basic / (Calendar Days or Working Days)`
    - Absence Deduction = `(Unpaid Absences + Half-Days * 0.5) * Daily Rate`
    - Overtime Pay = `Overtime Hours * (Hourly Rate * OT Multiplier)`
    - Net Salary = `Basic + Overtime - Deductions`
  - Itemized, printable pay slips with company header, deduction breakdown, and signature boxes.

- **📁 Excel Import & Export (`.xlsx` / `.csv`)**:
  - Upload existing staff attendance workbooks with auto-detected matrix or row formats.
  - Pre-import validation preview showing valid staff count, logs, and column mapping.
  - Built-in downloadable starter template: `Staff_Attendance_Template.xlsx`.
  - Export monthly registers and payroll sheets in one click.

- **📱 Installable Progressive Web App (PWA)**:
  - Installable on Android, iPhone/iPad (iOS Safari), Windows, and macOS.
  - Standalone app window, offline caching, and connectivity status indicator.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Vite PWA
- **Backend**: Node.js, Express, tsx
- **Database**: Persistent relational JSON/SQLite storage with atomic writes and transaction safety
- **Security**: bcryptjs password hashing, bearer session tokens, row-level access control
- **Spreadsheet Engine**: SheetJS (`xlsx`) for reading/writing workbooks

---

## 💻 Local Setup & Development

### 1. Prerequisites
- Node.js 18+ installed

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
The app will be running on `http://localhost:3000`.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 📤 Push this Code to GitHub

To push this repository to your GitHub account:

1. Create a new empty repository on [GitHub](https://github.com/new) (e.g. `attendx-pro`).
2. Run the following commands in your terminal:

```bash
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/attendx-pro.git
git branch -M main
git push -u origin main
```

---

## 📄 License
Apache-2.0
