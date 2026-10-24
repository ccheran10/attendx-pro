import React, { useState } from 'react';
import {
  Staff,
  AttendanceRecord,
  HolidayRecord,
  LeaveRecord,
  WorkspaceSettings,
  EmployeePayroll,
} from '../types/attendance';
import { calculateEmployeePayroll } from '../utils/payrollCalculator';
import { exportMonthlyRegisterExcel } from '../utils/excelEngine';
import {
  FileSpreadsheet,
  Printer,
  ChevronLeft,
  ChevronRight,
  Eye,
  Building2,
  DollarSign,
  TrendingDown,
  Clock,
  CheckCircle,
  X,
} from 'lucide-react';

interface SalaryPayrollViewProps {
  staffList: Staff[];
  attendanceList: AttendanceRecord[];
  holidays: HolidayRecord[];
  leaves: LeaveRecord[];
  settings: WorkspaceSettings;
  currentMonth: string;
  onMonthChange: (month: string) => void;
}

export const SalaryPayrollView: React.FC<SalaryPayrollViewProps> = ({
  staffList,
  attendanceList,
  holidays,
  leaves,
  settings,
  currentMonth,
  onMonthChange,
}) => {
  const [selectedSlip, setSelectedSlip] = useState<EmployeePayroll | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const activeStaff = staffList.filter((s) => s.status === 'ACTIVE');

  const payrolls: EmployeePayroll[] = activeStaff.map((staff) =>
    calculateEmployeePayroll(
      staff,
      currentMonth,
      attendanceList,
      holidays,
      leaves,
      settings
    )
  );

  const filteredPayrolls = payrolls.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Totals
  const totalBasic = payrolls.reduce((sum, p) => sum + p.baseSalary, 0);
  const totalDeductions = payrolls.reduce(
    (sum, p) => sum + p.absenceDeductions + p.halfDayDeductions,
    0
  );
  const totalOvertime = payrolls.reduce((sum, p) => sum + p.overtimeEarnings, 0);
  const totalNet = payrolls.reduce((sum, p) => sum + p.netPayableSalary, 0);

  const changeMonthBy = (offset: number) => {
    const [y, m] = currentMonth.split('-').map(Number);
    let newM = m + offset;
    let newY = y;
    if (newM < 1) {
      newM = 12;
      newY -= 1;
    } else if (newM > 12) {
      newM = 1;
      newY += 1;
    }
    onMonthChange(`${newY}-${String(newM).padStart(2, '0')}`);
  };

  const handleExportExcel = () => {
    exportMonthlyRegisterExcel(
      currentMonth,
      activeStaff,
      attendanceList,
      holidays,
      leaves,
      settings
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Bar with Month and Export Controls */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeMonthBy(-1)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <input
            type="month"
            value={currentMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          />
          <button
            onClick={() => changeMonthBy(1)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-500 font-medium ml-2">
            Formula: {settings.salaryBase.replace('_', ' ')} · Multiplier: {settings.overtimeMultiplier}x
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Payroll (.xlsx)</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Summary</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="no-print grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Basic Budget</span>
          <div className="mt-2 text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {settings.currencySymbol}{totalBasic.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Total contractual basic</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Absence Deductions</span>
          <div className="mt-2 text-xl font-bold font-mono tabular-nums text-red-600">
            -{settings.currencySymbol}{totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Unpaid absences & half-days</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overtime Payout</span>
          <div className="mt-2 text-xl font-bold font-mono tabular-nums text-emerald-600">
            +{settings.currencySymbol}{totalOvertime.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Approved overtime hours</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-850 border border-indigo-200 dark:border-indigo-900/60 shadow-2xs bg-indigo-50/20">
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Net Monthly Payout</span>
          <div className="mt-2 text-xl font-bold font-mono tabular-nums text-indigo-700 dark:text-indigo-400">
            {settings.currencySymbol}{totalNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Net payable after calculations</p>
        </div>
      </div>

      {/* Search */}
      <div className="no-print flex items-center justify-between">
        <input
          type="text"
          placeholder="Filter payroll by name or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-72 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
        />
      </div>

      {/* Payroll Table */}
      <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs print-sheet">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Monthly Payroll Register — {currentMonth}
          </h2>
          <span className="text-xs text-slate-500">
            {activeStaff.length} active employees
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-3">Dept</th>
                <th className="py-3 px-3">Basic Salary</th>
                <th className="py-3 px-3">Daily Rate</th>
                <th className="py-3 px-2 text-center">Cal / Work</th>
                <th className="py-3 px-2 text-center">Paid Days</th>
                <th className="py-3 px-3">Absence Deduct</th>
                <th className="py-3 px-3">OT Hours</th>
                <th className="py-3 px-3">OT Earnings</th>
                <th className="py-3 px-3 font-bold text-right">Net Payable</th>
                <th className="py-3 px-4 text-right no-print">Pay Slip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPayrolls.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    No payroll data available.
                  </td>
                </tr>
              ) : (
                filteredPayrolls.map((p) => (
                  <tr
                    key={p.staffId}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {p.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {p.employeeId} · {p.designation}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                      {p.department}
                    </td>

                    <td className="py-3 px-3 font-mono tabular-nums text-slate-800 dark:text-slate-200">
                      {settings.currencySymbol}{p.baseSalary.toLocaleString()}
                    </td>

                    <td className="py-3 px-3 font-mono tabular-nums text-slate-600 dark:text-slate-400">
                      {settings.currencySymbol}{p.dailyRate.toFixed(2)}
                    </td>

                    <td className="py-3 px-2 text-center font-mono tabular-nums text-slate-500">
                      {p.calendarDays} / {p.scheduledWorkingDays}
                    </td>

                    <td className="py-3 px-2 text-center font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400">
                      {p.paidDays}
                    </td>

                    <td className="py-3 px-3 font-mono tabular-nums text-red-600">
                      {p.absenceDeductions + p.halfDayDeductions > 0
                        ? `-${settings.currencySymbol}${(p.absenceDeductions + p.halfDayDeductions).toFixed(2)}`
                        : '-'}
                    </td>

                    <td className="py-3 px-3 font-mono tabular-nums text-slate-600 dark:text-slate-400">
                      {p.overtimeHours > 0 ? `${p.overtimeHours}h` : '-'}
                    </td>

                    <td className="py-3 px-3 font-mono tabular-nums text-emerald-600">
                      {p.overtimeEarnings > 0
                        ? `+${settings.currencySymbol}${p.overtimeEarnings.toFixed(2)}`
                        : '-'}
                    </td>

                    <td className="py-3 px-3 font-mono font-bold tabular-nums text-right text-indigo-700 dark:text-indigo-400 text-sm">
                      {settings.currencySymbol}{p.netPayableSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    <td className="py-3 px-4 text-right no-print">
                      <button
                        onClick={() => setSelectedSlip(p)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition inline-flex items-center gap-1 text-xs"
                        title="View printable pay slip"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Slip</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Individual Pay Slip Modal */}
      {selectedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-8 my-8 print-sheet">
            {/* Modal Header */}
            <div className="no-print flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Salary Statement & Pay Slip
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  onClick={() => setSelectedSlip(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Slip Content */}
            <div className="mt-4 border border-slate-200 dark:border-slate-700 rounded-xl p-6 bg-slate-50/50 dark:bg-slate-850">
              {/* Slip Org Header */}
              <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {settings.businessName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Staff Attendance & Monthly Salary Voucher
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Pay Period: {selectedSlip.month}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Generated: {new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Employee Particulars Grid */}
              <div className="grid grid-cols-2 gap-y-2 gap-x-4 py-4 border-b border-slate-200 dark:border-slate-700 text-xs">
                <div>
                  <span className="text-slate-400">Employee Name:</span>{' '}
                  <span className="font-bold text-slate-900 dark:text-white">{selectedSlip.name}</span>
                </div>
                <div>
                  <span className="text-slate-400">Employee Code:</span>{' '}
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{selectedSlip.employeeId}</span>
                </div>
                <div>
                  <span className="text-slate-400">Designation:</span>{' '}
                  <span className="text-slate-800 dark:text-slate-200">{selectedSlip.designation}</span>
                </div>
                <div>
                  <span className="text-slate-400">Department:</span>{' '}
                  <span className="text-slate-800 dark:text-slate-200">{selectedSlip.department}</span>
                </div>
                <div>
                  <span className="text-slate-400">Daily Pro-Rata Rate:</span>{' '}
                  <span className="font-mono text-slate-800 dark:text-slate-200">{settings.currencySymbol}{selectedSlip.dailyRate.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-400">Paid Working Days:</span>{' '}
                  <span className="font-mono font-bold text-emerald-600">{selectedSlip.paidDays} / {selectedSlip.calendarDays}</span>
                </div>
              </div>

              {/* Attendance Details Strip */}
              <div className="py-3 border-b border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 flex justify-between">
                <span>Present: <strong>{selectedSlip.daysPresent}</strong></span>
                <span>Absences: <strong className="text-red-600">{selectedSlip.daysAbsent}</strong></span>
                <span>Half Days: <strong>{selectedSlip.halfDays}</strong></span>
                <span>Leaves: <strong>{selectedSlip.paidLeaves + selectedSlip.unpaidLeaves}</strong></span>
                <span>Weekly Offs: <strong>{selectedSlip.weeklyOffs}</strong></span>
                <span>Holidays: <strong>{selectedSlip.paidHolidays}</strong></span>
              </div>

              {/* Earnings & Deductions 2-Column Ledger */}
              <div className="grid grid-cols-2 gap-4 py-4 text-xs">
                {/* Earnings */}
                <div className="space-y-2">
                  <div className="font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-1">
                    Earnings
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Monthly Basic</span>
                    <span className="font-mono text-slate-900 dark:text-white">
                      {settings.currencySymbol}{selectedSlip.baseSalary.toFixed(2)}
                    </span>
                  </div>
                  {selectedSlip.overtimeEarnings > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Overtime ({selectedSlip.overtimeHours}h)</span>
                      <span className="font-mono">
                        +{settings.currencySymbol}{selectedSlip.overtimeEarnings.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 font-bold">
                    <span>Total Gross Earnings</span>
                    <span className="font-mono">
                      {settings.currencySymbol}{selectedSlip.grossSalary.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Deductions */}
                <div className="space-y-2">
                  <div className="font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-1">
                    Deductions
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Absence Deductions ({selectedSlip.daysAbsent + selectedSlip.unpaidLeaves}d)</span>
                    <span className="font-mono">
                      -{settings.currencySymbol}{selectedSlip.absenceDeductions.toFixed(2)}
                    </span>
                  </div>
                  {selectedSlip.halfDayDeductions > 0 && (
                    <div className="flex justify-between text-amber-600">
                      <span>Half-Day Deductions ({selectedSlip.halfDays}x)</span>
                      <span className="font-mono">
                        -{settings.currencySymbol}{selectedSlip.halfDayDeductions.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 font-bold text-red-600">
                    <span>Total Deductions</span>
                    <span className="font-mono">
                      -{settings.currencySymbol}{(selectedSlip.absenceDeductions + selectedSlip.halfDayDeductions).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Payout Banner */}
              <div className="mt-4 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-bold text-indigo-900 dark:text-indigo-200">
                    Net Payable Salary
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Direct bank transfer / cash disbursement
                  </p>
                </div>
                <div className="text-xl font-bold font-mono text-indigo-700 dark:text-indigo-300">
                  {settings.currencySymbol}{selectedSlip.netPayableSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              {/* Signature space */}
              <div className="mt-12 pt-4 border-t border-dashed border-slate-300 dark:border-slate-700 grid grid-cols-2 gap-8 text-center text-xs text-slate-500">
                <div>
                  <div className="h-10" />
                  <div className="border-t border-slate-300 dark:border-slate-600 pt-1">
                    Employee Signature
                  </div>
                </div>
                <div>
                  <div className="h-10" />
                  <div className="border-t border-slate-300 dark:border-slate-600 pt-1">
                    Authorized Signatory / HR
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
