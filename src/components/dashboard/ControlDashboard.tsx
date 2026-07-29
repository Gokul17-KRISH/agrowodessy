import React from 'react';
import {
  Trash2,
  AlertTriangle,
  Truck,
  Route as RouteIcon,
  Recycle,
  Megaphone,
  Bot,
  Activity,
  Zap,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { Bin, Truck as TruckType, Route, AgentStatus, AgentEvent, SystemMetrics } from '../../types.js';

interface ControlDashboardProps {
  bins: Bin[];
  trucks: TruckType[];
  routes: Route[];
  agentStatuses: AgentStatus[];
  agentEvents: AgentEvent[];
  onQuickSimulateWaste: () => void;
  onQuickOptimizeRoute: () => void;
  onQuickGenerateCampaign: () => void;
  setActiveTab: (tab: string) => void;
}

export const ControlDashboard: React.FC<ControlDashboardProps> = ({
  bins,
  trucks,
  routes,
  agentStatuses,
  agentEvents,
  onQuickSimulateWaste,
  onQuickOptimizeRoute,
  onQuickGenerateCampaign,
  setActiveTab
}) => {
  const criticalBins = bins.filter(b => b.status === 'CRITICAL');
  const highBins = bins.filter(b => b.status === 'HIGH');
  const activeTrucks = trucks.filter(t => t.status === 'IN_TRANSIT' || t.status === 'COLLECTING');
  const availableTrucks = trucks.filter(t => t.status === 'IDLE');
  const pendingRoutes = routes.filter(r => r.approvalStatus === 'PENDING_APPROVAL');

  const avgLatency = Math.round(
    agentEvents.reduce((acc, e) => acc + (e.latencyMs || 200), 0) / (agentEvents.length || 1)
  );

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Total Bins</span>
            <Trash2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{bins.length}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Across 6 Coimbatore Zones</p>
        </div>

        <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 text-xs font-medium">
            <span>Critical Bins</span>
            <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
          </div>
          <div className="text-2xl font-extrabold text-rose-700 mt-1">{criticalBins.length}</div>
          <p className="text-[10px] text-rose-600 mt-0.5">&gt;95% Capacity threshold</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Active Trucks</span>
            <Truck className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {activeTrucks.length} <span className="text-xs text-slate-400 font-normal">/ {trucks.length}</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">{availableTrucks.length} available at depot</p>
        </div>

        <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-amber-900 text-xs font-medium">
            <span>Pending Routes</span>
            <RouteIcon className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-800 mt-1">{pendingRoutes.length}</div>
          <p className="text-[10px] text-amber-700 mt-0.5">Awaiting Approval</p>
        </div>

        <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-emerald-900 text-xs font-medium">
            <span>Landfill Diversion</span>
            <Recycle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-800 mt-1">68.4%</div>
          <p className="text-[10px] text-emerald-700 mt-0.5">+12.2% vs last month</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Agent Latency</span>
            <Zap className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{avgLatency} ms</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Gemini 2.5 flash reasoning</p>
        </div>
      </div>

      {/* Specialist Agents Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-extrabold tracking-wider text-slate-700 uppercase flex items-center gap-2">
            <Bot className="w-4 h-4 text-emerald-600" />
            FOUR SPECIALIST AGENTS — OPERATIONAL HEALTH
          </h2>
          <button
            onClick={() => setActiveTab('agents')}
            className="text-xs text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer font-bold"
          >
            Agent Observability <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(agentStatuses || []).map((agent) => (
            <div
              key={agent.id}
              className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-emerald-300 transition-all shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900">{agent.name}</span>
                  <span className="flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping mr-1"></span>
                    {agent.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">{agent.role}</p>
                <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-700 font-mono">
                  "{agent.lastAction}"
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                <span>Latency: {agent.latencyMs}ms</span>
                <span>Events: {agent.eventsCount}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Split Row: Agent Reasoning Stream + Fast Action Trigger Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent Operational Reasoning Stream (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-4 flex flex-col shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              LIVE AGENT REASONING & DECISION FEED
            </h3>
            <span className="text-[10px] text-slate-400">Public-safe concise operational logs</span>
          </div>

          <div className="mt-3 space-y-3 overflow-y-auto max-h-[360px] pr-1">
            {(agentEvents || []).slice(0, 6).map((evt) => (
              <div
                key={evt.id}
                className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5 transition-all hover:border-slate-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-emerald-700">{evt.agentName}</span>
                    <span className="text-[10px] font-mono text-slate-600 px-1.5 py-0.5 rounded bg-slate-200">
                      {evt.eventType}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-slate-900 font-semibold">{evt.inputSummary}</p>
                <p className="text-slate-700 text-[11px] bg-white p-2 rounded border border-slate-200">
                  <span className="font-bold text-emerald-700">Agent Reasoning: </span>
                  {evt.reasoning}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Action Simulator Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div>
            <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Sparkles className="w-4 h-4 text-teal-600" />
              QUICK SIMULATOR CONTROLS
            </h3>
            <p className="text-xs text-slate-500 mt-3">
              Trigger autonomous agent workflows or simulate city events in real-time.
            </p>

            <div className="mt-4 space-y-2.5">
              <button
                onClick={onQuickSimulateWaste}
                className="w-full text-left p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-rose-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    Simulate Critical Overflow
                  </div>
                  <div className="text-[11px] text-slate-500">Triggers Bin Density Agent alert on BIN-005</div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={onQuickOptimizeRoute}
                className="w-full text-left p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-amber-800 flex items-center gap-1.5">
                    <RouteIcon className="w-3.5 h-3.5 text-amber-600" />
                    Trigger AI Route Optimization
                  </div>
                  <div className="text-[11px] text-slate-500">Invokes VRP Solver for critical zones</div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={onQuickGenerateCampaign}
                className="w-full text-left p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-teal-800 flex items-center gap-1.5">
                    <Megaphone className="w-3.5 h-3.5 text-teal-600" />
                    Generate Civic Campaign
                  </div>
                  <div className="text-[11px] text-slate-500">Creates bilingual English/Tamil campaign</div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
            Hardware-Independent Simulation • Software-only municipal twin
          </div>
        </div>
      </div>
    </div>
  );
};
