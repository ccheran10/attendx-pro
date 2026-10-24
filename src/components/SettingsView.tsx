import React, { useState } from 'react';
import { UserProfile, WorkspaceSettings, SalaryCalculationBase } from '../types/attendance';
import { api } from '../services/api';
import {
  Settings as SettingsIcon,
  Shield,
  Building,
  KeyRound,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Database,
  Sparkles,
  Download,
  GitBranch,
} from 'lucide-react';

interface SettingsViewProps {
  user: UserProfile;
  settings: WorkspaceSettings;
  onUpdateSettings: (newSettings: WorkspaceSettings) => void;
  onRefreshAll: () => void;
  onLogout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  settings,
  onUpdateSettings,
  onRefreshAll,
  onLogout,
}) => {
  // Business settings state
  const [businessName, setBusinessName] = useState(settings.businessName);
  const [financialYear, setFinancialYear] = useState(settings.financialYear);
  const [standardHours, setStandardHours] = useState(settings.standardHours);
  const [weeklyOffDay, setWeeklyOffDay] = useState(settings.weeklyOffDay);
  const [salaryBase, setSalaryBase] = useState<SalaryCalculationBase>(settings.salaryBase);
  const [overtimeMultiplier, setOvertimeMultiplier] = useState(settings.overtimeMultiplier);
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol);

  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [savingPw, setSavingPw] = useState(false);

  // Demo seed state
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState<string | null>(null);
  const [seedError, setSeedError] = useState<string | null>(null);
  const [confirmSeedOpen, setConfirmSeedOpen] = useState(false);

  // Account deletion state
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteUsernameInput, setDeleteUsernameInput] = useState('');
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      const updated = await api.updateSettings({
        businessName: businessName.trim(),
        financialYear: financialYear.trim(),
        standardHours: Number(standardHours) || 8,
        weeklyOffDay: Number(weeklyOffDay),
        salaryBase,
        overtimeMultiplier: Number(overtimeMultiplier) || 1.5,
        currencySymbol: currencySymbol.trim() || '$',
      });
      onUpdateSettings(updated);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);

    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }

    try {
      setSavingPw(true);
      await api.changePassword(oldPassword, newPassword);
      setPwSuccess('Password changed successfully.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setPwError(msg);
    } finally {
      setSavingPw(false);
    }
  };

  const executeSeedDemo = async () => {
    try {
      setSeeding(true);
      setSeedError(null);
      const res = await api.seedDemoData();
      setSeedSuccess(res.message);
      setConfirmSeedOpen(false);
      onRefreshAll();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSeedError(`Failed to load demo data: ${msg}`);
    } finally {
      setSeeding(false);
    }
  };

  const executeDeleteAccount = async () => {
    if (deleteUsernameInput.trim() !== user.username) {
      setDeleteAccountError(`Please type "${user.username}" exactly to confirm.`);
      return;
    }
    try {
      setDeleteAccountError(null);
      await api.deleteAccount();
      onLogout();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setDeleteAccountError(msg);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-base font-bold text-slate-900 dark:text-white">
          Workspace Settings & Configuration
        </h1>
        <p className="text-xs text-slate-500">
          Configure business rules, salary deduction models, and account security.
        </p>
      </div>

      {/* Account Info Pill */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center uppercase">
            {user.username.slice(0, 2)}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              User: @{user.username}
            </div>
            <div className="text-[11px] text-slate-500">
              Workspace ID: {user.id.slice(0, 8)} · Created: {new Date(user.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-semibold"
        >
          Sign Out
        </button>
      </div>

      {/* Section 1: Business & Payroll Rules */}
      <div className="p-6 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Building className="w-4 h-4 text-indigo-600" />
          <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Business & Salary Calculation Rules
          </h2>
        </div>

        {settingsSaved && (
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings saved successfully!</span>
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Business / Enterprise Name
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Financial Year / Cycle
              </label>
              <input
                type="text"
                value={financialYear}
                onChange={(e) => setFinancialYear(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Standard Shift Hours
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
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Weekly Off Day
              </label>
              <select
                value={weeklyOffDay}
                onChange={(e) => setWeeklyOffDay(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value={0}>Sunday</option>
                <option value={6}>Saturday</option>
                <option value={1}>Monday</option>
                <option value={5}>Friday</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Currency Symbol
              </label>
              <input
                type="text"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                placeholder="$ or ₹ or £ or €"
                className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Salary Daily Rate Formula Base
              </label>
              <select
                value={salaryBase}
                onChange={(e) => setSalaryBase(e.target.value as SalaryCalculationBase)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="CALENDAR_DAYS">
                  Calendar Days (Basic / 30 or 31) - Standard
                </option>
                <option value="WORKING_DAYS">
                  Scheduled Working Days (Basic / Working Days)
                </option>
                <option value="FIXED_30">
                  Fixed 30 Days (Basic / 30)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Overtime Hourly Rate Multiplier
              </label>
              <input
                type="number"
                step={0.1}
                min={1.0}
                max={3.0}
                value={overtimeMultiplier}
                onChange={(e) => setOvertimeMultiplier(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingSettings}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Workspace Rules</span>
            </button>
          </div>
        </form>
      </div>

      {/* Section 2: Demo Data Testing */}
      <div className="p-6 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Database className="w-4 h-4 text-purple-600" />
          <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Sample Demo Data Seeder
          </h2>
        </div>
        <p className="text-xs text-slate-500">
          Populate your workspace with a realistic sample department (Operations, Tech, Logistics) and complete October 2026 attendance records with overtime, half-days, and absences to verify Excel register and payroll calculations.
        </p>

        {seedSuccess && (
          <div className="p-2.5 rounded-lg bg-purple-50 text-purple-900 text-xs">
            {seedSuccess}
          </div>
        )}

        {seedError && (
          <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs">
            {seedError}
          </div>
        )}

        <button
          onClick={() => setConfirmSeedOpen(true)}
          disabled={seeding}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{seeding ? 'Seeding...' : 'Load Sample Demo Workspace'}</span>
        </button>
      </div>

      {/* Section 3: Password Management */}
      <div className="p-6 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <KeyRound className="w-4 h-4 text-slate-600" />
          <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Change Account Password
          </h2>
        </div>

        {pwSuccess && (
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs">
            {pwSuccess}
          </div>
        )}
        {pwError && (
          <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs">
            {pwError}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              New Password (min 6 characters)
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={savingPw}
            className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold shadow-xs hover:bg-slate-800 disabled:opacity-50"
          >
            Update Password
          </button>
        </form>
      </div>

      {/* Section 4: Source Code & Git Package */}
      <div className="p-6 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <GitBranch className="w-4 h-4 text-indigo-600" />
          <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Source Code Package & Git Repository
          </h2>
        </div>
        <p className="text-xs text-slate-500">
          This application includes complete TypeScript source code, PWA configuration, Excel engines, and Express backend ready to run anywhere.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
          <a
            href="/attendx-pro-source.tar.gz"
            download="attendx-pro-source.tar.gz"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-4 h-4" />
            <span>Download Source Code Bundle (.tar.gz)</span>
          </a>
        </div>
      </div>

      {/* Section 5: Account Deletion */}
      <div className="p-6 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 shadow-2xs space-y-3">
        <h2 className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">
          Danger Zone
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Permanently delete this workspace and erase all staff records, daily attendance logs, and generated salary history. This action cannot be reversed.
        </p>
        <button
          onClick={() => {
            setDeleteUsernameInput('');
            setDeleteAccountError(null);
            setConfirmDeleteOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Workspace & Data</span>
        </button>
      </div>

      {/* Seed Demo Confirmation Dialog */}
      {confirmSeedOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Load Demo Data</h3>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              This will populate your workspace with 6 sample employees and complete October 2026 attendance records to demonstrate registers and payroll.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmSeedOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeSeedDemo}
                disabled={seeding}
                className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs"
              >
                {seeding ? 'Loading...' : 'Confirm Load'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Deletion Confirmation Dialog */}
      {confirmDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-red-600">Delete Workspace Permanently</h3>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              This will erase all your employee records and payroll data. Type <strong>{user.username}</strong> below to confirm:
            </p>
            <input
              type="text"
              value={deleteUsernameInput}
              onChange={(e) => setDeleteUsernameInput(e.target.value)}
              placeholder={user.username}
              className="mt-3 w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
            {deleteAccountError && (
              <div className="mt-2 p-2 rounded bg-red-50 text-red-700 text-xs">
                {deleteAccountError}
              </div>
            )}
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDeleteAccount}
                className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
