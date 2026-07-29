import React, { useState } from 'react';
import {
  Route as RouteIcon,
  Truck,
  CheckCircle2,
  XCircle,
  Edit3,
  RefreshCw,
  AlertTriangle,
  Clock,
  Navigation,
  ShieldCheck,
  MapPin
} from 'lucide-react';
import { Route, Truck as TruckType, UserRole } from '../../types.js';

interface RouteDispatchProps {
  routes: Route[];
  trucks: TruckType[];
  currentRole: UserRole;
  onApproveRoute: (routeId: string) => void;
  onRejectRoute: (routeId: string) => void;
  onModifyRoute: (routeId: string, newBinSequence: string[], newTruckId?: string) => void;
  onReoptimizeRoute: (routeId: string) => void;
  onTriggerOptimization: () => void;
}

export const RouteDispatch: React.FC<RouteDispatchProps> = ({
  routes,
  trucks,
  currentRole,
  onApproveRoute,
  onRejectRoute,
  onModifyRoute,
  onReoptimizeRoute,
  onTriggerOptimization
}) => {
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [selectedTruckId, setSelectedTruckId] = useState('');
  const [binSequenceInput, setBinSequenceInput] = useState('');

  const pendingRoutes = routes.filter(r => r.approvalStatus === 'PENDING_APPROVAL');
  const approvedRoutes = routes.filter(r => r.approvalStatus === 'APPROVED' || r.approvalStatus === 'IN_PROGRESS' || r.approvalStatus === 'COMPLETED');

  const handleEditClick = (route: Route) => {
    setEditingRoute(route);
    setSelectedTruckId(route.truckId);
    setBinSequenceInput(route.assignedBinIds.join(', '));
  };

  const handleSaveModification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoute) return;
    const newSeq = binSequenceInput.split(',').map(s => s.trim()).filter(Boolean);
    onModifyRoute(editingRoute.id, newSeq, selectedTruckId);
    setEditingRoute(null);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <RouteIcon className="w-5 h-5 text-amber-600" />
            HUMAN-IN-THE-LOOP DISPATCH CENTER
          </h2>
          <p className="text-xs text-slate-500">
            AI Routing Agent proposals require explicit dispatcher review & approval before execution.
          </p>
        </div>

        <button
          onClick={onTriggerOptimization}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          GENERATE NEW AI ROUTE PROPOSAL
        </button>
      </div>

      {/* Pending Approval Section */}
      <div>
        <h3 className="text-xs font-extrabold text-amber-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-amber-600" />
          AWAITING DISPATCHER APPROVAL ({pendingRoutes.length} PROPOSALS)
        </h3>

        {pendingRoutes.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs shadow-xs">
            No routes currently pending approval. Click "Generate New AI Route Proposal" above to run VRP solver.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pendingRoutes.map((route) => (
              <div
                key={route.id}
                className="bg-white border-2 border-amber-300 rounded-xl p-4 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-extrabold text-sm text-slate-900">{route.routeId}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      PENDING APPROVAL
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">{new Date(route.createdAt).toLocaleTimeString()}</span>
                </div>

                {/* Route Parameters Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-500 block text-[10px] font-medium">Truck</span>
                    <strong className="text-teal-800">{route.truckName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] font-medium">Distance</span>
                    <strong className="text-slate-900">{route.totalDistanceKm} km</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] font-medium">Est. Time</span>
                    <strong className="text-slate-900">{route.estimatedTimeMin} mins</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] font-medium">Capacity</span>
                    <strong className="text-emerald-700">{route.capacityUsagePct}%</strong>
                  </div>
                </div>

                {/* Bin Sequence Chain */}
                <div>
                  <div className="text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                    <Navigation className="w-3.5 h-3.5 text-amber-600" />
                    Optimal Bin Sequence Chain:
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                    {(route.orderedBins || []).map((bin, idx) => (
                      <React.Fragment key={bin.binId}>
                        <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-slate-900 font-bold">
                          {bin.binId} ({bin.fillLevel}%)
                        </span>
                        {idx < (route.orderedBins || []).length - 1 && (
                          <span className="text-amber-600 font-bold">➔</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Operational AI Reason */}
                <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 text-xs text-slate-800">
                  <span className="font-bold text-amber-900">AI Dispatch Reason: </span>
                  {route.reason}
                </div>

                {/* Dispatcher Human Controls */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onApproveRoute(route.id)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      APPROVE ROUTE
                    </button>
                    <button
                      onClick={() => handleEditClick(route)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1 border border-slate-200"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                      MODIFY
                    </button>
                    <button
                      onClick={() => onRejectRoute(route.id)}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1 border border-rose-200"
                    >
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      REJECT
                    </button>
                  </div>

                  <button
                    onClick={() => onReoptimizeRoute(route.id)}
                    className="px-2.5 py-1.5 text-[11px] text-amber-800 hover:text-amber-900 font-semibold cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3 text-amber-600" /> Reoptimize for Traffic
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approved / Active Routes History */}
      <div>
        <h3 className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          APPROVED & IN-PROGRESS DISPATCH HISTORIES ({approvedRoutes.length})
        </h3>

        <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-xs">
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-mono text-[10px]">
              <tr>
                <th className="p-3">Route ID</th>
                <th className="p-3">Truck</th>
                <th className="p-3">Bins Sequence</th>
                <th className="p-3">Distance</th>
                <th className="p-3">Est Time</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {approvedRoutes.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">{r.routeId}</td>
                  <td className="p-3 text-teal-700 font-bold">{r.truckName}</td>
                  <td className="p-3 text-slate-700">{r.assignedBinIds.join(' ➔ ')}</td>
                  <td className="p-3">{r.totalDistanceKm} km</td>
                  <td className="p-3">{r.estimatedTimeMin} mins</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 text-[10px] rounded font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {r.approvalStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modify Route Modal */}
      {editingRoute && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-extrabold text-sm text-amber-800 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-600" />
                Dispatcher Manual Override: {editingRoute.routeId}
              </h3>
              <button onClick={() => setEditingRoute(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveModification} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Assigned Truck</label>
                <select
                  value={selectedTruckId}
                  onChange={(e) => setSelectedTruckId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                >
                  {trucks.map((t) => (
                    <option key={t.truckId} value={t.truckId}>
                      {t.truckId} - {t.driverName} (Capacity: {t.capacityKg}kg)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Ordered Bin Sequence (Comma-separated Bin IDs)
                </label>
                <input
                  type="text"
                  value={binSequenceInput}
                  onChange={(e) => setBinSequenceInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white font-mono"
                  placeholder="BIN-005, BIN-018, BIN-034"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRoute(null)}
                  className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
                >
                  Save Dispatcher Modification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
