import React, { useState } from 'react';
import {
  Users,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Camera,
  Compass,
  Clock,
  Filter,
  Trash2,
  ShieldAlert,
  Send,
  Plus
} from 'lucide-react';
import { CitizenReport, CitizenReportType, CitizenReportStatus, Bin } from '../../types.js';
import { COIMBATORE_NEIGHBORHOODS } from '../../../server/config/cityData.js';

interface CitizenReportingProps {
  reports: CitizenReport[];
  bins: Bin[];
  onCreateReport: (reportData: any) => Promise<void>;
  onVoteReport: (id: string, direction: 'up' | 'down') => Promise<void>;
  onUpdateReportStatus: (id: string, status: CitizenReportStatus) => Promise<void>;
}

const SAMPLE_PHOTOS = [
  { label: 'Overflowing Commercial Bin', url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500' },
  { label: 'Illegal Plastics Dumping', url: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=500' },
  { label: 'Uncollected Organic Bags', url: 'https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?w=500' },
  { label: 'Damaged Plastic Container', url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=500' }
];

export const CitizenReporting: React.FC<CitizenReportingProps> = ({
  reports,
  bins,
  onCreateReport,
  onVoteReport,
  onUpdateReportStatus
}) => {
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('ALL');

  // Form State
  const [reportType, setReportType] = useState<CitizenReportType>('OVERFLOWING_BIN');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [neighborhood, setNeighborhood] = useState('Gandhipuram');
  const [locationName, setLocationName] = useState('');
  const [lat, setLat] = useState<number>(11.0185);
  const [lng, setLng] = useState<number>(76.9572);
  const [binId, setBinId] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>(SAMPLE_PHOTOS[0].url);
  const [reportedBy, setReportedBy] = useState('');
  const [gettingGps, setGettingGps] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleGetGps = () => {
    setGettingGps(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(Math.round(pos.coords.latitude * 10000) / 10000);
          setLng(Math.round(pos.coords.longitude * 10000) / 10000);
          setLocationName(`GPS Pin (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
          setGettingGps(false);
        },
        (err) => {
          console.warn('GPS location error:', err);
          setGettingGps(false);
          // Fallback to center of selected neighborhood
          const nh = COIMBATORE_NEIGHBORHOODS.find(n => n.name === neighborhood);
          if (nh) {
            setLat(nh.centerLat);
            setLng(nh.centerLng);
            setLocationName(`${nh.name} GPS Tag`);
          }
        }
      );
    } else {
      setGettingGps(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setSubmitting(true);
    await onCreateReport({
      reportType,
      title,
      description,
      neighborhood,
      locationName: locationName || `${neighborhood} Sector Tag`,
      lat,
      lng,
      binId: binId || undefined,
      photoUrl,
      reportedBy: reportedBy.trim() || 'Civic Updater'
    });

    setSubmitting(false);
    setShowForm(false);
    setTitle('');
    setDescription('');
    setBinId('');
    setReportedBy('');
  };

  const filteredReports = reports.filter(r => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (selectedNeighborhood !== 'ALL' && r.neighborhood !== selectedNeighborhood) return false;
    return true;
  });

  const pendingCount = reports.filter(r => r.status === 'PENDING_VERIFICATION').length;
  const verifiedCount = reports.filter(r => r.status === 'VERIFIED').length;
  const inProgressCount = reports.filter(r => r.status === 'IN_PROGRESS').length;
  const resolvedCount = reports.filter(r => r.status === 'RESOLVED').length;

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            CROWDSOURCED CITIZEN WASTE NETWORK & GPS MAP UPDATES
          </h2>
          <p className="text-xs text-slate-500">
            Real-time citizen reporting for overflowing bins, illegal dumping, and uncollected waste streams.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          {showForm ? 'CLOSE FORM' : 'SUBMIT CITIZEN REPORT'}
        </button>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">Pending Verification</div>
          <div className="text-2xl font-extrabold text-amber-600 mt-0.5">{pendingCount}</div>
          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Community upvotes active</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">Verified Issues</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-0.5">{verifiedCount}</div>
          <p className="text-[10px] text-emerald-700 font-bold mt-0.5">Route integration ready</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">Dispatch In-Progress</div>
          <div className="text-2xl font-extrabold text-cyan-600 mt-0.5">{inProgressCount}</div>
          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Truck collection en route</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">Resolved Reports</div>
          <div className="text-2xl font-extrabold text-slate-700 mt-0.5">{resolvedCount}</div>
          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Municipal verification closed</p>
        </div>
      </div>

      {/* New Report Form Drawer / Card */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-teal-200 rounded-xl p-5 shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-xs font-extrabold text-teal-800 uppercase tracking-wider flex items-center gap-2">
              <Camera className="w-4 h-4 text-teal-600" />
              CREATE REAL-TIME CITIZEN WASTE REPORT
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Auto GPS & AI Analysis</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {/* Issue Type */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">Issue Category</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as CitizenReportType)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-semibold focus:outline-none focus:border-teal-500"
              >
                <option value="OVERFLOWING_BIN">🗑️ Overflowing Public Bin</option>
                <option value="ILLEGAL_DUMPING">🚨 Illegal Dumping Site</option>
                <option value="MISSED_COLLECTION">⏰ Missed Collection Pickup</option>
                <option value="DAMAGED_BIN">🛠️ Damaged Bin / Latch Latch</option>
                <option value="LITTER_HOTSPOT">🧹 Street Litter Hotspot</option>
              </select>
            </div>

            {/* Neighborhood */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">Neighborhood Zone</label>
              <select
                value={neighborhood}
                onChange={(e) => {
                  setNeighborhood(e.target.value);
                  const nh = COIMBATORE_NEIGHBORHOODS.find(n => n.name === e.target.value);
                  if (nh) {
                    setLat(nh.centerLat);
                    setLng(nh.centerLng);
                  }
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-semibold focus:outline-none focus:border-teal-500"
              >
                {COIMBATORE_NEIGHBORHOODS.map(nh => (
                  <option key={nh.name} value={nh.name}>{nh.name}</option>
                ))}
              </select>
            </div>

            {/* Linked Bin (Optional) */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">Link Municipal Bin (Optional)</label>
              <select
                value={binId}
                onChange={(e) => setBinId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-semibold focus:outline-none focus:border-teal-500"
              >
                <option value="">-- No Specific Bin --</option>
                {bins.filter(b => b.neighborhood === neighborhood).map(b => (
                  <option key={b.binId} value={b.binId}>{b.binId} ({b.locationName} - {b.fillLevel}%)</option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">Report Title / Summary</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Commercial Plastic Bin Spilling onto Sidewalk"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-medium focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Reporter Name */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">Your Name / Identifier</label>
              <input
                type="text"
                value={reportedBy}
                onChange={(e) => setReportedBy(e.target.value)}
                placeholder="e.g. Priyan S. (Citizen)"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-medium focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-3">
              <label className="block text-slate-700 font-bold mb-1">Detailed Description</label>
              <textarea
                required
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe waste type, volume, obstruction, or special hazards..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-medium focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Location & GPS */}
            <div className="md:col-span-2 space-y-1">
              <label className="block text-slate-700 font-bold mb-1">Location Landmark & Coordinates</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. Opposite Bus Stop, Cross 4"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-medium focus:outline-none focus:border-teal-500"
                />
                <button
                  type="button"
                  onClick={handleGetGps}
                  disabled={gettingGps}
                  className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg border border-slate-300 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Compass className={`w-4 h-4 text-teal-600 ${gettingGps ? 'animate-spin' : ''}`} />
                  {gettingGps ? 'Locating...' : 'Use GPS'}
                </button>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Lat: {lat} | Lng: {lng}
              </div>
            </div>

            {/* Sample Photo Selector */}
            <div className="md:col-span-1">
              <label className="block text-slate-700 font-bold mb-1">Photo Evidence Preview</label>
              <select
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-medium focus:outline-none focus:border-teal-500"
              >
                {SAMPLE_PHOTOS.map((p, idx) => (
                  <option key={idx} value={p.url}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? 'Submitting & Classifying...' : 'Submit Citizen Report'}
            </button>
          </div>
        </form>
      )}

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="text-slate-500 flex items-center gap-1 font-bold mr-1">
            <Filter className="w-3.5 h-3.5" /> Filter Status:
          </span>
          {['ALL', 'PENDING_VERIFICATION', 'VERIFIED', 'IN_PROGRESS', 'RESOLVED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer text-xs ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-bold">Zone:</span>
          <select
            value={selectedNeighborhood}
            onChange={(e) => setSelectedNeighborhood(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-800 font-semibold focus:outline-none"
          >
            <option value="ALL">All Neighborhoods</option>
            {COIMBATORE_NEIGHBORHOODS.map(nh => (
              <option key={nh.name} value={nh.name}>{nh.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs">
            No citizen reports found matching current status filter.
          </div>
        ) : (
          filteredReports.map((report) => {
            let statusColor = 'bg-amber-50 text-amber-800 border-amber-200';
            if (report.status === 'VERIFIED') statusColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
            if (report.status === 'IN_PROGRESS') statusColor = 'bg-cyan-50 text-cyan-800 border-cyan-200';
            if (report.status === 'RESOLVED') statusColor = 'bg-slate-100 text-slate-700 border-slate-200';

            return (
              <div
                key={report.id}
                className="bg-white border border-slate-200 rounded-xl p-4 lg:p-5 shadow-xs hover:border-slate-300 transition-all space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm">{report.title}</span>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${statusColor}`}>
                        {report.status.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                        {report.reportType.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <strong>{report.neighborhood}</strong> • {report.locationName}
                      <span className="text-slate-400 text-[10px]">({report.lat}, {report.lng})</span>
                    </p>
                  </div>

                  <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 font-semibold">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {new Date(report.createdAt).toLocaleTimeString()}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Photo Preview if available */}
                  {report.photoUrl && (
                    <div className="md:col-span-1 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 h-28 relative">
                      <img
                        src={report.photoUrl}
                        alt="Citizen Report Observation"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute bottom-1 left-1 bg-black/60 backdrop-blur-xs text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                        Citizen Photo
                      </div>
                    </div>
                  )}

                  {/* Description & AI Reasoning */}
                  <div className={`${report.photoUrl ? 'md:col-span-3' : 'md:col-span-4'} space-y-2 text-xs`}>
                    <p className="text-slate-800 font-medium leading-relaxed">
                      "{report.description}"
                    </p>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-sans text-slate-800 shadow-xs space-y-1">
                      <div className="flex items-center gap-1 font-bold text-teal-800 text-[10px]">
                        <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                        AI MULTI-AGENT CLASSIFICATION & TELEMETRY
                      </div>
                      <p className="text-slate-700 font-medium">
                        {report.aiClassification || 'Categorized for municipal dispatch and collection route integration.'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px]">
                      <div className="flex items-center space-x-2 text-slate-500 font-medium">
                        <span>Submitted by: <strong className="text-slate-800">{report.reportedBy}</strong></span>
                        {report.binId && (
                          <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-bold">
                            Linked: {report.binId}
                          </span>
                        )}
                      </div>

                      {/* Community Trust / Upvote Buttons */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onVoteReport(report.id, 'up')}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-all"
                          title="Confirm report validity"
                        >
                          <ThumbsUp className="w-3 h-3 text-emerald-600" />
                          Confirm / Upvote ({report.upvotesCount})
                        </button>

                        <button
                          onClick={() => onVoteReport(report.id, 'down')}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-all"
                          title="Flag as inaccurate"
                        >
                          <ThumbsDown className="w-3 h-3" />
                          ({report.downvotesCount})
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dispatcher Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 bg-slate-50/50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Dispatcher Actions:
                  </span>

                  <div className="flex items-center space-x-2">
                    {report.status === 'PENDING_VERIFICATION' && (
                      <button
                        onClick={() => onUpdateReportStatus(report.id, 'VERIFIED')}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-md transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Mark Verified
                      </button>
                    )}

                    {(report.status === 'VERIFIED' || report.status === 'PENDING_VERIFICATION') && (
                      <button
                        onClick={() => onUpdateReportStatus(report.id, 'IN_PROGRESS')}
                        className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-[10px] rounded-md transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                      >
                        <Trash2 className="w-3 h-3" /> Dispatch Pickup
                      </button>
                    )}

                    {report.status !== 'RESOLVED' && (
                      <button
                        onClick={() => onUpdateReportStatus(report.id, 'RESOLVED')}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white font-bold text-[10px] rounded-md transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
