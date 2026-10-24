export type AttendanceStatus = 
  | 'PRESENT'      // P
  | 'ABSENT'       // A
  | 'HALF_DAY'     // HD
  | 'LEAVE'        // L (Approved paid/unpaid leave)
  | 'WEEKLY_OFF'   // WO
  | 'HOLIDAY';     // H

export type LeaveType = 'SICK' | 'CASUAL' | 'EARNED' | 'UNPAID';
export type LeaveStatus = 'APPROVED' | 'PENDING' | 'REJECTED';
export type StaffStatus = 'ACTIVE' | 'INACTIVE';
export type SalaryCalculationBase = 'CALENDAR_DAYS' | 'WORKING_DAYS' | 'FIXED_30';

export interface Staff {
  id: string;
  userId: string;
  employeeId: string; // e.g. EMP-001
  name: string;
  designation: string;
  department: string;
  phone?: string;
  email?: string;
  joinDate: string; // YYYY-MM-DD
  standardHours: number; // default 8
  baseSalary: number; // Monthly basic
  overtimeRate: number; // Hourly overtime rate (or multiplier based)
  status: StaffStatus;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  staffId: string;
  date: string; // YYYY-MM-DD
  checkIn?: string; // HH:mm
  checkOut?: string; // HH:mm
  breakMinutes: number; // default 0 or 60
  grossHours: number;
  netHours: number;
  status: AttendanceStatus;
  overtimeHours: number;
  remarks?: string;
  updatedAt: string;
}

export interface LeaveRecord {
  id: string;
  userId: string;
  staffId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  daysCount: number;
  leaveType: LeaveType;
  reason: string;
  status: LeaveStatus;
  isPaid: boolean;
  createdAt: string;
}

export interface HolidayRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  name: string;
  isPaid: boolean;
}

export interface WorkspaceSettings {
  userId: string;
  businessName: string;
  financialYear: string;
  standardHours: number;
  weeklyOffDay: number; // 0 for Sunday, 6 for Saturday
  salaryBase: SalaryCalculationBase;
  overtimeMultiplier: number; // e.g. 1.5
  currencySymbol: string; // e.g. "$", "₹", "£", "€"
}

export interface UserProfile {
  id: string;
  username: string;
  createdAt: string;
}

// Monthly Payroll Calculation Output for an Employee
export interface EmployeePayroll {
  staffId: string;
  employeeId: string;
  name: string;
  department: string;
  designation: string;
  month: string; // YYYY-MM
  calendarDays: number;
  scheduledWorkingDays: number;
  daysPresent: number;
  daysAbsent: number;
  halfDays: number;
  paidLeaves: number;
  unpaidLeaves: number;
  weeklyOffs: number;
  paidHolidays: number;
  paidDays: number;
  totalHours: number;
  standardHours: number;
  overtimeHours: number;
  baseSalary: number;
  dailyRate: number;
  hourlyRate: number;
  absenceDeductions: number;
  halfDayDeductions: number;
  overtimeEarnings: number;
  allowances: number;
  otherDeductions: number;
  grossSalary: number;
  netPayableSalary: number;
}
