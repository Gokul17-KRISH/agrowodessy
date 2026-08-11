import React from 'react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  userRole: string;
}

interface RoleTheme {
  background: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  activeBg: string;
  activeText: string;
  indicatorBg: string;
  logoBg: string;
  roleTitle: string;
  roleSubtext: string;
  glow: string;
  accentBorder: string;
}

const roleThemes: Record<string, RoleTheme> = {
  ADMIN: {
    background: 'linear-gradient(180deg, #090d16 0%, #111827 30%, #1e1b4b 70%, #0f172a 100%)',
    badgeBg: 'rgba(99, 102, 241, 0.25)',
    badgeBorder: 'rgba(129, 140, 248, 0.4)',
    badgeText: '#c7d2fe',
    activeBg: 'linear-gradient(90deg, rgba(99, 102, 241, 0.32) 0%, rgba(139, 92, 246, 0.2) 100%)',
    activeText: '#a5b4fc',
    indicatorBg: 'linear-gradient(180deg, #818cf8, #c084fc)',
    logoBg: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #c084fc 100%)',
    roleTitle: '🛡️ Admin Command Center',
    roleSubtext: 'Escrow & System Control',
    glow: '0 0 20px rgba(129, 140, 248, 0.4)',
    accentBorder: 'rgba(129, 140, 248, 0.25)'
  },
  FARMER: {
    background: 'linear-gradient(180deg, #022c22 0%, #064e3b 50%, #0f172a 100%)',
    badgeBg: 'rgba(16, 185, 129, 0.2)',
    badgeBorder: 'rgba(52, 211, 153, 0.35)',
    badgeText: '#6ee7b7',
    activeBg: 'linear-gradient(90deg, rgba(16, 185, 129, 0.28) 0%, rgba(5, 150, 105, 0.15) 100%)',
    activeText: '#34d399',
    indicatorBg: 'linear-gradient(180deg, #34d399, #10b981)',
    logoBg: 'linear-gradient(135deg, #059669, #10b981)',
    roleTitle: '🌱 Farmer Console',
    roleSubtext: 'Pre-Sowing Contract Hub',
    glow: '0 0 15px rgba(16, 185, 129, 0.4)',
    accentBorder: 'rgba(52, 211, 153, 0.2)'
  },
  BUYER: {
    background: 'linear-gradient(180deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)',
    badgeBg: 'rgba(59, 130, 246, 0.2)',
    badgeBorder: 'rgba(96, 165, 250, 0.35)',
    badgeText: '#93c5fd',
    activeBg: 'linear-gradient(90deg, rgba(59, 130, 246, 0.28) 0%, rgba(37, 99, 235, 0.15) 100%)',
    activeText: '#60a5fa',
    indicatorBg: 'linear-gradient(180deg, #60a5fa, #3b82f6)',
    logoBg: 'linear-gradient(135deg, #2563eb, #3b82f6)',
    roleTitle: '🏪 Buyer Console',
    roleSubtext: 'Corporate Procurement',
    glow: '0 0 15px rgba(59, 130, 246, 0.4)',
    accentBorder: 'rgba(96, 165, 250, 0.2)'
  },
  GRADER: {
    background: 'linear-gradient(180deg, #1c1917 0%, #78350f 50%, #0f172a 100%)',
    badgeBg: 'rgba(245, 158, 11, 0.2)',
    badgeBorder: 'rgba(251, 191, 36, 0.35)',
    badgeText: '#fde047',
    activeBg: 'linear-gradient(90deg, rgba(245, 158, 11, 0.28) 0%, rgba(217, 119, 6, 0.15) 100%)',
    activeText: '#fbbf24',
    indicatorBg: 'linear-gradient(180deg, #fbbf24, #f59e0b)',
    logoBg: 'linear-gradient(135deg, #d97706, #f59e0b)',
    roleTitle: '⚖️ Quality Grader Desk',
    roleSubtext: 'Assaying Certification Node',
    glow: '0 0 15px rgba(245, 158, 11, 0.4)',
    accentBorder: 'rgba(251, 191, 36, 0.2)'
  }
};

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, isOpen, onToggle, userRole }) => {
  const theme = roleThemes[userRole] || roleThemes.FARMER;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', roles: ['FARMER', 'BUYER', 'GRADER', 'ADMIN'] },
    { id: 'marketplace', label: 'Demand Board', icon: '🏪', roles: ['FARMER', 'BUYER', 'ADMIN'] },
    { id: 'saturation', label: 'Crop Intel', icon: '🧠', roles: ['FARMER', 'BUYER', 'ADMIN'] },
    { id: 'deliveries', label: 'Deliveries', icon: '🚚', roles: ['FARMER', 'BUYER', 'GRADER', 'ADMIN'] },
    { id: 'notifications', label: 'Notifications', icon: '🔔', roles: ['FARMER', 'BUYER', 'GRADER', 'ADMIN'] },
  ];

  const visibleItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <aside style={{
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      width: isOpen ? 260 : 68,
      background: theme.background,
      boxShadow: '4px 0 24px rgba(0, 0, 0, 0.25)',
      transition: 'width var(--transition-base), background var(--transition-base)',
      zIndex: 'var(--z-sticky)' as any,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      borderRight: `1px solid ${theme.accentBorder}`
    }}>
      {/* Brand Header */}
      <div style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: isOpen ? 'space-between' : 'center',
        padding: isOpen ? '0 1.25rem' : '0',
        borderBottom: `1px solid ${theme.accentBorder}`,
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: theme.logoBg,
            boxShadow: theme.glow,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 900,
            flexShrink: 0
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.4 19 2c1 2 2 4.1 2 7 0 6-4.5 11-10 11Z"/>
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
            </svg>
          </div>
          {isOpen && (
            <div style={{ lineHeight: 1.1 }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.4rem',
                fontWeight: 900,
                color: '#ffffff',
                whiteSpace: 'nowrap',
                letterSpacing: '-0.03em'
              }}>
                AGROW
              </span>
              <span style={{
                display: 'block',
                fontSize: '0.62rem',
                fontWeight: 700,
                color: theme.badgeText,
                letterSpacing: '0.08em',
                textTransform: 'uppercase'
              }}>
                Pre-Sowing Protocol
              </span>
            </div>
          )}
        </div>

        {/* Sidebar Toggle Button */}
        {isOpen && (
          <button
            onClick={onToggle}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: `1px solid ${theme.accentBorder}`,
              color: 'rgba(255, 255, 255, 0.7)',
              borderRadius: 8,
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title="Collapse Sidebar"
          >
            ◀
          </button>
        )}
      </div>

      {/* Role Console Banner */}
      {isOpen && (
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: `1px solid ${theme.accentBorder}`,
        }}>
          <div style={{
            padding: '10px 14px',
            borderRadius: 12,
            background: theme.badgeBg,
            border: `1px solid ${theme.badgeBorder}`,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
            backdropFilter: 'blur(4px)'
          }}>
            <div style={{
              fontSize: '0.78rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              color: theme.badgeText,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              {theme.roleTitle}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.6)', marginTop: 2, fontWeight: 500 }}>
              {theme.roleSubtext}
            </div>
          </div>
        </div>
      )}

      {/* Navigation List */}
      <nav style={{ flex: 1, padding: '0.75rem 0.6rem', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
        {visibleItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: isOpen ? '12px 16px' : '12px 10px',
                justifyContent: isOpen ? 'flex-start' : 'center',
                borderRadius: 14,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                background: isActive ? theme.activeBg : 'transparent',
                color: isActive ? theme.activeText : 'rgba(255,255,255,0.6)',
                border: isActive ? `1px solid ${theme.badgeBorder}` : '1px solid transparent',
                boxShadow: isActive ? theme.glow : 'none',
                cursor: 'pointer',
                fontSize: '0.92rem',
                fontWeight: isActive ? 700 : 500,
                width: '100%',
                position: 'relative'
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)';
                  (e.currentTarget as HTMLElement).style.color = '#ffffff';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)';
                }
              }}
              title={isOpen ? undefined : item.label}
            >
              {isActive && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 4,
                  height: 24,
                  borderRadius: '0 4px 4px 0',
                  background: theme.indicatorBg
                }} />
              )}
              <span style={{
                fontSize: '1.25rem',
                flexShrink: 0,
                filter: isActive ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' : 'none'
              }}>
                {item.icon}
              </span>
              {isOpen && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer System Info */}
      {isOpen ? (
        <div style={{
          padding: '1rem 1.25rem',
          borderTop: `1px solid ${theme.accentBorder}`,
          background: 'rgba(0,0,0,0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <p style={{ fontSize: '0.7rem', color: '#ffffff', fontWeight: 800, margin: 0 }}>
              AGROW Command v2.4
            </p>
            <p style={{ fontSize: '0.62rem', color: theme.badgeText, margin: '2px 0 0', fontWeight: 600 }}>
              🟢 Bank Escrow Active
            </p>
          </div>
        </div>
      ) : (
        <div style={{ padding: '0.75rem 0', textAlign: 'center', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={onToggle}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: `1px solid ${theme.accentBorder}`,
              color: 'rgba(255, 255, 255, 0.7)',
              borderRadius: 8,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
            title="Expand Sidebar"
          >
            ▶
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
