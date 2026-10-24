import React, { useState } from 'react';
import {
  Staff,
  AttendanceRecord,
  AttendanceStatus,
  WorkspaceSettings,
} from '../types/attendance';
import { api } from '../services/api';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Coffee,
  Save,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Edit2,
  X,
} from 'lucide-react';

interface DailyAttendanceViewProps {
  staffList: Staff[];
  attendanceList: AttendanceRecord[];
  settings: WorkspaceSettings;
  onRefresh: () => void;
}

export const DailyAttendanceView: React.FC<DailyAttendanceViewProps> = ({
  staffList,
  attendanceList,
  settings,
  onRefresh,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  // Time editing modal state
  const [checkInTime, setCheckInTime] = useState('09:00');
  const [checkOutTime, setCheckOutTime] = useState('17:30');
  const [breakMin, setBreakMin] = useState(60);
  const [editStatus, setEditStatus] = useState<AttendanceStatus>('PRESENT');
  const [editRemarks, setEditRemarks] = useState('');
  const [savingTime, setSavingTime] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);

  const activeStaff = staffList.filter((s) => s.status === 'ACTIVE');

  // Attendance records for the selected date
  const dayRecords = attendanceList.filter((a) => a.date === selectedDate);
  const recordMap = new Map<string, AttendanceRecord>();
  dayRecords.forEach((r) => recordMap.set(r.staffId, r));

  // Date Navigation
  const changeDateBy = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const departments = ['ALL', ...Array.from(new Set(activeStaff.map((s) => s.department)))];

  const filteredStaff = activeStaff.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.designation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = departmentFilter === 'ALL' || s.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  // Summary for selected day
  const presentCount = dayRecords.filter((r) => r.status === 'PRESENT').length;
  const absentCount = dayRecords.filter((r) => r.status === 'ABSENT').length;
  const halfDayCount = dayRecords.filter((r) => r.status === 'HALF_DAY').length;
  const leaveCount = dayRecords.filter((r) => r.status === 'LEAVE').length;
  const totalHours = dayRecords.reduce((sum, r) => sum + (r.netHours || 0), 0);

  // Quick single status update
  const handleQuickStatus = async (staff: Staff, status: AttendanceStatus) => {
    try {
      const net = status === 'PRESENT' ? (staff.standardHours || settings.standardHours || 8) : status === 'HALF_DAY' ? 4 : 0;
      await api.upsertAttendance({
        staffId: staff.id,
        date: selectedDate,
        status,
        checkIn: status === 'PRESENT' || status === 'HALF_DAY' ? '09:00' : undefined,
        checkOut: status === 'PRESENT' ? '17:30' : status === 'HALF_DAY' ? '13:00' : undefined,
        breakMinutes: status === 'PRESENT' ? 60 : 0,
        grossHours: net + (status === 'PRESENT' ? 1 : 0),
        netHours: net,
        overtimeHours: 0,
      });
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  // Batch "Mark All Present"
  const handleMarkAllPresent = async () => {
    try {
      setBatchLoading(true);
      const recordsToUpsert = activeStaff.map((s) => {
        const standard = s.standardHours || settings.standardHours || 8;
        return {
          staffId: s.id,
          date: selectedDate,
          status: 'PRESENT' as AttendanceStatus,
          checkIn: '09:00',
          checkOut: '17:30',
          breakMinutes: 60,
          grossHours: standard + 1,
          netHours: standard,
          overtimeHours: 0,
        };
      });
      await api.batchUpsertAttendance(recordsToUpsert);
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setBatchLoading(false);
    }
  };

  // Open detailed time editor modal
  const openTimeEditor = (staff: Staff) => {
    const existing = recordMap.get(staff.id);
    setEditingStaff(staff);
    if (existing) {
      setCheckInTime(existing.checkIn || '09:00');
      setCheckOutTime(existing.checkOut || '17:30');
      setBreakMin(existing.breakMinutes ?? 60);
      setEditStatus(existing.status);
      setEditRemarks(existing.remarks || '');
    } else {
      setCheckInTime('09:00');
      setCheckOutTime('17:30');
      setBreakMin(60);
      setEditStatus('PRESENT');
      setEditRemarks('');
    }
  };

  const handleSaveDetailedTime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    try {
      setSavingTime(true);
      let netHours = 0;
      let grossHours = 0;
      let otHours = 0;

      if (editStatus === 'PRESENT' || editStatus === 'HALF_DAY') {
        if (checkInTime && checkOutTime) {
          const [inH, inM] = checkInTime.split(':').map(Number);
          const [outH, outM] = checkOutTime.split(':').map(Number);
          let diff = (outH * 60 + (outM || 0)) - (inH * 60 + (inM || 0)) - breakMin;
          if (diff < 0) diff += 24 * 60; // overnight
          netHours = Math.max(0, Math.round((diff / 60) * 10) / 10);
          grossHours = Math.max(0, Math.round(((diff + breakMin) / 60) * 10) / 10);
          const standard = editingStaff.standardHours || settings.standardHours || 8;
          otHours = Math.max(0, Math.round((netHours - standard) * 10) / 10);
        } else {
          netHours = editStatus === 'PRESENT' ? (editingStaff.standardHours || 8) : 4;
        }
      }

      await api.upsertAttendance({
        staffId: editingStaff.id,
        date: selectedDate,
        status: editStatus,
        checkIn: checkInTime || undefined,
        checkOut: checkOutTime || undefined,
        breakMinutes: Number(breakMin) || 0,
        grossHours,
        netHours,
        overtimeHours: otHours,
        remarks: editRemarks.trim() || undefined,
      });

      setEditingStaff(null);
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setSavingTime(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Date Header Controls & Summary Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-2xs">
        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeDateBy(-1)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <button
            onClick={() => changeDateBy(1)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
          >
            Today
          </button>
        </div>

        {/* Day Counts Summary */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{presentCount} Present</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <div className="flex items-center gap-1 font-semibold text-red-600 dark:text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>{absentCount} Absent</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <div className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>{halfDayCount} Half-Day</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <div className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>{leaveCount} Leave</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <div className="font-mono font-bold text-slate-700 dark:text-slate-300">
            {totalHours.toFixed(1)} hrs total
          </div>
        </div>

        {/* Action: Rapid Batch Mark */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkAllPresent}
            disabled={batchLoading || activeStaff.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50"
            title="Mark all active staff present with standard 8 hours"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Mark All Present</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search by name, ID or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-slate-500 shrink-0">Department:</span>
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setDepartmentFilter(dept)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                departmentFilter === dept
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Attendance Roster Table */}
      <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-3">Role / Dept</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Clock In / Out</th>
                <th className="py-3 px-3">Break</th>
                <th className="py-3 px-3">Net Hours</th>
                <th className="py-3 px-3">Overtime</th>
                <th className="py-3 px-4 text-right">Quick Mark / Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No active staff found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => {
                  const rec = recordMap.get(staff.id);
                  const isPresent = rec?.status === 'PRESENT';
                  const isAbsent = rec?.status === 'ABSENT';
                  const isHalfDay = rec?.status === 'HALF_DAY';
                  const isLeave = rec?.status === 'LEAVE';
                  const isWO = rec?.status === 'WEEKLY_OFF';
                  const isHoli = rec?.status === 'HOLIDAY';

                  return (
                    <tr
                      key={staff.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Name & ID */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {staff.name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {staff.employeeId}
                        </div>
                      </td>

                      {/* Role & Dept */}
                      <td className="py-3 px-3">
                        <div className="text-slate-800 dark:text-slate-200">
                          {staff.designation}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {staff.department}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        {rec ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded font-bold text-[11px] ${
                              isPresent
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : isAbsent
                                ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                                : isHalfDay
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : isLeave
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {rec.status.replace('_', ' ')}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Unrecorded
                          </span>
                        )}
                      </td>

                      {/* Clock In / Out */}
                      <td className="py-3 px-3 font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {rec?.checkIn && rec?.checkOut ? (
                          <span>{rec.checkIn} - {rec.checkOut}</span>
                        ) : rec?.checkIn ? (
                          <span>{rec.checkIn} - ...</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Break */}
                      <td className="py-3 px-3 font-mono tabular-nums text-slate-600 dark:text-slate-400">
                        {rec?.breakMinutes ? `${rec.breakMinutes}m` : '-'}
                      </td>

                      {/* Net Hours */}
                      <td className="py-3 px-3 font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                        {rec?.netHours !== undefined ? `${rec.netHours}h` : '-'}
                      </td>

                      {/* Overtime */}
                      <td className="py-3 px-3 font-mono tabular-nums text-slate-600 dark:text-slate-400">
                        {rec?.overtimeHours && rec.overtimeHours > 0 ? (
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                            +{rec.overtimeHours}h
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>

                      {/* Quick Mark Buttons & Edit Modal trigger */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Quick P */}
                          <button
                            onClick={() => handleQuickStatus(staff, 'PRESENT')}
                            className={`w-7 h-7 rounded text-[11px] font-bold transition ${
                              isPresent
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-100 hover:text-emerald-800'
                            }`}
                            title="Mark Present (P)"
                          >
                            P
                          </button>

                          {/* Quick A */}
                          <button
                            onClick={() => handleQuickStatus(staff, 'ABSENT')}
                            className={`w-7 h-7 rounded text-[11px] font-bold transition ${
                              isAbsent
                                ? 'bg-red-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-red-100 hover:text-red-800'
                            }`}
                            title="Mark Absent (A)"
                          >
                            A
                          </button>

                          {/* Quick HD */}
                          <button
                            onClick={() => handleQuickStatus(staff, 'HALF_DAY')}
                            className={`w-7 h-7 rounded text-[11px] font-bold transition ${
                              isHalfDay
                                ? 'bg-amber-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-100 hover:text-amber-800'
                            }`}
                            title="Mark Half Day (HD)"
                          >
                            HD
                          </button>

                          {/* Quick L */}
                          <button
                            onClick={() => handleQuickStatus(staff, 'LEAVE')}
                            className={`w-7 h-7 rounded text-[11px] font-bold transition ${
                              isLeave
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-100 hover:text-blue-800'
                            }`}
                            title="Mark Leave (L)"
                          >
                            L
                          </button>

                          {/* Detailed Edit Time modal */}
                          <button
                            onClick={() => openTimeEditor(staff)}
                            className="p-1.5 ml-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition"
                            title="Edit In/Out times, break & overtime"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Time Editor Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Log Shift Hours: {editingStaff.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingStaff.employeeId} · {selectedDate}
                </p>
              </div>
              <button
                onClick={() => setEditingStaff(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDetailedTime} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as AttendanceStatus)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="PRESENT">Present (Full Day)</option>
                  <option value="HALF_DAY">Half Day</option>
                  <option value="ABSENT">Absent (Unpaid)</option>
                  <option value="LEAVE">Leave (Approved)</option>
                  <option value="WEEKLY_OFF">Weekly Off</option>
                  <option value="HOLIDAY">Official Holiday</option>
                </select>
              </div>

              {(editStatus === 'PRESENT' || editStatus === 'HALF_DAY') && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Clock In Time
                      </label>
                      <input
                        type="time"
                        value={checkInTime}
                        onChange={(e) => setCheckInTime(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Clock Out Time
                      </label>
                      <input
                        type="time"
                        value={checkOutTime}
                        onChange={(e) => setCheckOutTime(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Break Deduction (minutes)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={5}
                      value={breakMin}
                      onChange={(e) => setBreakMin(Number(e.target.value))}
                      placeholder="e.g. 60 min"
                      className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Remarks / Justification
                </label>
                <input
                  type="text"
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  placeholder="e.g. Client visit, approved overtime"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTime}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
