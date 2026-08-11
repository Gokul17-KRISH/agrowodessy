import React, { useState } from 'react';
import { User, CropCommitment, Delivery } from '../../types';
import { api } from '../../services/api';

interface GraderDashboardProps {
  user: User;
  commitments: CropCommitment[];
  deliveries: Delivery[];
  onRefresh: () => void;
}

const GraderDashboard: React.FC<GraderDashboardProps> = ({ user, commitments, deliveries, onRefresh }) => {
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [grade, setGrade] = useState<'A' | 'B' | 'C' | 'REJECTED'>('A');
  const [moisturePct, setMoisturePct] = useState<number>(10.5);
  const [avgSizeCm, setAvgSizeCm] = useState<number>(5.2);
  const [defectsPct, setDefectsPct] = useState<number>(1.8);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successCertMsg, setSuccessCertMsg] = useState('');

  const harvestedCommitments = commitments.filter(c => c.status === 'HARVESTED' || c.status === 'SEEDED');
  const myGradedDeliveries = deliveries.filter(d => d.graderId === user.id);

  const handleGradeSubmit = async (commitmentId: string) => {
    setSubmitting(true);
    try {
      await api.qualityReports.create({
        cropCommitmentId: commitmentId,
        grade: grade as any,
        parameters: {
          moisturePct,
          avgSizeCm,
          defectsPct,
          organicRating: grade === 'A' ? 5 : grade === 'B' ? 4 : 3
        },
        notes: notes || `Verified in-person lab test. Grade ${grade} certified.`
      });
      
      setSuccessCertMsg(`⚖️ Quality Certificate issued! Grade ${grade} verified. Final 30% Escrow Milestone released to farmer account.`);
      setTimeout(() => {
        setSuccessCertMsg('');
        setGradingId(null);
        setGrade('A');
        setNotes('');
        onRefresh();
      }, 2500);
    } catch (err) {
      console.error('Grader submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fadeInUp" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)',
        borderRadius: 24,
        padding: '2.25rem',
        color: '#ffffff',
        boxShadow: '0 12px 32px rgba(30, 27, 75, 0.25)',
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
            background: 'rgba(129, 140, 248, 0.2)',
            border: '1px solid rgba(165, 180, 252, 0.3)',
            color: '#c7d2fe',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
            marginBottom: 'var(--space-xs)'
          }}>
            ⚖️ INDEPENDENT ASSAYER & QUALITY CERTIFIER DESK
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            Quality Inspection & Escrow Release Console
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', marginTop: 4, maxWidth: 620 }}>
            Test harvest batches for moisture %, size distribution, and defects to issue digital certificates and trigger final bank escrow disbursements.
          </p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px 20px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.15)', textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: '#c7d2fe', fontWeight: 700 }}>CERTIFIED ASSAYER</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>{user.name}</div>
          <div style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 600 }}>{user.district ? `${user.district} Region` : 'National Inspector'}</div>
        </div>
      </div>

      {successCertMsg && (
        <div style={{
          padding: '16px 20px',
          borderRadius: 16,
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          color: '#166534',
          fontSize: '0.95rem',
          fontWeight: 700,
          boxShadow: '0 4px 14px rgba(22, 101, 52, 0.1)'
        }}>
          {successCertMsg}
        </div>
      )}

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-md)' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--agrow-amber-500)' }}>
          <span className="stat-label">Pending Inspection</span>
          <span className="stat-value">{harvestedCommitments.length} Batches</span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--agrow-amber-600)', fontWeight: 600 }}>
            📦 Awaiting Lab Assay
          </span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--agrow-leaf-500)' }}>
          <span className="stat-label">Certified & Disbursed</span>
          <span className="stat-value">{myGradedDeliveries.length} Batches</span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--agrow-leaf-500)', fontWeight: 600 }}>
            ✅ Escrow Released
          </span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #6366f1' }}>
          <span className="stat-label">Active Total System Batches</span>
          <span className="stat-value">{commitments.length} Batches</span>
          <span style={{ fontSize: '0.8125rem', color: '#6366f1', fontWeight: 600 }}>
            📊 Tracked on Ledger
          </span>
        </div>
      </div>

      {/* Batches Pending Quality Verification */}
      <div className="card">
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 8 }}>
          📦 Harvest Batches Pending Quality Certification
        </h3>

        {harvestedCommitments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-2xl) 0', color: 'var(--slate-400)' }}>
            <p style={{ fontSize: '2.5rem', marginBottom: 8 }}>⚖️</p>
            <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-700)' }}>All harvest batches are fully graded and certified!</p>
            <p style={{ fontSize: '0.825rem', color: 'var(--slate-500)' }}>No pending inspection requests in queue.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {harvestedCommitments.map(c => {
              const isEditingThis = gradingId === c.id;

              return (
                <div key={c.id} style={{
                  padding: '1.25rem',
                  borderRadius: 18,
                  background: isEditingThis ? '#fefce8' : '#ffffff',
                  border: isEditingThis ? '2px solid #fde047' : '1px solid #e2e8f0',
                  boxShadow: isEditingThis ? '0 8px 24px rgba(234, 179, 8, 0.15)' : '0 2px 8px rgba(0,0,0,0.03)',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                        Batch #{c.id} · {c.district} District
                      </span>
                      <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: '2px 0 0' }}>
                        {c.cropName}
                      </h4>
                    </div>

                    <span className={`badge ${c.status === 'HARVESTED' ? 'badge-green' : 'badge-amber'}`} style={{ padding: '6px 14px', fontSize: '0.825rem' }}>
                      Status: {c.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.85rem', color: '#475569', marginBottom: 14, background: '#f8fafc', padding: '10px 14px', borderRadius: 12 }}>
                    <span>👨‍🌾 <strong>Farmer:</strong> {c.farmerName}</span>
                    <span>📦 <strong>Volume:</strong> {c.quantityKg.toLocaleString()} Kg</span>
                    <span>🗓️ <strong>Target Month:</strong> {c.harvestDateAvailable || ''}</span>
                  </div>

                  {isEditingThis ? (
                    <div style={{ background: '#ffffff', border: '1px solid #fef08a', borderRadius: 16, padding: '1.25rem', marginTop: 12 }}>
                      <h5 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 800, color: '#854d0e' }}>
                        🔬 Enter Lab Assay Parameters & Issue Certification
                      </h5>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="input-group">
                          <label>Overall Grade</label>
                          <select className="input select" value={grade} onChange={e => setGrade(e.target.value as any)} style={{ fontWeight: 800 }}>
                            <option value="A">Grade A (Premium + Full Escrow)</option>
                            <option value="B">Grade B (Standard)</option>
                            <option value="C">Grade C (Sub-Standard)</option>
                            <option value="REJECTED">Reject Batch</option>
                          </select>
                        </div>

                        <div className="input-group">
                          <label>Moisture Content (%)</label>
                          <input type="number" step="0.1" className="input" value={moisturePct} onChange={e => setMoisturePct(parseFloat(e.target.value))} />
                        </div>

                        <div className="input-group">
                          <label>Avg. Size (cm)</label>
                          <input type="number" step="0.1" className="input" value={avgSizeCm} onChange={e => setAvgSizeCm(parseFloat(e.target.value))} />
                        </div>

                        <div className="input-group">
                          <label>Defect Rate (%)</label>
                          <input type="number" step="0.1" className="input" value={defectsPct} onChange={e => setDefectsPct(parseFloat(e.target.value))} />
                        </div>
                      </div>

                      <div className="input-group" style={{ marginBottom: '1rem' }}>
                        <label>Assayer Lab Notes & Observations</label>
                        <input className="input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Moisture within 11% limits, uniform color grading, zero pest damage..." />
                      </div>

                      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost" onClick={() => setGradingId(null)}>Cancel</button>
                        <button className="btn btn-primary" onClick={() => handleGradeSubmit(c.id)} disabled={submitting}>
                          {submitting ? '⏳ Processing Certificate...' : '⚖️ Approve Grade & Release Escrow'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="btn"
                      onClick={() => setGradingId(c.id)}
                      style={{
                        background: '#312e81',
                        color: '#ffffff',
                        fontWeight: 800,
                        padding: '10px 18px',
                        borderRadius: 12,
                        fontSize: '0.88rem'
                      }}
                    >
                      🔬 Inspect Batch & Enter Lab Assay →
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default GraderDashboard;
