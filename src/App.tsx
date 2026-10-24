import React, { useEffect, useState, useCallback } from 'react';
import {
  UserProfile,
  WorkspaceSettings,
  Staff,
  AttendanceRecord,
  HolidayRecord,
  LeaveRecord,
} from './types/attendance';
import { api } from './services/api';
import { Navbar, NavTab } from './components/Navbar';
import { MobileNav } from './components/MobileNav';
import { AuthModal } from './components/AuthModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { DashboardView } from './components/DashboardView';
import { DailyAttendanceView } from './components/DailyAttendanceView';
import { MonthlyRegisterView } from './components/MonthlyRegisterView';
import { StaffManagementView } from './components/StaffManagementView';
import { SalaryPayrollView } from './components/SalaryPayrollView';
import { LeaveHolidayView } from './components/LeaveHolidayView';
import { ExcelImportExportView } from './components/ExcelImportExportView';
import { SettingsView } from './components/SettingsView';
import {
  FileSpreadsheet,
  CalendarRange,
  Settings as SettingsIcon,
  X,
  RefreshCw,
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [currentMonth, setCurrentMonth] = useState<string>('2026-10');
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  // Core Data Stores
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [holidays, setHolidays] = useState<HolidayRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = api.getToken();
        if (token) {
          const res = await api.getMe();
          setUser(res.user);
          setSettings(res.settings);
        }
      } catch (e) {
        console.error('Session restore failed:', e);
        api.clearToken();
      } finally {
        setAuthChecked(true);
      }
    };
    checkAuth();
  }, []);

  // Fetch all workspace data
  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setDataLoading(true);
      const [staffData, attData, holData, leaveData, settingsData] = await Promise.all([
        api.getStaff(),
        api.getAttendance(currentMonth),
        api.getHolidays(),
        api.getLeaves(),
        api.getSettings(),
      ]);
      setStaffList(staffData);
      setAttendanceList(attData);
      setHolidays(holData);
      setLeaves(leaveData);
      setSettings(settingsData);
    } catch (e) {
      console.error('Failed to load workspace data:', e);
    } finally {
      setDataLoading(false);
    }
  }, [user, currentMonth]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setSettings(null);
    setStaffList([]);
    setAttendanceList([]);
    setHolidays([]);
    setLeaves([]);
  };

  const handleAuthSuccess = (u: UserProfile, s: WorkspaceSettings) => {
    setUser(u);
    setSettings(s);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !settings) {
    return (
      <div className="min-h-screen bg-slate-900">
        <AuthModal onSuccess={handleAuthSuccess} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased">
      {/* Top Navigation conforming to Top Bar Contract */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        user={user}
        settings={settings}
        onLogout={handleLogout}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-12">
        {currentTab === 'dashboard' && (
          <DashboardView
            staffList={staffList}
            attendanceList={attendanceList}
            holidays={holidays}
            leaves={leaves}
            settings={settings}
            currentMonth={currentMonth}
            onNavigate={setCurrentTab}
            onQuickSeed={fetchData}
            loading={dataLoading}
          />
        )}

        {currentTab === 'daily' && (
          <DailyAttendanceView
            staffList={staffList}
            attendanceList={attendanceList}
            settings={settings}
            onRefresh={fetchData}
          />
        )}

        {currentTab === 'register' && (
          <MonthlyRegisterView
            staffList={staffList}
            attendanceList={attendanceList}
            holidays={holidays}
            leaves={leaves}
            settings={settings}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            onRefresh={fetchData}
          />
        )}

        {currentTab === 'staff' && (
          <StaffManagementView
            staffList={staffList}
            settings={settings}
            onRefresh={fetchData}
          />
        )}

        {currentTab === 'payroll' && (
          <SalaryPayrollView
            staffList={staffList}
            attendanceList={attendanceList}
            holidays={holidays}
            leaves={leaves}
            settings={settings}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
          />
        )}

        {currentTab === 'leaves' && (
          <LeaveHolidayView
            staffList={staffList}
            leaves={leaves}
            holidays={holidays}
            settings={settings}
            onRefresh={fetchData}
          />
        )}

        {currentTab === 'excel' && (
          <ExcelImportExportView
            staffList={staffList}
            attendanceList={attendanceList}
            holidays={holidays}
            leaves={leaves}
            settings={settings}
            currentMonth={currentMonth}
            onRefresh={fetchData}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            user={user}
            settings={settings}
            onUpdateSettings={setSettings}
            onRefreshAll={fetchData}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenMore={() => setMobileMoreOpen(true)}
      />

      {/* Mobile "More" Drawer Modal */}
      {mobileMoreOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl animate-in slide-in-from-bottom-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Additional Modules
              </span>
              <button
                onClick={() => setMobileMoreOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-3 space-y-1">
              <button
                onClick={() => {
                  setCurrentTab('leaves');
                  setMobileMoreOpen(false);
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-left"
              >
                <CalendarRange className="w-4 h-4 text-blue-600" />
                <span>Leaves & Public Holidays</span>
              </button>

              <button
                onClick={() => {
                  setCurrentTab('excel');
                  setMobileMoreOpen(false);
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-left"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Excel Workbook Import & Export</span>
              </button>

              <button
                onClick={() => {
                  setCurrentTab('settings');
                  setMobileMoreOpen(false);
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-left"
              >
                <SettingsIcon className="w-4 h-4 text-slate-600" />
                <span>Workspace Settings & Password</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PWA Offline indicator */}
      <OfflineIndicator />
    </div>
  );
}
