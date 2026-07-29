import React, { useState, useEffect } from 'react';
import { Header } from './components/common/Header.js';
import { Sidebar } from './components/common/Sidebar.js';
import { ControlDashboard } from './components/dashboard/ControlDashboard.js';
import { CityMap } from './components/map/CityMap.js';
import { BinManagement } from './components/bins/BinManagement.js';
import { TruckFleet } from './components/trucks/TruckFleet.js';
import { RouteDispatch } from './components/routes/RouteDispatch.js';
import { AgentObservability } from './components/agents/AgentObservability.js';
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard.js';
import { CampaignManager } from './components/campaigns/CampaignManager.js';
import { SimulatorPanel } from './components/simulation/SimulatorPanel.js';
import { AlertsPanel } from './components/alerts/AlertsPanel.js';
import { CitizenReporting } from './components/reports/CitizenReporting.js';
import { LoginPage } from './components/auth/LoginPage.js';
import { api } from './services/api.js';
import {
  Bin,
  Truck,
  Route,
  AgentStatus,
  AgentEvent,
  SystemAlert,
  Campaign,
  UserRole,
  User,
  TrafficEvent,
  RoadClosure,
  CitizenReport,
  CitizenReportStatus
} from './types.js';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentRole, setRole] = useState<UserRole>('DISPATCHER');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showLoginPage, setShowLoginPage] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);

  const [bins, setBins] = useState<Bin[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>([]);
  const [agentEvents, setAgentEvents] = useState<AgentEvent[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [trafficEvents, setTrafficEvents] = useState<TrafficEvent[]>([]);
  const [roadClosures, setRoadClosures] = useState<RoadClosure[]>([]);
  const [citizenReports, setCitizenReports] = useState<CitizenReport[]>([]);

  const [demoActive, setDemoActive] = useState(false);
  const [demoStepInfo, setDemoStepInfo] = useState<{ stepNumber: number; stepName: string; description: string } | null>(null);

  // Authenticate session on startup
  useEffect(() => {
    async function initAuth() {
      try {
        const res = await api.getMe();
        if (res.success && res.user) {
          setCurrentUser(res.user);
          setRole(res.user.role);
          setShowLoginPage(false);
        } else {
          setCurrentUser(null);
          setShowLoginPage(true);
        }
      } catch {
        setCurrentUser(null);
        setShowLoginPage(true);
      } finally {
        setAuthChecking(false);
      }
    }
    initAuth();
  }, []);

  // Enforce role-appropriate tab access
  useEffect(() => {
    if (!currentUser) return;
    const role = currentUser.role;
    const allowedTabsMap: Record<UserRole, string[]> = {
      ADMIN: ['dashboard', 'map', 'bins', 'trucks', 'routes', 'reports', 'agents', 'analytics', 'campaigns', 'alerts', 'simulation'],
      DISPATCHER: ['dashboard', 'map', 'bins', 'trucks', 'routes', 'reports', 'alerts', 'simulation'],
      ANALYST: ['dashboard', 'reports', 'analytics', 'campaigns', 'alerts'],
      USER: ['dashboard', 'campaigns', 'reports', 'alerts']
    };

    const allowed = allowedTabsMap[role] || allowedTabsMap.ADMIN;
    if (!allowed.includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [currentUser, currentRole, activeTab]);

  // Fetch state from API
  const refreshData = async () => {
    try {
      const [binsRes, trucksRes, routesRes, campRes, agentsRes, eventsRes, alertsRes, trafficRes, closureRes, reportsRes] = await Promise.all([
        api.getBins(),
        api.getTrucks(),
        api.getRoutes(),
        api.getCampaigns(),
        api.getAgentStatuses(),
        api.getAgentEvents(),
        api.getAlerts(),
        api.getTraffic(),
        api.getRoadClosures(),
        api.getCitizenReports()
      ]);

      if (binsRes.success) setBins(binsRes.data);
      if (trucksRes.success) setTrucks(trucksRes.data);
      if (routesRes.success) setRoutes(routesRes.data);
      if (campRes.success) setCampaigns(campRes.data);
      if (agentsRes.success) setAgentStatuses(agentsRes.data);
      if (eventsRes.success) setAgentEvents(eventsRes.data);
      if (alertsRes.success) setAlerts(alertsRes.data);
      if (trafficRes.success) setTrafficEvents(trafficRes.data);
      if (closureRes.success) setRoadClosures(closureRes.data);
      if (reportsRes.success) setCitizenReports(reportsRes.data);
    } catch (e) {
      console.warn('[App] Error refreshing data from backend:', e);
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 4000);
    return () => clearInterval(interval);
  }, []);

  // Demo Mode Handler
  const handleStartDemo = async () => {
    setDemoActive(true);
    const res = await api.executeDemoStep();
    if (res.success && res.data) {
      setDemoStepInfo({
        stepNumber: res.data.stepNumber,
        stepName: res.data.stepName,
        description: res.data.description
      });

      // Switch active tab depending on demo step
      if (res.data.stepNumber === 1 || res.data.stepNumber === 2) {
        setActiveTab('bins');
      } else if (res.data.stepNumber === 3 || res.data.stepNumber === 4) {
        setActiveTab('routes');
      } else if (res.data.stepNumber === 5) {
        setActiveTab('map');
      } else if (res.data.stepNumber === 6) {
        setActiveTab('campaigns');
      }
    }
    await refreshData();
  };

  // Actions
  const handleSimulateFill = async (binId: string, delta: number) => {
    await api.simulateBinFill(binId, delta);
    await refreshData();
  };

  const handleScanImage = async (binId: string, imageDescription: string) => {
    await api.scanBinImage(binId, imageDescription);
    await refreshData();
  };

  const handleUpdateWasteType = async (binId: string, wasteType: string, isMixed?: boolean, contaminationDetails?: string) => {
    await api.updateBinWasteType(binId, wasteType, isMixed, contaminationDetails);
    await refreshData();
  };

  const handleApproveRoute = async (routeId: string) => {
    await api.approveRoute(routeId);
    await refreshData();
  };

  const handleRejectRoute = async (routeId: string) => {
    await api.rejectRoute(routeId);
    await refreshData();
  };

  const handleModifyRoute = async (routeId: string, newBinSequence: string[], newTruckId?: string) => {
    await api.modifyRoute(routeId, newBinSequence, newTruckId);
    await refreshData();
  };

  const handleReoptimizeRoute = async (routeId: string) => {
    await api.reoptimizeRoute(routeId);
    await refreshData();
  };

  const handleTriggerOptimization = async () => {
    await api.optimizeRoutes();
    await refreshData();
  };

  const handleGenerateCampaign = async (neighborhood: string, wasteIssue?: string) => {
    await api.generateCampaign(neighborhood, wasteIssue);
    await refreshData();
  };

  const handlePublishCampaign = async (campaignId: string) => {
    await api.publishCampaign(campaignId);
    await refreshData();
  };

  const handleTriggerOrchestration = async () => {
    await api.triggerOrchestration('MANUAL_OPTIMIZE');
    await refreshData();
  };

  const handleSimulateOverflow = async () => {
    await api.simulateOverflow('BIN-005');
    await refreshData();
    setActiveTab('bins');
  };

  const handleSimulateTraffic = async () => {
    await api.simulateTraffic('Gandhipuram');
    await refreshData();
    setActiveTab('map');
  };

  const handleCloseRoad = async () => {
    await api.closeRoad('RS Puram', 'DB Road North Axis');
    await refreshData();
    setActiveTab('map');
  };

  const handleResetSimulation = async () => {
    await api.resetSimulation();
    setDemoStepInfo(null);
    setDemoActive(false);
    await refreshData();
  };

  // Citizen Report Handlers
  const handleCreateCitizenReport = async (reportData: any) => {
    await api.createCitizenReport(reportData);
    await refreshData();
  };

  const handleVoteCitizenReport = async (id: string, direction: 'up' | 'down') => {
    await api.voteCitizenReport(id, direction);
    await refreshData();
  };

  const handleUpdateCitizenReportStatus = async (id: string, status: CitizenReportStatus) => {
    await api.updateCitizenReportStatus(id, status);
    await refreshData();
  };

  const criticalBinsCount = bins.filter(b => b.status === 'CRITICAL').length;
  const pendingRoutesCount = routes.filter(r => r.approvalStatus === 'PENDING_APPROVAL').length;
  const pendingReportsCount = citizenReports.filter(r => r.status === 'PENDING_VERIFICATION').length;

  if (showLoginPage || !currentUser) {
    return (
      <LoginPage
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setRole(user.role);
          setShowLoginPage(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF5EA] text-slate-800 flex flex-col font-sans antialiased selection:bg-amber-600 selection:text-white">
      <Header
        currentRole={currentRole}
        setRole={(role) => {
          setRole(role);
          if (currentUser) {
            setCurrentUser({ ...currentUser, role });
          }
        }}
        currentUser={currentUser}
        onLogout={async () => {
          await api.logout();
          setCurrentUser(null);
          setShowLoginPage(true);
        }}
        onOpenLogin={() => setShowLoginPage(true)}
        alerts={alerts}
        onStartDemo={handleStartDemo}
        demoActive={demoActive}
        demoStepInfo={demoStepInfo}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          criticalBinsCount={criticalBinsCount}
          pendingRoutesCount={pendingRoutesCount}
          pendingReportsCount={pendingReportsCount}
          userRole={currentRole}
        />

        <main className="flex-1 overflow-y-auto bg-[#FAF5EA]">
          {activeTab === 'dashboard' && (
            <ControlDashboard
              bins={bins}
              trucks={trucks}
              routes={routes}
              agentStatuses={agentStatuses}
              agentEvents={agentEvents}
              onQuickSimulateWaste={handleSimulateOverflow}
              onQuickOptimizeRoute={handleTriggerOptimization}
              onQuickGenerateCampaign={() => handleGenerateCampaign('RS Puram')}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'map' && (
            <div className="p-4">
              <CityMap
                bins={bins}
                trucks={trucks}
                routes={routes}
                trafficEvents={trafficEvents}
                roadClosures={roadClosures}
                citizenReports={citizenReports}
                onSelectBin={(b) => console.log('Selected bin', b.binId)}
                onSelectTruck={(t) => console.log('Selected truck', t.truckId)}
              />
            </div>
          )}

          {activeTab === 'bins' && (
            <BinManagement
              bins={bins}
              onSimulateFill={handleSimulateFill}
              onScanImage={handleScanImage}
              onUpdateWasteType={handleUpdateWasteType}
            />
          )}

          {activeTab === 'trucks' && (
            <TruckFleet trucks={trucks} />
          )}

          {activeTab === 'routes' && (
            <RouteDispatch
              routes={routes}
              trucks={trucks}
              currentRole={currentRole}
              onApproveRoute={handleApproveRoute}
              onRejectRoute={handleRejectRoute}
              onModifyRoute={handleModifyRoute}
              onReoptimizeRoute={handleReoptimizeRoute}
              onTriggerOptimization={handleTriggerOptimization}
            />
          )}

          {activeTab === 'reports' && (
            <CitizenReporting
              reports={citizenReports}
              bins={bins}
              onCreateReport={handleCreateCitizenReport}
              onVoteReport={handleVoteCitizenReport}
              onUpdateReportStatus={handleUpdateCitizenReportStatus}
            />
          )}

          {activeTab === 'agents' && (
            <AgentObservability
              agentStatuses={agentStatuses}
              agentEvents={agentEvents}
              onTriggerOrchestration={handleTriggerOrchestration}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsDashboard />
          )}

          {activeTab === 'campaigns' && (
            <CampaignManager
              campaigns={campaigns}
              onGenerateCampaign={handleGenerateCampaign}
              onPublishCampaign={handlePublishCampaign}
            />
          )}

          {activeTab === 'alerts' && (
            <AlertsPanel alerts={alerts} />
          )}

          {activeTab === 'simulation' && (
            <SimulatorPanel
              onSimulateOverflow={handleSimulateOverflow}
              onSimulateTraffic={handleSimulateTraffic}
              onCloseRoad={handleCloseRoad}
              onResetSimulation={handleResetSimulation}
              onStartDemo={handleStartDemo}
            />
          )}
        </main>
      </div>
    </div>
  );
}
