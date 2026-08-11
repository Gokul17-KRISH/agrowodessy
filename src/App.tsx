import React, { useState, useEffect, useCallback } from 'react';
import { User, DemandContract, CropCommitment, Delivery, Notification, SystemMetrics } from './types';
import { api } from './services/api';
import LoginPage from './components/auth/LoginPage';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import LandingHero from './components/landing/LandingHero';
import FarmerDashboard from './components/dashboard/FarmerDashboard';
import BuyerDashboard from './components/dashboard/BuyerDashboard';
import GraderDashboard from './components/dashboard/GraderDashboard';
import DistrictSaturation from './components/dashboard/DistrictSaturation';
import DeliveryTracker from './components/dashboard/DeliveryTracker';
import DemandMarketplace from './components/dashboard/DemandMarketplace';

type ViewTab = 'dashboard' | 'marketplace' | 'saturation' | 'deliveries' | 'notifications';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');
  const [demands, setDemands] = useState<DemandContract[]>([]);
  const [commitments, setCommitments] = useState<CropCommitment[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLanding, setShowLanding] = useState(true);

  // Check auth on mount
  useEffect(() => {
    const token = localStorage.getItem('agrilink_token');
    if (token) {
      api.auth.getMe()
        .then(res => {
          setUser(res.user);
          setShowLanding(false);
        })
        .catch(() => {
          localStorage.removeItem('agrilink_token');
        })
        .finally(() => setAuthChecked(true));
    } else {
      setAuthChecked(true);
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [demandsRes, commitmentsRes, deliveriesRes, notifRes, metricsRes] = await Promise.allSettled([
        api.demands.list(),
        api.commitments.list(),
        api.deliveries.list(),
        api.notifications.list(),
        api.metrics.get()
      ]);

      if (demandsRes.status === 'fulfilled') setDemands(demandsRes.value.data);
      if (commitmentsRes.status === 'fulfilled') setCommitments(commitmentsRes.value.data);
      if (deliveriesRes.status === 'fulfilled') setDeliveries(deliveriesRes.value.data);
      if (notifRes.status === 'fulfilled') setNotifications(notifRes.value.data);
      if (metricsRes.status === 'fulfilled') setMetrics(metricsRes.value.data);
    } catch (err) {
      console.error('[App] Data fetch error:', err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchData]);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setShowLanding(false);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    api.auth.logout().catch(() => {});
    setUser(null);
    setShowLanding(true);
    setDemands([]);
    setCommitments([]);
    setDeliveries([]);
    setNotifications([]);
    setMetrics(null);
  };

  const handleEnterApp = () => {
    setShowLanding(false);
  };

  // Landing page
  if (showLanding && !user) {
    return <LandingHero onEnter={handleEnterApp} />;
  }

  // Login + Registration
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Authenticated App Shell
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        if (user.role === 'BUYER') return <BuyerDashboard user={user} demands={demands} commitments={commitments} deliveries={deliveries} metrics={metrics} onRefresh={fetchData} />;
        if (user.role === 'GRADER') return <GraderDashboard user={user} commitments={commitments} deliveries={deliveries} onRefresh={fetchData} />;
        return <FarmerDashboard user={user} demands={demands} commitments={commitments} deliveries={deliveries} metrics={metrics} onRefresh={fetchData} />;
      case 'marketplace':
        return <DemandMarketplace user={user} demands={demands} onRefresh={fetchData} />;
      case 'saturation':
        return <DistrictSaturation />;
      case 'deliveries':
        return <DeliveryTracker user={user} deliveries={deliveries} onRefresh={fetchData} />;
      case 'notifications':
        return (
          <div className="animate-fadeInUp" style={{ maxWidth: 700 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: 'var(--space-lg)' }}>Notifications</h2>
            {notifications.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--slate-400)' }}>
                <span style={{ fontSize: '2rem' }}>🔔</span>
                <p style={{ marginTop: 'var(--space-sm)' }}>No notifications yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {notifications.map(n => (
                  <div key={n.id} className="card" style={{
                    padding: 'var(--space-md)',
                    borderLeft: `3px solid ${n.isRead ? 'var(--slate-200)' : 'var(--green-500)'}`,
                    opacity: n.isRead ? 0.7 : 1
                  }} onClick={() => {
                    if (!n.isRead) {
                      api.notifications.markRead(n.id).then(fetchData);
                    }
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.875rem' }}>{n.title}</strong>
                      <span className={`badge badge-${n.type === 'DEMAND' ? 'green' : n.type === 'ESCROW' ? 'amber' : 'blue'}`}>{n.type}</span>
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--slate-500)', marginTop: 4 }}>{n.message}</p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--slate-50)' }}>
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as ViewTab)}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        userRole={user.role}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: sidebarOpen ? 260 : 64, transition: 'margin-left var(--transition-base)' }}>
        <Header
          user={user}
          onLogout={handleLogout}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          unreadNotifications={unreadCount}
          onNotificationsClick={() => setActiveTab('notifications')}
        />
        <main style={{ flex: 1, padding: 'var(--space-xl)', paddingTop: 'calc(64px + var(--space-xl))' }}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
