import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { BarChart3, Recycle, AlertTriangle, ArrowDownRight, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api.js';

export const AnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAnalytics().then(res => {
      if (res.success) {
        setAnalyticsData(res.data);
      }
      setLoading(false);
    });
  }, []);

  if (loading || !analyticsData) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs">
        Compiling municipal waste analytics stream...
      </div>
    );
  }

  const {
    overallRecyclingRatePct,
    overallLandfillDiversionPct,
    totalCityVolumeTons,
    neighborhoodSummaries,
    insights
  } = analyticsData;

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#64748b'];

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-xs">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            MUNICIPAL RECYCLING & LANDFILL DIVERSION ANALYTICS
          </h2>
          <p className="text-xs text-slate-500">Historical waste stream analysis across 6 Coimbatore zones</p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Overall Landfill Diversion</div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-1">{overallLandfillDiversionPct}%</div>
          <p className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-bold">
            <ArrowUpRight className="w-4 h-4" /> +14.8% vs last quarter
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Average Source Recycling Rate</div>
          <div className="text-3xl font-extrabold text-teal-700 mt-1">{overallRecyclingRatePct}%</div>
          <p className="text-[11px] text-teal-800 mt-1 font-bold">
            Goal: 75% Municipal Target
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">30-Day City Waste Volume</div>
          <div className="text-3xl font-extrabold text-slate-900 mt-1">{totalCityVolumeTons} Tons</div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Processed at municipal recovery plants</p>
        </div>
      </div>

      {/* Bar Chart: Neighborhood Recycling Rates */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-extrabold text-slate-900">
          NEIGHBORHOOD RECYCLING & LANDFILL DIVERSION RATES (%)
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={neighborhoodSummaries}>
              <XAxis dataKey="neighborhood" stroke="#64748b" fontSize={11} fontWeight={600} />
              <YAxis stroke="#64748b" fontSize={11} fontWeight={600} domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px', color: '#0f172a' }} />
              <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />
              <Bar dataKey="avgRecyclingRatePct" name="Recycling Rate %" fill="#059669" radius={[4, 4, 0, 0]} />
              <Bar dataKey="landfillDiversionPct" name="Landfill Diversion %" fill="#0284c7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Neighborhood Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(neighborhoodSummaries || []).map((summary: any) => (
          <div key={summary.neighborhood} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-extrabold text-sm text-slate-900">{summary.neighborhood}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${summary.dominantWasteType === 'plastic' ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-slate-100 text-slate-800'}`}>
                Dominant: {summary.dominantWasteType} ({summary.dominantPercentage}%)
              </span>
            </div>

            <p className="text-xs text-slate-700 font-medium">{summary.primaryIssueDescription}</p>

            <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-[11px] text-teal-900">
              <strong className="text-slate-900 block mb-0.5 font-bold">Recommended Intervention:</strong>
              {summary.recommendedIntervention}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
