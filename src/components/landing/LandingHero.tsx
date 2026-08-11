import React, { useState } from 'react';

interface LandingHeroProps {
  onEnter: (role?: 'FARMER' | 'BUYER' | 'GRADER') => void;
}

const LandingHero: React.FC<LandingHeroProps> = ({ onEnter }) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Interactive District Glut Simulator State
  const [simDistrict, setSimDistrict] = useState<'Coimbatore' | 'Nashik' | 'Guntur' | 'Mandya'>('Coimbatore');
  const [simCrop, setSimCrop] = useState<'Tomato' | 'Red Onion' | 'Cotton' | 'Yellow Maize' | 'Green Chilli'>('Tomato');

  // Interactive Architecture Stepper State
  const [activeStep, setActiveStep] = useState<number>(1);

  // Interactive Console Preview Role State
  const [previewRole, setPreviewRole] = useState<'FARMER' | 'BUYER' | 'GRADER'>('FARMER');

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  // Mock data for District Glut Simulator
  const districtData = {
    Coimbatore: {
      Tomato: { price: 28, demand: '180 Tonnes', committed: '78 Tonnes', saturation: 43, status: 'SAFE', color: '#10b981', advice: 'Low saturation risk. Safe to lock acreage and plant now.' },
      'Red Onion': { price: 34, demand: '120 Tonnes', committed: '115 Tonnes', saturation: 96, status: 'GLUT_ALERT', color: '#ef4444', advice: '⚠️ High Glut Risk! 96% district capacity filled. Diversify to Maize or Chilli.' },
      Cotton: { price: 68, demand: '300 Tonnes', committed: '180 Tonnes', saturation: 60, status: 'MODERATE', color: '#f59e0b', advice: 'Moderate demand remaining. Pool acreage with local FPOs.' },
      'Yellow Maize': { price: 22, demand: '400 Tonnes', committed: '140 Tonnes', saturation: 35, status: 'HIGH_DEMAND', color: '#0284c7', advice: 'Strong corporate buyer backing. High price stability.' },
      'Green Chilli': { price: 45, demand: '90 Tonnes', committed: '40 Tonnes', saturation: 44, status: 'SAFE', color: '#10b981', advice: 'Healthy buyer escrow deposit. Safe contract window.' }
    },
    Nashik: {
      Tomato: { price: 24, demand: '250 Tonnes', committed: '235 Tonnes', saturation: 94, status: 'GLUT_ALERT', color: '#ef4444', advice: '⚠️ District Market Glut Warning! Switch to Cotton or Maize to avoid crash.' },
      'Red Onion': { price: 38, demand: '500 Tonnes', committed: '290 Tonnes', saturation: 58, status: 'SAFE', color: '#10b981', advice: 'Major retail buyback active. 42% allocation remaining.' },
      Cotton: { price: 72, demand: '200 Tonnes', committed: '80 Tonnes', saturation: 40, status: 'SAFE', color: '#10b981', advice: 'Excellent export contract price locked in escrow.' },
      'Yellow Maize': { price: 21, demand: '350 Tonnes', committed: '90 Tonnes', saturation: 26, status: 'HIGH_DEMAND', color: '#0284c7', advice: 'Poultry feed processor contracts open for pooling.' },
      'Green Chilli': { price: 48, demand: '110 Tonnes', committed: '88 Tonnes', saturation: 80, status: 'MODERATE', color: '#f59e0b', advice: 'Approaching capacity. Complete contract locking quickly.' }
    },
    Guntur: {
      Tomato: { price: 26, demand: '140 Tonnes', committed: '50 Tonnes', saturation: 36, status: 'SAFE', color: '#10b981', advice: 'High buyer interest for food processing unit.' },
      'Red Onion': { price: 32, demand: '160 Tonnes', committed: '70 Tonnes', saturation: 44, status: 'SAFE', color: '#10b981', advice: 'Steady escrow backing locked.' },
      Cotton: { price: 75, demand: '600 Tonnes', committed: '480 Tonnes', saturation: 80, status: 'MODERATE', color: '#f59e0b', advice: 'Large spinning mill contract 80% filled.' },
      'Yellow Maize': { price: 23, demand: '280 Tonnes', committed: '95 Tonnes', saturation: 34, status: 'HIGH_DEMAND', color: '#0284c7', advice: 'Recommended alternative for high net margin.' },
      'Green Chilli': { price: 52, demand: '450 Tonnes', committed: '430 Tonnes', saturation: 95, status: 'GLUT_ALERT', color: '#ef4444', advice: '⚠️ District Chilli Glut Warning! Consider Maize or Tomato.' }
    },
    Mandya: {
      Tomato: { price: 30, demand: '210 Tonnes', committed: '100 Tonnes', saturation: 48, status: 'SAFE', color: '#10b981', advice: 'Bangalore supermarket supply contract active.' },
      'Red Onion': { price: 36, demand: '150 Tonnes', committed: '60 Tonnes', saturation: 40, status: 'SAFE', color: '#10b981', advice: 'Good window for smallholder acreage commitment.' },
      Cotton: { price: 65, demand: '120 Tonnes', committed: '30 Tonnes', saturation: 25, status: 'HIGH_DEMAND', color: '#0284c7', advice: 'Open allocation available.' },
      'Yellow Maize': { price: 24, demand: '310 Tonnes', committed: '120 Tonnes', saturation: 39, status: 'SAFE', color: '#10b981', advice: 'Solid price guarantee in bank escrow.' },
      'Green Chilli': { price: 42, demand: '80 Tonnes', committed: '72 Tonnes', saturation: 90, status: 'GLUT_ALERT', color: '#ef4444', advice: '⚠️ High regional saturation alert.' }
    }
  };

  const currentSim = districtData[simDistrict][simCrop];

  const faqList = [
    {
      cat: "PLATFORM CONCEPT",
      q: "What is AGROW and how does it differ from traditional agricultural market apps?",
      a: "AGROW is a demand-first agricultural platform. Traditional platforms list produce after harvest when prices may collapse due to regional market gluts. AGROW enables corporate buyers and retail chains to post binding purchase contracts before seeds are planted, backed 100% by bank escrow."
    },
    {
      cat: "FINANCIAL SECURITY",
      q: "How does Bank Escrow protect farmers and buyers?",
      a: "When a buyer posts a pre-harvest contract, 100% of the contract value is locked into a secure bank escrow account. Farmers cultivate knowing the funds are guaranteed. Once a certified grader inspects the produce at farmgate delivery, funds are instantly released to the farmer's bank account."
    },
    {
      cat: "AI INTELLIGENCE",
      q: "What is the District Glut Prevention Engine?",
      a: "The Glut Prevention Engine monitors district-level acreage commitments in real-time. If too many farmers in a district (e.g., Coimbatore) commit to planting the exact same crop, AGROW calculates the regional saturation percentage and alerts farmers to diversify, avoiding catastrophic post-harvest price crashes."
    },
    {
      cat: "SMALLHOLDER POOLING",
      q: "How can 1-acre smallholders fulfill multi-tonne corporate contracts?",
      a: "AGROW features a Collective Supply Pooling engine. Micro-farmers in the same region can pool their individual yield capacity (e.g., 5 smallholders combining to deliver 10,000 kg of tomatoes), allowing smallholders to access lucrative corporate procurement contracts without middlemen."
    },
    {
      cat: "QUALITY ASSURANCE",
      q: "Who handles quality grading and dispute resolution?",
      a: "Independent certified agricultural graders inspect produce at farmgate or regional collection hubs. Graders test parameters like moisture content, size grading, and purity, uploading digital audit reports that trigger automated escrow payout."
    }
  ];

  return (
    <div style={{ background: '#fafaf9', color: '#0f172a', minHeight: '100vh', overflowX: 'hidden' }}>
      
      {/* 1. TOP NAVIGATION HEADER — GLASSMORPHISM WITH VIBRANT BADGE */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid #e2e8f0',
        padding: '0.85rem 5%'
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Brand Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => onEnter()}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.4 19 2c1 2 2 4.1 2 7 0 6-4.5 11-10 11Z"/>
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
              </svg>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.45rem', fontWeight: 900, color: '#064e3b', letterSpacing: '-0.03em' }}>
                  AGROW
                </span>
                <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: 10 }}>
                  DEMAND-FIRST
                </span>
              </div>
              <span style={{ display: 'block', fontSize: '0.65rem', color: '#0284c7', fontWeight: 700, letterSpacing: '0.06em', marginTop: -2 }}>
                PRE-HARVEST CONTRACTING PLATFORM
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '2rem' }} className="desktop-nav">
            <a href="#about-overview" style={{ color: '#334155', fontSize: '0.875rem', fontWeight: 700, transition: 'color 0.2s' }}>
              Overview
            </a>
            <a href="#glut-simulator" style={{ color: '#334155', fontSize: '0.875rem', fontWeight: 700, transition: 'color 0.2s' }}>
              <span style={{ color: '#0284c7' }}>●</span> District Simulator
            </a>
            <a href="#paradigm-shift" style={{ color: '#334155', fontSize: '0.875rem', fontWeight: 700, transition: 'color 0.2s' }}>
              Why AGROW
            </a>
            <a href="#how-it-works" style={{ color: '#334155', fontSize: '0.875rem', fontWeight: 700, transition: 'color 0.2s' }}>
              Architecture
            </a>
            <a href="#ecosystem-preview" style={{ color: '#334155', fontSize: '0.875rem', fontWeight: 700, transition: 'color 0.2s' }}>
              Portal Console
            </a>
            <a href="#faq" style={{ color: '#334155', fontSize: '0.875rem', fontWeight: 700, transition: 'color 0.2s' }}>
              FAQ
            </a>
          </nav>

          {/* Action CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button 
              onClick={() => onEnter('FARMER')}
              className="btn btn-outline btn-sm"
              style={{ fontSize: '0.85rem', fontWeight: 700, borderColor: '#cbd5e1', color: '#0f172a' }}
            >
              Sign In
            </button>
            <button 
              onClick={() => onEnter()}
              className="btn btn-secondary btn-sm"
              style={{
                fontWeight: 800,
                padding: '0.6rem 1.3rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: 'none',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
              }}
            >
              Launch Console →
            </button>
          </div>

        </div>
      </header>

      {/* 2. VIBRANT MULTI-COLOR HERO SECTION */}
      <section style={{
        background: 'linear-gradient(180deg, #f0fdf4 0%, #e0f2fe 50%, #ffffff 100%)',
        color: '#0f172a',
        position: 'relative',
        padding: '4.5rem 5% 5rem',
        overflow: 'hidden'
      }}>
        {/* Soft Decorative Ambient Color Glow Spheres */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '5%',
          width: '550px',
          height: '550px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, rgba(255, 255, 255, 0) 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '5%',
          left: '-5%',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, rgba(255, 255, 255, 0) 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          top: '30%',
          left: '35%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(2, 132, 199, 0.12) 0%, rgba(255, 255, 255, 0) 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '3.5rem', alignItems: 'center', position: 'relative', zIndex: 10 }}>
          
          {/* Hero Left Content */}
          <div>
            
            {/* Multi-color Pill Tags */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              <span style={{ background: '#dcfce7', color: '#15803d', padding: '5px 14px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 800, border: '1px solid #bbf7d0' }}>
                🌾 Demand-First Agri
              </span>
              <span style={{ background: '#fef3c7', color: '#b45309', padding: '5px 14px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 800, border: '1px solid #fde68a' }}>
                🔒 100% Bank Escrow
              </span>
              <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '5px 14px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 800, border: '1px solid #bae6fd' }}>
                📊 District Glut AI
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(2.7rem, 4.5vw, 4rem)',
              fontWeight: 900,
              color: '#064e3b',
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
              marginBottom: '1.25rem'
            }}>
              Sell Before You Plant.<br />
              <span style={{
                background: 'linear-gradient(135deg, #059669 0%, #0284c7 60%, #4f46e5 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Eliminate Agri Market Risk.
              </span>
            </h1>

            <p style={{
              fontSize: '1.15rem',
              lineHeight: 1.7,
              color: '#334155',
              marginBottom: '2.25rem',
              maxWidth: 580
            }}>
              <strong>AGROW</strong> connects farmers directly with corporate buyers & retailers <strong>before sowing</strong>. Lock guaranteed purchase prices in bank escrow, prevent regional crop gluts with district AI, and eliminate middleman commissions.
            </p>

            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
              <button
                onClick={() => onEnter('FARMER')}
                className="btn btn-lg"
                style={{
                  fontWeight: 800,
                  padding: '0.95rem 2.25rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  boxShadow: '0 8px 22px rgba(16, 185, 129, 0.3)',
                  border: 'none'
                }}
              >
                Access Farmer Portal →
              </button>
              <button
                onClick={() => onEnter('BUYER')}
                className="btn btn-lg"
                style={{
                  fontWeight: 800,
                  padding: '0.95rem 2rem',
                  background: '#ffffff',
                  color: '#0369a1',
                  border: '2px solid #bae6fd',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.1)'
                }}
              >
                Corporate Procurement →
              </button>
            </div>

            {/* COLORFUL IMPACT METRICS TICKER */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1.25rem',
              paddingTop: '2rem',
              borderTop: '1px solid #cbd5e1'
            }}>
              <div style={{ background: '#ffffff', padding: '14px', borderRadius: 14, border: '1px solid #dcfce7', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#10b981' }}>100%</div>
                <div style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 700, marginTop: 2 }}>Escrow Bank Guarantee</div>
              </div>
              <div style={{ background: '#ffffff', padding: '14px', borderRadius: 14, border: '1px solid #fde68a', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#d97706' }}>₹14.8 Cr</div>
                <div style={{ fontSize: '0.78rem', color: '#b45309', fontWeight: 700, marginTop: 2 }}>Pre-Harvest Escrow Locked</div>
              </div>
              <div style={{ background: '#ffffff', padding: '14px', borderRadius: 14, border: '1px solid #bae6fd', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#0284c7' }}>48 Districts</div>
                <div style={{ fontSize: '0.78rem', color: '#0369a1', fontWeight: 700, marginTop: 2 }}>Glut Sensing Active</div>
              </div>
            </div>

          </div>

          {/* Hero Right: HERO VISUAL HERO & DYNAMIC CYCLE CARD */}
          <div style={{ position: 'relative' }}>
            <div style={{
              borderRadius: 24,
              overflow: 'hidden',
              boxShadow: '0 24px 50px rgba(6, 78, 59, 0.16)',
              border: '2px solid #bbf7d0',
              background: '#ffffff',
              position: 'relative'
            }}>
              <img
                src="https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=1000&q=80"
                alt="Farmers harvesting crop under bright sunlight"
                style={{
                  width: '100%',
                  height: '470px',
                  objectFit: 'cover'
                }}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(6, 78, 59, 0.05) 0%, rgba(6, 78, 59, 0.65) 100%)'
              }} />

              {/* DYNAMIC MULTI-COLOR OVERLAY CARD */}
              <div style={{
                position: 'absolute',
                bottom: 18,
                left: 18,
                right: 18,
                background: 'rgba(255, 255, 255, 0.97)',
                backdropFilter: 'blur(20px)',
                borderRadius: 18,
                padding: '1.35rem',
                border: '1px solid #bae6fd',
                boxShadow: '0 12px 30px rgba(0,0,0,0.12)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0284c7', letterSpacing: '0.08em' }}>
                    THE AGROW DEMAND-FIRST CYCLE
                  </div>
                  <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.65rem', fontWeight: 800, padding: '3px 8px', borderRadius: 8 }}>
                    ● LIVE MODEL
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, textAlign: 'center' }}>
                  <div style={{ background: '#f0fdf4', padding: '12px 8px', borderRadius: 12, border: '1px solid #bbf7d0' }}>
                    <div style={{ fontSize: '1.2rem', marginBottom: 2 }}>📝</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#064e3b' }}>1. Lock Contract</div>
                    <div style={{ fontSize: '0.65rem', color: '#059669' }}>Escrow Deposit</div>
                  </div>
                  <div style={{ background: '#fffbeb', padding: '12px 8px', borderRadius: 12, border: '1px solid #fde68a' }}>
                    <div style={{ fontSize: '1.2rem', marginBottom: 2 }}>🌱</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#92400e' }}>2. Plant & Pool</div>
                    <div style={{ fontSize: '0.65rem', color: '#d97706' }}>Zero Glut Risk</div>
                  </div>
                  <div style={{ background: '#f0f9ff', padding: '12px 8px', borderRadius: 12, border: '1px solid #bae6fd' }}>
                    <div style={{ fontSize: '1.2rem', marginBottom: 2 }}>💳</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#075985' }}>3. Graded Pay</div>
                    <div style={{ fontSize: '0.65rem', color: '#0284c7' }}>Instant Release</div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 3. NEW INTERACTIVE WIDGET: LIVE DISTRICT GLUT & SATURATION RISK SIMULATOR */}
      <section id="glut-simulator" style={{ padding: '5.5rem 5%', background: '#ffffff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto 3rem' }}>
            <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.8rem', fontWeight: 800, padding: '4px 14px', borderRadius: 20, letterSpacing: '0.08em' }}>
              INTERACTIVE DEMO WIDGET
            </span>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 900, marginTop: '0.6rem', color: '#064e3b' }}>
              Test The AGROW District Glut & Saturation AI Engine
            </h2>
            <p style={{ color: '#475569', fontSize: '1.05rem', marginTop: '0.75rem' }}>
              Select a district and crop below to simulate how AGROW prevents price crashes by calculating regional capacity saturation in real-time.
            </p>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #f0fdf4 100%)',
            borderRadius: 24,
            padding: '2.5rem',
            border: '2px solid #bbf7d0',
            boxShadow: '0 12px 36px rgba(0,0,0,0.06)'
          }}>
            
            {/* Control Selectors */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#064e3b', marginBottom: 8 }}>
                  1. SELECT AGRICULTURAL DISTRICT:
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(['Coimbatore', 'Nashik', 'Guntur', 'Mandya'] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setSimDistrict(d)}
                      style={{
                        padding: '10px 18px',
                        borderRadius: 12,
                        fontSize: '0.9rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: simDistrict === d ? '2px solid #10b981' : '1px solid #cbd5e1',
                        background: simDistrict === d ? '#10b981' : '#ffffff',
                        color: simDistrict === d ? '#ffffff' : '#334155',
                        boxShadow: simDistrict === d ? '0 4px 12px rgba(16, 185, 129, 0.25)' : 'none'
                      }}
                    >
                      📍 {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#064e3b', marginBottom: 8 }}>
                  2. SELECT INTENDED CROP:
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(['Tomato', 'Red Onion', 'Cotton', 'Yellow Maize', 'Green Chilli'] as const).map((c) => (
                    <button
                      key={c}
                      onClick={() => setSimCrop(c)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 12,
                        fontSize: '0.9rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: simCrop === c ? '2px solid #0284c7' : '1px solid #cbd5e1',
                        background: simCrop === c ? '#0284c7' : '#ffffff',
                        color: simCrop === c ? '#ffffff' : '#334155',
                        boxShadow: simCrop === c ? '0 4px 12px rgba(2, 132, 199, 0.25)' : 'none'
                      }}
                    >
                      🌾 {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Dynamic Results Display */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
              
              <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>ESCROW BUYER PRICE</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#059669', marginTop: 4 }}>
                  ₹{currentSim.price}<span style={{ fontSize: '1rem', color: '#64748b' }}>/kg</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700, marginTop: 4 }}>✓ Locked in Bank Escrow</div>
              </div>

              <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>TOTAL CORPORATE DEMAND</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0284c7', marginTop: 4 }}>
                  {currentSim.demand}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#0369a1', fontWeight: 700, marginTop: 4 }}>Contracted Procurement</div>
              </div>

              <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>COMMITTED ACREAGE YIELD</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#d97706', marginTop: 4 }}>
                  {currentSim.committed}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 700, marginTop: 4 }}>Pooled Farmer Yield</div>
              </div>

              <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: 16, border: `2px solid ${currentSim.color}` }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>DISTRICT SATURATION</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: currentSim.color, marginTop: 4 }}>
                  {currentSim.saturation}%
                </div>
                {/* Meter Bar */}
                <div style={{ height: 6, background: '#e2e8f0', borderRadius: 10, marginTop: 6, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${currentSim.saturation}%`, background: currentSim.color, borderRadius: 10 }}></div>
                </div>
              </div>

            </div>

            {/* Smart Advice Banner */}
            <div style={{
              background: currentSim.status === 'GLUT_ALERT' ? '#fef2f2' : currentSim.status === 'HIGH_DEMAND' ? '#f0f9ff' : '#f0fdf4',
              border: `1.5px solid ${currentSim.color}`,
              borderRadius: 16,
              padding: '1.25rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem'
            }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: currentSim.color, letterSpacing: '0.06em' }}>
                  AGROW AI DISTRICT SENSING RECOMMENDATION:
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                  {currentSim.advice}
                </div>
              </div>
              <button
                onClick={() => onEnter('FARMER')}
                className="btn btn-sm"
                style={{ background: currentSim.color, color: '#ffffff', fontWeight: 800, borderRadius: 10, padding: '10px 18px', border: 'none', whiteSpace: 'nowrap' }}
              >
                Commit Acreage Now →
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* 4. PARADIGM SHIFT: TRADITIONAL VS AGROW */}
      <section id="paradigm-shift" style={{ padding: '6rem 5%', background: '#fafaf9' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 4rem' }}>
            <span style={{ background: '#fef3c7', color: '#b45309', fontSize: '0.8rem', fontWeight: 800, padding: '4px 14px', borderRadius: 20, letterSpacing: '0.08em' }}>
              PARADIGM SHIFT
            </span>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '0.6rem', color: '#064e3b' }}>
              Traditional Speculative Farming vs AGROW Demand-First
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
            
            {/* Traditional System */}
            <div style={{ background: '#ffffff', padding: '2.5rem', borderRadius: 24, border: '2px solid #fee2e2', boxShadow: '0 6px 20px rgba(239, 68, 68, 0.05)' }}>
              <div style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 20, background: '#fef2f2', color: '#dc2626', fontSize: '0.8rem', fontWeight: 800, marginBottom: '1.25rem' }}>
                🛑 TRADITIONAL SPECULATIVE FARMING
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#991b1b', marginBottom: '1.25rem' }}>
                High Financial Vulnerability & Price Collapse
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <li style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: '0.95rem', color: '#450a0a' }}>
                  <span style={{ color: '#ef4444', fontWeight: 900, fontSize: '1.1rem' }}>✕</span>
                  <div><strong>Blind Planting:</strong> Farmers plant based on last year's prices, causing regional crop gluts and severe price crashes.</div>
                </li>
                <li style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: '0.95rem', color: '#450a0a' }}>
                  <span style={{ color: '#ef4444', fontWeight: 900, fontSize: '1.1rem' }}>✕</span>
                  <div><strong>Middleman Exploitation:</strong> Commission agents cut 25-40% of farmer revenue through hidden charges.</div>
                </li>
                <li style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: '0.95rem', color: '#450a0a' }}>
                  <span style={{ color: '#ef4444', fontWeight: 900, fontSize: '1.1rem' }}>✕</span>
                  <div><strong>Post-Harvest Panic:</strong> Perishable produce must be sold immediately at distress prices.</div>
                </li>
                <li style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: '0.95rem', color: '#450a0a' }}>
                  <span style={{ color: '#ef4444', fontWeight: 900, fontSize: '1.1rem' }}>✕</span>
                  <div><strong>Corporate Supply Shocks:</strong> Food processors suffer from erratic quality and extreme price spikes.</div>
                </li>
              </ul>
            </div>

            {/* AGROW Demand-First System */}
            <div style={{ background: '#ffffff', padding: '2.5rem', borderRadius: 24, border: '2px solid #bbf7d0', boxShadow: '0 8px 30px rgba(16, 185, 129, 0.08)' }}>
              <div style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 20, background: '#f0fdf4', color: '#15803d', fontSize: '0.8rem', fontWeight: 800, marginBottom: '1.25rem' }}>
                ✨ THE AGROW DEMAND-FIRST MODEL
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#064e3b', marginBottom: '1.25rem' }}>
                Guaranteed Pre-Harvest Escrow & Planned Yield
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <li style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: '0.95rem', color: '#064e3b' }}>
                  <span style={{ color: '#10b981', fontWeight: 900, fontSize: '1.1rem' }}>✓</span>
                  <div><strong>Demand Before Seeds:</strong> Purchase price, quantity, and delivery window locked in escrow before tilling land.</div>
                </li>
                <li style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: '0.95rem', color: '#064e3b' }}>
                  <span style={{ color: '#10b981', fontWeight: 900, fontSize: '1.1rem' }}>✓</span>
                  <div><strong>Direct Escrow Payout:</strong> 100% funds locked in bank escrow, released straight to farmer accounts.</div>
                </li>
                <li style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: '0.95rem', color: '#064e3b' }}>
                  <span style={{ color: '#10b981', fontWeight: 900, fontSize: '1.1rem' }}>✓</span>
                  <div><strong>District Saturation Guard:</strong> Real-time acreage alerts notify farmers when a crop hits capacity limit.</div>
                </li>
                <li style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: '0.95rem', color: '#064e3b' }}>
                  <span style={{ color: '#10b981', fontWeight: 900, fontSize: '1.1rem' }}>✓</span>
                  <div><strong>Certified Quality Grading:</strong> Independent assaying ensures objective pricing based on actual parameters.</div>
                </li>
              </ul>
            </div>

          </div>

        </div>
      </section>

      {/* 5. INTERACTIVE PROCESS ARCHITECTURE STEPPER */}
      <section id="how-it-works" style={{ padding: '6rem 5%', background: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 3.5rem' }}>
            <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.8rem', fontWeight: 800, padding: '4px 14px', borderRadius: 20, letterSpacing: '0.08em' }}>
              PLATFORM WORKFLOW
            </span>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#064e3b', marginTop: '0.6rem' }}>
              4-Step End-To-End Architecture
            </h2>
          </div>

          {/* Interactive Step Selector Tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2.5rem' }}>
            {[
              { num: 1, title: "1. Buyer Posts Demand", color: "#4f46e5", bg: "#e0e7ff" },
              { num: 2, title: "2. Farmers Commit & Pool", color: "#10b981", bg: "#dcfce7" },
              { num: 3, title: "3. District Glut Check", color: "#d97706", bg: "#fef3c7" },
              { num: 4, title: "4. Quality Grading & Pay", color: "#0284c7", bg: "#e0f2fe" }
            ].map((step) => (
              <button
                key={step.num}
                onClick={() => setActiveStep(step.num)}
                style={{
                  padding: '1.25rem 1rem',
                  borderRadius: 16,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.25s',
                  border: activeStep === step.num ? `2px solid ${step.color}` : '1px solid #e2e8f0',
                  background: activeStep === step.num ? step.bg : '#ffffff',
                  boxShadow: activeStep === step.num ? '0 6px 18px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: step.color }}>STEP 0{step.num}</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{step.title}</div>
              </button>
            ))}
          </div>

          {/* Step Detail Display Box */}
          <div style={{
            background: activeStep === 1 ? '#f5f3ff' : activeStep === 2 ? '#f0fdf4' : activeStep === 3 ? '#fffbeb' : '#f0f9ff',
            border: `2px solid ${activeStep === 1 ? '#c7d2fe' : activeStep === 2 ? '#bbf7d0' : activeStep === 3 ? '#fde68a' : '#bae6fd'}`,
            borderRadius: 24,
            padding: '2.5rem',
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.8fr',
            gap: '2.5rem',
            alignItems: 'center'
          }}>
            <div>
              {activeStep === 1 && (
                <>
                  <span style={{ background: '#4f46e5', color: '#ffffff', fontSize: '0.75rem', fontWeight: 800, padding: '4px 12px', borderRadius: 10 }}>CORPORATE DEMAND INITIATION</span>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#312e81', marginTop: '1rem' }}>Buyer Deposits 100% Escrow & Defines Contract Terms</h3>
                  <p style={{ color: '#4338ca', fontSize: '1.05rem', lineHeight: 1.7, marginTop: '1rem' }}>
                    Institutional buyers (supermarket chains, food processors, spice exporters) create pre-harvest contracts. They specify crop parameters, delivery dates, volume, and deposit funds into bank escrow.
                  </p>
                  <div style={{ marginTop: '1.5rem', display: 'flex', gap: 12 }}>
                    <span style={{ background: '#ffffff', color: '#4f46e5', padding: '8px 14px', borderRadius: 10, fontSize: '0.85rem', fontWeight: 700, border: '1px solid #c7d2fe' }}>✓ Binding Pre-Harvest Price</span>
                    <span style={{ background: '#ffffff', color: '#4f46e5', padding: '8px 14px', borderRadius: 10, fontSize: '0.85rem', fontWeight: 700, border: '1px solid #c7d2fe' }}>✓ Escrow Verified</span>
                  </div>
                </>
              )}

              {activeStep === 2 && (
                <>
                  <span style={{ background: '#10b981', color: '#ffffff', fontSize: '0.75rem', fontWeight: 800, padding: '4px 12px', borderRadius: 10 }}>SMALLHOLDER SUPPLY POOLING</span>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#064e3b', marginTop: '1rem' }}>Farmers Commit Acreage & Form Collective Clusters</h3>
                  <p style={{ color: '#047857', fontSize: '1.05rem', lineHeight: 1.7, marginTop: '1rem' }}>
                    Smallholder farmers browse verified contracts in their district. 1-acre farmers pool their yield capacity together (e.g. 10 farmers combining to deliver 20 Tonnes), guaranteeing smallholder participation in corporate supply chains.
                  </p>
                  <div style={{ marginTop: '1.5rem', display: 'flex', gap: 12 }}>
                    <span style={{ background: '#ffffff', color: '#059669', padding: '8px 14px', borderRadius: 10, fontSize: '0.85rem', fontWeight: 700, border: '1px solid #bbf7d0' }}>✓ Acreage Allocation</span>
                    <span style={{ background: '#ffffff', color: '#059669', padding: '8px 14px', borderRadius: 10, fontSize: '0.85rem', fontWeight: 700, border: '1px solid #bbf7d0' }}>✓ FPO Group Pooling</span>
                  </div>
                </>
              )}

              {activeStep === 3 && (
                <>
                  <span style={{ background: '#d97706', color: '#ffffff', fontSize: '0.75rem', fontWeight: 800, padding: '4px 12px', borderRadius: 10 }}>REAL-TIME DISTRICT AI</span>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#78350f', marginTop: '1rem' }}>Glut Sensing Alerts Farmers Before Overproduction</h3>
                  <p style={{ color: '#b45309', fontSize: '1.05rem', lineHeight: 1.7, marginTop: '1rem' }}>
                    AGROW’s district saturation engine aggregates committed land across all farmers in a region. If a district reaches 100%+ of demand, automated alerts notify farmers to shift to alternate high-demand crops.
                  </p>
                  <div style={{ marginTop: '1.5rem', display: 'flex', gap: 12 }}>
                    <span style={{ background: '#ffffff', color: '#d97706', padding: '8px 14px', borderRadius: 10, fontSize: '0.85rem', fontWeight: 700, border: '1px solid #fde68a' }}>✓ Glut Prevention</span>
                    <span style={{ background: '#ffffff', color: '#d97706', padding: '8px 14px', borderRadius: 10, fontSize: '0.85rem', fontWeight: 700, border: '1px solid #fde68a' }}>✓ Crop Diversification</span>
                  </div>
                </>
              )}

              {activeStep === 4 && (
                <>
                  <span style={{ background: '#0284c7', color: '#ffffff', fontSize: '0.75rem', fontWeight: 800, padding: '4px 12px', borderRadius: 10 }}>AUTOMATED ESCROW PAYOUT</span>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#075985', marginTop: '1rem' }}>Certified Quality Assaying Triggers Direct Payment</h3>
                  <p style={{ color: '#0369a1', fontSize: '1.05rem', lineHeight: 1.7, marginTop: '1rem' }}>
                    At harvest, certified independent assayers inspect produce moisture, size, and purity at farmgate depots. Digital quality reports automatically unlock escrow funds directly to farmer bank accounts.
                  </p>
                  <div style={{ marginTop: '1.5rem', display: 'flex', gap: 12 }}>
                    <span style={{ background: '#ffffff', color: '#0284c7', padding: '8px 14px', borderRadius: 10, fontSize: '0.85rem', fontWeight: 700, border: '1px solid #bae6fd' }}>✓ Farmgate Delivery</span>
                    <span style={{ background: '#ffffff', color: '#0284c7', padding: '8px 14px', borderRadius: 10, fontSize: '0.85rem', fontWeight: 700, border: '1px solid #bae6fd' }}>✓ Instant Bank Payout</span>
                  </div>
                </>
              )}
            </div>

            <div style={{ background: '#ffffff', padding: '1.75rem', borderRadius: 18, border: '1px solid #cbd5e1', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 10 }}>ARCHITECTURE SNAPSHOT</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 10, fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                  🔒 Escrow Contract: <span style={{ color: '#10b981' }}>Verified Bank Escrow</span>
                </div>
                <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 10, fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                  📡 AI Glut Monitoring: <span style={{ color: '#0284c7' }}>Real-Time District Acreage</span>
                </div>
                <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 10, fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                  ⚖️ Assaying Standard: <span style={{ color: '#d97706' }}>Certified Assayer Protocol</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 6. INTERACTIVE CONSOLE ROLE PREVIEW SWITCHER */}
      <section id="ecosystem-preview" style={{ padding: '6rem 5%', background: '#fafaf9' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 3rem' }}>
            <span style={{ background: '#e0e7ff', color: '#4338ca', fontSize: '0.8rem', fontWeight: 800, padding: '4px 14px', borderRadius: 20, letterSpacing: '0.08em' }}>
              PORTAL CONSOLE PREVIEW
            </span>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '0.6rem', color: '#064e3b' }}>
              Role-Based Workflows Built For Scale
            </h2>
            <p style={{ color: '#475569', fontSize: '1.05rem', marginTop: '0.5rem' }}>
              Click below to preview the dedicated console environments available inside AGROW:
            </p>
          </div>

          {/* Role Switcher Tabs */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
            {[
              { id: 'FARMER', label: '👨‍🌾 Farmer & FPO Portal', color: '#10b981', bg: '#f0fdf4' },
              { id: 'BUYER', label: '🏢 Corporate Buyer Console', color: '#0284c7', bg: '#f0f9ff' },
              { id: 'GRADER', label: '⚖️ Quality Grader Hub', color: '#d97706', bg: '#fffbeb' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPreviewRole(tab.id as any)}
                style={{
                  padding: '12px 24px',
                  borderRadius: 14,
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: previewRole === tab.id ? `2px solid ${tab.color}` : '1px solid #cbd5e1',
                  background: previewRole === tab.id ? tab.color : '#ffffff',
                  color: previewRole === tab.id ? '#ffffff' : '#334155',
                  boxShadow: previewRole === tab.id ? '0 6px 18px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Role Console Dynamic Preview Box */}
          <div style={{
            background: '#ffffff',
            borderRadius: 24,
            border: '2px solid #e2e8f0',
            padding: '2.5rem',
            boxShadow: '0 12px 32px rgba(0,0,0,0.05)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '3rem',
            alignItems: 'center'
          }}>
            {previewRole === 'FARMER' && (
              <>
                <div>
                  <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.75rem', fontWeight: 800, padding: '4px 12px', borderRadius: 10 }}>FARMER & FPO CONSOLE</span>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#064e3b', marginTop: '0.75rem' }}>Browse Escrow Contracts & Commit Acreage</h3>
                  <p style={{ color: '#475569', fontSize: '1rem', lineHeight: 1.65, marginTop: '0.75rem' }}>
                    Farmers browse active corporate demand in their district, check price guarantees, lock acreage allocations, and monitor escrow payout milestones in real time.
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '1.25rem 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <li style={{ display: 'flex', gap: 8, fontSize: '0.9rem', color: '#064e3b', fontWeight: 700 }}>✓ Guaranteed Pre-Sowing Buyback Price</li>
                    <li style={{ display: 'flex', gap: 8, fontSize: '0.9rem', color: '#064e3b', fontWeight: 700 }}>✓ Collective Yield Pooling with FPO Members</li>
                    <li style={{ display: 'flex', gap: 8, fontSize: '0.9rem', color: '#064e3b', fontWeight: 700 }}>✓ Automated District Glut Warning System</li>
                  </ul>
                  <button onClick={() => onEnter('FARMER')} className="btn" style={{ background: '#10b981', color: '#ffffff', fontWeight: 800, padding: '12px 24px', borderRadius: 12, border: 'none' }}>
                    Launch Farmer Console →
                  </button>
                </div>
                <div style={{ background: '#f0fdf4', padding: '1.5rem', borderRadius: 18, border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#15803d', marginBottom: 12 }}>MOCK CONSOLE PREVIEW — FARMER DASHBOARD</div>
                  <div style={{ background: '#ffffff', padding: 14, borderRadius: 12, border: '1px solid #dcfce7', marginBottom: 10 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#064e3b' }}>🍅 Red Tomato (A-Grade Processing)</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>Buyer: Nilgiri Supermarkets Escrow</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#10b981', marginTop: 6 }}>₹28.00 / kg <span style={{ fontSize: '0.75rem', color: '#15803d' }}>(Escrow Verified)</span></div>
                  </div>
                  <div style={{ background: '#ffffff', padding: 14, borderRadius: 12, border: '1px solid #dcfce7' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#064e3b' }}>🌽 Hybrid Yellow Maize</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>Buyer: Godrej Feeds Ltd</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#10b981', marginTop: 6 }}>₹22.50 / kg <span style={{ fontSize: '0.75rem', color: '#15803d' }}>(Escrow Verified)</span></div>
                  </div>
                </div>
              </>
            )}

            {previewRole === 'BUYER' && (
              <>
                <div>
                  <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.75rem', fontWeight: 800, padding: '4px 12px', borderRadius: 10 }}>CORPORATE BUYER CONSOLE</span>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#075985', marginTop: '0.75rem' }}>Post Demand Contracts & Track Supply Clusters</h3>
                  <p style={{ color: '#475569', fontSize: '1rem', lineHeight: 1.65, marginTop: '0.75rem' }}>
                    Corporate buyers and processors post annual procurement requirements, lock funds in bank escrow, track farmer acreage commitments, and manage farmgate logistics.
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '1.25rem 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <li style={{ display: 'flex', gap: 8, fontSize: '0.9rem', color: '#0369a1', fontWeight: 700 }}>✓ Guaranteed Supply Volumes Direct From Source</li>
                    <li style={{ display: 'flex', gap: 8, fontSize: '0.9rem', color: '#0369a1', fontWeight: 700 }}>✓ 100% Transparent Assaying & Grading</li>
                    <li style={{ display: 'flex', gap: 8, fontSize: '0.9rem', color: '#0369a1', fontWeight: 700 }}>✓ Secure Escrow Capital Management</li>
                  </ul>
                  <button onClick={() => onEnter('BUYER')} className="btn" style={{ background: '#0284c7', color: '#ffffff', fontWeight: 800, padding: '12px 24px', borderRadius: 12, border: 'none' }}>
                    Launch Corporate Console →
                  </button>
                </div>
                <div style={{ background: '#f0f9ff', padding: '1.5rem', borderRadius: 18, border: '1px solid #bae6fd' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0369a1', marginBottom: 12 }}>MOCK CONSOLE PREVIEW — CORPORATE BUYER</div>
                  <div style={{ background: '#ffffff', padding: 14, borderRadius: 12, border: '1px solid #bae6fd', marginBottom: 10 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#075985' }}>📜 Contract #AG-2026-904</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>Target: 150 Tonnes Tomato | Coimbatore</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0284c7', marginTop: 6 }}>Bank Escrow Locked: ₹42,00,000</div>
                  </div>
                  <div style={{ background: '#ffffff', padding: 14, borderRadius: 12, border: '1px solid #bae6fd' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#075985' }}>📜 Contract #AG-2026-881</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>Target: 300 Tonnes Maize | Guntur</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0284c7', marginTop: 6 }}>Bank Escrow Locked: ₹67,50,000</div>
                  </div>
                </div>
              </>
            )}

            {previewRole === 'GRADER' && (
              <>
                <div>
                  <span style={{ background: '#fef3c7', color: '#b45309', fontSize: '0.75rem', fontWeight: 800, padding: '4px 12px', borderRadius: 10 }}>QUALITY ASSAYER HUB</span>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#78350f', marginTop: '0.75rem' }}>Upload Farmgate Assaying Reports & Trigger Payouts</h3>
                  <p style={{ color: '#475569', fontSize: '1rem', lineHeight: 1.65, marginTop: '0.75rem' }}>
                    Independent certified agricultural assayers perform quality testing at farmgate depots, uploading moisture, size, and purity parameters to trigger automated escrow settlement.
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '1.25rem 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <li style={{ display: 'flex', gap: 8, fontSize: '0.9rem', color: '#b45309', fontWeight: 700 }}>✓ Standardized Quality Parameter Protocols</li>
                    <li style={{ display: 'flex', gap: 8, fontSize: '0.9rem', color: '#b45309', fontWeight: 700 }}>✓ Digital Audit Certificates & Photo Evidence</li>
                    <li style={{ display: 'flex', gap: 8, fontSize: '0.9rem', color: '#b45309', fontWeight: 700 }}>✓ Automated Escrow Release Signal</li>
                  </ul>
                  <button onClick={() => onEnter('GRADER')} className="btn" style={{ background: '#d97706', color: '#ffffff', fontWeight: 800, padding: '12px 24px', borderRadius: 12, border: 'none' }}>
                    Launch Grader Console →
                  </button>
                </div>
                <div style={{ background: '#fffbeb', padding: '1.5rem', borderRadius: 18, border: '1px solid #fde68a' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#b45309', marginBottom: 12 }}>MOCK CONSOLE PREVIEW — QUALITY GRADER</div>
                  <div style={{ background: '#ffffff', padding: 14, borderRadius: 12, border: '1px solid #fde68a', marginBottom: 10 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#78350f' }}>⚖️ Batch #B-8830 (Farmer: R. Kumar)</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>Grade: A1 Premium | Moisture: 11%</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#d97706', marginTop: 6 }}>Status: Payout Approved (100% Escrow Released)</div>
                  </div>
                  <div style={{ background: '#ffffff', padding: 14, borderRadius: 12, border: '1px solid #fde68a' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#78350f' }}>⚖️ Batch #B-8831 (Farmer: S. Lakshmi)</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>Grade: A2 Standard | Size: 45mm+</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#d97706', marginTop: 6 }}>Status: Pending Assayer Signature</div>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </section>

      {/* 7. FREQUENTLY ASKED QUESTIONS (FAQ) */}
      <section id="faq" style={{ padding: '6rem 5%', background: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.8rem', fontWeight: 800, padding: '4px 14px', borderRadius: 20, letterSpacing: '0.08em' }}>
              PLATFORM FAQS
            </span>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 900, marginTop: '0.6rem', color: '#064e3b' }}>
              Frequently Asked Questions
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {faqList.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div
                  key={index}
                  style={{
                    background: '#ffffff',
                    borderRadius: 16,
                    border: '1px solid #cbd5e1',
                    overflow: 'hidden',
                    transition: 'all 0.2s',
                    boxShadow: isOpen ? '0 4px 14px rgba(0,0,0,0.05)' : 'none'
                  }}
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    style={{
                      width: '100%',
                      padding: '1.25rem 1.5rem',
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      color: '#064e3b'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ background: '#f0fdf4', color: '#15803d', fontSize: '0.68rem', fontWeight: 800, padding: '3px 8px', borderRadius: 8 }}>
                        {faq.cat}
                      </span>
                      <span>{faq.q}</span>
                    </div>
                    <span style={{ fontSize: '1.2rem', color: '#10b981', marginLeft: 12 }}>
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                  {isOpen && (
                    <div style={{ padding: '0 1.5rem 1.5rem', color: '#475569', fontSize: '0.95rem', lineHeight: 1.65, borderTop: '1px solid #f1f5f9' }}>
                      <p style={{ marginTop: '1rem' }}>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 8. CALL TO ACTION BANNER — VIBRANT MULTI-COLOR GRADIENT */}
      <section style={{
        padding: '5.5rem 5%',
        background: 'linear-gradient(135deg, #059669 0%, #0284c7 50%, #4f46e5 100%)',
        color: '#ffffff',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: 850, margin: '0 auto' }}>
          <span style={{ background: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', fontSize: '0.8rem', fontWeight: 800, padding: '4px 14px', borderRadius: 20 }}>
            GET STARTED TODAY
          </span>
          <h2 style={{ fontSize: '2.6rem', fontWeight: 900, marginTop: '1rem', marginBottom: '1rem' }}>
            Transform Speculative Farming Into Guaranteed Prosperity
          </h2>
          <p style={{ fontSize: '1.15rem', color: '#e0f2fe', marginBottom: '2.5rem', lineHeight: 1.6 }}>
            Launch the interactive AGROW platform console to experience pre-harvest contracting, bank escrow verification, and district glut sensing.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => onEnter('FARMER')}
              className="btn btn-lg"
              style={{ fontWeight: 800, padding: '0.95rem 2.5rem', background: '#ffffff', color: '#064e3b', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}
            >
              Enter Farmer Console →
            </button>
            <button
              onClick={() => onEnter('BUYER')}
              className="btn btn-outline-white btn-lg"
              style={{ fontWeight: 800, padding: '0.95rem 2.2rem', borderColor: '#ffffff', color: '#ffffff' }}
            >
              Enter Corporate Console →
            </button>
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer style={{ background: '#064e3b', color: '#ffffff', padding: '4rem 5% 2rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem', paddingBottom: '3rem', borderBottom: '1px solid rgba(255, 255, 255, 0.15)' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 800 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.4 19 2c1 2 2 4.1 2 7 0 6-4.5 11-10 11Z"/>
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
              </svg>
            </div>
            <div>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.03em' }}>
                AGROW
              </span>
              <span style={{ display: 'block', fontSize: '0.65rem', color: '#6ee7b7', fontWeight: 700 }}>
                DEMAND-FIRST AGRI PLATFORM
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem', color: '#a7f3d0' }}>
            <a href="#about-overview" style={{ color: '#a7f3d0' }}>Overview</a>
            <a href="#glut-simulator" style={{ color: '#a7f3d0' }}>Glut AI Simulator</a>
            <a href="#paradigm-shift" style={{ color: '#a7f3d0' }}>Why AGROW</a>
            <a href="#how-it-works" style={{ color: '#a7f3d0' }}>Architecture</a>
            <a href="#ecosystem-preview" style={{ color: '#a7f3d0' }}>Console Portal</a>
            <a href="#faq" style={{ color: '#a7f3d0' }}>FAQ</a>
          </div>

        </div>

        <div style={{ maxWidth: 1280, margin: '2rem auto 0', display: 'flex', justifyContent: 'space-between', color: '#6ee7b7', fontSize: '0.8rem' }}>
          <div>© 2026 AGROW Platform — Demand-First Agricultural Pre-Harvest Contracting.</div>
          <div>Sell Before You Plant.</div>
        </div>
      </footer>

    </div>
  );
};

export default LandingHero;
