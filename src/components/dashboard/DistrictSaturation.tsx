import React, { useEffect, useState } from 'react';
import { DistrictSaturationIntelligence } from '../../types';
import { api } from '../../services/api';

const DistrictSaturation: React.FC = () => {
  const [data, setData] = useState<DistrictSaturationIntelligence[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.saturation.get(selectedDistrict || undefined);
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedDistrict]);

  const alertColors: Record<string, { bg: string; border: string; text: string; dot: string }> = {
    LOW: { bg: 'var(--green-50)', border: 'var(--green-200)', text: 'var(--green-700)', dot: 'var(--green-500)' },
    OPTIMAL: { bg: 'var(--blue-50)', border: 'var(--blue-400)', text: 'var(--blue-600)', dot: 'var(--blue-500)' },
    HIGH: { bg: 'var(--amber-50)', border: 'var(--amber-200)', text: 'var(--amber-600)', dot: 'var(--amber-500)' },
    CRITICAL: { bg: 'var(--red-50)', border: 'var(--red-400)', text: 'var(--red-600)', dot: 'var(--red-500)' },
  };

  const actionEmoji: Record<string, string> = { PLANT: '✅', AVOID: '⛔', MONITOR: '👁️' };

  return (
    <div className="animate-fadeInUp">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800 }}>
            District Crop Intelligence 🧠
          </h1>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.875rem', marginTop: 4 }}>
            Real-time saturation analysis to prevent market crashes
          </p>
        </div>
        <div className="input-group" style={{ width: 200 }}>
          <select className="input select" value={selectedDistrict} onChange={e => setSelectedDistrict(e.target.value)}>
            <option value="">All Districts</option>
            {['Coimbatore', 'Erode', 'Tiruppur', 'Salem', 'Trichy', 'Madurai'].map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-3xl)', color: 'var(--slate-400)' }}>
          <p style={{ fontSize: '2rem' }}>🧠</p>
          <p>Analyzing crop saturation data...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
          {data.map(district => (
            <div key={district.district} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* District Header */}
              <div style={{
                padding: 'var(--space-md) var(--space-lg)',
                background: 'linear-gradient(135deg, var(--green-800), var(--green-900))',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 700 }}>
                    📍 {district.district} District
                  </h3>
                  <p style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                    Updated {new Date(district.lastUpdated).toLocaleString()}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  {district.metrics.filter(m => m.alertLevel === 'CRITICAL').length > 0 && (
                    <span className="badge badge-red">⚠ CRITICAL ALERTS</span>
                  )}
                </div>
              </div>

              {/* Crop Grid */}
              <div style={{ padding: 'var(--space-lg)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-md)' }}>
                  {district.metrics.map(metric => {
                    const colors = alertColors[metric.alertLevel] || alertColors.LOW;
                    return (
                      <div key={metric.cropName} style={{
                        padding: 'var(--space-md)',
                        borderRadius: 'var(--radius-md)',
                        background: colors.bg,
                        border: `1px solid ${colors.border}`,
                        transition: 'all var(--transition-base)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{metric.cropName}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors.dot }} />
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: colors.text }}>{metric.alertLevel}</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ height: 8, borderRadius: 4, background: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: `${Math.min(metric.saturationPercentage, 120)}%`,
                              maxWidth: '100%',
                              borderRadius: 4,
                              background: colors.dot,
                              transition: 'width 0.5s'
                            }} />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: '0.75rem', color: 'var(--slate-600)' }}>
                          <span>📊 {metric.saturationPercentage}% saturated</span>
                          <span>👨‍🌾 {metric.contributingFarmers} farmers</span>
                          <span>📦 Demand: {(metric.totalDemandKg / 1000).toFixed(1)}T</span>
                          <span>🌱 Committed: {(metric.totalCommitmentKg / 1000).toFixed(1)}T</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Recommendations */}
                <div style={{ marginTop: 'var(--space-lg)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-md)' }}>
                  <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-sm)' }}>
                    🎯 Planting Recommendations
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {district.recommendations.map(rec => (
                      <div key={rec.cropName} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                        background: rec.action === 'AVOID' ? 'var(--red-50)' : rec.action === 'MONITOR' ? 'var(--amber-50)' : 'var(--green-50)',
                        fontSize: '0.8125rem'
                      }}>
                        <span>{actionEmoji[rec.action]}</span>
                        <span style={{ fontWeight: 600 }}>{rec.cropName}</span>
                        <span style={{ color: 'var(--slate-500)' }}>— {rec.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DistrictSaturation;
