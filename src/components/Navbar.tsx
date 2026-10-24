import React from 'react';
import { UserProfile, WorkspaceSettings } from '../types/attendance';
import { PWAInstallButton } from './PWAInstallButton';
import {
  LayoutDashboard,
  CalendarCheck,
  TableProperties,
  Users,
  BadgeDollarSign,
  CalendarRange,
  FileSpreadsheet,
  Settings as SettingsIcon,
  LogOut,
  Building2,
} from 'lucide-react';

export type NavTab = 
  | 'dashboard'
  | 'daily'
  | 'register'
  | 'staff'
  | 'payroll'
  | 'leaves'
  | 'excel'
  | 'settings';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  user: UserProfile;
  settings: WorkspaceSettings;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  user,
  settings,
  onLogout,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'daily', label: 'Daily Log', icon: CalendarCheck },
    { id: 'register', label: 'Monthly Register', icon: TableProperties },
    { id: 'staff', label: 'Staff Roster', icon: Users },
    { id: 'payroll', label: 'Payroll & Slips', icon: BadgeDollarSign },
    { id: 'leaves', label: 'Leaves & Holidays', icon: CalendarRange },
    { id: 'excel', label: 'Excel Import/Export', icon: FileSpreadsheet },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center gap-2.5 text-left focus:outline-none group"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm group-hover:bg-indigo-700 transition">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                AttendX Pro
              </span>
            </button>
            <span className="hidden sm:inline text-xs text-slate-400 font-medium">·</span>
            <span className="hidden sm:inline text-xs font-medium text-slate-500 truncate max-w-[140px]">
              {settings.businessName || 'Workspace'}
            </span>
          </div>

          {/* Zone 2: Single-line navigation links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-850'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action & Profile */}
          <div className="flex items-center gap-3 shrink-0">
            <PWAInstallButton />

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200 uppercase">
                {user.username.slice(0, 2)}
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 hidden md:inline truncate max-w-[100px]">
                {user.username}
              </span>
              <button
                onClick={onLogout}
                title="Log out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
