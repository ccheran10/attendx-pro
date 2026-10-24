import {
  Staff,
  AttendanceRecord,
  HolidayRecord,
  WorkspaceSettings,
  EmployeePayroll,
  LeaveRecord,
} from '../types/attendance';

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function formatDateStr(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export function calculateEmployeePayroll(
  staff: Staff,
  monthStr: string, // 'YYYY-MM'
  attendanceList: AttendanceRecord[],
  holidays: HolidayRecord[],
  leaves: LeaveRecord[],
  settings: WorkspaceSettings
): EmployeePayroll {
  const [yearStr, monthNumStr] = monthStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthNumStr, 10); // 1-12
  const calendarDays = getDaysInMonth(year, month);

  // Filter attendance for this staff and this month
  const staffAttendance = attendanceList.filter(
    (a) => a.staffId === staff.id && a.date.startsWith(monthStr)
  );
  const attendanceMap = new Map<string, AttendanceRecord>();
  staffAttendance.forEach((a) => attendanceMap.set(a.date, a));

  // Filter holidays for this month
  const monthHolidays = holidays.filter((h) => h.date.startsWith(monthStr));
  const holidayMap = new Map<string, HolidayRecord>();
  monthHolidays.forEach((h) => holidayMap.set(h.date, h));

  let weeklyOffCount = 0;
  let paidHolidaysCount = 0;
  let daysPresent = 0;
  let daysAbsent = 0;
  let halfDays = 0;
  let paidLeaves = 0;
  let unpaidLeaves = 0;
  let totalHours = 0;
  let overtimeHours = 0;

  for (let day = 1; day <= calendarDays; day++) {
    const dateStr = formatDateStr(year, month, day);
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay(); // 0 is Sunday, 6 is Saturday
    const isWeeklyOff = dayOfWeek === settings.weeklyOffDay;
    const holiday = holidayMap.get(dateStr);
    const record = attendanceMap.get(dateStr);

    if (record) {
      totalHours += record.netHours || 0;
      overtimeHours += record.overtimeHours || 0;

      switch (record.status) {
        case 'PRESENT':
          daysPresent += 1;
          break;
        case 'ABSENT':
          daysAbsent += 1;
          break;
        case 'HALF_DAY':
          halfDays += 1;
          break;
        case 'LEAVE':
          // Check if paid or unpaid from leaves
          const matchingLeave = leaves.find(
            (l) =>
              l.staffId === staff.id &&
              l.startDate <= dateStr &&
              l.endDate >= dateStr &&
              l.status === 'APPROVED'
          );
          if (matchingLeave && !matchingLeave.isPaid) {
            unpaidLeaves += 1;
          } else {
            paidLeaves += 1;
          }
          break;
        case 'WEEKLY_OFF':
          weeklyOffCount += 1;
          break;
        case 'HOLIDAY':
          paidHolidaysCount += 1;
          break;
      }
    } else {
      // If no explicit attendance entry recorded yet for this day:
      if (holiday) {
        if (holiday.isPaid) paidHolidaysCount += 1;
      } else if (isWeeklyOff) {
        weeklyOffCount += 1;
      }
    }
  }

  const scheduledWorkingDays = Math.max(
    0,
    calendarDays - weeklyOffCount - paidHolidaysCount
  );

  // Paid Days calculation: Present + Paid Leaves + Paid Holidays + Weekly Offs + (Half Days * 0.5)
  const paidDays =
    daysPresent +
    paidLeaves +
    paidHolidaysCount +
    weeklyOffCount +
    halfDays * 0.5;

  // Daily rate according to workspace formula setting
  let baseDivisor = calendarDays;
  if (settings.salaryBase === 'WORKING_DAYS') {
    baseDivisor = scheduledWorkingDays > 0 ? scheduledWorkingDays : calendarDays;
  } else if (settings.salaryBase === 'FIXED_30') {
    baseDivisor = 30;
  }
  const dailyRate = Math.round((staff.baseSalary / baseDivisor) * 100) / 100;
  const standardHours = staff.standardHours || settings.standardHours || 8;
  const hourlyRate = Math.round((dailyRate / standardHours) * 100) / 100;

  // Deductions
  const totalUnpaidAbsenceDays = daysAbsent + unpaidLeaves;
  const absenceDeductions =
    Math.round(totalUnpaidAbsenceDays * dailyRate * 100) / 100;
  const halfDayDeductions = Math.round(halfDays * 0.5 * dailyRate * 100) / 100;

  // Overtime earnings
  const otMultiplier = settings.overtimeMultiplier || 1.5;
  const overtimeRate = staff.overtimeRate || Math.round(hourlyRate * otMultiplier * 100) / 100;
  const overtimeEarnings =
    Math.round(overtimeHours * overtimeRate * 100) / 100;

  const allowances = 0;
  const otherDeductions = 0;
  const grossSalary = Math.round((staff.baseSalary + overtimeEarnings + allowances) * 100) / 100;
  const totalDeductions = absenceDeductions + halfDayDeductions + otherDeductions;
  const netPayableSalary = Math.max(0, Math.round((grossSalary - totalDeductions) * 100) / 100);

  return {
    staffId: staff.id,
    employeeId: staff.employeeId,
    name: staff.name,
    department: staff.department,
    designation: staff.designation,
    month: monthStr,
    calendarDays,
    scheduledWorkingDays,
    daysPresent,
    daysAbsent,
    halfDays,
    paidLeaves,
    unpaidLeaves,
    weeklyOffs: weeklyOffCount,
    paidHolidays: paidHolidaysCount,
    paidDays,
    totalHours: Math.round(totalHours * 10) / 10,
    standardHours,
    overtimeHours: Math.round(overtimeHours * 10) / 10,
    baseSalary: staff.baseSalary,
    dailyRate,
    hourlyRate,
    absenceDeductions,
    halfDayDeductions,
    overtimeEarnings,
    allowances,
    otherDeductions,
    grossSalary,
    netPayableSalary,
  };
}
