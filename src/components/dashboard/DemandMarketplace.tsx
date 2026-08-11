import React, { useState } from 'react';
import { User, DemandContract } from '../../types';
import { api } from '../../services/api';

interface DemandMarketplaceProps {
  user: User;
  demands: DemandContract[];
  onRefresh: () => void;
}

const DemandMarketplace: React.FC<DemandMarketplaceProps> = ({ user, demands, onRefresh }) => {
  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'PRICE_DESC' | 'PROGRESS_DESC' | 'DATE'>('PRICE_DESC');

  // Modals & Interactivity State
  const [selectedContract, setSelectedContract] = useState<DemandContract | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Acreage Yield Calculator State (in Contract Detail Modal)
  const [acresToCommit, setAcresToCommit] = useState<number>(2);
  const [commitSuccessMsg, setCommitSuccessMsg] = useState('');

  // New Contract Form State (for Buyer)
  const [newCropName, setNewCropName] = useState('Red Onion');
  const [newDistrict, setNewDistrict] = useState('Coimbatore');
  const [newQtyKg, setNewQtyKg] = useState('50000');
  const [newPrice, setNewPrice] = useState('28');
  const [newTargetMonth, setNewTargetMonth] = useState('Nov 2026');
  const [newQualitySpecs, setNewQualitySpecs] = useState('Moisture < 12%, Size > 45mm, Defects < 3%');

  const isFarmer = user.role === 'FARMER';
  const isBuyer = user.role === 'BUYER';

  // Available unique options for dropdowns
  const cropOptions = Array.from(new Set(demands.map(d => d.cropName)));
  const districtOptions = Array.from(new Set(demands.map(d => d.district)));

  // Filter & Sort Logic
  const filteredDemands = demands.filter(d => {
    const matchesSearch =
      d.cropName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.buyerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCrop = selectedCrop === 'ALL' || d.cropName === selectedCrop;
    const matchesDistrict = selectedDistrict === 'ALL' || d.district === selectedDistrict;
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;

    return matchesSearch && matchesCrop && matchesDistrict && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'PRICE_DESC') return b.pricePerKg - a.pricePerKg;
    if (sortBy === 'PROGRESS_DESC') {
      const pA = (a.quantityCommittedKg / a.quantityRequiredKg) * 100;
      const pB = (b.quantityCommittedKg / b.quantityRequiredKg) * 100;
      return pB - pA;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Calculate Marketplace Statistics
  const totalVolumeKg = demands.reduce((acc, curr) => acc + curr.quantityRequiredKg, 0);
  const totalEscrowLocked = demands.reduce((acc, curr) => acc + (curr.quantityRequiredKg * curr.pricePerKg), 0);
  const totalCommittedKg = demands.reduce((acc, curr) => acc + curr.quantityCommittedKg, 0);
  const overallProgress = totalVolumeKg > 0 ? Math.round((totalCommittedKg / totalVolumeKg) * 100) : 0;

  // Handle Commit Action
  const handleCommitSubmit = async () => {
    if (!selectedContract || acresToCommit <= 0) return;
    const expectedYieldKg = acresToCommit * 10000; // ~10 Tonnes per acre avg yield
    setSubmitting(true);
    try {
      await api.commitments.create({
        demandContractId: selectedContract.id,
        quantityKg: expectedYieldKg,
        plantingDate: new Date().toISOString().split('T')[0]
      });
      setCommitSuccessMsg(`🎉 Successfully committed ${acresToCommit} Acres (${expectedYieldKg.toLocaleString()} Kg) to ${selectedContract.buyerName}! Escrow advance unlocked.`);
      setTimeout(() => {
        setCommitSuccessMsg('');
        setSelectedContract(null);
        onRefresh();
      }, 2000);
    } catch (err) {
      console.error('Commit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle New Demand Creation (Buyer)
  const handleCreateDemand = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.demands.create({
        cropName: newCropName,
        district: newDistrict,
        quantityRequiredKg: parseInt(newQtyKg),
        pricePerKg: parseFloat(newPrice),
        targetMonth: newTargetMonth,
        qualityRequirements: newQualitySpecs,
        status: 'OPEN'
      });
      setShowCreateModal(false);
      onRefresh();
    } catch (err) {
      console.error('Create demand error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fadeInUp" style={{ fontFamily: 'var(--font-body)' }}>

      {/* 1. Header Banner & Aggregate Stats */}
      <div style={{
        background: 'linear-gradient(135deg, #052e16 0%, #064e3b 50%, #0f766e 100%)',
        borderRadius: 24,
        padding: '2.5rem',
        color: 'white',
        marginBottom: '2rem',
        boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ maxWidth: 600 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', padding: '4px 12px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 700, marginBottom: 12, color: '#a7f3d0' }}>
              🏪 Pre-Sowing Corporate Contract Exchange
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 900, lineHeight: 1.2, margin: 0, color: '#ffffff' }}>
              Corporate Demand Marketplace
            </h1>
            <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.85)', marginTop: 8, lineHeight: 1.5 }}>
              Browse pre-sowing buyback contracts backed by 100% bank escrow capital. Lock your harvest prices before spending a single rupee on seeds or land prep.
            </p>
          </div>

          {isBuyer && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn"
              style={{
                background: '#10b981',
                color: '#ffffff',
                fontWeight: 800,
                padding: '12px 24px',
                borderRadius: 14,
                border: 'none',
                boxShadow: '0 4px 16px rgba(16,185,129,0.4)',
                fontSize: '0.95rem'
              }}
            >
              + Post New Contract & Lock Escrow
            </button>
          )}
        </div>

        {/* Live Marketplace Metrics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginTop: '2rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(255,255,255,0.15)'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>Total Open Demand</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffffff' }}>{(totalVolumeKg / 1000).toLocaleString()} Tonnes</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>Bank Escrow Funds Locked</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fde047' }}>₹{(totalEscrowLocked / 10000000).toFixed(2)} Cr</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>FPO Supply Progress</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#6ee7b7' }}>{overallProgress}% Full</div>
          </div>
        </div>
      </div>

      {/* 2. Multi-Parameter Filter & Search Bar */}
      <div style={{
        background: '#ffffff',
        borderRadius: 20,
        padding: '1.25rem 1.5rem',
        marginBottom: '2rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Search Input */}
        <div style={{ flex: 1, minWidth: 260 }}>
          <input
            className="input"
            placeholder="🔍 Search crop, district, or corporate buyer..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ borderRadius: 12, padding: '10px 16px' }}
          />
        </div>

        {/* Dropdown Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            className="input select"
            value={selectedCrop}
            onChange={e => setSelectedCrop(e.target.value)}
            style={{ width: 140, borderRadius: 12, fontSize: '0.85rem' }}
          >
            <option value="ALL">🌱 All Crops</option>
            {cropOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            className="input select"
            value={selectedDistrict}
            onChange={e => setSelectedDistrict(e.target.value)}
            style={{ width: 150, borderRadius: 12, fontSize: '0.85rem' }}
          >
            <option value="ALL">📍 All Districts</option>
            {districtOptions.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <select
            className="input select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ width: 140, borderRadius: 12, fontSize: '0.85rem' }}
          >
            <option value="ALL">Status: All</option>
            <option value="OPEN">🟢 Open Only</option>
            <option value="FULLY_COMMITTED">🟡 Fully Committed</option>
          </select>

          <select
            className="input select"
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            style={{ width: 160, borderRadius: 12, fontSize: '0.85rem', fontWeight: 700 }}
          >
            <option value="PRICE_DESC">Price: High to Low</option>
            <option value="PROGRESS_DESC">Supply: Most Filled</option>
            <option value="DATE">Newest Contracts</option>
          </select>
        </div>
      </div>

      {/* 3. Contract Cards Grid */}
      {filteredDemands.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: '#ffffff',
          borderRadius: 20,
          border: '2px dashed #cbd5e1',
          color: '#64748b'
        }}>
          <span style={{ fontSize: '3rem' }}>🏪</span>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: 12, color: '#0f172a' }}>No Demand Contracts Found</h3>
          <p style={{ fontSize: '0.875rem' }}>Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {filteredDemands.map(demand => {
            const pct = demand.quantityRequiredKg > 0 ? Math.round((demand.quantityCommittedKg / demand.quantityRequiredKg) * 100) : 0;
            const isFull = pct >= 100;
            const escrowLockedVal = (demand.quantityRequiredKg * demand.pricePerKg);

            return (
              <div
                key={demand.id}
                className="card"
                style={{
                  padding: 0,
                  borderRadius: 20,
                  overflow: 'hidden',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  background: '#ffffff',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                {/* Top Banner Header */}
                <div style={{
                  padding: '1.25rem 1.5rem',
                  background: isFull ? 'linear-gradient(135deg, #fffbeb, #fef3c7)' : 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: isFull ? '#b45309' : '#15803d' }}>
                      📍 {demand.district} Cluster
                    </span>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 900, margin: '2px 0 0', color: '#0f172a' }}>
                      {demand.cropName}
                    </h3>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#15803d' }}>
                      ₹{demand.pricePerKg}<span style={{ fontSize: '0.8rem', fontWeight: 600 }}>/Kg</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', background: '#ffffff', color: '#166534', padding: '2px 8px', borderRadius: 8, fontWeight: 700, border: '1px solid #bbf7d0' }}>
                      Escrow Guaranteed
                    </span>
                  </div>
                </div>

                {/* Body Details */}
                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Corporate Buyer</span>
                      <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>🏢 {demand.buyerName}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Target Volume</span>
                      <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{(demand.quantityRequiredKg / 1000).toLocaleString()} Tonnes</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Delivery Target</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0369a1', background: '#e0f2fe', padding: '2px 8px', borderRadius: 6 }}>
                        🗓️ {demand.targetMonth}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, marginBottom: 6 }}>
                        <span style={{ color: '#475569' }}>FPO Acreage Commitment</span>
                        <span style={{ color: isFull ? '#d97706' : '#16a34a' }}>{pct}% Filled</span>
                      </div>
                      <div style={{ height: 8, borderRadius: 4, background: '#e2e8f0', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min(pct, 100)}%`,
                          background: isFull ? 'linear-gradient(90deg, #f59e0b, #d97706)' : 'linear-gradient(90deg, #10b981, #059669)',
                          borderRadius: 4
                        }} />
                      </div>
                    </div>

                    {/* Escrow Lock Badge */}
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: '#334155' }}>
                      <span>🔒 Bank Escrow Deposit:</span>
                      <strong style={{ color: '#0f172a' }}>₹{(escrowLockedVal / 100000).toFixed(1)} Lakhs</strong>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setSelectedContract(demand)}
                      className="btn"
                      style={{
                        flex: 1,
                        background: '#0f172a',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '0.88rem',
                        padding: '10px 14px',
                        borderRadius: 12,
                        border: 'none'
                      }}
                    >
                      Inspect Contract & Calculate Yield →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. INTERACTIVE CONTRACT DETAIL & ACREAGE YIELD CALCULATOR MODAL */}
      {selectedContract && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '1.5rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 28,
            width: '100%',
            maxWidth: 640,
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '1.5rem 2rem', background: 'linear-gradient(135deg, #052e16, #065f46)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#a7f3d0', textTransform: 'uppercase' }}>
                  Verified Escrow Contract #{selectedContract.id}
                </span>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 900, margin: '2px 0 0' }}>
                  {selectedContract.cropName} — {selectedContract.district}
                </h2>
              </div>
              <button
                onClick={() => setSelectedContract(null)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: 10, width: 36, height: 36, fontSize: '1.2rem', cursor: 'pointer', fontWeight: 800 }}
              >
                ✕
              </button>
            </div>

            {/* Modal Content Scroll Area */}
            <div style={{ padding: '2rem', overflowY: 'auto', flex: 1 }}>

              {commitSuccessMsg && (
                <div style={{ padding: '14px 18px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, color: '#166534', fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                  {commitSuccessMsg}
                </div>
              )}

              {/* Corporate Specs & Escrow Security Card */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 18, padding: '1.25rem', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>📋 Certified Quality & Escrow Parameters</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Guaranteed Buyback:</span>
                    <div style={{ fontWeight: 800, color: '#15803d', fontSize: '1.1rem' }}>₹{selectedContract.pricePerKg} / Kg</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Escrow Bank Partner:</span>
                    <div style={{ fontWeight: 800, color: '#0369a1' }}>HDFC Agri Escrow #8912</div>
                  </div>
                  <div style={{ gridColumn: 'span 2', background: '#ffffff', padding: '10px', borderRadius: 10, border: '1px solid #e2e8f0', marginTop: 4 }}>
                    <span style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 700 }}>QUALITY SPECS & ASSAYING:</span>
                    <div style={{ fontWeight: 700, color: '#334155', fontSize: '0.85rem', marginTop: 2 }}>
                      {selectedContract.qualityRequirements || 'Standard Moisture < 12%, Defect Limit < 3%, Grade A/B certified.'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Land Acreage Yield Calculator (for Farmers) */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 18, padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#166534' }}>⚡ Interactive Farm Acreage Yield Calculator</h4>
                  <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>Pre-Sowing Payout</span>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#166534' }}>Select Acres to Commit:</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
                    <input
                      type="range"
                      min={0.5}
                      max={10}
                      step={0.5}
                      value={acresToCommit}
                      onChange={e => setAcresToCommit(parseFloat(e.target.value))}
                      style={{ flex: 1, accentColor: '#10b981' }}
                    />
                    <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#166534', minWidth: 70, textAlign: 'right' }}>
                      {acresToCommit} Acres
                    </span>
                  </div>
                </div>

                {/* Live Computed Breakdown */}
                {(() => {
                  const estYieldKg = acresToCommit * 10000; // 10 Tonnes per acre
                  const totalPayout = estYieldKg * selectedContract.pricePerKg;
                  const advance30 = totalPayout * 0.30;
                  const harvest40 = totalPayout * 0.40;
                  const final30 = totalPayout * 0.30;

                  return (
                    <div style={{ background: '#ffffff', borderRadius: 14, padding: '1rem', border: '1px solid #bbf7d0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.85rem' }}>
                        <span>Projected Harvest Volume:</span>
                        <strong style={{ color: '#0f172a' }}>{estYieldKg.toLocaleString()} Kg ({(estYieldKg/1000)} Tonnes)</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: '1rem', fontWeight: 800, color: '#15803d', borderBottom: '1px dashed #cbd5e1', paddingBottom: 8 }}>
                        <span>Total Escrow Guaranteed Revenue:</span>
                        <span>₹{totalPayout.toLocaleString()}</span>
                      </div>

                      {/* 3-Stage Escrow Timeline */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: '0.75rem', textAlign: 'center' }}>
                        <div style={{ background: '#f0fdf4', padding: '8px', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                          <div style={{ color: '#166534', fontWeight: 700 }}>30% Sowing Advance</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#15803d', marginTop: 2 }}>₹{advance30.toLocaleString()}</div>
                        </div>
                        <div style={{ background: '#e0f2fe', padding: '8px', borderRadius: 8, border: '1px solid #bae6fd' }}>
                          <div style={{ color: '#075985', fontWeight: 700 }}>40% Harvest Signal</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#0369a1', marginTop: 2 }}>₹{harvest40.toLocaleString()}</div>
                        </div>
                        <div style={{ background: '#fffbeb', padding: '8px', borderRadius: 8, border: '1px solid #fde68a' }}>
                          <div style={{ color: '#78350f', fontWeight: 700 }}>30% Assayer Approval</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#b45309', marginTop: 2 }}>₹{final30.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {isFarmer && selectedContract.status === 'OPEN' && (
                  <button
                    onClick={handleCommitSubmit}
                    disabled={submitting}
                    className="btn"
                    style={{
                      width: '100%',
                      marginTop: '1.25rem',
                      background: '#10b981',
                      color: '#ffffff',
                      fontWeight: 900,
                      fontSize: '1rem',
                      padding: '14px',
                      borderRadius: 14,
                      border: 'none',
                      boxShadow: '0 4px 16px rgba(16,185,129,0.4)'
                    }}
                  >
                    {submitting ? '⏳ Lock Escrow & Register Land...' : `🤝 Commit ${acresToCommit} Acres to Contract Now →`}
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 5. CREATE NEW DEMAND CONTRACT MODAL (for Corporate Buyers) */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '1.5rem'
        }}>
          <div style={{ background: '#ffffff', borderRadius: 28, width: '100%', maxWidth: 540, padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Post New Escrow Buyback Contract 🏢
              </h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 32, height: 32, fontWeight: 800, cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleCreateDemand} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Crop Commodity</label>
                  <input className="input" value={newCropName} onChange={e => setNewCropName(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Target District</label>
                  <select className="input select" value={newDistrict} onChange={e => setNewDistrict(e.target.value)}>
                    {['Coimbatore', 'Erode', 'Tiruppur', 'Salem', 'Trichy', 'Madurai', 'Nashik', 'Guntur', 'Kolar'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Required Volume (Kg)</label>
                  <input className="input" type="number" value={newQtyKg} onChange={e => setNewQtyKg(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Guaranteed Price (₹/Kg)</label>
                  <input className="input" type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} required />
                </div>
              </div>

              <div className="input-group">
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Target Delivery Month</label>
                <input className="input" value={newTargetMonth} onChange={e => setNewTargetMonth(e.target.value)} placeholder="Nov 2026" required />
              </div>

              <div className="input-group">
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Upload Quality Specification / Lab Standard Document (PDF / Image)</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="input"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        console.log('File uploaded:', file.name);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{ padding: '8px' }}
                />
              </div>

              <div className="input-group">
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Quality & Inspection Requirements</label>
                <textarea className="input" value={newQualitySpecs} onChange={e => setNewQualitySpecs(e.target.value)} rows={2} required />
              </div>

              <button type="submit" className="btn" disabled={submitting} style={{ background: '#10b981', color: '#ffffff', fontWeight: 800, fontSize: '1rem', padding: '14px', borderRadius: 14, border: 'none', marginTop: '0.5rem' }}>
                {submitting ? '⏳ Depositing Bank Escrow...' : '🔒 Lock Escrow Capital & Publish Contract →'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default DemandMarketplace;
