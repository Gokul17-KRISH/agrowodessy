import React from 'react';
import { User } from '../../types';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  onToggleSidebar: () => void;
  unreadNotifications: number;
  onNotificationsClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, onToggleSidebar, unreadNotifications, onNotificationsClick }) => {
  const roleLabels: Record<string, { label: string; emoji: string; color: string }> = {
    FARMER: { label: 'Farmer', emoji: '🌱', color: 'var(--green-600)' },
    BUYER: { label: 'Buyer', emoji: '🏪', color: 'var(--blue-600)' },
    GRADER: { label: 'Grader', emoji: '⚖️', color: 'var(--amber-600)' },
    ADMIN: { label: 'Admin', emoji: '🛡️', color: '#6366f1' },
  };

  const roleInfo = roleLabels[user.role] || roleLabels.FARMER;

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      right: 0,
      left: 0,
      height: 64,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 var(--space-xl)',
      background: 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--color-border)',
      zIndex: 'var(--z-sticky)' as any,
    }}>
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        <button
          onClick={onToggleSidebar}
          className="btn btn-ghost btn-icon"
          style={{ fontSize: '1.25rem' }}
          aria-label="Toggle sidebar"
        >
          ☰
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            background: 'var(--agrow-forest-900)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--agrow-leaf-400)',
            fontWeight: 800,
            fontSize: '1.1rem'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.4 19 2c1 2 2 4.1 2 7 0 6-4.5 11-10 11Z"/>
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
            </svg>
          </div>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.35rem',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            color: 'var(--agrow-forest-950)'
          }}>
            AGROW
          </span>
        </div>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        {/* Notifications */}
        <button
          onClick={onNotificationsClick}
          className="btn btn-ghost btn-icon"
          style={{ position: 'relative', fontSize: '1.125rem' }}
          aria-label="Notifications"
        >
          🔔
          {unreadNotifications > 0 && (
            <span style={{
              position: 'absolute',
              top: 2,
              right: 2,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: 'var(--red-500)',
              color: 'white',
              fontSize: '0.625rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid white'
            }}>
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          )}
        </button>

        {/* User Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: `2px solid ${roleInfo.color}`,
            overflow: 'hidden'
          }}>
            <img
              src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=16A34A&color=fff`}
              alt={user.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{user.name}</div>
            <div style={{ fontSize: '0.6875rem', color: roleInfo.color, fontWeight: 600 }}>
              {roleInfo.emoji} {roleInfo.label}
              {user.district && <span style={{ color: 'var(--slate-400)', fontWeight: 400 }}> · {user.district}</span>}
            </div>
          </div>
        </div>

        <button onClick={onLogout} className="btn btn-ghost btn-sm" style={{ color: 'var(--slate-400)' }}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
