import React, { useState } from 'react';
import {
  Trash2,
  AlertTriangle,
  Search,
  Camera,
  Filter,
  ShieldAlert,
  Leaf,
  Recycle,
  AlertCircle,
  CheckCircle2,
  ArrowRightLeft,
  Sparkles,
  Layers,
  Grid,
  Info,
  X,
  PackageX,
  Plus,
  Minus,
  BarChart3,
  Box,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Bin, BinStatus, WasteType } from '../../types.js';

interface BinManagementProps {
  bins: Bin[];
  onSimulateFill: (binId: string, delta: number) => void;
  onScanImage: (binId: string, imageDescription: string) => void;
  onUpdateWasteType?: (binId: string, wasteType: string, isMixed?: boolean, contaminationDetails?: string) => void;
}

export interface BinStop {
  stopId: string;
  stopNumber: number;
  locationName: string;
  neighborhood: string;
  lat: number;
  lng: number;
  bin1A: Bin; // Degradable Bin
  bin1B: Bin; // Non-Degradable Bin
  isStopContaminated: boolean;
}

// Foreign items available for selection when simulating contamination with default counts
export interface ForeignItem {
  id: string;
  label: string;
  category: string;
  defaultQty: number;
}

const NON_BIO_ITEMS: ForeignItem[] = [
  { id: 'plastic_bottle', label: '🥤 Plastic Water Bottles', category: 'Plastic', defaultQty: 3 },
  { id: 'polythene_bag', label: '🛍️ Single-Use Polythene Bag', category: 'Plastic', defaultQty: 5 },
  { id: 'metal_can', label: '🥫 Aluminium Soda Can', category: 'Metal', defaultQty: 2 },
  { id: 'foil_wrapper', label: '🍫 Foil Food Wrapper', category: 'Packaging', defaultQty: 4 },
  { id: 'glass_bottle', label: '🍾 Glass Bottle Fragments', category: 'Glass', defaultQty: 2 },
  { id: 'battery_ewaste', label: '🔋 Disposable Battery / E-waste', category: 'Hazardous', defaultQty: 1 }
];

const BIO_ITEMS: ForeignItem[] = [
  { id: 'food_scraps', label: '🥗 Leftover Cooked Food Scraps', category: 'Food Waste', defaultQty: 4 },
  { id: 'fruit_peels', label: '🍌 Fruit Peels & Citrus Skins', category: 'Organic', defaultQty: 6 },
  { id: 'coffee_grounds', label: '☕ Coffee Grounds & Tea Bags', category: 'Kitchen Waste', defaultQty: 3 },
  { id: 'wet_leaves', label: '🍃 Garden Leaves & Wet Waste', category: 'Green Waste', defaultQty: 5 },
  { id: 'meat_waste', label: '🍗 Raw Meat Scraps & Bones', category: 'Food Waste', defaultQty: 2 }
];

export interface ContaminantBadge {
  id: string;
  label: string;
  count: number;
  displayTag: string;
  category: string;
}

export const BinManagement: React.FC<BinManagementProps> = ({
  bins,
  onSimulateFill,
  onScanImage,
  onUpdateWasteType
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [wasteTypeFilter, setWasteTypeFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'STOPS' | 'GRID'>('STOPS');
  const [selectedBinForScan, setSelectedBinForScan] = useState<Bin | null>(null);
  const [scanDescription, setScanDescription] = useState('');

  // State for interactive Mix Waste Modal
  const [mixingBin, setMixingBin] = useState<{ bin: Bin; isDegradableBin: boolean } | null>(null);
  const [selectedItemsToMix, setSelectedItemsToMix] = useState<string[]>([]);
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({
    plastic_bottle: 3,
    polythene_bag: 5,
    metal_can: 2,
    foil_wrapper: 4,
    glass_bottle: 2,
    battery_ewaste: 1,
    food_scraps: 4,
    fruit_peels: 6,
    coffee_grounds: 3,
    wet_leaves: 5,
    meat_waste: 2
  });
  const [customMixNote, setCustomMixNote] = useState('');
  const [showItemCountsBreakdown, setShowItemCountsBreakdown] = useState(true);

  // Group bins into paired Stops (Bin 1A - Degradable & Bin 1B - Non-Degradable)
  const stops: BinStop[] = [];
  for (let i = 0; i < bins.length; i += 2) {
    const rawA = bins[i];
    const rawB = bins[i + 1] || { ...rawA, id: `${rawA.id}-B`, binId: `${rawA.binId}-B` };
    const stopNumber = Math.floor(i / 2) + 1;

    // Assign default categories if missing
    const bin1A: Bin = {
      ...rawA,
      binCategory: rawA.binCategory || 'degradable',
      wasteType: rawA.wasteType === 'mixed' ? 'mixed' : (rawA.wasteType || 'degradable')
    };

    const bin1B: Bin = {
      ...rawB,
      binCategory: rawB.binCategory || 'non-degradable',
      wasteType: rawB.wasteType === 'mixed' ? 'mixed' : (rawB.wasteType || 'non-degradable')
    };

    const isAContaminated = bin1A.wasteType === 'mixed' || bin1A.isMixed;
    const isBContaminated = bin1B.wasteType === 'mixed' || bin1B.isMixed;

    stops.push({
      stopId: `STOP-${String(stopNumber).padStart(3, '0')}`,
      stopNumber,
      locationName: rawA.locationName || `Stop Station ${stopNumber}`,
      neighborhood: rawA.neighborhood || 'Central Zone',
      lat: rawA.lat,
      lng: rawA.lng,
      bin1A,
      bin1B,
      isStopContaminated: Boolean(isAContaminated || isBContaminated)
    });
  }

  // Filter stops
  const filteredStops = stops.filter(stop => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      stop.locationName.toLowerCase().includes(searchLower) ||
      stop.neighborhood.toLowerCase().includes(searchLower) ||
      stop.bin1A.binId.toLowerCase().includes(searchLower) ||
      stop.bin1B.binId.toLowerCase().includes(searchLower) ||
      `stop ${stop.stopNumber}`.includes(searchLower);

    const matchesStatus =
      statusFilter === 'ALL' ||
      stop.bin1A.status === statusFilter ||
      stop.bin1B.status === statusFilter;

    let matchesType = true;
    if (wasteTypeFilter === 'MIXED_ONLY') {
      matchesType = stop.isStopContaminated;
    } else if (wasteTypeFilter === 'CLEAN_ONLY') {
      matchesType = !stop.isStopContaminated;
    } else if (wasteTypeFilter !== 'ALL') {
      matchesType =
        stop.bin1A.wasteType === wasteTypeFilter ||
        stop.bin1B.wasteType === wasteTypeFilter;
    }

    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate summary metrics
  const totalStopsCount = stops.length;
  const contaminatedStopsCount = stops.filter(s => s.isStopContaminated).length;
  const totalBinsCount = bins.length;
  const mixedBinsCount = bins.filter(b => b.wasteType === 'mixed' || b.isMixed).length;
  const degradableBinsCount = bins.filter(b => (b.wasteType === 'degradable' || b.wasteType === 'organic') && !b.isMixed).length;
  const nonDegradableBinsCount = bins.filter(b => (b.wasteType === 'non-degradable' || b.wasteType === 'plastic' || b.wasteType === 'paper' || b.wasteType === 'glass') && !b.isMixed).length;

  // Helper to extract contaminant tags AND counts for display
  const getContaminantBadges = (bin: Bin, isDegradableBin: boolean): ContaminantBadge[] => {
    const text = (bin.contaminationDetails || '').toLowerCase();
    const badges: ContaminantBadge[] = [];
    const availableItems = isDegradableBin ? NON_BIO_ITEMS : BIO_ITEMS;

    availableItems.forEach(item => {
      let matched = false;
      let qty = itemQuantities[item.id] || item.defaultQty || 3;

      // Check keyword match in contamination details
      if (item.id === 'plastic_bottle' && (text.includes('bottle') || text.includes('plastic'))) matched = true;
      else if (item.id === 'polythene_bag' && (text.includes('bag') || text.includes('polythene') || text.includes('carry') || text.includes('wrapper'))) matched = true;
      else if (item.id === 'metal_can' && (text.includes('can') || text.includes('soda') || text.includes('aluminium') || text.includes('metal'))) matched = true;
      else if (item.id === 'foil_wrapper' && (text.includes('foil') || text.includes('wrapper') || text.includes('snack'))) matched = true;
      else if (item.id === 'glass_bottle' && (text.includes('glass') || text.includes('fragment'))) matched = true;
      else if (item.id === 'battery_ewaste' && (text.includes('battery') || text.includes('ewaste') || text.includes('wire'))) matched = true;
      else if (item.id === 'food_scraps' && (text.includes('food') || text.includes('cooked') || text.includes('scraps') || text.includes('rice'))) matched = true;
      else if (item.id === 'fruit_peels' && (text.includes('peel') || text.includes('fruit') || text.includes('banana') || text.includes('citrus'))) matched = true;
      else if (item.id === 'coffee_grounds' && (text.includes('coffee') || text.includes('tea'))) matched = true;
      else if (item.id === 'wet_leaves' && (text.includes('leaf') || text.includes('leaves') || text.includes('garden') || text.includes('wet'))) matched = true;
      else if (item.id === 'meat_waste' && (text.includes('meat') || text.includes('bone') || text.includes('fish'))) matched = true;

      // Check if text has explicit custom count pattern like "(×5)" or "x5" or "5 items"
      const countMatch = text.match(/(?:×|x|\b)(\d+)\s*(?:items|pcs|count|×|x)?/i);
      if (matched && countMatch && countMatch[1]) {
        const parsed = parseInt(countMatch[1], 10);
        if (parsed > 0 && parsed < 100) {
          qty = parsed;
        }
      }

      if (matched) {
        badges.push({
          id: item.id,
          label: item.label,
          count: qty,
          displayTag: `${item.label} (×${qty})`,
          category: item.category
        });
      }
    });

    // Fallbacks if no specific items matched but bin is mixed
    if (badges.length === 0) {
      if (isDegradableBin) {
        badges.push(
          { id: 'plastic_bottle', label: '🥤 Plastic Water Bottles', count: 3, displayTag: '🥤 Plastic Water Bottles (×3)', category: 'Plastic' },
          { id: 'polythene_bag', label: '🛍️ Single-Use Polythene Bag', count: 5, displayTag: '🛍️ Polythene Carry Bag (×5)', category: 'Plastic' },
          { id: 'metal_can', label: '🥫 Aluminium Soda Can', count: 2, displayTag: '🥫 Aluminium Soda Can (×2)', category: 'Metal' }
        );
      } else {
        badges.push(
          { id: 'food_scraps', label: '🥗 Leftover Cooked Food Scraps', count: 4, displayTag: '🥗 Leftover Food Scraps (×4)', category: 'Food Waste' },
          { id: 'fruit_peels', label: '🍌 Fruit Peels & Citrus Skins', count: 6, displayTag: '🍌 Fruit Peels & Citrus Skins (×6)', category: 'Organic' },
          { id: 'coffee_grounds', label: '☕ Coffee Grounds & Tea Bags', count: 3, displayTag: '☕ Coffee Grounds & Tea Bags (×3)', category: 'Kitchen Waste' }
        );
      }
    }

    return badges;
  };

  // Compute City-wide Item Count Summary across all mixed bins
  const cityItemCountsSummary: Record<string, { label: string; count: number; binCount: number; category: string }> = {};

  bins.forEach((bin, idx) => {
    const isMixed = bin.wasteType === 'mixed' || bin.isMixed;
    if (!isMixed) return;

    const isDegradableBin = bin.binCategory === 'degradable' || idx % 2 === 0;
    const badges = getContaminantBadges(bin, isDegradableBin);

    badges.forEach(b => {
      if (!cityItemCountsSummary[b.label]) {
        cityItemCountsSummary[b.label] = {
          label: b.label,
          count: 0,
          binCount: 0,
          category: isDegradableBin ? 'Non-Bio in Bio Bin' : 'Bio in Non-Bio Bin'
        };
      }
      cityItemCountsSummary[b.label].count += b.count;
      cityItemCountsSummary[b.label].binCount += 1;
    });
  });

  const grandTotalForeignItemCount = Object.values(cityItemCountsSummary).reduce((acc, curr) => acc + curr.count, 0);

  const handleOpenMixModal = (bin: Bin, isDegradableBin: boolean) => {
    setMixingBin({ bin, isDegradableBin });
    const available = isDegradableBin ? NON_BIO_ITEMS : BIO_ITEMS;
    setSelectedItemsToMix([available[0].label, available[1].label]);
    setCustomMixNote('');
  };

  const handleConfirmMix = () => {
    if (!mixingBin || !onUpdateWasteType) return;
    const { bin, isDegradableBin } = mixingBin;

    const availableItems = isDegradableBin ? NON_BIO_ITEMS : BIO_ITEMS;
    const selectedList = availableItems.filter(item => selectedItemsToMix.includes(item.label));

    const itemsWithCounts = selectedList.map(item => {
      const qty = itemQuantities[item.id] || item.defaultQty || 3;
      return `${item.label} (×${qty})`;
    });

    const itemsList = itemsWithCounts.length > 0
      ? itemsWithCounts.join(', ')
      : (isDegradableBin ? '🥤 Plastic Water Bottles (×3), 🛍️ Single-Use Polythene Bag (×5)' : '🥗 Leftover Cooked Food Scraps (×4), 🍌 Fruit Peels & Citrus Skins (×6)');

    const contaminationMessage = isDegradableBin
      ? `Foreign Non-Biodegradable items dumped in Bio Bin 1A: ${itemsList}${customMixNote ? ` - Note: ${customMixNote}` : ''}`
      : `Foreign Bio-Degradable items dumped in Non-Bio Bin 1B: ${itemsList}${customMixNote ? ` - Note: ${customMixNote}` : ''}`;

    onUpdateWasteType(bin.binId, 'mixed', true, contaminationMessage);
    setMixingBin(null);
  };

  const handleCleanBin = (bin: Bin, defaultType: 'degradable' | 'non-degradable') => {
    if (!onUpdateWasteType) return;
    onUpdateWasteType(bin.binId, defaultType, false, 'Waste segregated cleanly.');
  };

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBinForScan || !scanDescription) return;

    const descLower = scanDescription.toLowerCase();
    const indicatesMixing = descLower.includes('mix') || descLower.includes('plastic') || descLower.includes('food') || descLower.includes('contaminat') || descLower.includes('non degradable') || descLower.includes('bio degrade') || descLower.includes('can') || descLower.includes('bottle') || descLower.includes('bag') || descLower.includes('peel');

    if (indicatesMixing && onUpdateWasteType) {
      onUpdateWasteType(selectedBinForScan.binId, 'mixed', true, `CV Camera Analysis: ${scanDescription}`);
    } else {
      onScanImage(selectedBinForScan.binId, scanDescription);
    }

    setSelectedBinForScan(null);
    setScanDescription('');
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setItemQuantities(prev => {
      const current = prev[itemId] || 3;
      const next = Math.max(1, Math.min(99, current + delta));
      return { ...prev, [itemId]: next };
    });
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Overview Banner */}
      <div className="bg-[#FFF8EE] rounded-2xl p-5 text-amber-950 shadow-md border-2 border-[#E5A83B]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#1E3F35] text-emerald-200 border border-emerald-600/40 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                <Layers className="w-3.5 h-3.5" />
                2 BINS PER STOP MODEL (BIN 1A & BIN 1B)
              </span>
              {contaminatedStopsCount > 0 && (
                <span className="bg-rose-900 text-rose-100 border border-rose-600/40 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse shadow-2xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-300" />
                  {contaminatedStopsCount} STOPS CONTAMINATED
                </span>
              )}
            </div>
            <h1 className="text-xl font-black tracking-tight text-amber-950 mt-2 flex items-center gap-2">
              Municipal Waste Station & Segregation Monitor
            </h1>
            <p className="text-xs text-amber-900/90 mt-1 max-w-2xl leading-relaxed">
              Each stop holds <strong className="text-amber-950">Bin 1A (Degradable)</strong> and <strong className="text-amber-950">Bin 1B (Non-Degradable)</strong>. If foreign non-bio items (e.g. plastic/metal) are dumped into Bin 1A, or foreign bio items (e.g. food/fruit peels) are dumped into Bin 1B, the system immediately tracks &amp; displays <strong className="text-rose-700">MIXED</strong> status with exact item counts.
            </p>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 w-full md:w-auto">
            <div className="bg-[#FAF0DA] border border-[#E5A83B]/60 p-2.5 rounded-xl text-center shadow-2xs">
              <div className="text-[11px] text-amber-900/80 font-bold">Total Stops</div>
              <div className="text-base font-black text-amber-950">{totalStopsCount} <span className="text-[10px] text-amber-800 font-normal">({totalBinsCount} Bins)</span></div>
            </div>
            <div className="bg-[#E6F4EA] border border-[#A8E0B7] p-2.5 rounded-xl text-center shadow-2xs">
              <div className="text-[11px] text-emerald-900 font-bold flex items-center justify-center gap-1">
                <Leaf className="w-3 h-3 text-emerald-600" /> Degradable
              </div>
              <div className="text-base font-black text-emerald-800">{degradableBinsCount}</div>
            </div>
            <div className="bg-[#E0F2FE] border border-[#7DD3FC] p-2.5 rounded-xl text-center shadow-2xs">
              <div className="text-[11px] text-sky-900 font-bold flex items-center justify-center gap-1">
                <Recycle className="w-3 h-3 text-sky-600" /> Non-Degradable
              </div>
              <div className="text-base font-black text-sky-800">{nonDegradableBinsCount}</div>
            </div>
            <div className={`p-2.5 rounded-xl text-center border shadow-2xs ${mixedBinsCount > 0 ? 'bg-rose-100 border-rose-300 text-rose-950' : 'bg-[#FAF0DA] border-[#E5A83B]/60 text-amber-900'}`}>
              <div className="text-[11px] font-bold flex items-center justify-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-600" /> Mixed Bins
              </div>
              <div className="text-base font-black text-rose-700">{mixedBinsCount}</div>
            </div>
            <div className="bg-[#FEF3C7] border border-[#FCD34D] p-2.5 rounded-xl text-center shadow-2xs">
              <div className="text-[11px] text-amber-950 font-bold flex items-center justify-center gap-1">
                <Box className="w-3 h-3 text-amber-700" /> Foreign Items
              </div>
              <div className="text-base font-black text-amber-900">{grandTotalForeignItemCount} <span className="text-[9px] text-amber-800 font-semibold">items</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* SYSTEM-WIDE FOREIGN ITEMS SUMMARY CARD (Show counts for each item) */}
      <div className="bg-[#FFFDF7] border-2 border-[#E5A83B]/70 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowItemCountsBreakdown(!showItemCountsBreakdown)}>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500 text-white rounded-lg">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                Foreign Items Count Breakdown Across Mixed Bins
                <span className="bg-amber-200/80 text-amber-900 font-mono text-xs px-2 py-0.5 rounded-full font-bold">
                  {grandTotalForeignItemCount} total items detected
                </span>
              </h2>
              <p className="text-[11px] text-slate-600">
                Itemized count of odd/foreign waste materials improperly thrown into Bio and Non-Bio bins.
              </p>
            </div>
          </div>
          <button className="text-slate-500 hover:text-slate-800 p-1">
            {showItemCountsBreakdown ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {showItemCountsBreakdown && (
          <div className="mt-4 pt-3 border-t border-amber-200/60">
            {Object.keys(cityItemCountsSummary).length === 0 ? (
              <div className="text-center py-3 text-xs text-slate-500 font-semibold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                No contaminated bins in the system. All bins are cleanly segregated!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {Object.entries(cityItemCountsSummary).map(([itemLabel, data]) => (
                  <div key={itemLabel} className="bg-white border border-amber-200/80 rounded-xl p-3 shadow-2xs flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate" title={data.label}>
                        {data.label}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        Found in {data.binCount} bin{data.binCount > 1 ? 's' : ''} ({data.category})
                      </div>
                    </div>
                    <div className="bg-amber-500 text-white font-mono font-black text-sm px-2.5 py-1 rounded-lg shrink-0 shadow-2xs">
                      {data.count} <span className="text-[10px] font-normal">pcs</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1 border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('STOPS')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1.5 ${viewMode === 'STOPS' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <Layers className="w-3.5 h-3.5" />
              Stop Stations (1A & 1B Pairs)
            </button>
            <button
              onClick={() => setViewMode('GRID')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1.5 ${viewMode === 'GRID' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <Grid className="w-3.5 h-3.5" />
              All Bins Grid
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 lg:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search stop name, neighborhood or Bin 1A/1B ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>

          {/* Waste / Contamination Filter */}
          <select
            value={wasteTypeFilter}
            onChange={(e) => setWasteTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Waste Statuses</option>
            <option value="MIXED_ONLY">⚠️ Mixed / Contaminated Only</option>
            <option value="CLEAN_ONLY">✅ Clean Segregated Only</option>
            <option value="degradable">Degradable Bins</option>
            <option value="non-degradable">Non-Degradable Bins</option>
            <option value="mixed">Mixed Bins</option>
          </select>

          {/* Fill Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Capacity Levels</option>
            <option value="CRITICAL">Critical (&gt;95%)</option>
            <option value="HIGH">High (81-95%)</option>
            <option value="MEDIUM">Medium (61-80%)</option>
            <option value="NORMAL">Normal (31-60%)</option>
            <option value="EMPTY">Empty (0-30%)</option>
          </select>
        </div>
      </div>

      {/* STOPS PAIR VIEW (1A & 1B per stop) */}
      {viewMode === 'STOPS' && (
        <div className="space-y-4">
          {filteredStops.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
              <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="font-semibold text-sm">No waste stops match your filter criteria.</p>
              <button
                onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); setWasteTypeFilter('ALL'); }}
                className="mt-3 text-xs text-emerald-600 font-bold hover:underline cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredStops.map(stop => {
              const binAIsMixed = stop.bin1A.wasteType === 'mixed' || stop.bin1A.isMixed;
              const binBIsMixed = stop.bin1B.wasteType === 'mixed' || stop.bin1B.isMixed;

              const binABadges = binAIsMixed ? getContaminantBadges(stop.bin1A, true) : [];
              const binBBadges = binBIsMixed ? getContaminantBadges(stop.bin1B, false) : [];

              const totalABinItems = binABadges.reduce((sum, b) => sum + b.count, 0);
              const totalBBinItems = binBBadges.reduce((sum, b) => sum + b.count, 0);

              return (
                <div
                  key={stop.stopId}
                  className={`bg-white border rounded-2xl p-4 lg:p-5 shadow-xs transition-all ${stop.isStopContaminated ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  {/* Stop Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="bg-slate-900 text-white font-mono text-xs font-black px-3 py-1 rounded-lg">
                        STOP #{String(stop.stopNumber).padStart(2, '0')}
                      </span>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                          {stop.locationName}
                          <span className="text-xs font-normal text-slate-500">({stop.neighborhood})</span>
                        </h3>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Coords: {stop.lat}, {stop.lng} • Dual Station Pair
                        </p>
                      </div>
                    </div>

                    {/* Contamination Alert Header Tag */}
                    <div className="flex items-center gap-2">
                      {stop.isStopContaminated ? (
                        <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-300 text-rose-800 text-xs font-extrabold px-3 py-1 rounded-full animate-pulse">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          <span>STOP STATUS: MIXED WASTE DETECTED</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>STOP STATUS: CLEAN SEGREGATION</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dual Bins Section: BIN 1A & BIN 1B */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* BIN 1A (Degradable Bin) */}
                    <div className={`rounded-xl p-4 border transition-all flex flex-col justify-between ${binAIsMixed ? 'bg-rose-50/80 border-rose-300 shadow-sm' : 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-300'}`}>
                      <div>
                        {/* Title Bar */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="bg-emerald-700 text-white font-mono font-black text-xs px-2 py-0.5 rounded-md">
                              BIN {stop.stopNumber}A
                            </span>
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                              <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                              Bio-Degradable Bin
                            </span>
                          </div>

                          {/* Waste Type Display Badge */}
                          {binAIsMixed ? (
                            <span className="bg-rose-600 text-white font-black text-[11px] px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1 animate-bounce">
                              <AlertTriangle className="w-3 h-3 text-amber-200" />
                              DISPLAY: MIXED
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <Leaf className="w-3 h-3 text-emerald-600" />
                              DEGRADABLE
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 font-mono mt-1">ID: {stop.bin1A.binId}</p>

                        {/* Fill Meter */}
                        <div className="mt-3 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600 font-medium">Fill Level:</span>
                            <span className="font-bold text-slate-900">{stop.bin1A.fillLevel}% ({stop.bin1A.status})</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden border border-slate-300">
                            <div
                              className={`h-full ${stop.bin1A.status === 'CRITICAL' ? 'bg-rose-500' : stop.bin1A.status === 'HIGH' ? 'bg-orange-500' : 'bg-emerald-500'}`}
                              style={{ width: `${stop.bin1A.fillLevel}%` }}
                            />
                          </div>
                        </div>

                        {/* Contamination / Odd Items Display Banner with Item Counts */}
                        <div className="mt-3">
                          {binAIsMixed ? (
                            <div className="bg-rose-100/90 border border-rose-300 text-rose-950 rounded-xl p-3 text-xs space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-rose-900 font-black">
                                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                  <span>CONTAMINATION DETECTED</span>
                                </div>
                                <span className="bg-rose-600 text-white font-mono text-[10px] font-black px-2 py-0.5 rounded-md">
                                  {totalABinItems} Odd Items Total
                                </span>
                              </div>

                              <p className="text-[11px] text-rose-800 font-medium leading-relaxed">
                                {stop.bin1A.contaminationDetails || 'Non-degradable materials improperly thrown into this Bio-degradable bin.'}
                              </p>

                              {/* Badges of Foreign Non-Bio Items with Item Counts */}
                              <div className="pt-2 border-t border-rose-200/80">
                                <div className="text-[10px] font-bold text-rose-900 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                                  <span className="flex items-center gap-1">
                                    <PackageX className="w-3 h-3 text-rose-600" />
                                    Foreign Item Counts:
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {binABadges.map((badge, idx) => (
                                    <div key={idx} className="bg-rose-200/90 border border-rose-300 text-rose-950 text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs">
                                      <span>{badge.label}</span>
                                      <span className="bg-rose-700 text-white font-mono font-black text-[10px] px-1.5 py-0.2 rounded">
                                        ×{badge.count}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-emerald-100/60 border border-emerald-200 text-emerald-900 rounded-lg p-2 text-xs font-semibold flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Clean Bio Waste (Organic / Food / Compostable)</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Interactive Controls for Bin 1A */}
                      <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                        {binAIsMixed ? (
                          <button
                            onClick={() => handleCleanBin(stop.bin1A, 'degradable')}
                            className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                          >
                            <Sparkles className="w-3 h-3" />
                            Unmix / Segregate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenMixModal(stop.bin1A, true)}
                            className="flex-1 py-1.5 px-2 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                            title="Simulate non-degradable trash (plastic/cans) thrown into bio bin with item count"
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                            Mix Non-Bio Waste
                          </button>
                        )}

                        <button
                          onClick={() => onSimulateFill(stop.bin1A.binId, 20)}
                          className="py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          +20%
                        </button>

                        <button
                          onClick={() => setSelectedBinForScan(stop.bin1A)}
                          className="py-1.5 px-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          CV Scan
                        </button>
                      </div>
                    </div>

                    {/* BIN 1B (Non-Degradable Bin) */}
                    <div className={`rounded-xl p-4 border transition-all flex flex-col justify-between ${binBIsMixed ? 'bg-rose-50/80 border-rose-300 shadow-sm' : 'bg-cyan-50/40 border-cyan-200 hover:border-cyan-300'}`}>
                      <div>
                        {/* Title Bar */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="bg-cyan-800 text-white font-mono font-black text-xs px-2 py-0.5 rounded-md">
                              BIN {stop.stopNumber}B
                            </span>
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                              <Recycle className="w-3.5 h-3.5 text-cyan-600" />
                              Non-Degradable Bin
                            </span>
                          </div>

                          {/* Waste Type Display Badge */}
                          {binBIsMixed ? (
                            <span className="bg-rose-600 text-white font-black text-[11px] px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1 animate-bounce">
                              <AlertTriangle className="w-3 h-3 text-amber-200" />
                              DISPLAY: MIXED
                            </span>
                          ) : (
                            <span className="bg-cyan-100 text-cyan-900 border border-cyan-300 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <Recycle className="w-3 h-3 text-cyan-600" />
                              NON-DEGRADABLE
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 font-mono mt-1">ID: {stop.bin1B.binId}</p>

                        {/* Fill Meter */}
                        <div className="mt-3 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600 font-medium">Fill Level:</span>
                            <span className="font-bold text-slate-900">{stop.bin1B.fillLevel}% ({stop.bin1B.status})</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden border border-slate-300">
                            <div
                              className={`h-full ${stop.bin1B.status === 'CRITICAL' ? 'bg-rose-500' : stop.bin1B.status === 'HIGH' ? 'bg-orange-500' : 'bg-cyan-500'}`}
                              style={{ width: `${stop.bin1B.fillLevel}%` }}
                            />
                          </div>
                        </div>

                        {/* Contamination / Odd Items Display Banner with Item Counts */}
                        <div className="mt-3">
                          {binBIsMixed ? (
                            <div className="bg-rose-100/90 border border-rose-300 text-rose-950 rounded-xl p-3 text-xs space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-rose-900 font-black">
                                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                  <span>CONTAMINATION DETECTED</span>
                                </div>
                                <span className="bg-rose-600 text-white font-mono text-[10px] font-black px-2 py-0.5 rounded-md">
                                  {totalBBinItems} Odd Items Total
                                </span>
                              </div>

                              <p className="text-[11px] text-rose-800 font-medium leading-relaxed">
                                {stop.bin1B.contaminationDetails || 'Bio-degradable wet waste improperly thrown into this Non-degradable bin.'}
                              </p>

                              {/* Badges of Foreign Bio Items with Item Counts */}
                              <div className="pt-2 border-t border-rose-200/80">
                                <div className="text-[10px] font-bold text-rose-900 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                                  <span className="flex items-center gap-1">
                                    <PackageX className="w-3 h-3 text-rose-600" />
                                    Foreign Item Counts:
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {binBBadges.map((badge, idx) => (
                                    <div key={idx} className="bg-rose-200/90 border border-rose-300 text-rose-950 text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs">
                                      <span>{badge.label}</span>
                                      <span className="bg-rose-700 text-white font-mono font-black text-[10px] px-1.5 py-0.2 rounded">
                                        ×{badge.count}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-cyan-100/60 border border-cyan-200 text-cyan-900 rounded-lg p-2 text-xs font-semibold flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                              <span>Clean Non-Bio Waste (Plastics / Metal / Dry Paper)</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Interactive Controls for Bin 1B */}
                      <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                        {binBIsMixed ? (
                          <button
                            onClick={() => handleCleanBin(stop.bin1B, 'non-degradable')}
                            className="flex-1 py-1.5 px-2 bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                          >
                            <Sparkles className="w-3 h-3" />
                            Unmix / Segregate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenMixModal(stop.bin1B, false)}
                            className="flex-1 py-1.5 px-2 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                            title="Simulate bio-degradable trash (food/fruit peels) thrown into non-bio bin with item count"
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                            Mix Bio Waste
                          </button>
                        )}

                        <button
                          onClick={() => onSimulateFill(stop.bin1B.binId, 20)}
                          className="py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          +20%
                        </button>

                        <button
                          onClick={() => setSelectedBinForScan(stop.bin1B)}
                          className="py-1.5 px-2.5 bg-cyan-800 hover:bg-cyan-900 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          CV Scan
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* INDIVIDUAL BINS GRID VIEW */}
      {viewMode === 'GRID' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {bins.map((bin, index) => {
            const isMixed = bin.wasteType === 'mixed' || bin.isMixed;
            const isDegradableCategory = index % 2 === 0;
            const binLabel = `BIN ${Math.floor(index / 2) + 1}${isDegradableCategory ? 'A' : 'B'}`;
            const badges = isMixed ? getContaminantBadges(bin, isDegradableCategory) : [];
            const totalItemsInBin = badges.reduce((sum, b) => sum + b.count, 0);

            let statusBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
            let fillBarClass = 'bg-emerald-500';

            if (bin.status === 'CRITICAL') {
              statusBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse';
              fillBarClass = 'bg-rose-500';
            } else if (bin.status === 'HIGH') {
              statusBadgeClass = 'bg-orange-50 text-orange-700 border-orange-200';
              fillBarClass = 'bg-orange-500';
            } else if (bin.status === 'MEDIUM') {
              statusBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
              fillBarClass = 'bg-amber-500';
            }

            return (
              <div
                key={bin.id}
                className={`bg-white border rounded-xl p-4 flex flex-col justify-between shadow-xs transition-all ${isMixed ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-200 hover:border-emerald-300'}`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-extrabold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {binLabel} ({bin.binId})
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadgeClass}`}>
                      {bin.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 font-semibold mt-2 truncate">{bin.locationName}</p>
                  <p className="text-[11px] text-slate-500">{bin.neighborhood}</p>

                  {/* Fill Meter Bar */}
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Fill Level:</span>
                      <span className="font-bold text-slate-900">{bin.fillLevel}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                      <div className={`h-full ${fillBarClass}`} style={{ width: `${bin.fillLevel}%` }} />
                    </div>
                  </div>

                  {/* Waste Display Tag */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Waste Type:</span>
                    {isMixed ? (
                      <span className="bg-rose-600 text-white font-extrabold text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-200" />
                        MIXED ({totalItemsInBin} items)
                      </span>
                    ) : (
                      <span className={`font-extrabold text-[11px] px-2 py-0.5 rounded-full ${isDegradableCategory ? 'bg-emerald-100 text-emerald-800' : 'bg-cyan-100 text-cyan-800'}`}>
                        {isDegradableCategory ? 'DEGRADABLE' : 'NON-DEGRADABLE'}
                      </span>
                    )}
                  </div>

                  {/* Foreign Items with counts if mixed */}
                  {isMixed && (
                    <div className="mt-2.5 p-2 bg-rose-50 border border-rose-200 rounded-lg text-[10px] space-y-1">
                      <div className="font-bold text-rose-900 flex items-center justify-between">
                        <span>{isDegradableCategory ? '🚨 Foreign Non-Bio Items:' : '🚨 Foreign Bio Items:'}</span>
                        <span className="bg-rose-200 font-mono font-black px-1 rounded">Sum: {totalItemsInBin}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {badges.map((b, i) => (
                          <span key={i} className="bg-rose-200/90 text-rose-950 font-bold px-1.5 py-0.5 rounded border border-rose-300">
                            {b.label} ×{b.count}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Mix / Clean buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                  {isMixed ? (
                    <button
                      onClick={() => handleCleanBin(bin, isDegradableCategory ? 'degradable' : 'non-degradable')}
                      className="flex-1 py-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded transition-colors cursor-pointer text-center"
                    >
                      Unmix
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenMixModal(bin, isDegradableCategory)}
                      className="flex-1 py-1 px-2 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold rounded transition-colors cursor-pointer text-center"
                    >
                      Mix Waste
                    </button>
                  )}

                  <button
                    onClick={() => onSimulateFill(bin.binId, 20)}
                    className="py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold rounded cursor-pointer"
                  >
                    +20%
                  </button>

                  <button
                    onClick={() => setSelectedBinForScan(bin)}
                    className="py-1 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold rounded cursor-pointer flex items-center gap-1"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* INTERACTIVE CONTAMINATION MIX MODAL WITH ITEM QUANTITY STEPPERS */}
      {mixingBin && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                  CONTAMINATION SIMULATOR
                </span>
                <h3 className="font-extrabold text-sm text-slate-900 mt-1">
                  Inject Foreign Waste &amp; Item Counts into {mixingBin.bin.binId}
                </h3>
              </div>
              <button onClick={() => setMixingBin(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer font-bold">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                Target Bin Type: {mixingBin.isDegradableBin ? 'Bio-Degradable Bin 1A' : 'Non-Degradable Bin 1B'}
              </div>
              <p className="text-[11px] text-amber-800">
                {mixingBin.isDegradableBin
                  ? 'Select non-degradable items and configure the item count for each item dumped into Bin 1A.'
                  : 'Select bio-degradable items and configure the item count for each item dumped into Bin 1B.'}
              </p>
            </div>

            {/* Checklist of Foreign Items with Quantity Steppers */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Choose Foreign Items &amp; Specify Item Counts:
              </label>
              <div className="grid grid-cols-1 gap-2.5 max-h-60 overflow-y-auto pr-1">
                {(mixingBin.isDegradableBin ? NON_BIO_ITEMS : BIO_ITEMS).map(item => {
                  const isChecked = selectedItemsToMix.includes(item.label);
                  const currentQty = itemQuantities[item.id] || item.defaultQty || 3;

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border text-xs font-semibold transition-all ${isChecked ? 'bg-rose-50/90 border-rose-300 text-rose-950 shadow-2xs' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedItemsToMix(prev => [...prev, item.label]);
                              } else {
                                setSelectedItemsToMix(prev => prev.filter(i => i !== item.label));
                              }
                            }}
                            className="accent-rose-600 rounded w-4 h-4 cursor-pointer"
                          />
                          <span className="font-bold text-slate-900 truncate">{item.label}</span>
                        </label>

                        {/* Quantity Counter Stepper */}
                        {isChecked && (
                          <div className="flex items-center gap-1 bg-white border border-rose-300 rounded-lg p-1 shadow-2xs">
                            <span className="text-[10px] font-bold text-slate-500 px-1">Qty:</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-mono font-black text-xs text-rose-950 min-w-[20px] text-center">
                              {currentQty}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-6 h-6 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center justify-center cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Optional Custom Note / Source:
              </label>
              <input
                type="text"
                placeholder="e.g. Dumped by nearby street food vendor"
                value={customMixNote}
                onChange={(e) => setCustomMixNote(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2 text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setMixingBin(null)}
                className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmMix}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-200" />
                Apply Contamination with Item Counts
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CV Scan Simulator Modal with Presets */}
      {selectedBinForScan && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-extrabold text-sm text-emerald-800 flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-600" />
                Smart Camera Inspection: {selectedBinForScan.binId} ({selectedBinForScan.locationName})
              </h3>
              <button onClick={() => setSelectedBinForScan(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer font-bold">✕</button>
            </div>

            {/* Quick Contamination Presets with explicit item counts */}
            <div className="space-y-2">
              <label className="block text-slate-700 font-bold text-xs">
                Quick Simulation Scenarios:
              </label>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setScanDescription("Plastic bottles (×5), polythene carry bags (×8), and metal soda cans (×3) dumped inside Bio-Degradable Bin 1A.")}
                  className="p-2.5 rounded-lg border border-rose-200 bg-rose-50/60 hover:bg-rose-100 text-rose-900 font-semibold text-left transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>🚨 Non-Bio Items (Plastic bottles ×5, Bags ×8, Cans ×3) in Bio Bin</span>
                  <span className="font-bold text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded">Triggers MIXED</span>
                </button>

                <button
                  type="button"
                  onClick={() => setScanDescription("Leftover cooked food scraps (×4), banana peels (×6), and wet kitchen waste (×3) dumped inside Non-Bio Bin 1B.")}
                  className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/60 hover:bg-amber-100 text-amber-900 font-semibold text-left transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>🚨 Bio Items (Cooked food scraps ×4, Fruit peels ×6) in Non-Bio Bin</span>
                  <span className="font-bold text-[10px] bg-amber-600 text-white px-2 py-0.5 rounded">Triggers MIXED</span>
                </button>

                <button
                  type="button"
                  onClick={() => setScanDescription("Clean, 100% segregated waste without cross-contamination.")}
                  className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 text-emerald-900 font-semibold text-left transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>✅ Pure segregated waste observation</span>
                  <span className="font-bold text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded">Clean Segregation</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleScanSubmit} className="space-y-4 text-xs pt-2">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Custom Visual Description / Sensor Output:
                </label>
                <textarea
                  rows={3}
                  value={scanDescription}
                  onChange={(e) => setScanDescription(e.target.value)}
                  placeholder="Describe waste items observed by AI camera (e.g. plastic bottle (x4), polythene bag (x6), food scraps (x3))..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedBinForScan(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Process Vision Analysis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
