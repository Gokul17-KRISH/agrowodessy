import React from 'react';
import {
  LayoutDashboard,
  Map,
  Trash2,
  Truck,
  Route as RouteIcon,
  Bot,
  BarChart3,
  Megaphone,
  Bell,
  Sliders,
  ShieldAlert,
  Users
} from 'lucide-react';
import { UserRole } from '../../types.js';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  criticalBinsCount: number;
  pendingRoutesCount: number;
  pendingReportsCount?: number;
  userRole?: UserRole;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  criticalBinsCount,
  pendingRoutesCount,
  pendingReportsCount = 0,
  userRole = 'ADMIN'
}) => {
  const allNavItems = [
    { id: 'dashboard', label: 'Control Center', icon: LayoutDashboard, roles: ['ADMIN', 'DISPATCHER', 'ANALYST'] },
    { id: 'map', label: 'Live GIS Map', icon: Map, roles: ['ADMIN', 'DISPATCHER'] },
    {
      id: 'bins',
      label: 'Bins Management',
      icon: Trash2,
      badge: criticalBinsCount > 0 ? `${criticalBinsCount} Alert` : null,
      badgeColor: 'bg-rose-500',
      roles: ['ADMIN', 'DISPATCHER']
    },
    { id: 'trucks', label: 'Fleet & Trucks', icon: Truck, roles: ['ADMIN', 'DISPATCHER'] },
    {
      id: 'routes',
      label: 'AI Dispatch Routes',
      icon: RouteIcon,
      badge: pendingRoutesCount > 0 ? `${pendingRoutesCount} Pending` : null,
      badgeColor: 'bg-amber-500',
      roles: ['ADMIN', 'DISPATCHER']
    },
    {
      id: 'reports',
      label: 'Citizen Crowdsource',
      icon: Users,
      badge: pendingReportsCount > 0 ? `${pendingReportsCount} New` : null,
      badgeColor: 'bg-teal-600',
      roles: ['ADMIN', 'DISPATCHER', 'ANALYST']
    },
    { id: 'agents', label: 'AI Specialist Agents', icon: Bot, roles: ['ADMIN'] },
    { id: 'analytics', label: 'Recycling Analytics', icon: BarChart3, roles: ['ADMIN', 'ANALYST'] },
    { id: 'campaigns', label: 'Civic Campaigns', icon: Megaphone, roles: ['ADMIN', 'ANALYST'] },
    { id: 'alerts', label: 'System Alerts', icon: Bell, roles: ['ADMIN', 'DISPATCHER', 'ANALYST'] },
    { id: 'simulation', label: 'City Simulator', icon: Sliders, roles: ['ADMIN', 'DISPATCHER'] }
  ];

  const navItems = allNavItems.filter(item => item.roles.includes(userRole));

  return (
    <aside className="w-64 bg-[#FFFDF7] border-r border-[#E5A83B]/40 text-slate-700 flex flex-col justify-between shrink-0 min-h-[calc(100vh-65px)] shadow-xs">
      <div className="p-3 space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold text-amber-900/60 tracking-wider uppercase">
          Municipal Operations
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#FAF0DA] text-amber-950 border border-[#E5A83B] font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-[#FAF0DA]/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full text-white ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/80 text-[11px] text-slate-500 space-y-1">
        <div className="flex items-center justify-between">
          <span>Engine Status:</span>
          <span className="text-emerald-700 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            AUTONOMOUS
          </span>
        </div>
        <div className="text-[10px] text-slate-400 truncate">
          Gemini 2.5 Multi-Agent Orchestrator
        </div>
      </div>
    </aside>
  );
};
