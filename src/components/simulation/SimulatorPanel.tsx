import React from 'react';
import { Sliders, AlertTriangle, Play, RefreshCw, Zap, ShieldAlert, Truck, Navigation } from 'lucide-react';

interface SimulatorPanelProps {
  onSimulateOverflow: () => void;
  onSimulateTraffic: () => void;
  onCloseRoad: () => void;
  onResetSimulation: () => void;
  onStartDemo: () => void;
}

export const SimulatorPanel: React.FC<SimulatorPanelProps> = ({
  onSimulateOverflow,
  onSimulateTraffic,
  onCloseRoad,
  onResetSimulation,
  onStartDemo
}) => {
  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-600" />
            SOFTWARE CITY SIMULATION ENGINE (NO HARDWARE REQUIRED)
          </h2>
          <p className="text-xs text-slate-500">
            Simulate IoT sensor fill levels, traffic congestion, road blockages, and automated multi-agent execution.
          </p>
        </div>

        <button
          onClick={onStartDemo}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-2"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          START AUTOMATED DEMO MODE
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Bin Overflow Simulator */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center space-x-3 text-rose-600">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-extrabold text-sm text-slate-900">1. Bin Fill & Critical Overflow</h3>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Triggers a sudden 98% critical overflow event on BIN-005 in Gandhipuram, causing Bin Density Agent to flag urgent priority.
          </p>
          <button
            onClick={onSimulateOverflow}
            className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-rose-600" /> SIMULATE CRITICAL OVERFLOW
          </button>
        </div>

        {/* Card 2: Traffic Jam & Road Closure Simulator */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center space-x-3 text-amber-600">
            <Navigation className="w-5 h-5" />
            <h3 className="font-extrabold text-sm text-slate-900">2. Traffic Jam & Road Closures</h3>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Simulates heavy rush hour congestion or pipeline work road closures. Forces Routing Agent to recalculate VRP paths.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onSimulateTraffic}
              className="py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs rounded-lg transition-all cursor-pointer"
            >
              Simulate Traffic
            </button>
            <button
              onClick={onCloseRoad}
              className="py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs rounded-lg transition-all cursor-pointer"
            >
              Close DB Road
            </button>
          </div>
        </div>

        {/* Card 3: Reset Simulation State */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center space-x-3 text-teal-600">
            <RefreshCw className="w-5 h-5" />
            <h3 className="font-extrabold text-sm text-slate-900">3. Reset Simulation State</h3>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Resets all 50 bins to normal fill rates, returns garbage trucks to central depot, and clears active traffic events.
          </p>
          <button
            onClick={onResetSimulation}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4 text-slate-600" /> RESET ALL SIMULATION DATA
          </button>
        </div>
      </div>
    </div>
  );
};
