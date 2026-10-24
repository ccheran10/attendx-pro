# AttendX Pro — Cloud Attendance & Payroll Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/github/actions/workflow/status/ccheran10/attendx-pro/deploy.yml?branch=main)](https://github.com/ccheran10/attendx-pro/actions)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-emerald.svg)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)

A modern, cloud-synchronized staff attendance management system and installable Progressive Web App (PWA) engineered to convert manual spreadsheet workbooks into an automated, multi-device payroll platform.

---

## 🌐 Live Application

- **Live Application**: [https://ais-dev-x7peetdzotyrqukzksmpkp-570498639008.asia-northeast1.run.app](https://ais-dev-x7peetdzotyrqukzksmpkp-570498639008.asia-northeast1.run.app)
- **Shared Production Preview**: [https://ais-pre-x7peetdzotyrqukzksmpkp-570498639008.asia-northeast1.run.app](https://ais-pre-x7peetdzotyrqukzksmpkp-570498639008.asia-northeast1.run.app)
- **GitHub Repository**: [https://github.com/ccheran10/attendx-pro](https://github.com/ccheran10/attendx-pro)
- **GitHub Releases**: [https://github.com/ccheran10/attendx-pro/releases](https://github.com/ccheran10/attendx-pro/releases)

> 💡 **Instant Guest Preview**: Click **"Explore Live Demo as Guest"** on the landing screen to immediately test the application with pre-populated sample employees and October 2026 payroll data without creating an account.

---

## ✨ Features & Architecture

### 1. 📅 Daily Attendance Logger
- **One-Click Batch Check-in**: Select date and click **"Mark All Present"** to instantly log shifts for the whole team.
- **Inline Status Switches**: Rapidly toggle status codes: `P` (Present), `A` (Absent), `HD` (Half-Day), `L` (Leave), `WO` (Weekly Off), `H` (Official Holiday).
- **Time Clock & Overtime**: Log exact clock-in, clock-out, and break minutes; the engine auto-calculates gross hours, net hours, and approved overtime.

### 2. 📊 31-Day Monthly Matrix Register (Excel Parity)
- Recreates the familiar layout of spreadsheet attendance registers.
- High-density matrix displaying Day 1 to 31 with automatic day-of-week and weekend highlights.
- Interactive cell editing: click any day cell on any employee to update their attendance record.
- Live dynamic totals: Present count, Absent count, Half-days, Paid/Unpaid Leaves, Scheduled Working Days, and Net Salary.
- One-click **Export to Excel (.xlsx)** and formatted print layout.

### 3. 💰 Salary & Payroll Engine
- Dynamic pro-rata daily rate calculation:
  $$\text{Daily Rate} = \frac{\text{Monthly Basic}}{\text{Calendar Days or Working Days}}$$
  $$\text{Absence Deductions} = (\text{Unpaid Absences} + \text{Half-Days} \times 0.5) \times \text{Daily Rate}$$
  $$\text{Overtime Pay} = \text{Overtime Hours} \times \left(\frac{\text{Daily Rate}}{\text{Shift Hours}} \times \text{Multiplier}\right)$$
  $$\text{Net Salary} = \text{Basic} + \text{Overtime} - \text{Deductions}$$
- **Printable Pay Slips**: Generates itemized vouchers showing employee info, earnings, deductions, and authorized signature lines.

### 4. 📁 Excel Import & Export (`.xlsx` / `.csv`)
- **Smart Importer**: Reads uploaded spreadsheets, auto-detects column mappings (matrix view vs daily logs vs employee lists), and flags errors with preview before database commit.
- **Templates**: Includes a downloadable starter workbook (`Staff_Attendance_Template.xlsx`).
- **Exporting**: Instant client-side generation of styled monthly register workbooks.

### 5. 🔐 Multi-Tenant Workspace & Security
- Every user has an isolated workspace. User A can never access User B's staff or salary numbers.
- Cryptographic password hashing using `bcryptjs` (salt rounds: 10).
- Bearer session token authentication with row-level query enforcement (`WHERE userId = ?`).

### 6. 📱 Progressive Web App (PWA) & Mobile Installation
- **Installable on Mobile & Desktop**: Standalone window mode, custom launcher icons, and service worker caching.
- **In-App Install Modal**: Built-in installation button with tailored instructions for iOS Safari and Android Chrome.

---

## 📱 How to Install the App

### Android & Desktop Chrome / Edge
1. Open the application URL in Chrome, Edge, or Brave.
2. Click the **"Install App"** button in the top navigation bar, or select **"Install App"** from the browser menu (⋮).
3. The app will install onto your home screen / desktop and open in an independent window.

### iPhone & iPad (iOS Safari)
1. Open the application in Safari.
2. Tap the **Share** button (box with upward arrow) at the bottom.
3. Scroll down and tap **"Add to Home Screen"**.
4. Tap **Add** in the top right.

---

## 🛠️ Third-Party Dependencies & Licenses

| Package | Version | License | Purpose |
| :--- | :--- | :--- | :--- |
| `react` / `react-dom` | ^19.0.0 | MIT | UI component architecture |
| `express` | ^4.21.2 | MIT | REST API backend server |
| `xlsx` (SheetJS) | ^0.18.5 | Apache-2.0 | Excel spreadsheet parsing & generation |
| `bcryptjs` | ^3.0.2 | MIT | Secure password hashing |
| `lucide-react` | ^1.16.0 | ISC | High-clarity SVG iconography |
| `vite` | ^6.2.0 | MIT | Frontend build tooling |
| `vite-plugin-pwa` | ^1.2.0 | MIT | Progressive Web App & Service Worker generator |
| `tailwindcss` | ^4.0.0 | MIT | High-density styling & typography |

---

## 💻 Local Setup & Development

### Prerequisites
- Node.js 18 or higher
- npm 9 or higher (or bun / yarn)

### 1. Clone the repository
```bash
git clone https://github.com/ccheran10/attendx-pro.git
cd attendx-pro
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start development server
```bash
npm run dev
```
Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Docker Deployment

You can deploy AttendX Pro with a single command using Docker:

```bash
docker compose up -d
```

Or build manually:
```bash
docker build -t attendx-pro .
docker run -d -p 3000:3000 -v attendx-data:/app/data attendx-pro
```

---

## 🚀 Cloud Deployment Options

### Render / Railway / Fly.io
1. Create a new Web Service and link your GitHub repository `ccheran10/attendx-pro`.
2. Build Command: `npm install && npm run build`
3. Start Command: `npm start`
4. Port: `3000`
5. Mount a persistent disk to `/app/data` to persist attendance records across restarts.

### Google Cloud Run
1. Build and push the container image:
   ```bash
   gcloud builds submit --tag gcr.io/<PROJECT_ID>/attendx-pro
   ```
2. Deploy to Cloud Run:
   ```bash
   gcloud run deploy attendx-pro \
     --image gcr.io/<PROJECT_ID>/attendx-pro \
     --platform managed \
     --allow-unauthenticated \
     --port 3000
   ```

---

## 📦 Releases & Downloads

- **Official Release Downloads**: [GitHub Releases](https://github.com/ccheran10/attendx-pro/releases)
- **Source Code Archive**: Available in the app under **Settings $\rightarrow$ Download Source Code (.tar.gz)** or via GitHub Releases.
- **Android APK Workflow**: Automated GitHub Actions workflow (`.github/workflows/build-android.yml`) builds release packages on every version tag (`v*`).

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
