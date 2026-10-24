import React from 'react';
import {
  Staff,
  AttendanceRecord,
  HolidayRecord,
  WorkspaceSettings,
  LeaveRecord,
} from '../types/attendance';
import { NavTab } from './Navbar';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarCheck,
  TableProperties,
  FileSpreadsheet,
  ArrowRight,
  UserPlus,
  Coins,
} from 'lucide-react';
import { calculateEmployeePayroll } from '../utils/payrollCalculator';

interface DashboardViewProps {
  staffList: Staff[];
  attendanceList: AttendanceRecord[];
  holidays: HolidayRecord[];
  leaves: LeaveRecord[];
  settings: WorkspaceSettings;
  currentMonth: string;
  onNavigate: (tab: NavTab) => void;
  onQuickSeed: () => void;
  loading: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  staffList,
  attendanceList,
  holidays,
  leaves,
  settings,
  currentMonth,
  onNavigate,
  onQuickSeed,
  loading,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const activeStaff = staffList.filter((s) => s.status === 'ACTIVE');

  // Today's attendance calculation
  const todayAttendance = attendanceList.filter((a) => a.date === todayStr);
  const presentToday = todayAttendance.filter((a) => a.status === 'PRESENT').length;
  const absentToday = todayAttendance.filter((a) => a.status === 'ABSENT').length;
  const halfDayToday = todayAttendance.filter((a) => a.status === 'HALF_DAY').length;
  const leaveToday = todayAttendance.filter((a) => a.status === 'LEAVE').length;

  const totalLoggedToday = presentToday + absentToday + halfDayToday + leaveToday;
  const attendanceRate = activeStaff.length > 0 ? Math.round((presentToday / activeStaff.length) * 100) : 0;

  // Total Hours today
  const hoursToday = todayAttendance.reduce((acc, a) => acc + (a.netHours || 0), 0);

  // Estimated Monthly Payroll
  const monthlyPayrolls = activeStaff.map((s) =>
    calculateEmployeePayroll(s, currentMonth, attendanceList, holidays, leaves, settings)
  );
  const totalMonthlyPayout = monthlyPayrolls.reduce((sum, p) => sum + p.netPayableSalary, 0);

  return (
    <div className="space-y-6">
      {/* Header bar with greeting & quick actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {settings.businessName} Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time attendance tracking, shift metrics, and payroll summary for {currentMonth}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('daily')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Mark Today ({todayStr})</span>
          </button>
          <button
            onClick={() => onNavigate('register')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium transition"
          >
            <TableProperties className="w-3.5 h-3.5" />
            <span>Monthly Register</span>
          </button>
        </div>
      </div>

      {/* Zero data callout banner if empty */}
      {staffList.length === 0 && !loading && (
        <div className="p-5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-slate-800 dark:text-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-indigo-950 dark:text-indigo-200">
              Welcome to Your Attendance Workspace!
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Your workspace is ready. You can import your existing Excel workbook or start with a sample team to test calculations immediately.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onQuickSeed}
              className="px-3.5 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-sm transition"
            >
              Load Sample Team
            </button>
            <button
              onClick={() => onNavigate('excel')}
              className="px-3.5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 text-slate-800 dark:text-slate-200 transition"
            >
              Import Excel File
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Staff */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Staff</span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {activeStaff.length}
            </span>
            <span className="text-xs text-slate-400">
              ({staffList.length - activeStaff.length} inactive)
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Roster capacity</span>
            <button
              onClick={() => onNavigate('staff')}
              className="text-indigo-600 hover:underline font-medium"
            >
              Manage
            </button>
          </p>
        </div>

        {/* Card 2: Today's Present Rate */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Present Today</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-600">
              {presentToday}
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              / {activeStaff.length} ({attendanceRate}%)
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            {absentToday} absent · {halfDayToday} half-day · {leaveToday} leave
          </p>
        </div>

        {/* Card 3: Today's Clocked Hours */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hours Logged</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {hoursToday.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400">hrs today</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Standard: {settings.standardHours}h/shift
          </p>
        </div>

        {/* Card 4: Monthly Est Payroll */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Est. Payroll ({currentMonth})</span>
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-xs font-bold text-slate-500">{settings.currencySymbol}</span>
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {totalMonthlyPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>After absences & OT</span>
            <button
              onClick={() => onNavigate('payroll')}
              className="text-indigo-600 hover:underline font-medium"
            >
              Pay Slips
            </button>
          </p>
        </div>
      </div>

      {/* Main Grid: Today's Status Roster + Fast Workflow Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Today's Attendance Roster (2 cols) */}
        <div className="lg:col-span-2 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Today's Attendance Status ({todayStr})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {totalLoggedToday} of {activeStaff.length} logged
              </p>
            </div>
            <button
              onClick={() => onNavigate('daily')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>Full Logger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {activeStaff.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No employees registered yet. Add staff to begin tracking.
              </div>
            ) : (
              activeStaff.slice(0, 6).map((staff) => {
                const rec = todayAttendance.find((a) => a.staffId === staff.id);
                return (
                  <div key={staff.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {staff.name}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {staff.employeeId}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {staff.department} · {staff.designation}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {rec ? (
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              rec.status === 'PRESENT'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : rec.status === 'ABSENT'
                                ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                                : rec.status === 'HALF_DAY'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                            }`}
                          >
                            {rec.status}
                          </span>
                          <span className="text-xs font-mono tabular-nums text-slate-500">
                            {rec.netHours}h
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Not logged</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {activeStaff.length > 6 && (
            <div className="mt-3 text-center pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => onNavigate('daily')}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium"
              >
                + {activeStaff.length - 6} more employees
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Excel & Setup Modules */}
        <div className="space-y-4">
          {/* Quick Actions Card */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Quick Workflows
            </h2>
            <div className="space-y-2">
              <button
                onClick={() => onNavigate('excel')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Excel Import / Export
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Import workbook or export register
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('staff')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Add New Employee
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Set base salary, shift hours, ID
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('register')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
                    <TableProperties className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      31-Day Excel Register
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Interactive monthly matrix
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Business Policy Summary */}
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
            <span className="font-semibold text-slate-800 dark:text-slate-200">Workspace Rules:</span>
            <div className="flex justify-between">
              <span>Standard Shift:</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">{settings.standardHours}h / day</span>
            </div>
            <div className="flex justify-between">
              <span>Weekly Off:</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">{settings.weeklyOffDay === 0 ? 'Sunday' : 'Saturday'}</span>
            </div>
            <div className="flex justify-between">
              <span>Salary Basis:</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">{settings.salaryBase.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span>OT Multiplier:</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">{settings.overtimeMultiplier}x</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
