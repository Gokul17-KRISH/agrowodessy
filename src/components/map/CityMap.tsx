import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Bin, Truck, Route, TrafficEvent, RoadClosure, CitizenReport } from '../../types.js';
import { COIMBATORE_NEIGHBORHOODS } from '../../../server/config/cityData.js';

interface CityMapProps {
  bins: Bin[];
  trucks: Truck[];
  routes: Route[];
  trafficEvents: TrafficEvent[];
  roadClosures: RoadClosure[];
  citizenReports?: CitizenReport[];
  onSelectBin: (bin: Bin) => void;
  onSelectTruck: (truck: Truck) => void;
}

export const CityMap: React.FC<CityMapProps> = ({
  bins,
  trucks,
  routes,
  trafficEvents,
  roadClosures,
  citizenReports = [],
  onSelectBin,
  onSelectTruck
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const [selectedBin, setSelectedBin] = useState<Bin | null>(null);
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [selectedReport, setSelectedReport] = useState<CitizenReport | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet map if not created
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [11.0168, 76.9558],
        zoom: 13,
        zoomControl: true
      });

      // Dark theme map tiles (CartoDB Dark Matter)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!layerGroup) return;

    layerGroup.clearLayers();

    // 1. Draw Bins
    bins.forEach((bin) => {
      let color = '#10b981'; // GREEN
      if (bin.status === 'MEDIUM') color = '#eab308'; // YELLOW
      if (bin.status === 'HIGH') color = '#f97316'; // ORANGE
      if (bin.status === 'CRITICAL') color = '#ef4444'; // RED

      const binMarker = L.circleMarker([bin.lat, bin.lng], {
        radius: bin.status === 'CRITICAL' ? 10 : 7,
        fillColor: color,
        color: '#ffffff',
        weight: bin.status === 'CRITICAL' ? 2.5 : 1.5,
        opacity: 1,
        fillOpacity: 0.9
      });

      binMarker.bindTooltip(
        `<b>${bin.binId}</b> (${bin.fillLevel}%)<br/>${bin.locationName}`,
        { permanent: false, direction: 'top' }
      );

      binMarker.on('click', () => {
        setSelectedBin(bin);
        setSelectedTruck(null);
        setSelectedReport(null);
        onSelectBin(bin);
      });

      binMarker.addTo(layerGroup);
    });

    // 2. Draw Garbage Trucks
    trucks.forEach((truck) => {
      const isMoving = truck.status === 'IN_TRANSIT' || truck.status === 'COLLECTING';
      const truckIcon = L.divIcon({
        className: 'truck-marker-custom',
        html: `
          <div style="
            background: ${isMoving ? '#0284c7' : '#475569'};
            color: white;
            padding: 4px 6px;
            border-radius: 6px;
            font-size: 10px;
            font-weight: bold;
            border: 2px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            gap: 3px;
            white-space: nowrap;
          ">
            🚛 ${truck.truckId}
          </div>
        `,
        iconSize: [60, 24],
        iconAnchor: [30, 12]
      });

      const truckMarker = L.marker([truck.currentLat, truck.currentLng], { icon: truckIcon });

      truckMarker.on('click', () => {
        setSelectedTruck(truck);
        setSelectedBin(null);
        setSelectedReport(null);
        onSelectTruck(truck);
      });

      truckMarker.addTo(layerGroup);
    });

    // 3. Draw Active Routes Polylines
    routes.forEach((route) => {
      if (route.orderedBins.length > 0 && (route.approvalStatus === 'APPROVED' || route.approvalStatus === 'PENDING_APPROVAL' || route.approvalStatus === 'IN_PROGRESS')) {
        const truck = trucks.find(t => t.truckId === route.truckId);
        const startLat = truck ? truck.currentLat : route.orderedBins[0].lat;
        const startLng = truck ? truck.currentLng : route.orderedBins[0].lng;

        const points: [number, number][] = [[startLat, startLng]];
        route.orderedBins.forEach(b => points.push([b.lat, b.lng]));

        const color = route.approvalStatus === 'APPROVED' || route.approvalStatus === 'IN_PROGRESS' ? '#06b6d4' : '#f59e0b';

        const polyline = L.polyline(points, {
          color,
          weight: 4,
          opacity: 0.8,
          dashArray: route.approvalStatus === 'PENDING_APPROVAL' ? '6, 8' : undefined
        });

        polyline.bindTooltip(
          `<b>Route ${route.routeId}</b> (${route.truckId})<br/>Distance: ${route.totalDistanceKm}km | Status: ${route.approvalStatus}`,
          { sticky: true }
        );

        polyline.addTo(layerGroup);
      }
    });

    // 4. Draw Road Closures
    roadClosures.filter(rc => rc.active).forEach((rc) => {
      const closureMarker = L.circleMarker([rc.startLat, rc.startLng], {
        radius: 12,
        fillColor: '#dc2626',
        color: '#ffffff',
        weight: 2,
        fillOpacity: 0.9
      });
      closureMarker.bindTooltip(`⛔ <b>ROAD CLOSED: ${rc.roadName}</b><br/>${rc.description}`);
      closureMarker.addTo(layerGroup);
    });

    // 5. Draw Citizen Crowdsourced Reports
    citizenReports.filter(r => r.status !== 'RESOLVED').forEach((rep) => {
      let iconBg = '#0d9488'; // teal
      if (rep.reportType === 'OVERFLOWING_BIN') iconBg = '#e11d48'; // rose
      if (rep.reportType === 'ILLEGAL_DUMPING') iconBg = '#d97706'; // amber

      const reportIcon = L.divIcon({
        className: 'citizen-report-marker',
        html: `
          <div style="
            background: ${iconBg};
            color: white;
            padding: 3px 6px;
            border-radius: 9999px;
            font-size: 10px;
            font-weight: bold;
            border: 2px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 2px;
            white-space: nowrap;
          ">
            📢 ${rep.title.substring(0, 18)}...
          </div>
        `,
        iconSize: [110, 22],
        iconAnchor: [55, 11]
      });

      const repMarker = L.marker([rep.lat, rep.lng], { icon: reportIcon });

      repMarker.bindTooltip(
        `<b>📢 Citizen Report (${rep.reportType.replace('_', ' ')})</b><br/>${rep.title}<br/>Status: ${rep.status}`,
        { permanent: false, direction: 'top' }
      );

      repMarker.on('click', () => {
        setSelectedReport(rep);
        setSelectedBin(null);
        setSelectedTruck(null);
      });

      repMarker.addTo(layerGroup);
    });

  }, [bins, trucks, routes, roadClosures, trafficEvents, citizenReports]);

  return (
    <div className="relative w-full h-[calc(100vh-80px)] rounded-xl overflow-hidden border border-slate-200 shadow-xs flex flex-col bg-white">
      {/* Legend Overlay Bar */}
      <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 shadow-md space-y-1.5">
        <div className="font-bold text-[11px] text-slate-500 uppercase tracking-wider mb-1">GIS Map Legend</div>
        <div className="flex items-center gap-3 font-medium">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> 0-60% Fill</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span> 61-80%</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> 81-95%</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span> &gt;95% Critical</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-200 text-[11px] text-slate-600 font-medium">
          <span>🚛 Trucks ({trucks.length})</span>
          <span className="text-cyan-700 font-bold">━ Route</span>
          <span className="text-rose-600 font-bold">⛔ Road Closure</span>
          <span className="text-teal-700 font-bold">📢 Citizen Reports ({citizenReports.filter(r => r.status !== 'RESOLVED').length})</span>
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full bg-slate-100 z-10" />

      {/* Inspector Drawer Modal when Citizen Report selected */}
      {selectedReport && (
        <div className="absolute bottom-4 right-4 z-[1000] bg-white border border-teal-200 text-slate-900 rounded-xl p-4 w-84 shadow-xl animate-fade-in space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h4 className="font-extrabold text-sm text-teal-800 flex items-center gap-1.5">
              📢 Citizen Report Inspector
            </h4>
            <button
              onClick={() => setSelectedReport(null)}
              className="text-slate-400 hover:text-slate-700 cursor-pointer font-bold"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2 text-xs">
            <div className="font-bold text-slate-900">{selectedReport.title}</div>
            <p className="text-slate-600 italic">"{selectedReport.description}"</p>
            
            {selectedReport.photoUrl && (
              <div className="rounded-lg overflow-hidden border border-slate-200 h-28 bg-slate-100">
                <img src={selectedReport.photoUrl} alt="Report Photo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            )}

            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500">Neighborhood:</span>
              <span className="font-bold text-slate-800">{selectedReport.neighborhood}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500">Status:</span>
              <span className="font-extrabold text-teal-700">{selectedReport.status}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500">Community Votes:</span>
              <span className="font-bold text-emerald-700">👍 {selectedReport.upvotesCount} Confirmed</span>
            </div>

            <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500">
              Reported by {selectedReport.reportedBy} at {new Date(selectedReport.createdAt).toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}

      {/* Inspector Drawer Modal when Bin or Truck selected */}
      {selectedBin && (
        <div className="absolute bottom-4 right-4 z-[1000] bg-white border border-slate-200 text-slate-900 rounded-xl p-4 w-80 shadow-xl animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h4 className="font-extrabold text-sm text-emerald-700">{selectedBin.binId} Inspector</h4>
            <button
              onClick={() => setSelectedBin(null)}
              className="text-slate-400 hover:text-slate-700 cursor-pointer font-bold"
            >
              ✕
            </button>
          </div>
          <div className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Location:</span>
              <span className="font-semibold text-right">{selectedBin.locationName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Fill Level:</span>
              <span className={`font-bold ${selectedBin.fillLevel > 90 ? 'text-rose-600' : 'text-emerald-700'}`}>
                {selectedBin.fillLevel}% ({selectedBin.status})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Waste Type:</span>
              <span className="uppercase font-bold text-teal-700">{selectedBin.wasteType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Overflow Risk:</span>
              <span className="font-bold text-amber-700">{selectedBin.estimatedOverflowRisk}</span>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-200">
              <div className="text-[10px] text-slate-500 mb-1 font-medium">Historical Readings (Past 24h):</div>
              <div className="flex items-end gap-1 h-12 bg-slate-50 p-1.5 rounded border border-slate-200">
                {(selectedBin.historicalReadings || []).map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-emerald-500 rounded-t"
                    style={{ height: `${h.fillLevel}%` }}
                    title={`${h.fillLevel}% at ${new Date(h.timestamp).toLocaleTimeString()}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTruck && (
        <div className="absolute bottom-4 right-4 z-[1000] bg-white border border-slate-200 text-slate-900 rounded-xl p-4 w-80 shadow-xl animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h4 className="font-extrabold text-sm text-cyan-700">🚛 Truck {selectedTruck.truckId} Details</h4>
            <button
              onClick={() => setSelectedTruck(null)}
              className="text-slate-400 hover:text-slate-700 cursor-pointer font-bold"
            >
              ✕
            </button>
          </div>
          <div className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Driver:</span>
              <span className="font-semibold">{selectedTruck.driverName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Current Load:</span>
              <span className="font-bold text-teal-700">
                {selectedTruck.currentLoadKg} kg / {selectedTruck.capacityKg} kg ({Math.round((selectedTruck.currentLoadKg / selectedTruck.capacityKg) * 100)}%)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Fuel Level:</span>
              <span className="font-semibold">{selectedTruck.fuelLevel}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <span className="font-bold text-emerald-700">{selectedTruck.status}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

