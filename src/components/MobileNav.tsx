import React from 'react';
import { NavTab } from './Navbar';
import {
  LayoutDashboard,
  CalendarCheck,
  TableProperties,
  Users,
  BadgeDollarSign,
  Menu,
} from 'lucide-react';

interface MobileNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenMore: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenMore,
}) => {
  const primaryTabs: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'daily', label: 'Daily', icon: CalendarCheck },
    { id: 'register', label: 'Register', icon: TableProperties },
    { id: 'staff', label: 'Staff', icon: Users },
    { id: 'payroll', label: 'Payroll', icon: BadgeDollarSign },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 bottom-nav px-2 py-1">
      <div className="flex items-center justify-around">
        {primaryTabs.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-lg transition-colors ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] mt-0.5 whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={onOpenMore}
          className="flex flex-col items-center justify-center py-1.5 px-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800"
        >
          <Menu className="w-4 h-4" />
          <span className="text-[10px] mt-0.5 whitespace-nowrap">More</span>
        </button>
      </div>
    </nav>
  );
};
