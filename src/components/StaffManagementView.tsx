import React, { useState } from 'react';
import { Staff, WorkspaceSettings } from '../types/attendance';
import { api } from '../services/api';
import {
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  X,
  Save,
  Download,
} from 'lucide-react';

interface StaffManagementViewProps {
  staffList: Staff[];
  settings: WorkspaceSettings;
  onRefresh: () => void;
}

export const StaffManagementView: React.FC<StaffManagementViewProps> = ({
  staffList,
  settings,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);

  // Form Fields
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [standardHours, setStandardHours] = useState(8);
  const [baseSalary, setBaseSalary] = useState(3500);
  const [overtimeRate, setOvertimeRate] = useState(0);
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const departments = ['ALL', ...Array.from(new Set(staffList.map((s) => s.department)))];

  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.designation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = departmentFilter === 'ALL' || s.department === departmentFilter;
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const openAddModal = () => {
    setEditingStaffId(null);
    setEmployeeId(`EMP-${String(staffList.length + 101).padStart(3, '0')}`);
    setName('');
    setDesignation('Team Member');
    setDepartment('Operations');
    setPhone('');
    setEmail('');
    setJoinDate(new Date().toISOString().split('T')[0]);
    setStandardHours(settings.standardHours || 8);
    setBaseSalary(3500);
    setOvertimeRate(0);
    setStatus('ACTIVE');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (staff: Staff) => {
    setEditingStaffId(staff.id);
    setEmployeeId(staff.employeeId);
    setName(staff.name);
    setDesignation(staff.designation);
    setDepartment(staff.department);
    setPhone(staff.phone || '');
    setEmail(staff.email || '');
    setJoinDate(staff.joinDate);
    setStandardHours(staff.standardHours);
    setBaseSalary(staff.baseSalary);
    setOvertimeRate(staff.overtimeRate);
    setStatus(staff.status);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!employeeId.trim() || !name.trim()) {
      setFormError('Employee ID and Full Name are required.');
      return;
    }

    try {
      setSaving(true);
      if (editingStaffId) {
        await api.updateStaff(editingStaffId, {
          employeeId: employeeId.trim(),
          name: name.trim(),
          designation: designation.trim(),
          department: department.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          joinDate,
          standardHours: Number(standardHours) || 8,
          baseSalary: Number(baseSalary) || 0,
          overtimeRate: Number(overtimeRate) || 0,
          status,
        });
      } else {
        await api.addStaff({
          employeeId: employeeId.trim(),
          name: name.trim(),
          designation: designation.trim(),
          department: department.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          joinDate,
          standardHours: Number(standardHours) || 8,
          baseSalary: Number(baseSalary) || 0,
          overtimeRate: Number(overtimeRate) || 0,
          status,
        });
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (!staffToDelete) return;
    try {
      setDeleteError(null);
      await api.deleteStaff(staffToDelete.id);
      setStaffToDelete(null);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setDeleteError(msg);
    }
  };

  const handleDelete = (staff: Staff) => {
    setDeleteError(null);
    setStaffToDelete(staff);
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <h1 className="text-base font-bold text-slate-900 dark:text-white">
            Staff & Employee Roster
          </h1>
          <p className="text-xs text-slate-500">
            Total {staffList.length} employees ({staffList.filter((s) => s.status === 'ACTIVE').length} active)
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80 relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, ID, or job title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {/* Department Filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-400">Dept:</span>
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setDepartmentFilter(dept)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                  departmentFilter === dept
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 ml-2">
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-1 rounded text-xs font-medium transition ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Staff Roster Grid */}
      <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Designation</th>
                <th className="py-3 px-3">Base Salary</th>
                <th className="py-3 px-3">Standard Shift</th>
                <th className="py-3 px-3">Joined Date</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No staff records found. Click "Add Employee" to register staff.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => (
                  <tr
                    key={staff.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {staff.name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {staff.employeeId} {staff.phone ? `· ${staff.phone}` : ''}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                      {staff.department}
                    </td>

                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                      {staff.designation}
                    </td>

                    <td className="py-3 px-3 font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                      {settings.currencySymbol}{staff.baseSalary.toLocaleString()}
                    </td>

                    <td className="py-3 px-3 font-mono tabular-nums text-slate-600 dark:text-slate-400">
                      {staff.standardHours}h / day
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-500">
                      {staff.joinDate}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                          staff.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {staff.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(staff)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition"
                          title="Edit details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(staff)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition"
                          title="Delete staff"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingStaffId ? 'Edit Employee Information' : 'Register New Employee'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="EMP-001"
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Mercer"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Operations, Sales, Tech"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Designation / Title
                  </label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="Associate, Lead"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Monthly Basic Salary ({settings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Standard Daily Hours
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={standardHours}
                    onChange={(e) => setStandardHours(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555-0100"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Join Date
                  </label>
                  <input
                    type="date"
                    value={joinDate}
                    onChange={(e) => setJoinDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="ACTIVE">Active (Included in attendance & payroll)</option>
                  <option value="INACTIVE">Inactive (Former / Resigned staff)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingStaffId ? 'Save Changes' : 'Register Employee'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Staff Confirmation Modal */}
      {staffToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Delete Employee Record
            </h3>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              Are you sure you want to delete <strong>{staffToDelete.name}</strong> ({staffToDelete.employeeId}) and all their attendance records?
            </p>
            {deleteError && (
              <div className="mt-2 p-2 rounded bg-red-50 text-red-700 text-xs">
                {deleteError}
              </div>
            )}
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setStaffToDelete(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
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
