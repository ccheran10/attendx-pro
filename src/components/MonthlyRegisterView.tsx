import React, { useState } from 'react';
import {
  Staff,
  AttendanceRecord,
  HolidayRecord,
  LeaveRecord,
  WorkspaceSettings,
  AttendanceStatus,
} from '../types/attendance';
import { api } from '../services/api';
import {
  getDaysInMonth,
  formatDateStr,
  calculateEmployeePayroll,
} from '../utils/payrollCalculator';
import { exportMonthlyRegisterExcel } from '../utils/excelEngine';
import {
  FileSpreadsheet,
  Printer,
  ChevronLeft,
  ChevronRight,
  Filter,
  Info,
  Calendar,
} from 'lucide-react';

interface MonthlyRegisterViewProps {
  staffList: Staff[];
  attendanceList: AttendanceRecord[];
  holidays: HolidayRecord[];
  leaves: LeaveRecord[];
  settings: WorkspaceSettings;
  currentMonth: string;
  onMonthChange: (month: string) => void;
  onRefresh: () => void;
}

export const MonthlyRegisterView: React.FC<MonthlyRegisterViewProps> = ({
  staffList,
  attendanceList,
  holidays,
  leaves,
  settings,
  currentMonth,
  onMonthChange,
  onRefresh,
}) => {
  const [selectedStaffForCell, setSelectedStaffForCell] = useState<{
    staff: Staff;
    date: string;
    dayNum: number;
    currentStatus?: AttendanceStatus;
  } | null>(null);

  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  const [yearStr, monthNumStr] = currentMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthNumStr, 10);
  const daysInMonth = getDaysInMonth(year, month);

  // Month navigation
  const changeMonthBy = (offset: number) => {
    let newMonth = month + offset;
    let newYear = year;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    } else if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    const mStr = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    onMonthChange(mStr);
  };

  const activeStaff = staffList.filter((s) => s.status === 'ACTIVE');
  const departments = ['ALL', ...Array.from(new Set(activeStaff.map((s) => s.department)))];

  const filteredStaff = activeStaff.filter(
    (s) => departmentFilter === 'ALL' || s.department === departmentFilter
  );

  // Attendance map: key = `${staffId}_${dateStr}`
  const attMap = new Map<string, AttendanceRecord>();
  attendanceList.forEach((a) => {
    attMap.set(`${a.staffId}_${a.date}`, a);
  });

  // Holiday map
  const holidayMap = new Map<string, HolidayRecord>();
  holidays.forEach((h) => {
    holidayMap.set(h.date, h);
  });

  // Cell Click handler to toggle status
  const handleCellClick = (staff: Staff, dayNum: number) => {
    const dateStr = formatDateStr(year, month, dayNum);
    const existing = attMap.get(`${staff.id}_${dateStr}`);
    setSelectedStaffForCell({
      staff,
      date: dateStr,
      dayNum,
      currentStatus: existing?.status,
    });
  };

  const setCellStatus = async (status: AttendanceStatus) => {
    if (!selectedStaffForCell) return;
    try {
      const net =
        status === 'PRESENT'
          ? (selectedStaffForCell.staff.standardHours || settings.standardHours || 8)
          : status === 'HALF_DAY'
          ? 4
          : 0;

      await api.upsertAttendance({
        staffId: selectedStaffForCell.staff.id,
        date: selectedStaffForCell.date,
        status,
        checkIn: status === 'PRESENT' || status === 'HALF_DAY' ? '09:00' : undefined,
        checkOut: status === 'PRESENT' ? '17:30' : status === 'HALF_DAY' ? '13:00' : undefined,
        breakMinutes: status === 'PRESENT' ? 60 : 0,
        grossHours: net + (status === 'PRESENT' ? 1 : 0),
        netHours: net,
        overtimeHours: 0,
      });

      setSelectedStaffForCell(null);
      onRefresh();
    } catch (e) {
      console.error(e);
    }
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
      {/* Header controls & actions */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-2xs">
        {/* Month Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeMonthBy(-1)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <input
              type="month"
              value={currentMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <button
            onClick={() => changeMonthBy(1)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
          <span className="font-semibold text-slate-500">Legend:</span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">P = Present</span>
          <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 font-bold">A = Absent</span>
          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">HD = Half Day</span>
          <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">L = Leave</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">WO = Off</span>
          <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">H = Holiday</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
            title="Download formatted 31-day Excel Register"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel (.xlsx)</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Register</span>
          </button>
        </div>
      </div>

      {/* Filter by Department */}
      <div className="no-print flex items-center gap-2">
        <Filter className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-xs text-slate-500">Department:</span>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setDepartmentFilter(dept)}
              className={`px-2.5 py-0.5 rounded text-xs font-medium transition ${
                departmentFilter === dept
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Printable Sheet Wrapper */}
      <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs overflow-hidden print-sheet">
        {/* Printable Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {settings.businessName} — Monthly Attendance Register
            </h2>
            <p className="text-xs text-slate-500">
              Period: {currentMonth} ({daysInMonth} Days) · Shift: {settings.standardHours}h/day · Off: {settings.weeklyOffDay === 0 ? 'Sunday' : 'Saturday'}
            </p>
          </div>
          <div className="text-right text-xs text-slate-500 hidden sm:block">
            <span>Click any day cell to edit status directly</span>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 font-semibold">
                <th className="py-2.5 px-3 text-left sticky left-0 z-20 bg-slate-100 dark:bg-slate-800 shadow-r border-r border-slate-200 dark:border-slate-700 whitespace-nowrap min-w-[140px]">
                  Employee
                </th>
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const dayNum = i + 1;
                  const dateObj = new Date(year, month - 1, dayNum);
                  const isWO = dateObj.getDay() === settings.weeklyOffDay;
                  const dateStr = formatDateStr(year, month, dayNum);
                  const isHol = holidayMap.has(dateStr);

                  return (
                    <th
                      key={dayNum}
                      className={`py-2 px-1 text-[10px] min-w-[26px] font-mono border-r border-slate-200 dark:border-slate-700 ${
                        isHol
                          ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                          : isWO
                          ? 'bg-slate-200 dark:bg-slate-750 text-slate-700 font-bold'
                          : ''
                      }`}
                    >
                      <div>{dayNum}</div>
                      <div className="text-[9px] font-normal opacity-70">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][dateObj.getDay()]}
                      </div>
                    </th>
                  );
                })}
                {/* Summary Columns */}
                <th className="py-2 px-2 font-mono text-[11px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-r border-slate-200 dark:border-slate-700">
                  P
                </th>
                <th className="py-2 px-2 font-mono text-[11px] bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-r border-slate-200 dark:border-slate-700">
                  A
                </th>
                <th className="py-2 px-2 font-mono text-[11px] bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-r border-slate-200 dark:border-slate-700">
                  HD
                </th>
                <th className="py-2 px-2 font-mono text-[11px] bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-r border-slate-200 dark:border-slate-700">
                  L
                </th>
                <th className="py-2 px-2 font-mono text-[11px] bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
                  Paid
                </th>
                <th className="py-2 px-2 font-mono text-[11px] bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
                  Hours
                </th>
                <th className="py-2 px-3 font-mono text-[11px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 text-right min-w-[90px]">
                  Net Pay
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={daysInMonth + 8} className="py-8 text-center text-slate-400">
                    No active staff in this department.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => {
                  const payroll = calculateEmployeePayroll(
                    staff,
                    currentMonth,
                    attendanceList,
                    holidays,
                    leaves,
                    settings
                  );

                  return (
                    <tr
                      key={staff.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Sticky Employee Name & ID */}
                      <td className="py-2 px-3 text-left sticky left-0 z-10 bg-white dark:bg-slate-850 shadow-r border-r border-slate-200 dark:border-slate-700">
                        <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[130px]">
                          {staff.name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 truncate">
                          {staff.employeeId} · {staff.department}
                        </div>
                      </td>

                      {/* Day 1..31 Cells */}
                      {Array.from({ length: daysInMonth }, (_, i) => {
                        const dayNum = i + 1;
                        const dateStr = formatDateStr(year, month, dayNum);
                        const rec = attMap.get(`${staff.id}_${dateStr}`);
                        const dateObj = new Date(year, month - 1, dayNum);
                        const isWO = dateObj.getDay() === settings.weeklyOffDay;
                        const hol = holidayMap.get(dateStr);

                        let code = '-';
                        let cellBg = '';
                        let cellText = 'text-slate-400';

                        if (rec) {
                          switch (rec.status) {
                            case 'PRESENT':
                              code = 'P';
                              cellBg = 'bg-emerald-100/80 dark:bg-emerald-950/60';
                              cellText = 'text-emerald-800 dark:text-emerald-300 font-bold';
                              break;
                            case 'ABSENT':
                              code = 'A';
                              cellBg = 'bg-red-100/80 dark:bg-red-950/60';
                              cellText = 'text-red-800 dark:text-red-300 font-bold';
                              break;
                            case 'HALF_DAY':
                              code = 'HD';
                              cellBg = 'bg-amber-100/80 dark:bg-amber-950/60';
                              cellText = 'text-amber-800 dark:text-amber-300 font-bold';
                              break;
                            case 'LEAVE':
                              code = 'L';
                              cellBg = 'bg-blue-100/80 dark:bg-blue-950/60';
                              cellText = 'text-blue-800 dark:text-blue-300 font-bold';
                              break;
                            case 'WEEKLY_OFF':
                              code = 'WO';
                              cellBg = 'bg-slate-200/70 dark:bg-slate-800';
                              cellText = 'text-slate-700 dark:text-slate-400 font-bold';
                              break;
                            case 'HOLIDAY':
                              code = 'H';
                              cellBg = 'bg-purple-100/80 dark:bg-purple-950/60';
                              cellText = 'text-purple-800 dark:text-purple-300 font-bold';
                              break;
                          }
                        } else if (hol) {
                          code = 'H';
                          cellBg = 'bg-purple-50 dark:bg-purple-950/40';
                          cellText = 'text-purple-600 dark:text-purple-400 font-semibold';
                        } else if (isWO) {
                          code = 'WO';
                          cellBg = 'bg-slate-100 dark:bg-slate-800/80';
                          cellText = 'text-slate-500 font-medium';
                        }

                        return (
                          <td
                            key={dayNum}
                            onClick={() => handleCellClick(staff, dayNum)}
                            className={`py-1.5 px-0.5 border-r border-slate-100 dark:border-slate-800 font-mono text-[10px] cursor-pointer hover:ring-1 hover:ring-indigo-500 transition-all ${cellBg} ${cellText}`}
                            title={`${staff.name} - ${dateStr}: ${code}`}
                          >
                            {code}
                          </td>
                        );
                      })}

                      {/* Summary Columns */}
                      <td className="py-2 px-1 font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400 border-r border-slate-200 dark:border-slate-700 bg-emerald-50/50">
                        {payroll.daysPresent}
                      </td>
                      <td className="py-2 px-1 font-mono tabular-nums font-bold text-red-600 dark:text-red-400 border-r border-slate-200 dark:border-slate-700 bg-red-50/50">
                        {payroll.daysAbsent}
                      </td>
                      <td className="py-2 px-1 font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400 border-r border-slate-200 dark:border-slate-700 bg-amber-50/50">
                        {payroll.halfDays}
                      </td>
                      <td className="py-2 px-1 font-mono tabular-nums font-bold text-blue-600 dark:text-blue-400 border-r border-slate-200 dark:border-slate-700 bg-blue-50/50">
                        {payroll.paidLeaves + payroll.unpaidLeaves}
                      </td>
                      <td className="py-2 px-1 font-mono tabular-nums font-bold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-700">
                        {payroll.paidDays}
                      </td>
                      <td className="py-2 px-1 font-mono tabular-nums text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700">
                        {payroll.totalHours}
                      </td>
                      <td className="py-2 px-3 font-mono tabular-nums font-bold text-slate-900 dark:text-white text-right bg-indigo-50/40">
                        {settings.currencySymbol}{payroll.netPayableSalary.toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Cell Status Picker Dialog */}
      {selectedStaffForCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Update Attendance
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedStaffForCell.staff.name} ({selectedStaffForCell.staff.employeeId}) · {selectedStaffForCell.date}
            </p>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={() => setCellStatus('PRESENT')}
                className="py-2 px-3 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-600 hover:text-white text-xs font-bold transition flex items-center justify-center gap-1.5 border border-emerald-200"
              >
                <span>P - Present (Full)</span>
              </button>
              <button
                onClick={() => setCellStatus('ABSENT')}
                className="py-2 px-3 rounded-lg bg-red-50 text-red-800 hover:bg-red-600 hover:text-white text-xs font-bold transition flex items-center justify-center gap-1.5 border border-red-200"
              >
                <span>A - Absent</span>
              </button>
              <button
                onClick={() => setCellStatus('HALF_DAY')}
                className="py-2 px-3 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-600 hover:text-white text-xs font-bold transition flex items-center justify-center gap-1.5 border border-amber-200"
              >
                <span>HD - Half Day</span>
              </button>
              <button
                onClick={() => setCellStatus('LEAVE')}
                className="py-2 px-3 rounded-lg bg-blue-50 text-blue-800 hover:bg-blue-600 hover:text-white text-xs font-bold transition flex items-center justify-center gap-1.5 border border-blue-200"
              >
                <span>L - Leave</span>
              </button>
              <button
                onClick={() => setCellStatus('WEEKLY_OFF')}
                className="py-2 px-3 rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-700 hover:text-white text-xs font-bold transition flex items-center justify-center gap-1.5 border border-slate-300"
              >
                <span>WO - Weekly Off</span>
              </button>
              <button
                onClick={() => setCellStatus('HOLIDAY')}
                className="py-2 px-3 rounded-lg bg-purple-50 text-purple-800 hover:bg-purple-600 hover:text-white text-xs font-bold transition flex items-center justify-center gap-1.5 border border-purple-200"
              >
                <span>H - Holiday</span>
              </button>
            </div>

            <button
              onClick={() => setSelectedStaffForCell(null)}
              className="mt-4 w-full py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
