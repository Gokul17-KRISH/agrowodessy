import React, { useState } from 'react';
import { User } from '../../types';
import { api } from '../../services/api';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

type AuthMode = 'login' | 'register' | 'forgot_email' | 'forgot_otp' | 'forgot_success';

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('Coimbatore');
  const [role, setRole] = useState('FARMER');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot Password State
  const [resetEmail, setResetEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'register') {
        const res = await api.auth.register({ name, email, password, confirmPassword, phone, district, role });
        onLogin(res.user);
      } else if (mode === 'login') {
        const res = await api.auth.login(email, password);
        onLogin(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!resetEmail) {
      setError('Please enter your registered email address.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setMode('forgot_otp');
      setSuccessMsg(`Verification code dispatched to ${resetEmail}. (Use Demo OTP: 123456)`);
    }, 800);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter a valid 6-digit OTP code.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setEmail(resetEmail);
      setPassword(newPassword);
      setMode('forgot_success');
    }, 1000);
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setError('');
    setLoading(true);
    try {
      const res = await api.auth.login(demoEmail, 'demo1234');
      onLogin(res.user);
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'linear-gradient(135deg, #052e16 0%, #064e3b 35%, #047857 70%, #15803d 100%)',
      fontFamily: 'var(--font-body)'
    }}>
      {/* Left Column – Needs & Necessity Showcase */}
      <div style={{
        flex: 1.2,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '3rem 4rem',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow Effects */}
        <div style={{ position: 'absolute', top: -100, right: -100, width: 450, height: 450, borderRadius: '50%', background: 'rgba(34, 197, 94, 0.15)', filter: 'blur(100px)' }} />
        <div style={{ position: 'absolute', bottom: -50, left: -50, width: 350, height: 350, borderRadius: '50%', background: 'rgba(251, 191, 36, 0.12)', filter: 'blur(80px)' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 620 }}>
          {/* Logo Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(16,185,129,0.4)'
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.4 19 2c1 2 2 4.1 2 7 0 6-4.5 11-10 11Z"/>
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
              </svg>
            </div>
            <div>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em', color: '#ffffff' }}>AGROW</span>
              <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.15)', color: '#a7f3d0', padding: '2px 8px', borderRadius: 8, marginLeft: 8, fontWeight: 700 }}>Agri-FinTech Protocol</span>
            </div>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.75rem',
            fontWeight: 900,
            lineHeight: 1.15,
            marginBottom: '1rem',
            color: '#ffffff'
          }}>
            Protect Farmers.<br />
            <span style={{ color: '#6ee7b7' }}>Contract Before Planting.</span>
          </h1>

          <p style={{ fontSize: '1.05rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', marginBottom: '2rem' }}>
            Traditional farming forces smallholders to sow on guesswork and face 40% post-harvest price crashes. AGROW guarantees pre-sowing contracts backed by 100% bank escrow.
          </p>

          {/* Necessity Feature Showcase Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '1.2rem' }}>
              <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>🛡️</div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff' }}>Zero Distress Selling</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginTop: 4, lineHeight: 1.4 }}>
                Lock minimum buyback price prior to purchasing seeds & fertilizers.
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '1.2rem' }}>
              <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>🔒</div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff' }}>100% Bank Escrow</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginTop: 4, lineHeight: 1.4 }}>
                Buyers deposit full funds upfront into escrow prior to land allocation.
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '1.2rem' }}>
              <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>🌾</div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff' }}>FPO Collective Scale</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginTop: 4, lineHeight: 1.4 }}>
                Small farmers aggregate acreage to command corporate bulk rates (+24% margin).
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '1.2rem' }}>
              <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>⚠️</div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff' }}>Glut Prevention Radar</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginTop: 4, lineHeight: 1.4 }}>
                State-wide intelligence prevents district over-sowing & price crashes.
              </div>
            </div>
          </div>

          {/* Social Proof Stats */}
          <div style={{
            display: 'flex',
            gap: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(255,255,255,0.15)'
          }}>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fde047' }}>₹14.8 Cr+</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>Bank Escrow Locked</div>
            </div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#6ee7b7' }}>4,250 Acres</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>Pooled Land Area</div>
            </div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#38bdf8' }}>100% Zero</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>Buyer Default Guarantee</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column – Interactive Auth / Forgot Password Form */}
      <div style={{
        width: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem',
        background: '#ffffff',
        borderTopLeftRadius: 36,
        borderBottomLeftRadius: 36,
        boxShadow: '-24px 0 80px rgba(0,0,0,0.2)'
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* 1. LOGIN & REGISTER MODE */}
          {(mode === 'login' || mode === 'register') && (
            <>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.8rem',
                fontWeight: 900,
                marginBottom: 6,
                color: '#0f172a'
              }}>
                {mode === 'register' ? 'Join AGROW Protocol 🌱' : 'Welcome Back 👋'}
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem' }}>
                {mode === 'register' ? 'Register your FPO, land, or buyer entity' : 'Sign in to manage escrow & pre-sowing contracts'}
              </p>

              {error && (
                <div style={{
                  padding: '12px 16px',
                  background: '#fef2f2',
                  border: '1px solid #fca5a5',
                  borderRadius: 12,
                  color: '#dc2626',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                  fontWeight: 600
                }}>
                  ⚠️ {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {mode === 'register' && (
                  <>
                    <div className="input-group">
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Full Name / FPO Title</label>
                      <input className="input" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Gopalakrishnan R. (Farmer Lead)" required />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="input-group">
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Role</label>
                        <select className="input select" value={role} onChange={e => setRole(e.target.value)}>
                          <option value="FARMER">🌱 Farmer / FPO</option>
                          <option value="BUYER">🏪 Corporate Buyer</option>
                          <option value="GRADER">⚖️ Quality Assayer</option>
                        </select>
                      </div>
                      <div className="input-group">
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>District</label>
                        <select className="input select" value={district} onChange={e => setDistrict(e.target.value)}>
                          {['Coimbatore', 'Erode', 'Tiruppur', 'Salem', 'Trichy', 'Madurai', 'Nashik', 'Guntur', 'Kolar'].map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="input-group">
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Phone Number</label>
                      <input className="input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 94432 89012" />
                    </div>
                  </>
                )}

                <div className="input-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Email Address</label>
                  <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@agrow.com" required />
                </div>

                <div className="input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Password</label>
                    {mode === 'login' && (
                      <span
                        onClick={() => { setMode('forgot_email'); setError(''); setResetEmail(email); }}
                        style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Forgot Password?
                      </span>
                    )}
                  </div>
                  <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={8} />
                </div>

                {mode === 'register' && (
                  <div className="input-group">
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Confirm Password</label>
                    <input className="input" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" required />
                  </div>
                )}

                <button type="submit" className="btn" disabled={loading} style={{
                  width: '100%',
                  marginTop: '0.5rem',
                  background: '#10b981',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '1rem',
                  padding: '14px',
                  borderRadius: 14,
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(16,185,129,0.3)'
                }}>
                  {loading ? '⏳ Verifying Credentials...' : mode === 'register' ? 'Create AGROW Account →' : 'Sign In to Console →'}
                </button>
              </form>

              {/* Quick Demo Selector */}
              <div style={{ textAlign: 'center', margin: '1.25rem 0 0.75rem', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                — One-Click Demo Access —
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <button onClick={() => handleDemoLogin('farmer@agrilink.demo')} disabled={loading} className="btn" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', fontSize: '0.78rem', fontWeight: 700, padding: '8px' }}>
                  🌱 Farmer
                </button>
                <button onClick={() => handleDemoLogin('buyer@agrilink.demo')} disabled={loading} className="btn" style={{ background: '#f0f9ff', color: '#075985', border: '1px solid #bae6fd', fontSize: '0.78rem', fontWeight: 700, padding: '8px' }}>
                  🏪 Buyer
                </button>
                <button onClick={() => handleDemoLogin('grader@agrilink.demo')} disabled={loading} className="btn" style={{ background: '#fffbeb', color: '#78350f', border: '1px solid #fde68a', fontSize: '0.78rem', fontWeight: 700, padding: '8px' }}>
                  ⚖️ Grader
                </button>
              </div>

              <p style={{ textAlign: 'center', fontSize: '0.85rem', marginTop: '1.5rem', color: '#64748b' }}>
                {mode === 'register' ? 'Already have an account?' : "Don't have an account?"}{' '}
                <span onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError(''); }} style={{ color: '#10b981', fontWeight: 800, cursor: 'pointer' }}>
                  {mode === 'register' ? 'Sign In' : 'Sign Up Free'}
                </span>
              </p>
            </>
          )}

          {/* 2. FORGOT PASSWORD STEP 1: EMAIL INPUT */}
          {mode === 'forgot_email' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <button onClick={() => setMode('login')} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '4px 10px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                  ← Back to Login
                </button>
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 900, color: '#0f172a' }}>
                Reset Password 🔑
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem' }}>
                Enter your registered email address to receive a secure 6-digit verification code.
              </p>

              {error && (
                <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12, color: '#dc2626', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 600 }}>
                  ⚠️ {error}
                </div>
              )}

              <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="input-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Registered Email Address</label>
                  <input
                    className="input"
                    type="email"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    placeholder="farmer@agrilink.demo"
                    required
                  />
                </div>

                <button type="submit" className="btn" disabled={loading} style={{ background: '#0284c7', color: '#ffffff', fontWeight: 800, fontSize: '1rem', padding: '14px', borderRadius: 14, border: 'none' }}>
                  {loading ? '⏳ Sending Verification Code...' : 'Send Verification OTP →'}
                </button>
              </form>
            </div>
          )}

          {/* 3. FORGOT PASSWORD STEP 2: OTP & NEW PASSWORD */}
          {mode === 'forgot_otp' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <button onClick={() => setMode('forgot_email')} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '4px 10px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                  ← Change Email
                </button>
              </div>

              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 900, color: '#0f172a' }}>
                Verify & Set Password 🔒
              </h2>

              {successMsg && (
                <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, color: '#166534', fontSize: '0.82rem', marginBottom: '1rem', fontWeight: 600 }}>
                  ✅ {successMsg}
                </div>
              )}

              {error && (
                <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12, color: '#dc2626', fontSize: '0.82rem', marginBottom: '1rem', fontWeight: 600 }}>
                  ⚠️ {error}
                </div>
              )}

              <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>6-Digit OTP Code</label>
                    <span onClick={() => setOtpCode('123456')} style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 800, cursor: 'pointer' }}>⚡ Auto-fill 123456</span>
                  </div>
                  <input
                    className="input"
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value)}
                    placeholder="123456"
                    style={{ letterSpacing: '0.2em', fontSize: '1.1rem', fontWeight: 800, textAlign: 'center' }}
                    required
                  />
                </div>

                <div className="input-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>New Password</label>
                  <input
                    className="input"
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                  />
                </div>

                <div className="input-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Confirm New Password</label>
                  <input
                    className="input"
                    type="password"
                    value={confirmNewPassword}
                    onChange={e => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                  />
                </div>

                <button type="submit" className="btn" disabled={loading} style={{ background: '#10b981', color: '#ffffff', fontWeight: 800, fontSize: '1rem', padding: '14px', borderRadius: 14, border: 'none', marginTop: '0.5rem' }}>
                  {loading ? '⏳ Updating Password...' : 'Reset & Confirm Password →'}
                </button>
              </form>
            </div>
          )}

          {/* 4. FORGOT PASSWORD STEP 3: SUCCESS CONFIRMATION */}
          {mode === 'forgot_success' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: 12 }}>🎉</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 900, color: '#0f172a' }}>
                Password Updated!
              </h2>
              <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '0.75rem 0 1.5rem', lineHeight: 1.5 }}>
                Your AGROW account password for <strong style={{ color: '#0f172a' }}>{resetEmail}</strong> has been successfully updated.
              </p>

              <button
                onClick={() => setMode('login')}
                className="btn"
                style={{ width: '100%', background: '#10b981', color: '#ffffff', fontWeight: 800, fontSize: '1rem', padding: '14px', borderRadius: 14, border: 'none' }}
              >
                Sign In with New Password →
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
