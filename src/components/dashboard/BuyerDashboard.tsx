import React, { useState } from 'react';
import { User, DemandContract, CropCommitment, Delivery, SystemMetrics } from '../../types';
import { api } from '../../services/api';

interface BuyerDashboardProps {
  user: User;
  demands: DemandContract[];
  commitments: CropCommitment[];
  deliveries: Delivery[];
  metrics: SystemMetrics | null;
  onRefresh: () => void;
}

const BuyerDashboard: React.FC<BuyerDashboardProps> = ({ user, demands, commitments, deliveries, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    cropName: '',
    quantityRequiredKg: '',
    pricePerKg: '',
    targetMonth: '',
    district: user.district || 'Coimbatore',
    terms: '',
    qualityRequirements: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const myDemands = demands.filter(d => d.buyerId === user.id);
  const myDeliveries = deliveries.filter(d => d.buyerId === user.id);
  const totalVolume = myDemands.reduce((a, d) => a + d.quantityRequiredKg, 0);
  const totalCommitted = myDemands.reduce((a, d) => a + d.quantityCommittedKg, 0);
  const escrowOut = myDeliveries.filter(d => d.escrowStatus === 'HELD_IN_ESCROW' || d.escrowStatus === 'RELEASED_TO_FARMER').reduce((a, d) => a + d.totalAmount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.demands.create({
        cropName: formData.cropName,
        quantityRequiredKg: parseInt(formData.quantityRequiredKg),
        pricePerKg: parseFloat(formData.pricePerKg),
        targetMonth: formData.targetMonth,
        district: formData.district,
        terms: formData.terms,
        qualityRequirements: formData.qualityRequirements
      });
      setShowForm(false);
      setFormData({ cropName: '', quantityRequiredKg: '', pricePerKg: '', targetMonth: '', district: user.district || 'Coimbatore', terms: '', qualityRequirements: '' });
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fadeInUp">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800 }}>
            Buyer Dashboard 🏪
          </h1>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.875rem', marginTop: 4 }}>
            {user.district && `${user.district} District · `}Manage demand contracts and track supply
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Post Demand'}
        </button>
      </div>

      {/* New Demand Form */}
      {showForm && (
        <div className="card animate-fadeInUp" style={{ marginBottom: 'var(--space-xl)', borderLeft: '4px solid var(--green-500)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>
            📋 Post New Demand Contract
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div className="input-group">
              <label>Crop Name</label>
              <input className="input" value={formData.cropName} onChange={e => setFormData({...formData, cropName: e.target.value})} placeholder="e.g., Tomato" required />
            </div>
            <div className="input-group">
              <label>Quantity Required (Kg)</label>
              <input className="input" type="number" value={formData.quantityRequiredKg} onChange={e => setFormData({...formData, quantityRequiredKg: e.target.value})} placeholder="e.g., 5000" required />
            </div>
            <div className="input-group">
              <label>Price Per Kg (₹)</label>
              <input className="input" type="number" step="0.5" value={formData.pricePerKg} onChange={e => setFormData({...formData, pricePerKg: e.target.value})} placeholder="e.g., 35" required />
            </div>
            <div className="input-group">
              <label>Target Month</label>
              <input className="input" value={formData.targetMonth} onChange={e => setFormData({...formData, targetMonth: e.target.value})} placeholder="e.g., November 2026" required />
            </div>
            <div className="input-group">
              <label>District</label>
              <select className="input select" value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})}>
                {['Coimbatore', 'Erode', 'Tiruppur', 'Salem', 'Trichy', 'Madurai'].map(d =>
                  <option key={d} value={d}>{d}</option>
                )}
              </select>
            </div>
            <div className="input-group">
              <label>Quality Requirements</label>
              <input className="input" value={formData.qualityRequirements} onChange={e => setFormData({...formData, qualityRequirements: e.target.value})} placeholder="Grade A, organic preferred" />
            </div>
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label>Terms & Conditions</label>
              <input className="input" value={formData.terms} onChange={e => setFormData({...formData, terms: e.target.value})} placeholder="Payment within 7 days of delivery verification" />
            </div>
            <div style={{ gridColumn: 'span 2', display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? '⏳ Posting...' : '📋 Post Demand'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <div className="stat-card blue">
          <span className="stat-label">My Demands</span>
          <span className="stat-value">{myDemands.length}</span>
          <span className="stat-trend" style={{ color: 'var(--blue-600)' }}>📋 Active contracts</span>
        </div>
        <div className="stat-card green">
          <span className="stat-label">Total Demand Volume</span>
          <span className="stat-value">{(totalVolume / 1000).toFixed(1)}T</span>
          <span className="stat-trend" style={{ color: 'var(--green-600)' }}>{Math.round((totalCommitted / Math.max(totalVolume, 1)) * 100)}% committed</span>
        </div>
        <div className="stat-card amber">
          <span className="stat-label">Escrow Outflow</span>
          <span className="stat-value">₹{(escrowOut / 1000).toFixed(0)}K</span>
          <span className="stat-trend" style={{ color: 'var(--amber-600)' }}>🔒 Secured payments</span>
        </div>
        <div className="stat-card green">
          <span className="stat-label">Deliveries</span>
          <span className="stat-value">{myDeliveries.length}</span>
          <span className="stat-trend" style={{ color: 'var(--green-600)' }}>{myDeliveries.filter(d => d.deliveryStatus === 'DELIVERED').length} completed</span>
        </div>
      </div>

      {/* My Demands */}
      <div className="card">
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>
          📋 My Demand Contracts
        </h3>
        {myDemands.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--slate-400)' }}>
            <p style={{ fontSize: '2rem', marginBottom: 8 }}>📋</p>
            <p>No demand contracts yet. Post your first one!</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr><th>Crop</th><th>Qty Required</th><th>Committed</th><th>Price</th><th>Target</th><th>District</th><th>Status</th></tr>
              </thead>
              <tbody>
                {myDemands.map(d => {
                  const pct = Math.round((d.quantityCommittedKg / d.quantityRequiredKg) * 100);
                  return (
                    <tr key={d.id}>
                      <td style={{ fontWeight: 600 }}>{d.cropName}</td>
                      <td>{d.quantityRequiredKg.toLocaleString()} Kg</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 60, height: 6, borderRadius: 3, background: 'var(--slate-200)' }}>
                            <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, borderRadius: 3, background: pct >= 100 ? 'var(--green-500)' : 'var(--blue-500)' }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{pct}%</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--green-700)' }}>₹{d.pricePerKg}/Kg</td>
                      <td>{d.targetMonth}</td>
                      <td>{d.district}</td>
                      <td><span className={`badge ${d.status === 'OPEN' ? 'badge-green' : d.status === 'FULLY_COMMITTED' ? 'badge-blue' : d.status === 'COMPLETED' ? 'badge-gray' : 'badge-amber'}`}>{d.status.replace('_', ' ')}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyerDashboard;
