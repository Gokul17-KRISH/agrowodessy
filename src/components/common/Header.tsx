import React from 'react';
import {
  Truck,
  Play,
  CheckCircle2,
  Bell,
  Cpu,
  User as UserIcon,
  Activity,
  Layers,
  Sparkles,
  LogOut,
  LogIn
} from 'lucide-react';
import { UserRole, SystemAlert, User } from '../../types.js';

interface HeaderProps {
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
  currentUser: User | null;
  onLogout: () => void;
  onOpenLogin: () => void;
  alerts: SystemAlert[];
  onStartDemo: () => void;
  demoActive: boolean;
  demoStepInfo?: { stepNumber: number; stepName: string; description: string } | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  setRole,
  currentUser,
  onLogout,
  onOpenLogin,
  alerts,
  onStartDemo,
  demoActive,
  demoStepInfo,
  activeTab,
  setActiveTab
}) => {
  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length;

  return (
    <header className="sticky top-0 z-30 bg-[#FFFDF7] border-b border-[#E5A83B]/40 text-amber-950 px-4 lg:px-6 py-3 flex flex-wrap items-center justify-between shadow-2xs">
      {/* Brand & Subtitle */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
          <Truck className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              WASTEWISE
            </h1>
            <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              SDG 11 & 12
            </span>
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Autonomous Municipal Engine • Coimbatore Smart City
          </p>
        </div>
      </div>

      {/* Demo Step Bar Banner if running */}
      {demoStepInfo && (
        <div className="hidden xl:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 animate-fade-in shadow-xs">
          <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
          <div>
            <span className="font-bold text-emerald-800">
              DEMO STEP {demoStepInfo.stepNumber}/6: {demoStepInfo.stepName}
            </span>
            <p className="text-[11px] text-emerald-700">{demoStepInfo.description}</p>
          </div>
        </div>
      )}

      {/* Action Controls, Role Switcher, & User Profile */}
      <div className="flex items-center space-x-3 mt-2 sm:mt-0">
        {/* 1-Click START DEMO button */}
        <button
          onClick={onStartDemo}
          id="btn-start-demo"
          className="flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all transform hover:-translate-y-0.5 cursor-pointer active:translate-y-0"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{demoActive ? 'NEXT DEMO STEP ▶' : 'START DEMO MODE'}</span>
        </button>

        {/* Alerts Badge */}
        <button
          onClick={() => setActiveTab('alerts')}
          className="relative p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200"
          title="System Alerts"
        >
          <Bell className="w-4 h-4" />
          {criticalCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-600 text-white animate-bounce">
              {criticalCount}
            </span>
          )}
        </button>

        {/* Role Switcher */}
        <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200 text-xs">
          <span className="text-[11px] text-slate-500 px-2 font-medium hidden sm:inline">Role:</span>
          {(['ADMIN', 'DISPATCHER', 'ANALYST'] as UserRole[]).map(r => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`px-2.5 py-1 rounded-md transition-all font-medium cursor-pointer ${
                currentRole === r
                  ? 'bg-white text-emerald-700 font-bold shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Account / Login Badge */}
        {currentUser ? (
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
            <img
              src={currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover border border-slate-300"
              referrerPolicy="no-referrer"
            />
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-slate-900 truncate max-w-[110px]">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {currentUser.role}
              </div>
            </div>
            <button
              onClick={onLogout}
              className="p-2 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition-colors cursor-pointer border border-slate-200"
              title="Sign Out / Switch Account"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenLogin}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};

