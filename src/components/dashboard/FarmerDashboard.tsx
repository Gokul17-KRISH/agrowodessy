import React, { useState } from 'react';
import { User, DemandContract, CropCommitment, Delivery, SystemMetrics } from '../../types';

interface FarmerDashboardProps {
  user: User;
  demands: DemandContract[];
  commitments: CropCommitment[];
  deliveries: Delivery[];
  metrics: SystemMetrics | null;
  onRefresh: () => void;
  onNavigateToMarketplace?: () => void;
}

// Crop benchmarks per acre for calculation
const CROP_BENCHMARKS: Record<string, { avgYieldPerAcre: number; avgPriceKg: number; icon: string }> = {
  'Red Onion': { avgYieldPerAcre: 10000, avgPriceKg: 28, icon: '🧅' },
  'Turmeric': { avgYieldPerAcre: 6000, avgPriceKg: 95, icon: '🟡' },
  'Tomato (Hybrid)': { avgYieldPerAcre: 12000, avgPriceKg: 22, icon: '🍅' },
  'Basmati Rice': { avgYieldPerAcre: 2200, avgPriceKg: 42, icon: '🌾' },
  'Maize (Corn)': { avgYieldPerAcre: 3500, avgPriceKg: 24, icon: '🌽' },
  'Organic Wheat': { avgYieldPerAcre: 2500, avgPriceKg: 34, icon: '🌾' },
};

const FarmerDashboard: React.FC<FarmerDashboardProps> = ({
  user,
  demands,
  commitments,
  deliveries,
  metrics,
  onNavigateToMarketplace
}) => {
  const [calcCrop, setCalcCrop] = useState<string>('Red Onion');
  const [calcAcres, setCalcAcres] = useState<number>(2);

  const myCommitments = commitments.filter(c => c.farmerId === user.id);
  const myDeliveries = deliveries.filter(d => d.farmerId === user.id);
  const openDemands = demands.filter(d => d.status === 'OPEN');
  const totalCommittedKg = myCommitments.reduce((a, c) => a + c.quantityKg, 0);
  const totalEarned = myDeliveries.filter(d => d.escrowStatus === 'RELEASED_TO_FARMER').reduce((a, d) => a + d.totalAmount, 0);
  const escrowPending = myDeliveries.filter(d => d.escrowStatus === 'HELD_IN_ESCROW').reduce((a, d) => a + d.totalAmount, 0);

  // Calculator computations
  const cropInfo = CROP_BENCHMARKS[calcCrop] || CROP_BENCHMARKS['Red Onion'];
  const calculatedYieldKg = Math.round(cropInfo.avgYieldPerAcre * calcAcres);
  const calculatedRevenue = Math.round(calculatedYieldKg * cropInfo.avgPriceKg);
  const stage1Advance = Math.round(calculatedRevenue * 0.3);
  const stage2Milestone = Math.round(calculatedRevenue * 0.4);
  const stage3Balance = Math.round(calculatedRevenue * 0.3);

  return (
    <div className="animate-fadeInUp" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
      {/* Top Banner & Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--agrow-forest-950) 0%, #064e3b 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-xl)',
        color: '#ffffff',
        boxShadow: '0 12px 32px rgba(2, 26, 18, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 'var(--space-md)'
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            borderRadius: 20,
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid rgba(52, 211, 153, 0.3)',
            color: '#6ee7b7',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
            marginBottom: 'var(--space-xs)'
          }}>
            🌱 VERIFIED FARMER HUB · {user.district ? `${user.district} DISTRICT` : 'NATIONAL'}
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', fontWeight: 800, color: '#ffffff' }}>
            Welcome back, {user.name.split(' ')[0]}
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.9rem', marginTop: 4, maxWidth: 560 }}>
            Know your demand before buying seeds. Lock guaranteed corporate contracts in bank escrow before sowing.
          </p>
        </div>

        {onNavigateToMarketplace && (
          <button
            onClick={onNavigateToMarketplace}
            className="btn btn-secondary"
            style={{
              padding: '0.85rem 1.75rem',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
              fontSize: '0.95rem',
              fontWeight: 700
            }}
          >
            🏪 Explore Demand Board ({openDemands.length})
          </button>
        )}
      </div>

      {/* Primary Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-md)' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--agrow-leaf-500)' }}>
          <span className="stat-label">Active Commitments</span>
          <span className="stat-value">{myCommitments.length}</span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--agrow-leaf-500)', fontWeight: 600 }}>
            📦 {totalCommittedKg.toLocaleString()} Kg Total Bound
          </span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--agrow-amber-500)' }}>
          <span className="stat-label">Escrow Locked Funds</span>
          <span className="stat-value">₹{(escrowPending / 1000).toFixed(1)}K</span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--agrow-amber-600)', fontWeight: 600 }}>
            🔒 Bank Escrow Guaranteed
          </span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #2563eb' }}>
          <span className="stat-label">Bank Payouts Released</span>
          <span className="stat-value">₹{(totalEarned / 1000).toFixed(1)}K</span>
          <span style={{ fontSize: '0.8125rem', color: '#2563eb', fontWeight: 600 }}>
            ✅ Disbursed to Account
          </span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <span className="stat-label">Open Corporate Contracts</span>
          <span className="stat-value">{openDemands.length}</span>
          <span style={{ fontSize: '0.8125rem', color: '#8b5cf6', fontWeight: 600 }}>
            🏛️ Institutional Demand
          </span>
        </div>
      </div>

      {/* Pre-Sowing Acreage & Escrow Revenue Calculator */}
      <div className="card" style={{
        background: 'linear-gradient(180deg, #ffffff 0%, var(--agrow-leaf-50) 100%)',
        border: '1px solid var(--agrow-leaf-300)',
        boxShadow: '0 8px 24px rgba(5, 150, 105, 0.08)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 'var(--space-md)' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--agrow-forest-950)', display: 'flex', alignItems: 'center', gap: 8 }}>
              🧮 Pre-Sowing Acreage & Escrow Revenue Calculator
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)', marginTop: 2 }}>
              Simulate guaranteed bank escrow payouts for your farm land before planting.
            </p>
          </div>
          <span className="badge badge-green" style={{ fontSize: '0.8rem', padding: '4px 12px' }}>
            HDFC/ICICI Escrow Protocol
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-lg)' }}>
          {/* Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div className="input-group">
              <label>Select Intended Crop</label>
              <select
                className="input"
                value={calcCrop}
                onChange={e => setCalcCrop(e.target.value)}
                style={{ fontWeight: 600 }}
              >
                {Object.keys(CROP_BENCHMARKS).map(c => (
                  <option key={c} value={c}>
                    {CROP_BENCHMARKS[c].icon} {c} (Avg. ₹{CROP_BENCHMARKS[c].avgPriceKg}/Kg)
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Farm Land Acreage</label>
                <span style={{ fontWeight: 800, color: 'var(--agrow-leaf-500)', fontSize: '1.1rem' }}>
                  {calcAcres} {calcAcres === 1 ? 'Acre' : 'Acres'}
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="15"
                step="0.5"
                value={calcAcres}
                onChange={e => setCalcAcres(parseFloat(e.target.value))}
                style={{ accentColor: 'var(--agrow-leaf-500)', cursor: 'pointer', height: 8 }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                <span>0.5 Acre</span>
                <span>5 Acres</span>
                <span>15 Acres</span>
              </div>
            </div>

            <div style={{
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: 'white',
              border: '1px solid var(--slate-200)',
              fontSize: '0.8125rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: 'var(--slate-600)' }}>Benchmark Yield / Acre:</span>
                <strong>{cropInfo.avgYieldPerAcre.toLocaleString()} Kg</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--slate-600)' }}>Target Contract Price:</span>
                <strong style={{ color: 'var(--agrow-forest-800)' }}>₹{cropInfo.avgPriceKg} / Kg</strong>
              </div>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div style={{
            background: 'var(--agrow-forest-950)',
            color: 'white',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-lg)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#6ee7b7', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Total Projected Escrow Revenue
              </div>
              <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#ffffff', margin: '4px 0 12px', lineHeight: 1 }}>
                ₹{calculatedRevenue.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                Guaranteed for <strong>{calculatedYieldKg.toLocaleString()} Kg</strong> harvested volume.
              </div>
            </div>

            {/* Milestone Payout Steps */}
            <div style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)', borderTop: '1px solid rgba(255,255,255,0.15)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>
                3-Stage Bank Escrow Disbursement Plan:
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <span>🌱 Stage 1 (30% Sowing Advance):</span>
                <strong style={{ color: '#6ee7b7' }}>₹{stage1Advance.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <span>🌾 Stage 2 (40% Harvest Signal):</span>
                <strong style={{ color: '#93c5fd' }}>₹{stage2Milestone.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <span>⚖️ Stage 3 (30% Assayer Approval):</span>
                <strong style={{ color: '#fde047' }}>₹{stage3Balance.toLocaleString()}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
        {/* My Commitments */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              📋 My Active Crop Commitments
            </h3>
            <span className="badge badge-slate">{myCommitments.length} Active</span>
          </div>

          {myCommitments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-2xl) 0', color: 'var(--slate-400)' }}>
              <p style={{ fontSize: '2rem', marginBottom: 8 }}>🌱</p>
              <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>No pre-sowing commitments yet</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--slate-500)', marginTop: 4 }}>
                Commit to corporate buyer demands on the Demand Board to lock your prices.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {myCommitments.map(c => (
                <div key={c.id} style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--slate-50)',
                  border: '1px solid var(--slate-200)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--slate-900)' }}>{c.cropName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--slate-600)', marginTop: 2 }}>
                      {c.quantityKg.toLocaleString()} Kg · {c.district} District
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)', marginTop: 2 }}>
                      Target: {c.harvestDateAvailable || ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge ${
                      c.status === 'DELIVERED' ? 'badge-green' :
                      c.status === 'HARVESTED' ? 'badge-blue' :
                      c.status === 'SEEDED' ? 'badge-amber' : 'badge-slate'
                    }`}>
                      {c.status}
                    </span>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--agrow-forest-800)', marginTop: 4 }}>
                      ₹{(c.quantityKg * 25).toLocaleString()} Est.
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Corporate Demands */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              🏛️ Verified Corporate Demands
            </h3>
            {onNavigateToMarketplace && (
              <button
                onClick={onNavigateToMarketplace}
                style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--agrow-leaf-500)', cursor: 'pointer' }}
              >
                View All →
              </button>
            )}
          </div>

          {openDemands.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-2xl) 0', color: 'var(--slate-400)' }}>
              <p>No open corporate contracts available right now.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {openDemands.slice(0, 4).map(d => {
                const pct = d.quantityRequiredKg > 0 ? Math.round((d.quantityCommittedKg / d.quantityRequiredKg) * 100) : 0;
                return (
                  <div key={d.id} style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--agrow-leaf-50)',
                    border: '1px solid var(--agrow-leaf-100)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--agrow-forest-950)' }}>{d.cropName}</span>
                      <span style={{ fontWeight: 800, color: 'var(--agrow-leaf-500)', fontSize: '0.9rem' }}>₹{d.pricePerKg}/Kg</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--slate-600)', marginBottom: 8 }}>
                      {d.buyerName} · {d.district} · Target {d.targetMonth}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--agrow-leaf-200)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, borderRadius: 3, background: pct >= 100 ? 'var(--agrow-amber-500)' : 'var(--agrow-leaf-500)', transition: 'width 0.5s' }} />
                      </div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: pct >= 100 ? 'var(--agrow-amber-600)' : 'var(--agrow-leaf-500)' }}>
                        {pct}% Committed
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FarmerDashboard;
