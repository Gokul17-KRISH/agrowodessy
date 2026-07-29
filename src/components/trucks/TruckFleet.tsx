import React from 'react';
import { Truck as TruckIcon, User, Fuel, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Truck } from '../../types.js';

interface TruckFleetProps {
  trucks: Truck[];
}

export const TruckFleet: React.FC<TruckFleetProps> = ({ trucks }) => {
  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <TruckIcon className="w-5 h-5 text-teal-600" />
            MUNICIPAL TRUCK FLEET (10 VEHICLES)
          </h2>
          <p className="text-xs text-slate-500">Real-time load capacity, driver assignment, and route dispatch status</p>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            IDLE (Depot Ready)
          </span>
          <span className="flex items-center gap-1.5 text-cyan-700">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
            IN TRANSIT
          </span>
          <span className="flex items-center gap-1.5 text-amber-700">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            COLLECTING
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trucks.map((truck) => {
          const loadPct = Math.round((truck.currentLoadKg / truck.capacityKg) * 100);
          let statusBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';

          if (truck.status === 'IN_TRANSIT') statusBadge = 'bg-cyan-50 text-cyan-700 border-cyan-200 animate-pulse';
          if (truck.status === 'COLLECTING') statusBadge = 'bg-amber-50 text-amber-700 border-amber-200';
          if (truck.status === 'MAINTENANCE') statusBadge = 'bg-rose-50 text-rose-700 border-rose-200';

          return (
            <div
              key={truck.id}
              className="bg-white border border-slate-200 hover:border-teal-300 rounded-xl p-4 flex flex-col justify-between shadow-xs transition-all"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TruckIcon className="w-4 h-4 text-teal-600" />
                    <span className="font-mono font-bold text-sm text-slate-900">{truck.truckId}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusBadge}`}>
                    {truck.status}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-700">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-400" /> Driver:</span>
                    <span className="font-bold text-slate-900">{truck.driverName}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-500">
                    <span className="flex items-center gap-1"><Fuel className="w-3.5 h-3.5 text-slate-400" /> Fuel Level:</span>
                    <span className="font-bold text-emerald-700">{truck.fuelLevel}%</span>
                  </div>
                </div>

                {/* Capacity Meter */}
                <div className="mt-4 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Current Load:</span>
                    <span className="font-bold text-teal-800">
                      {truck.currentLoadKg} kg / {truck.capacityKg} kg ({loadPct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={`h-full ${loadPct > 80 ? 'bg-amber-500' : 'bg-teal-500'}`}
                      style={{ width: `${loadPct}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 font-medium flex justify-between">
                <span>Location: {truck.currentLat.toFixed(3)}, {truck.currentLng.toFixed(3)}</span>
                <span>Route: {truck.assignedRouteId || 'None'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
