import React from 'react';
import { User, Delivery } from '../../types';
import { api } from '../../services/api';

interface DeliveryTrackerProps {
  user: User;
  deliveries: Delivery[];
  onRefresh: () => void;
}

const DeliveryTracker: React.FC<DeliveryTrackerProps> = ({ user, deliveries, onRefresh }) => {
  const isBuyer = user.role === 'BUYER';
  const isAdmin = user.role === 'ADMIN';

  const myDeliveries = deliveries.filter(d =>
    user.role === 'BUYER' ? d.buyerId === user.id :
    user.role === 'FARMER' ? d.farmerId === user.id :
    true
  );

  const handleEscrow = async (deliveryId: string, action: 'deposit' | 'release' | 'refund') => {
    try {
      await api.deliveries.escrowAction(deliveryId, action);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const escrowStatusLabels: Record<string, { label: string; class: string }> = {
    AWAITING_DEPOSIT: { label: '⏳ Awaiting Deposit', class: 'badge-slate' },
    HELD_IN_ESCROW: { label: '🔒 HDFC/ICICI Escrow Active', class: 'badge-amber' },
    RELEASED_TO_FARMER: { label: '✅ 100% Escrow Released', class: 'badge-green' },
    REFUNDED_TO_BUYER: { label: '↩️ Escrow Refunded', class: 'badge-red' },
  };

  return (
    <div className="animate-fadeInUp" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #022c22 0%, #065f46 60%, #0d9488 100%)',
        borderRadius: 24,
        padding: '2.25rem',
        color: '#ffffff',
        boxShadow: '0 12px 32px rgba(2, 44, 34, 0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            borderRadius: 20,
            background: 'rgba(52, 211, 153, 0.2)',
            border: '1px solid rgba(110, 231, 183, 0.3)',
            color: '#6ee7b7',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
            marginBottom: 'var(--space-xs)'
          }}>
            🏦 BANK ESCROW AUDIT & MILESTONE LEDGER
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            Delivery & Escrow Audit Tracker
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.9rem', marginTop: 4, maxWidth: 600 }}>
            Real-time verification of pre-sowing milestone payouts, assayer lab reports, and bank escrow releases.
          </p>
        </div>
      </div>

      {myDeliveries.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--slate-400)' }}>
          <p style={{ fontSize: '3rem', marginBottom: 12 }}>🚚</p>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--slate-700)' }}>No Deliveries or Escrows to Track</h3>
          <p style={{ fontSize: '0.875rem' }}>Active commitments and deliveries will appear here with full escrow audit trails.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {myDeliveries.map(delivery => {
            const escrowInfo = escrowStatusLabels[delivery.escrowStatus] || escrowStatusLabels.AWAITING_DEPOSIT;
            
            // Calculate 3-stage milestone breakdown amounts
            const totalVal = delivery.totalAmount;
            const stage1Val = Math.round(totalVal * 0.3);
            const stage2Val = Math.round(totalVal * 0.4);
            const stage3Val = Math.round(totalVal * 0.3);

            const isReleased = delivery.escrowStatus === 'RELEASED_TO_FARMER';
            const isHeld = delivery.escrowStatus === 'HELD_IN_ESCROW';

            return (
              <div key={delivery.id} className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: 20 }}>
                {/* Header Bar */}
                <div style={{
                  padding: '1.25rem 1.5rem',
                  background: isReleased ? '#f0fdf4' : '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                      Delivery #{delivery.id}
                    </span>
                    <span className={`badge ${delivery.deliveryStatus === 'DELIVERED' ? 'badge-green' : 'badge-blue'}`}>
                      {delivery.deliveryStatus}
                    </span>
                    <span className={`badge ${escrowInfo.class}`}>{escrowInfo.label}</span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--agrow-forest-800)' }}>
                      ₹{delivery.totalAmount.toLocaleString()}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--slate-500)', fontWeight: 600 }}>Total Escrow Guaranteed</span>
                  </div>
                </div>

                <div style={{ padding: '1.5rem' }}>
                  {/* Details Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 12 }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Crop Item</div>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem', marginTop: 2 }}>{delivery.cropName}</div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 12 }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Delivered Volume</div>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem', marginTop: 2 }}>{delivery.quantityDeliveredKg.toLocaleString()} Kg</div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 12 }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Contract Unit Rate</div>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem', marginTop: 2 }}>₹{delivery.pricePerKg} / Kg</div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 12 }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>{isBuyer ? 'Supplier Farmer' : 'Corporate Buyer'}</div>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem', marginTop: 2 }}>{isBuyer ? delivery.farmerName : delivery.buyerName}</div>
                    </div>
                  </div>

                  {/* 3-Stage Escrow Milestone Ledger */}
                  <div style={{
                    background: '#0f172a',
                    color: '#ffffff',
                    borderRadius: 16,
                    padding: '1.25rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 12 }}>
                      🏛️ Bank Escrow 3-Stage Milestone Ledger
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                      <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 12px', borderRadius: 12 }}>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Stage 1 (30% Sowing)</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#6ee7b7', margin: '2px 0' }}>₹{stage1Val.toLocaleString()}</div>
                        <span style={{ fontSize: '0.6875rem', background: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                          RELEASED AT SOWING
                        </span>
                      </div>

                      <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 12px', borderRadius: 12 }}>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Stage 2 (40% Harvest)</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#93c5fd', margin: '2px 0' }}>₹{stage2Val.toLocaleString()}</div>
                        <span style={{ fontSize: '0.6875rem', background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                          RELEASED AT HARVEST
                        </span>
                      </div>

                      <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 12px', borderRadius: 12 }}>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Stage 3 (30% Assayer)</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fde047', margin: '2px 0' }}>₹{stage3Val.toLocaleString()}</div>
                        <span style={{ fontSize: '0.6875rem', background: isReleased ? 'rgba(234, 179, 8, 0.2)' : 'rgba(255,255,255,0.1)', color: isReleased ? '#fde047' : '#94a3b8', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                          {isReleased ? 'PASSED & RELEASED' : 'PENDING ASSAY'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tracking Timeline */}
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
                    <h4 style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '1rem' }}>
                      📋 Immutable Tracking Timeline
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingLeft: 18, borderLeft: '2px solid #bbf7d0' }}>
                      {delivery.trackingTimeline.map((entry, i) => (
                        <div key={i} style={{ position: 'relative' }}>
                          <div style={{
                            position: 'absolute',
                            left: -23,
                            top: 4,
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: i === delivery.trackingTimeline.length - 1 ? '#10b981' : '#cbd5e1',
                            border: '2px solid #ffffff'
                          }} />
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{entry.status.replace(/_/g, ' ')}</div>
                          <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: 2 }}>{entry.description}</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>
                            {new Date(entry.timestamp).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions for Buyer/Admin */}
                  {(isBuyer || isAdmin) && (
                    <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                      {delivery.escrowStatus === 'AWAITING_DEPOSIT' && (
                        <button className="btn btn-primary" onClick={() => handleEscrow(delivery.id, 'deposit')}>
                          🔒 Deposit 100% Funds to Escrow
                        </button>
                      )}
                      {isHeld && (
                        <>
                          <button className="btn btn-primary" onClick={() => handleEscrow(delivery.id, 'release')}>
                            ✅ Release Final Escrow Payout to Farmer
                          </button>
                          <button className="btn btn-danger" onClick={() => handleEscrow(delivery.id, 'refund')}>
                            ↩️ Request Escrow Refund
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DeliveryTracker;
