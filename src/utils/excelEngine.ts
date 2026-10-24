import * as XLSX from 'xlsx';
import {
  Staff,
  AttendanceRecord,
  HolidayRecord,
  WorkspaceSettings,
  LeaveRecord,
  EmployeePayroll,
  AttendanceStatus,
} from '../types/attendance';
import { calculateEmployeePayroll, formatDateStr, getDaysInMonth } from './payrollCalculator';

export interface ImportPreviewResult {
  sheetName: string;
  detectedType: 'matrix' | 'daily_log' | 'employee_list' | 'unknown';
  totalRows: number;
  validStaff: Partial<Staff>[];
  validAttendance: Partial<AttendanceRecord>[];
  errors: string[];
  warnings: string[];
}

/**
 * Generates an Excel Workbook containing the 31-day Monthly Attendance Register matrix,
 * Monthly Payroll Summary, and Employee Master sheet.
 */
export function exportMonthlyRegisterExcel(
  monthStr: string, // 'YYYY-MM'
  staffList: Staff[],
  attendanceList: AttendanceRecord[],
  holidays: HolidayRecord[],
  leaves: LeaveRecord[],
  settings: WorkspaceSettings
): void {
  const [yearStr, monthNumStr] = monthStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthNumStr, 10);
  const daysCount = getDaysInMonth(year, month);

  const wb = XLSX.utils.book_new();

  // 1. Matrix Register Sheet
  const matrixHeaders = [
    'Emp ID',
    'Full Name',
    'Department',
    'Designation',
    ...Array.from({ length: daysCount }, (_, i) => `Day ${i + 1}`),
    'Present (P)',
    'Absent (A)',
    'Half Day (HD)',
    'Leave (L)',
    'Weekly Off (WO)',
    'Holiday (H)',
    'Paid Days',
    'Total Hours',
    'Net Payable',
  ];

  const matrixRows: (string | number)[][] = [matrixHeaders];

  const payrollSummaries: EmployeePayroll[] = [];

  staffList.forEach((st) => {
    const payroll = calculateEmployeePayroll(
      st,
      monthStr,
      attendanceList,
      holidays,
      leaves,
      settings
    );
    payrollSummaries.push(payroll);

    const stAttendance = attendanceList.filter(
      (a) => a.staffId === st.id && a.date.startsWith(monthStr)
    );
    const attMap = new Map<string, AttendanceRecord>();
    stAttendance.forEach((a) => attMap.set(a.date, a));

    const dayCells: string[] = [];
    for (let d = 1; d <= daysCount; d++) {
      const dateStr = formatDateStr(year, month, d);
      const rec = attMap.get(dateStr);
      const dateObj = new Date(year, month - 1, d);
      const isWO = dateObj.getDay() === settings.weeklyOffDay;
      const hol = holidays.find((h) => h.date === dateStr);

      if (rec) {
        const codeMap: Record<AttendanceStatus, string> = {
          PRESENT: 'P',
          ABSENT: 'A',
          HALF_DAY: 'HD',
          LEAVE: 'L',
          WEEKLY_OFF: 'WO',
          HOLIDAY: 'H',
        };
        dayCells.push(codeMap[rec.status] || 'P');
      } else if (hol) {
        dayCells.push('H');
      } else if (isWO) {
        dayCells.push('WO');
      } else {
        dayCells.push('-');
      }
    }

    matrixRows.push([
      st.employeeId,
      st.name,
      st.department,
      st.designation,
      ...dayCells,
      payroll.daysPresent,
      payroll.daysAbsent,
      payroll.halfDays,
      payroll.paidLeaves + payroll.unpaidLeaves,
      payroll.weeklyOffs,
      payroll.paidHolidays,
      payroll.paidDays,
      payroll.totalHours,
      payroll.netPayableSalary,
    ]);
  });

  const matrixSheet = XLSX.utils.aoa_to_sheet(matrixRows);
  XLSX.utils.book_append_sheet(wb, matrixSheet, 'Attendance Register');

  // 2. Payroll Summary Sheet
  const payrollHeaders = [
    'Emp ID',
    'Name',
    'Department',
    'Designation',
    'Basic Salary',
    'Calendar Days',
    'Working Days',
    'Present Days',
    'Absent Days',
    'Half Days',
    'Paid Leaves',
    'Paid Days',
    'Daily Rate',
    'Absence Deduction',
    'Half Day Deduction',
    'Overtime Hours',
    'Overtime Pay',
    'Gross Salary',
    'Net Payable Salary',
  ];

  const payrollRows = [
    payrollHeaders,
    ...payrollSummaries.map((p) => [
      p.employeeId,
      p.name,
      p.department,
      p.designation,
      p.baseSalary,
      p.calendarDays,
      p.scheduledWorkingDays,
      p.daysPresent,
      p.daysAbsent,
      p.halfDays,
      p.paidLeaves,
      p.paidDays,
      p.dailyRate,
      p.absenceDeductions,
      p.halfDayDeductions,
      p.overtimeHours,
      p.overtimeEarnings,
      p.grossSalary,
      p.netPayableSalary,
    ]),
  ];

  const payrollSheet = XLSX.utils.aoa_to_sheet(payrollRows);
  XLSX.utils.book_append_sheet(wb, payrollSheet, 'Monthly Payroll');

  // 3. Employee Master Sheet
  const staffHeaders = [
    'Emp ID',
    'Full Name',
    'Department',
    'Designation',
    'Phone',
    'Email',
    'Join Date',
    'Standard Hours',
    'Basic Salary',
    'Status',
  ];
  const staffRows = [
    staffHeaders,
    ...staffList.map((s) => [
      s.employeeId,
      s.name,
      s.department,
      s.designation,
      s.phone || '',
      s.email || '',
      s.joinDate,
      s.standardHours,
      s.baseSalary,
      s.status,
    ]),
  ];
  const staffSheet = XLSX.utils.aoa_to_sheet(staffRows);
  XLSX.utils.book_append_sheet(wb, staffSheet, 'Employee Master');

  // Trigger download in browser
  const filename = `Attendance_Payroll_Register_${monthStr}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Downloads a standard starter template that users can fill and import.
 */
export function downloadAttendanceTemplate(): void {
  const wb = XLSX.utils.book_new();

  // Template 1: Staff Master
  const staffData = [
    ['Emp ID', 'Full Name', 'Department', 'Designation', 'Phone', 'Email', 'Join Date (YYYY-MM-DD)', 'Basic Salary', 'Standard Hours'],
    ['EMP-001', 'Alex Mercer', 'Operations', 'Operations Lead', '+1 555-0101', 'alex@business.com', '2024-01-15', 4500, 8],
    ['EMP-002', 'Elena Rostova', 'Engineering', 'Senior Developer', '+1 555-0102', 'elena@business.com', '2024-02-01', 5200, 8],
    ['EMP-003', 'Marcus Vance', 'Logistics', 'Inventory Specialist', '+1 555-0103', 'marcus@business.com', '2024-03-10', 3800, 8],
    ['EMP-004', 'Sophia Chen', 'Human Resources', 'HR Coordinator', '+1 555-0104', 'sophia@business.com', '2024-04-01', 4100, 8],
  ];
  const staffSheet = XLSX.utils.aoa_to_sheet(staffData);
  XLSX.utils.book_append_sheet(wb, staffSheet, 'Staff List');

  // Template 2: Daily Attendance Logs
  const attData = [
    ['Date (YYYY-MM-DD)', 'Emp ID', 'Employee Name', 'Check In (HH:MM)', 'Check Out (HH:MM)', 'Break Minutes', 'Status', 'Remarks'],
    ['2026-10-01', 'EMP-001', 'Alex Mercer', '09:00', '17:30', 60, 'PRESENT', 'On time'],
    ['2026-10-01', 'EMP-002', 'Elena Rostova', '09:15', '18:15', 60, 'PRESENT', 'Overtime 1h'],
    ['2026-10-01', 'EMP-003', 'Marcus Vance', '09:00', '13:00', 0, 'HALF_DAY', 'Left early for doctor'],
    ['2026-10-01', 'EMP-004', 'Sophia Chen', '', '', 0, 'LEAVE', 'Approved personal leave'],
  ];
  const attSheet = XLSX.utils.aoa_to_sheet(attData);
  XLSX.utils.book_append_sheet(wb, attSheet, 'Daily Attendance');

  XLSX.writeFile(wb, 'Staff_Attendance_Template.xlsx');
}

/**
 * Parses uploaded Excel files (.xlsx, .xls, .csv).
 * Intelligently recognizes staff sheets, daily attendance logs, and matrix grids.
 */
export function parseExcelWorkbook(
  dataBuffer: ArrayBuffer,
  currentYearMonth: string = '2026-10'
): ImportPreviewResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const validStaff: Partial<Staff>[] = [];
  const validAttendance: Partial<AttendanceRecord>[] = [];

  try {
    const workbook = XLSX.read(dataBuffer, { type: 'array' });
    const sheetNames = workbook.SheetNames;

    if (sheetNames.length === 0) {
      return {
        sheetName: '',
        detectedType: 'unknown',
        totalRows: 0,
        validStaff: [],
        validAttendance: [],
        errors: ['The uploaded Excel workbook contains no sheets.'],
        warnings: [],
      };
    }

    // Inspect each sheet
    for (const sheetName of sheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rawRows: (string | number | undefined)[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      if (!rawRows || rawRows.length < 2) continue;

      const headerRow = rawRows[0].map((c) => String(c || '').trim().toLowerCase());

      // Check if this sheet is Staff list
      const hasEmpId = headerRow.some((h) => h.includes('emp') || h.includes('code') || h === 'id');
      const hasName = headerRow.some((h) => h.includes('name'));
      const hasSalary = headerRow.some((h) => h.includes('salary') || h.includes('basic') || h.includes('pay'));
      const hasDate = headerRow.some((h) => h.includes('date'));
      const hasStatus = headerRow.some((h) => h.includes('status') || h.includes('att') || h.includes('present'));
      const hasDaysMatrix = headerRow.some((h) => /^day\s*\d+/i.test(h) || /^\d{1,2}$/.test(h));

      if (hasDaysMatrix) {
        // Attendance matrix format!
        warnings.push(`Detected monthly matrix in sheet "${sheetName}". Parsing Day columns...`);
        // Find index of name, emp id, and day columns
        const empIdIdx = headerRow.findIndex((h) => h.includes('emp') || h.includes('code') || h === 'id');
        const nameIdx = headerRow.findIndex((h) => h.includes('name'));

        const dayColIndices: { day: number; colIdx: number }[] = [];
        headerRow.forEach((h, colIdx) => {
          const match = h.match(/(?:day\s*)?(\d{1,2})$/i);
          if (match) {
            const dayNum = parseInt(match[1], 10);
            if (dayNum >= 1 && dayNum <= 31) {
              dayColIndices.push({ day: dayNum, colIdx });
            }
          }
        });

        for (let r = 1; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row || row.length === 0) continue;
          const empIdVal = empIdIdx >= 0 && row[empIdIdx] ? String(row[empIdIdx]).trim() : `EMP-${r}`;
          const nameVal = nameIdx >= 0 && row[nameIdx] ? String(row[nameIdx]).trim() : `Staff ${r}`;

          validStaff.push({
            employeeId: empIdVal,
            name: nameVal,
            department: 'General',
            designation: 'Staff',
            baseSalary: 3000,
            standardHours: 8,
            status: 'ACTIVE',
          });

          for (const item of dayColIndices) {
            const cellVal = String(row[item.colIdx] || '').trim().toUpperCase();
            if (!cellVal || cellVal === '-') continue;

            let st: AttendanceStatus = 'PRESENT';
            if (cellVal === 'A' || cellVal.includes('ABSENT')) st = 'ABSENT';
            else if (cellVal === 'HD' || cellVal.includes('HALF')) st = 'HALF_DAY';
            else if (cellVal === 'L' || cellVal.includes('LEAVE')) st = 'LEAVE';
            else if (cellVal === 'WO' || cellVal.includes('OFF')) st = 'WEEKLY_OFF';
            else if (cellVal === 'H' || cellVal.includes('HOLI')) st = 'HOLIDAY';

            const [yearStr, monthNumStr] = currentYearMonth.split('-');
            const dateStr = formatDateStr(parseInt(yearStr, 10), parseInt(monthNumStr, 10), item.day);

            validAttendance.push({
              date: dateStr,
              status: st,
              netHours: st === 'PRESENT' ? 8 : st === 'HALF_DAY' ? 4 : 0,
              grossHours: st === 'PRESENT' ? 8 : st === 'HALF_DAY' ? 4 : 0,
              breakMinutes: 0,
              overtimeHours: 0,
            });
          }
        }

        return {
          sheetName,
          detectedType: 'matrix',
          totalRows: rawRows.length - 1,
          validStaff,
          validAttendance,
          errors,
          warnings,
        };
      }

      if (hasDate && (hasStatus || headerRow.some((h) => h.includes('in') || h.includes('check')))) {
        // Daily log format!
        const dateIdx = headerRow.findIndex((h) => h.includes('date'));
        const empIdIdx = headerRow.findIndex((h) => h.includes('emp') || h.includes('code') || h === 'id');
        const nameIdx = headerRow.findIndex((h) => h.includes('name'));
        const inIdx = headerRow.findIndex((h) => h.includes('in'));
        const outIdx = headerRow.findIndex((h) => h.includes('out'));
        const statusIdx = headerRow.findIndex((h) => h.includes('status') || h.includes('att'));
        const breakIdx = headerRow.findIndex((h) => h.includes('break'));
        const remarksIdx = headerRow.findIndex((h) => h.includes('remark') || h.includes('note'));

        for (let r = 1; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row || row.length === 0) continue;
          const rawDate = row[dateIdx];
          if (!rawDate) continue;

          let dateStr = String(rawDate).trim();
          // Normalize excel numeric serial dates if present
          if (typeof rawDate === 'number') {
            const jsDate = XLSX.SSF.parse_date_code(rawDate);
            if (jsDate) {
              dateStr = formatDateStr(jsDate.y, jsDate.m, jsDate.d);
            }
          }

          const empIdVal = empIdIdx >= 0 && row[empIdIdx] ? String(row[empIdIdx]).trim() : `EMP-${r}`;
          const nameVal = nameIdx >= 0 && row[nameIdx] ? String(row[nameIdx]).trim() : `Staff ${r}`;
          const inVal = inIdx >= 0 && row[inIdx] ? String(row[inIdx]).trim() : undefined;
          const outVal = outIdx >= 0 && row[outIdx] ? String(row[outIdx]).trim() : undefined;
          const statusRaw = statusIdx >= 0 && row[statusIdx] ? String(row[statusIdx]).trim().toUpperCase() : 'PRESENT';
          const breakMin = breakIdx >= 0 && row[breakIdx] ? Number(row[breakIdx]) || 0 : 0;
          const remarks = remarksIdx >= 0 && row[remarksIdx] ? String(row[remarksIdx]).trim() : '';

          let status: AttendanceStatus = 'PRESENT';
          if (statusRaw === 'A' || statusRaw.includes('ABSENT')) status = 'ABSENT';
          else if (statusRaw === 'HD' || statusRaw.includes('HALF')) status = 'HALF_DAY';
          else if (statusRaw === 'L' || statusRaw.includes('LEAVE')) status = 'LEAVE';
          else if (statusRaw === 'WO' || statusRaw.includes('OFF')) status = 'WEEKLY_OFF';
          else if (statusRaw === 'H' || statusRaw.includes('HOLI')) status = 'HOLIDAY';

          let netHours = status === 'PRESENT' ? 8 : status === 'HALF_DAY' ? 4 : 0;
          if (inVal && outVal) {
            const [inH, inM] = inVal.split(':').map(Number);
            const [outH, outM] = outVal.split(':').map(Number);
            if (!isNaN(inH) && !isNaN(outH)) {
              let diffMins = (outH * 60 + (outM || 0)) - (inH * 60 + (inM || 0)) - breakMin;
              if (diffMins < 0) diffMins += 24 * 60; // overnight shift
              netHours = Math.max(0, Math.round((diffMins / 60) * 10) / 10);
            }
          }

          validStaff.push({
            employeeId: empIdVal,
            name: nameVal,
            department: 'Operations',
            designation: 'Staff',
            baseSalary: 3500,
            standardHours: 8,
            status: 'ACTIVE',
          });

          validAttendance.push({
            date: dateStr,
            checkIn: inVal,
            checkOut: outVal,
            breakMinutes: breakMin,
            grossHours: netHours + (breakMin / 60),
            netHours,
            overtimeHours: Math.max(0, netHours - 8),
            status,
            remarks,
          });
        }

        return {
          sheetName,
          detectedType: 'daily_log',
          totalRows: rawRows.length - 1,
          validStaff,
          validAttendance,
          errors,
          warnings,
        };
      }

      if (hasEmpId && hasName) {
        // Staff Master Sheet
        const empIdIdx = headerRow.findIndex((h) => h.includes('emp') || h.includes('code') || h === 'id');
        const nameIdx = headerRow.findIndex((h) => h.includes('name'));
        const deptIdx = headerRow.findIndex((h) => h.includes('dept') || h.includes('department'));
        const desigIdx = headerRow.findIndex((h) => h.includes('desig') || h.includes('role') || h.includes('title'));
        const phoneIdx = headerRow.findIndex((h) => h.includes('phone') || h.includes('contact') || h.includes('mobile'));
        const salaryIdx = headerRow.findIndex((h) => h.includes('salary') || h.includes('basic') || h.includes('pay'));
        const dateIdx = headerRow.findIndex((h) => h.includes('join') || h.includes('date'));

        for (let r = 1; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row || row.length === 0) continue;
          const empIdVal = empIdIdx >= 0 && row[empIdIdx] ? String(row[empIdIdx]).trim() : `EMP-${r}`;
          const nameVal = nameIdx >= 0 && row[nameIdx] ? String(row[nameIdx]).trim() : `Staff ${r}`;
          const deptVal = deptIdx >= 0 && row[deptIdx] ? String(row[deptIdx]).trim() : 'Operations';
          const desigVal = desigIdx >= 0 && row[desigIdx] ? String(row[desigIdx]).trim() : 'Team Member';
          const phoneVal = phoneIdx >= 0 && row[phoneIdx] ? String(row[phoneIdx]).trim() : undefined;
          const salaryVal = salaryIdx >= 0 && row[salaryIdx] ? Number(row[salaryIdx]) || 3500 : 3500;
          const joinVal = dateIdx >= 0 && row[dateIdx] ? String(row[dateIdx]).trim() : '2025-01-01';

          validStaff.push({
            employeeId: empIdVal,
            name: nameVal,
            department: deptVal,
            designation: desigVal,
            phone: phoneVal,
            baseSalary: salaryVal,
            standardHours: 8,
            joinDate: joinVal,
            status: 'ACTIVE',
          });
        }

        return {
          sheetName,
          detectedType: 'employee_list',
          totalRows: rawRows.length - 1,
          validStaff,
          validAttendance: [],
          errors,
          warnings,
        };
      }
    }

    errors.push('Could not automatically determine the column structure of the uploaded Excel sheets. Please check the column headers or use our template.');
    return {
      sheetName: sheetNames[0] || 'Unknown',
      detectedType: 'unknown',
      totalRows: 0,
      validStaff: [],
      validAttendance: [],
      errors,
      warnings,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push(`Failed to read Excel file: ${message}`);
    return {
      sheetName: 'Error',
      detectedType: 'unknown',
      totalRows: 0,
      validStaff: [],
      validAttendance: [],
      errors,
      warnings,
    };
  }
}
