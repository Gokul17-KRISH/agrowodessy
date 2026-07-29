import React, { useState } from 'react';
import { Megaphone, Globe, CheckCircle2, Sparkles, Send, Share2, Layers } from 'lucide-react';
import { Campaign } from '../../types.js';
import { COIMBATORE_NEIGHBORHOODS } from '../../../server/config/cityData.js';

interface CampaignManagerProps {
  campaigns: Campaign[];
  onGenerateCampaign: (neighborhood: string, wasteIssue?: string) => void;
  onPublishCampaign: (campaignId: string) => void;
}

export const CampaignManager: React.FC<CampaignManagerProps> = ({
  campaigns,
  onGenerateCampaign,
  onPublishCampaign
}) => {
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('RS Puram');
  const [customIssueInput, setCustomIssueInput] = useState('');
  const [activeLangTab, setActiveLangTab] = useState<'BOTH' | 'EN' | 'TA'>('BOTH');

  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerateCampaign(selectedNeighborhood, customIssueInput);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-teal-600" />
            CIVIC RECYCLING CAMPAIGN ENGINE (BILINGUAL ENGLISH & TAMIL)
          </h2>
          <p className="text-xs text-slate-500">
            Civic Campaign Agent generates hyper-local educational messaging based on neighborhood waste analytics.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveLangTab('BOTH')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${activeLangTab === 'BOTH' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            English & Tamil (Side-by-Side)
          </button>
          <button
            onClick={() => setActiveLangTab('EN')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${activeLangTab === 'EN' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            English Only
          </button>
          <button
            onClick={() => setActiveLangTab('TA')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${activeLangTab === 'TA' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            தமிழ் (Tamil)
          </button>
        </div>
      </div>

      {/* Generator Control Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-extrabold text-teal-800 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-teal-600" />
          GENERATE NEW HYPER-LOCAL CIVIC CAMPAIGN
        </h3>

        <form onSubmit={handleGenerateSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Target Neighborhood</label>
            <select
              value={selectedNeighborhood}
              onChange={(e) => setSelectedNeighborhood(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white font-medium"
            >
              {COIMBATORE_NEIGHBORHOODS.map((nh) => (
                <option key={nh.name} value={nh.name}>{nh.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Primary Waste Issue (Optional Override)</label>
            <input
              type="text"
              value={customIssueInput}
              onChange={(e) => setCustomIssueInput(e.target.value)}
              placeholder="e.g. Single-Use Plastic Bottle Accumulation in Markets"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              GENERATE BILINGUAL CAMPAIGN
            </button>
          </div>
        </form>
      </div>

      {/* Campaigns List */}
      <div className="space-y-6">
        {(campaigns || []).map((camp) => (
          <div key={camp.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <span className="font-extrabold text-base text-slate-900">{camp.neighborhood}</span>
                <span className="text-xs px-2.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 font-semibold">
                  {camp.wasteIssue}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${camp.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                  {camp.status}
                </span>
                {camp.status !== 'PUBLISHED' && (
                  <button
                    onClick={() => onPublishCampaign(camp.id)}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" /> Publish Campaign
                  </button>
                )}
              </div>
            </div>

            {/* Campaign Parameters */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500 block text-[10px] font-medium">Target Group</span>
                <strong className="text-slate-800">{camp.targetGroup}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-medium">Duration</span>
                <strong className="text-slate-900">{camp.duration}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-medium">Expected Impact</span>
                <strong className="text-emerald-700 font-bold">{camp.expectedImpact}</strong>
              </div>
            </div>

            {/* Side-by-Side English & Tamil Content Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* English Box */}
              {(activeLangTab === 'BOTH' || activeLangTab === 'EN') && (
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 font-bold text-teal-800 text-xs">
                    <span>ENGLISH CAMPAIGN CONTENT</span>
                    <Globe className="w-4 h-4 text-teal-600" />
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Campaign Title</span>
                    <h4 className="font-extrabold text-sm text-slate-900 mt-0.5">{camp.titleEn}</h4>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Data Explanation</span>
                    <p className="text-slate-700 mt-0.5 font-medium">{camp.explanationEn}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Citizen Call-to-Action</span>
                    <p className="text-emerald-800 font-bold mt-0.5">{camp.citizenActionEn}</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs">
                    <span className="text-teal-700 text-[10px] font-extrabold block mb-1">POSTER HEADLINE</span>
                    <p className="font-extrabold text-slate-900 text-xs">"{camp.posterCopyEn}"</p>
                  </div>
                </div>
              )}

              {/* Tamil Box */}
              {(activeLangTab === 'BOTH' || activeLangTab === 'TA') && (
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 font-bold text-emerald-800 text-xs">
                    <span>தமிழ் விழிப்புணர்வு பிரச்சாரம் (TAMIL)</span>
                    <Globe className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">தலைப்பு</span>
                    <h4 className="font-extrabold text-sm text-slate-900 mt-0.5">{camp.titleTa}</h4>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">விளக்கம்</span>
                    <p className="text-slate-700 mt-0.5 font-medium">{camp.explanationTa}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">மக்கள் செயல்பாடு</span>
                    <p className="text-emerald-800 font-bold mt-0.5">{camp.citizenActionTa}</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs">
                    <span className="text-emerald-700 text-[10px] font-extrabold block mb-1">சுவரொட்டி வரிகள்</span>
                    <p className="font-extrabold text-slate-900 text-xs">"{camp.posterCopyTa}"</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
