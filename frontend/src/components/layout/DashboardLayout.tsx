import React from 'react';
import { DashboardSidebar } from './DashboardSidebar';

interface DashboardLayoutProps {
  type: 'driver' | 'host' | 'admin';
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  type,
  title,
  subtitle,
  action,
  children
}) => {
  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Left Sidebar */}
          <DashboardSidebar type={type} />

          {/* Main Dashboard Content */}
          <div className="flex-1 w-full min-w-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {title}
                </h1>
                {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
              </div>
              {action && <div className="shrink-0">{action}</div>}
            </div>

            {/* Page Content */}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
