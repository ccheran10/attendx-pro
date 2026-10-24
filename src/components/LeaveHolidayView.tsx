import React, { useState } from 'react';
import {
  Staff,
  LeaveRecord,
  HolidayRecord,
  WorkspaceSettings,
  LeaveType,
} from '../types/attendance';
import { api } from '../services/api';
import {
  CalendarRange,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  X,
  Save,
} from 'lucide-react';

interface LeaveHolidayViewProps {
  staffList: Staff[];
  leaves: LeaveRecord[];
  holidays: HolidayRecord[];
  settings: WorkspaceSettings;
  onRefresh: () => void;
}

export const LeaveHolidayView: React.FC<LeaveHolidayViewProps> = ({
  staffList,
  leaves,
  holidays,
  settings,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'leaves' | 'holidays'>('leaves');

  // Leave Modal State
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveStaffId, setLeaveStaffId] = useState(staffList[0]?.id || '');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveType, setLeaveType] = useState<LeaveType>('CASUAL');
  const [isPaid, setIsPaid] = useState(true);
  const [reason, setReason] = useState('');

  // Holiday Modal State
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [holidayDate, setHolidayDate] = useState(new Date().toISOString().split('T')[0]);
  const [holidayName, setHolidayName] = useState('');
  const [holidayIsPaid, setHolidayIsPaid] = useState(true);

  const [saving, setSaving] = useState(false);

  const activeStaff = staffList.filter((s) => s.status === 'ACTIVE');

  const handleAddLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveStaffId) return;
    try {
      setSaving(true);
      await api.addLeave({
        staffId: leaveStaffId,
        startDate,
        endDate,
        daysCount: 1,
        leaveType,
        reason: reason.trim(),
        status: 'APPROVED',
        isPaid,
      });
      setIsLeaveModalOpen(false);
      setReason('');
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const [leaveToDelete, setLeaveToDelete] = useState<string | null>(null);
  const [holidayToDelete, setHolidayToDelete] = useState<string | null>(null);

  const confirmDeleteLeave = async () => {
    if (!leaveToDelete) return;
    try {
      await api.deleteLeave(leaveToDelete);
      setLeaveToDelete(null);
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const confirmDeleteHoliday = async () => {
    if (!holidayToDelete) return;
    try {
      await api.deleteHoliday(holidayToDelete);
      setHolidayToDelete(null);
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteLeave = (id: string) => setLeaveToDelete(id);
  const handleDeleteHoliday = (id: string) => setHolidayToDelete(id);

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayName.trim()) return;
    try {
      setSaving(true);
      await api.addHoliday({
        date: holidayDate,
        name: holidayName.trim(),
        isPaid: holidayIsPaid,
      });
      setIsHolidayModalOpen(false);
      setHolidayName('');
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Toggle & Add Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            onClick={() => setActiveTab('leaves')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'leaves'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Staff Leaves ({leaves.length})
          </button>
          <button
            onClick={() => setActiveTab('holidays')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'holidays'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Official Holidays ({holidays.length})
          </button>
        </div>

        <div>
          {activeTab === 'leaves' ? (
            <button
              onClick={() => {
                if (activeStaff.length > 0) setLeaveStaffId(activeStaff[0].id);
                setIsLeaveModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Record Leave</span>
            </button>
          ) : (
            <button
              onClick={() => setIsHolidayModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Holiday</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Leaves Table */}
      {activeTab === 'leaves' && (
        <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-3">Date Range</th>
                  <th className="py-3 px-3">Days</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Pay Status</th>
                  <th className="py-3 px-3">Reason</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {leaves.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No leave records recorded yet.
                    </td>
                  </tr>
                ) : (
                  leaves.map((l) => {
                    const st = staffList.find((s) => s.id === l.staffId);
                    return (
                      <tr key={l.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {st ? st.name : 'Unknown Staff'}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {st?.employeeId}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono tabular-nums text-slate-700 dark:text-slate-300">
                          {l.startDate} {l.startDate !== l.endDate ? `to ${l.endDate}` : ''}
                        </td>
                        <td className="py-3 px-3 font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                          {l.daysCount}d
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                            {l.leaveType}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {l.isPaid ? (
                            <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Paid Leave
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-red-500 flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" /> Unpaid Absence
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-500 italic">
                          {l.reason || 'None provided'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteLeave(l.id)}
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Holidays Table */}
      {activeTab === 'holidays' && (
        <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-3">Holiday Name</th>
                  <th className="py-3 px-3">Day of Week</th>
                  <th className="py-3 px-3">Paid Benefit</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {holidays.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No official holidays listed.
                    </td>
                  </tr>
                ) : (
                  holidays
                    .slice()
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map((h) => {
                      const dObj = new Date(h.date);
                      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dObj.getDay()];
                      return (
                        <tr key={h.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                            {h.date}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                            {h.name}
                          </td>
                          <td className="py-3 px-3 text-slate-500">
                            {dayName}
                          </td>
                          <td className="py-3 px-3">
                            {h.isPaid ? (
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                Paid Holiday
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600">
                                Unpaid
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDeleteHoliday(h.id)}
                              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Leave Modal */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Record Leave Application
              </h3>
              <button onClick={() => setIsLeaveModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLeave} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Employee
                </label>
                <select
                  value={leaveStaffId}
                  onChange={(e) => setLeaveStaffId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {activeStaff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.employeeId}) - {s.department}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Leave Type
                  </label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="CASUAL">Casual Leave</option>
                    <option value="SICK">Sick Leave</option>
                    <option value="EARNED">Earned / Annual</option>
                    <option value="UNPAID">Unpaid Leave</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Paid Status
                  </label>
                  <select
                    value={isPaid ? 'true' : 'false'}
                    onChange={(e) => setIsPaid(e.target.value === 'true')}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="true">Paid (No salary deduction)</option>
                    <option value="false">Unpaid (Deducts daily rate)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason / Notes
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Medical checkup, personal work"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Leave</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Holiday Modal */}
      {isHolidayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Add Official Holiday
              </h3>
              <button onClick={() => setIsHolidayModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddHoliday} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Holiday Date
                </label>
                <input
                  type="date"
                  required
                  value={holidayDate}
                  onChange={(e) => setHolidayDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Holiday Name
                </label>
                <input
                  type="text"
                  required
                  value={holidayName}
                  onChange={(e) => setHolidayName(e.target.value)}
                  placeholder="e.g. Founders Day"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Remuneration
                </label>
                <select
                  value={holidayIsPaid ? 'true' : 'false'}
                  onChange={(e) => setHolidayIsPaid(e.target.value === 'true')}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="true">Paid Holiday (Counted toward salary)</option>
                  <option value="false">Unpaid Holiday</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsHolidayModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Holiday</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Leave Confirmation */}
      {leaveToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Delete Leave Application</h3>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              Are you sure you want to remove this leave application from the records?
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setLeaveToDelete(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteLeave}
                className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Holiday Confirmation */}
      {holidayToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Remove Official Holiday</h3>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              Are you sure you want to remove this holiday from the workspace calendar?
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setHolidayToDelete(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteHoliday}
                className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
