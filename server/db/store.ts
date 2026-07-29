import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  Bin,
  Truck,
  Route,
  WasteHistory,
  Campaign,
  AgentEvent,
  TrafficEvent,
  RoadClosure,
  SystemAlert,
  AgentStatus,
  BinStatus,
  PriorityLevel,
  WasteType,
  User,
  CitizenReport,
  SharedWorkflowState,
  AgentMessage,
  ToolCallLog,
  HumanApprovalRecord
} from '../../src/types.js';
import { COIMBATORE_NEIGHBORHOODS, calculateDistanceKm } from '../config/cityData.js';

class DatabaseStore {
  public bins: Bin[] = [];
  public trucks: Truck[] = [];
  public routes: Route[] = [];
  public wasteHistory: WasteHistory[] = [];
  public campaigns: Campaign[] = [];
  public agentEvents: AgentEvent[] = [];
  public trafficEvents: TrafficEvent[] = [];
  public roadClosures: RoadClosure[] = [];
  public alerts: SystemAlert[] = [];
  public agentStatuses: AgentStatus[] = [];
  public users: User[] = [];
  public citizenReports: CitizenReport[] = [];
  public workflowRuns: SharedWorkflowState[] = [];
  public agentMessages: AgentMessage[] = [];
  public toolCalls: ToolCallLog[] = [];
  public humanApprovals: HumanApprovalRecord[] = [];

  private dataFilePath = path.join(process.cwd(), 'data', 'store.json');

  constructor() {
    this.init();
  }

  private init() {
    // Try reading from JSON file if exists
    try {
      if (fs.existsSync(this.dataFilePath)) {
        const raw = fs.readFileSync(this.dataFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        this.bins = parsed.bins || [];
        this.trucks = parsed.trucks || [];
        this.routes = parsed.routes || [];
        this.wasteHistory = parsed.wasteHistory || [];
        this.campaigns = parsed.campaigns || [];
        this.agentEvents = parsed.agentEvents || [];
        this.trafficEvents = parsed.trafficEvents || [];
        this.roadClosures = parsed.roadClosures || [];
        this.alerts = parsed.alerts || [];
        this.agentStatuses = parsed.agentStatuses || [];
        this.users = parsed.users || [];
        this.citizenReports = parsed.citizenReports || [];
        this.workflowRuns = parsed.workflowRuns || [];
        this.agentMessages = parsed.agentMessages || [];
        this.toolCalls = parsed.toolCalls || [];
        this.humanApprovals = parsed.humanApprovals || [];
        
        if (this.bins.length >= 50 && this.citizenReports.length > 0) {
          this.ensureSystemUsers();
          this.ensureFourAgents();
          console.log(`[Store] Loaded ${this.bins.length} bins, ${this.trucks.length} trucks, ${this.users.length} users, and ${this.citizenReports.length} citizen reports.`);
          return;
        }
      }
    } catch (err) {
      console.warn('[Store] Could not read JSON store, generating initial seed data...', err);
    }

    this.seedData();
    this.ensureSystemUsers();
    this.ensureFourAgents();
    this.saveToDisk();
  }

  public ensureFourAgents() {
    const defaultAgents: AgentStatus[] = [
      {
        id: 'AGT-01',
        name: 'Bin Density & Waste Composition Agent',
        role: 'Density & Composition Specialist',
        status: 'ACTIVE',
        lastAction: 'Monitoring 50 municipal bin sensors & composition profiles',
        latencyMs: 120,
        eventsCount: this.agentEvents.filter(e => e.agentName.includes('Bin')).length
      },
      {
        id: 'AGT-02',
        name: 'Logistics & Dynamic Routing Agent',
        role: 'Dispatch & Route Optimization Specialist',
        status: 'ACTIVE',
        lastAction: 'VRPsolver ready; watching traffic & road closure events',
        latencyMs: 180,
        eventsCount: this.agentEvents.filter(e => e.agentName.includes('Routing') || e.agentName.includes('Logistics')).length
      },
      {
        id: 'AGT-03',
        name: 'Recycling Intelligence & Analytics Agent',
        role: 'Waste Pattern & Contamination Specialist',
        status: 'ACTIVE',
        lastAction: 'Analyzing 30-day zone diversion & anomaly baselines',
        latencyMs: 140,
        eventsCount: this.agentEvents.filter(e => e.agentName.includes('Recycling') || e.agentName.includes('Analytics')).length
      },
      {
        id: 'AGT-04',
        name: 'Civic Campaign & Engagement Agent',
        role: 'Bilingual Civic Behavior Specialist',
        status: 'ACTIVE',
        lastAction: 'Gemini tool ready for Tamil + English campaigns',
        latencyMs: 210,
        eventsCount: this.agentEvents.filter(e => e.agentName.includes('Campaign')).length
      }
    ];

    this.agentStatuses = defaultAgents;
  }

  public ensureSystemUsers() {
    const defaultPasswordHash = bcrypt.hashSync(process.env.DEMO_PASSWORD || 'demo1234', 10);
    const initialAdminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@wastewise.demo';
    const initialAdminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'demo1234';
    const initialAdminHash = bcrypt.hashSync(initialAdminPassword, 10);
    const nowIso = new Date().toISOString();

    const requiredUsers: User[] = [
      {
        id: 'USR-01-DEMO',
        name: 'Municipal Admin',
        email: initialAdminEmail,
        role: 'ADMIN',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        phone: '+91 98765 10002',
        isActive: true,
        isEmailVerified: true,
        createdAt: nowIso,
        updatedAt: nowIso,
        passwordHash: initialAdminHash
      },
      {
        id: 'USR-04-CITIZEN',
        name: 'Citizen User',
        email: 'user@wastewise.demo',
        role: 'USER',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        phone: '+91 98765 10007',
        isActive: true,
        isEmailVerified: true,
        createdAt: nowIso,
        updatedAt: nowIso,
        passwordHash: defaultPasswordHash
      },
      {
        id: 'USR-01',
        name: 'Municipal Admin',
        email: 'admin@wastewise.gov.in',
        role: 'ADMIN',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        phone: '+91 98765 10001',
        isActive: true,
        isEmailVerified: true,
        createdAt: nowIso,
        updatedAt: nowIso,
        passwordHash: defaultPasswordHash
      }
    ];

    for (const reqUser of requiredUsers) {
      const idx = this.users.findIndex(u => u.email.toLowerCase() === reqUser.email.toLowerCase());
      if (idx === -1) {
        this.users.push(reqUser);
      } else {
        // Update passwordHash and roles if missing
        this.users[idx] = {
          ...this.users[idx],
          role: reqUser.role,
          passwordHash: this.users[idx].passwordHash || reqUser.passwordHash,
          isActive: this.users[idx].isActive !== undefined ? this.users[idx].isActive : true
        };
      }
    }
    this.saveToDisk();
  }

  public saveToDisk() {
    try {
      const dir = path.dirname(this.dataFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(
        this.dataFilePath,
        JSON.stringify(
          {
            bins: this.bins,
            trucks: this.trucks,
            routes: this.routes,
            wasteHistory: this.wasteHistory,
            campaigns: this.campaigns,
            agentEvents: this.agentEvents,
            trafficEvents: this.trafficEvents,
            roadClosures: this.roadClosures,
            alerts: this.alerts,
            agentStatuses: this.agentStatuses,
            users: this.users,
            citizenReports: this.citizenReports,
            workflowRuns: this.workflowRuns,
            agentMessages: this.agentMessages,
            toolCalls: this.toolCalls,
            humanApprovals: this.humanApprovals
          },
          null,
          2
        )
      );
    } catch (e) {
      console.warn('[Store] Failed writing persistent store:', e);
    }
  }

  private seedData() {
    console.log('[Store] Seeding initial WasteWise municipal dataset...');

    const wasteTypes: WasteType[] = ['mixed', 'organic', 'plastic', 'paper', 'glass'];

    // 1. Seed Bins (50 bins across 6 neighborhoods)
    let binCounter = 1;
    this.bins = [];

    COIMBATORE_NEIGHBORHOODS.forEach((nh) => {
      // Create 8 to 9 bins per neighborhood
      const count = nh.name === 'Gandhipuram' || nh.name === 'RS Puram' ? 9 : 8;
      for (let i = 0; i < count; i++) {
        // Offset coords slightly around center
        const latOffset = (Math.random() - 0.5) * 0.018;
        const lngOffset = (Math.random() - 0.5) * 0.018;
        
        // Random fill level with a few intentional HIGH and CRITICAL bins for initial demo
        let fillLevel = Math.floor(20 + Math.random() * 65);
        if (binCounter === 5 || binCounter === 18 || binCounter === 34) {
          fillLevel = 94 + Math.floor(Math.random() * 5); // 94-98% Critical
        } else if (binCounter === 12 || binCounter === 27 || binCounter === 42) {
          fillLevel = 84 + Math.floor(Math.random() * 8); // 84-91% High
        }

        const binId = `BIN-${String(binCounter).padStart(3, '0')}`;
        const status = this.getBinStatus(fillLevel);
        const priority = this.getPriority(status);
        const overflowRisk = Math.min(1, Math.round((fillLevel / 100) * (1 + (fillLevel > 80 ? 0.15 : 0)) * 100) / 100);

        // Waste type distribution tailored per neighborhood
        let wasteType: WasteType = wasteTypes[i % wasteTypes.length];
        if (nh.name === 'RS Puram' && i % 2 === 0) wasteType = 'plastic';
        if (nh.name === 'Saibaba Colony' && i % 2 === 0) wasteType = 'organic';
        if (nh.name === 'Peelamedu' && i % 3 === 0) wasteType = 'paper';

        this.bins.push({
          id: binId,
          binId,
          locationName: `${nh.name} Sector ${i + 1}`,
          neighborhood: nh.name,
          lat: Math.round((nh.centerLat + latOffset) * 10000) / 10000,
          lng: Math.round((nh.centerLng + lngOffset) * 10000) / 10000,
          fillLevel,
          wasteType,
          status,
          priority,
          estimatedOverflowRisk: overflowRisk,
          lastUpdated: new Date(Date.now() - Math.floor(Math.random() * 3600000)).toISOString(),
          historicalReadings: Array.from({ length: 6 }).map((_, idx) => ({
            timestamp: new Date(Date.now() - (6 - idx) * 3600000 * 4).toISOString(),
            fillLevel: Math.max(10, Math.min(100, fillLevel - (6 - idx) * 12 + Math.floor(Math.random() * 10 - 5)))
          }))
        });

        binCounter++;
      }
    });

    // 2. Seed Garbage Trucks (10 trucks)
    const driverNames = [
      'Karthik Raja', 'M. Arumugam', 'Senthil Kumar', 'R. Dhanapal', 'P. Murugan',
      'V. Sundaram', 'S. Natarajan', 'G. Balaji', 'K. Elango', 'M. Saravanan'
    ];

    this.trucks = Array.from({ length: 10 }).map((_, idx) => {
      const truckId = `TRK-${String(idx + 1).padStart(2, '0')}`;
      const nh = COIMBATORE_NEIGHBORHOODS[idx % COIMBATORE_NEIGHBORHOODS.length];
      const capacityKg = idx % 2 === 0 ? 5000 : 3500;
      const currentLoadKg = idx === 0 ? 1200 : idx === 3 ? 3100 : Math.floor(capacityKg * (0.1 + Math.random() * 0.4));
      
      return {
        id: truckId,
        truckId,
        driverName: driverNames[idx],
        capacityKg,
        currentLoadKg,
        fuelLevel: 75 + Math.floor(Math.random() * 25),
        currentLat: nh.centerLat + (Math.random() - 0.5) * 0.01,
        currentLng: nh.centerLng + (Math.random() - 0.5) * 0.01,
        status: idx === 0 ? 'IDLE' : idx === 2 ? 'COLLECTING' : 'IDLE',
        assignedRouteId: null
      };
    });

    // 3. Seed Traffic & Road Closures
    this.trafficEvents = [
      {
        id: 'TRAF-101',
        roadName: 'Avinashi Road',
        neighborhood: 'Peelamedu',
        severity: 'HEAVY',
        description: 'Heavy flyover construction traffic slowdown.',
        active: true,
        lat: 11.0250,
        lng: 76.9950
      },
      {
        id: 'TRAF-102',
        roadName: 'Cross Cut Road',
        neighborhood: 'Gandhipuram',
        severity: 'MODERATE',
        description: 'Commercial rush hour market congestion.',
        active: true,
        lat: 11.0180,
        lng: 76.9580
      }
    ];

    this.roadClosures = [
      {
        id: 'ROAD-201',
        roadName: 'DB Road North Axis',
        neighborhood: 'RS Puram',
        startLat: 11.0090,
        startLng: 76.9460,
        endLat: 11.0110,
        endLng: 76.9480,
        description: 'Pipeline drainage repair work. Complete road block.',
        active: true
      }
    ];

    // 4. Seed Historical Waste Records (100+ items across 6 neighborhoods over past 30 days)
    this.wasteHistory = [];
    const now = Date.now();
    let historyId = 1;

    COIMBATORE_NEIGHBORHOODS.forEach((nh) => {
      for (let day = 30; day >= 0; day--) {
        const dateStr = new Date(now - day * 86400000).toISOString().split('T')[0];
        
        let plastic = 22;
        let organic = 45;
        let paper = 18;
        let glass = 7;
        let mixed = 8;

        if (nh.name === 'RS Puram') {
          plastic = 64; // High plastic waste issue
          organic = 16;
          paper = 12;
          glass = 4;
          mixed = 4;
        } else if (nh.name === 'Saibaba Colony') {
          organic = 68; // High organic waste issue
          plastic = 14;
          paper = 10;
          glass = 4;
          mixed = 4;
        } else if (nh.name === 'Peelamedu') {
          paper = 38;
          plastic = 32;
          organic = 18;
          glass = 6;
          mixed = 6;
        }

        const totalVolumeTons = Math.round((12 + Math.random() * 8) * 10) / 10;
        const recyclingRatePct = Math.round((35 + Math.random() * 25) * 10) / 10;
        const separationRatePct = Math.round((40 + Math.random() * 30) * 10) / 10;
        const landfillDiversionPct = Math.round((recyclingRatePct * 0.8 + separationRatePct * 0.3) * 10) / 10;

        this.wasteHistory.push({
          id: `WH-${historyId++}`,
          neighborhood: nh.name,
          date: dateStr,
          totalVolumeTons,
          recyclingRatePct,
          separationRatePct,
          landfillDiversionPct,
          breakdown: { plastic, organic, paper, glass, mixed }
        });
      }
    });

    // 5. Seed Initial Campaigns
    this.campaigns = [
      {
        id: 'CAMP-001',
        neighborhood: 'RS Puram',
        wasteIssue: 'Single-Use Plastic Bottle & Container Accumulation (64% plastic composition)',
        titleEn: 'RS Puram Zero Plastic Initiative',
        titleTa: 'ஆர்.எஸ்.புரம் பிளாஸ்டிக் இல்லா முன்னெடுப்பு',
        explanationEn: 'RS Puram commercial markets show 64% plastic waste, leading to microplastic runoff and bin clogging.',
        explanationTa: 'ஆர்.எஸ்.புரம் வணிகச் சந்தைகளில் 64% பிளாஸ்டிக் கழிவுகள் பதிவாகியுள்ளன. இது கழிவுநீர் தேக்கத்திற்கு வழிவகுக்கிறது.',
        citizenActionEn: 'Switch to cotton tote bags and place clean PET bottles in designated blue recycling bins.',
        citizenActionTa: 'துணிப்பைகளைப் பயன்படுத்தவும், தூய்மையான பிளாஸ்டிக் பாட்டில்களை நீலநிற மறுசுழற்சி தொட்டிகளில் போடுங்கள்.',
        posterCopyEn: 'Ditch Single-Use Plastic! Protect Our RS Puram Clean Canopy.',
        posterCopyTa: 'ஒருமுறை பயன்படுத்தும் பிளாஸ்டிக்கை தவிர்க்கவும்! நமது ஆர்.எஸ்.புரத்தை தூய்மையாக்குவோம்.',
        socialMediaEn: 'Join 5,000+ RS Puram residents segregating plastic waste at source today! #WasteWise #CleanCoimbatore',
        socialMediaTa: 'பிளாஸ்டிக் கழிவுகளை பிரித்தெடுக்கும் 5,000+ ஆர்.எஸ்.புரம் மக்களுடன் இன்றே இணையுங்கள்! #WasteWise',
        targetGroup: 'Commercial Shop Owners & Apartment Associations',
        duration: '14 Days',
        expectedImpact: '32% reduction in unsegregated plastic waste to landfill',
        status: 'PUBLISHED',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
      }
    ];

    // 6. Seed Agent Statuses
    this.agentStatuses = [
      {
        id: 'agent-1',
        name: 'Bin Density Agent',
        role: 'Computer Vision & IoT Fill Analytics',
        status: 'ACTIVE',
        lastAction: 'Scanned 50 city bins. Flagged BIN-005 (96%) as CRITICAL.',
        latencyMs: 140,
        eventsCount: 38
      },
      {
        id: 'agent-2',
        name: 'Routing Agent',
        role: 'Multi-Vehicle VRP & Traffic Optimization',
        status: 'ACTIVE',
        lastAction: 'Calculated optimal collection route for Truck TRK-01.',
        latencyMs: 210,
        eventsCount: 24
      },
      {
        id: 'agent-3',
        name: 'Recycling Analytics Agent',
        role: 'Landfill Diversion & Waste Breakdown',
        status: 'ACTIVE',
        lastAction: 'Processed 30-day neighborhood waste separation metrics.',
        latencyMs: 180,
        eventsCount: 19
      },
      {
        id: 'agent-4',
        name: 'Civic Campaign Agent',
        role: 'Bilingual Civic Campaign Generator (En/Ta)',
        status: 'ACTIVE',
        lastAction: 'Generated RS Puram Zero Plastic campaign.',
        latencyMs: 420,
        eventsCount: 12
      }
    ];

    // 7. Seed Initial Agent Events
    this.agentEvents = [
      {
        id: 'EVT-1001',
        agentName: 'Bin Density Agent',
        eventType: 'CRITICAL_BIN_DETECTED',
        inputSummary: 'BIN-005 fill level reached 96% in Gandhipuram Sector 5',
        outputSummary: 'Status escalated to CRITICAL. Overflow risk set to 0.96. Priority URGENT.',
        toolUsed: 'getBinStatus',
        reasoning: 'BIN-005 exceeded 95% critical threshold during automated sensor scan cycle.',
        latencyMs: 135,
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        status: 'WARNING'
      },
      {
        id: 'EVT-1002',
        agentName: 'Routing Agent',
        eventType: 'ROUTE_PROPOSAL_GENERATED',
        inputSummary: 'Targeted 3 critical/high bins in Gandhipuram zone',
        outputSummary: 'Assigned Truck TRK-01 (Capacity 5000kg). Route distance: 8.4km. Time: 22 mins.',
        toolUsed: 'optimizeMultiTruckRoutes',
        reasoning: 'TRK-01 has 3,800kg available capacity and is 1.2km from Gandhipuram cluster. Bypassed DB Road closure.',
        latencyMs: 215,
        timestamp: new Date(Date.now() - 1200000).toISOString(),
        status: 'SUCCESS'
      }
    ];

    // 8. Seed Initial Alerts
    this.alerts = [
      {
        id: 'ALT-001',
        severity: 'CRITICAL',
        title: 'Critical Overflow Warning',
        message: 'BIN-005 (Gandhipuram Sector 5) is at 96% capacity with high overflow risk.',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        entityId: 'BIN-005',
        entityType: 'bin'
      },
      {
        id: 'ALT-002',
        severity: 'WARNING',
        title: 'Active Road Closure',
        message: 'DB Road North Axis in RS Puram blocked due to pipeline work.',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        entityId: 'ROAD-201',
        entityType: 'route'
      }
    ];

    // 9. Seed Users
    const defaultPasswordHash = bcrypt.hashSync(process.env.DEMO_PASSWORD || 'demo1234', 10);
    const nowIso = new Date().toISOString();

    const initialAdminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@wastewise.demo';
    const initialAdminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'demo1234';
    const initialAdminHash = bcrypt.hashSync(initialAdminPassword, 10);

    this.users = [
      {
        id: 'USR-01',
        name: 'Municipal Admin',
        email: 'admin@wastewise.gov.in',
        role: 'ADMIN',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        phone: '+91 98765 10001',
        isActive: true,
        isEmailVerified: true,
        createdAt: nowIso,
        updatedAt: nowIso,
        passwordHash: defaultPasswordHash
      },
      {
        id: 'USR-01-DEMO',
        name: 'Municipal Admin',
        email: initialAdminEmail,
        role: 'ADMIN',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        phone: '+91 98765 10002',
        isActive: true,
        isEmailVerified: true,
        createdAt: nowIso,
        updatedAt: nowIso,
        passwordHash: initialAdminHash
      },
      {
        id: 'USR-02',
        name: 'Chief Dispatcher',
        email: 'dispatcher@wastewise.gov.in',
        role: 'DISPATCHER',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        phone: '+91 98765 10003',
        isActive: true,
        isEmailVerified: true,
        createdAt: nowIso,
        updatedAt: nowIso,
        passwordHash: defaultPasswordHash
      },
      {
        id: 'USR-02-DEMO',
        name: 'Chief Dispatcher',
        email: 'dispatcher@wastewise.demo',
        role: 'DISPATCHER',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        phone: '+91 98765 10004',
        isActive: true,
        isEmailVerified: true,
        createdAt: nowIso,
        updatedAt: nowIso,
        passwordHash: defaultPasswordHash
      },
      {
        id: 'USR-03',
        name: 'Sustainability Analyst',
        email: 'analyst@wastewise.gov.in',
        role: 'ANALYST',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        phone: '+91 98765 10005',
        isActive: true,
        isEmailVerified: true,
        createdAt: nowIso,
        updatedAt: nowIso,
        passwordHash: defaultPasswordHash
      },
      {
        id: 'USR-03-DEMO',
        name: 'Sustainability Analyst',
        email: 'analyst@wastewise.demo',
        role: 'ANALYST',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        phone: '+91 98765 10006',
        isActive: true,
        isEmailVerified: true,
        createdAt: nowIso,
        updatedAt: nowIso,
        passwordHash: defaultPasswordHash
      },
      {
        id: 'USR-04-CITIZEN',
        name: 'Citizen User',
        email: 'user@wastewise.demo',
        role: 'USER',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        phone: '+91 98765 10007',
        isActive: true,
        isEmailVerified: true,
        createdAt: nowIso,
        updatedAt: nowIso,
        passwordHash: defaultPasswordHash
      }
    ];

    // 10. Seed Citizen Crowdsourced Reports
    this.citizenReports = [
      {
        id: 'REP-001',
        reportId: 'REP-001',
        reportType: 'OVERFLOWING_BIN',
        title: 'Gandhipuram Sector 5 Commercial Bin Overflow',
        description: 'Bin near 100 Feet Road bus stop is spilling plastic food containers onto pedestrian walkway.',
        neighborhood: 'Gandhipuram',
        locationName: '100 Feet Road Bus Stand, Sector 5',
        lat: 11.0185,
        lng: 76.9572,
        binId: 'BIN-005',
        photoUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500',
        status: 'VERIFIED',
        upvotesCount: 14,
        downvotesCount: 0,
        reportedBy: 'Kavitha S. (Citizen)',
        aiClassification: 'AI Confidence: 98%. Confirmed severe overflow of plastic food packaging causing obstruction.',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'REP-002',
        reportId: 'REP-002',
        reportType: 'ILLEGAL_DUMPING',
        title: 'Construction Debris & Plastic Bags Dumping',
        description: 'Dumped pile of broken tiles and unsegregated plastic bags behind DB Road market lane.',
        neighborhood: 'RS Puram',
        locationName: 'DB Road West Corner, Sector 2',
        lat: 11.0098,
        lng: 76.9465,
        photoUrl: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=500',
        status: 'PENDING_VERIFICATION',
        upvotesCount: 8,
        downvotesCount: 1,
        reportedBy: 'Rajeshkumar M. (Local Business Owner)',
        aiClassification: 'AI Confidence: 91%. Identified illegal commercial construction runoff + plastic waste.',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 4).toISOString()
      },
      {
        id: 'REP-003',
        reportId: 'REP-003',
        reportType: 'MISSED_COLLECTION',
        title: 'Residential Sector Organic Waste Bin Unemptied',
        description: 'Scheduled morning pickup did not arrive for organic bin BIN-018. Smelling strongly.',
        neighborhood: 'Saibaba Colony',
        locationName: 'NSR Road Cross 4, Sector 3',
        lat: 11.0285,
        lng: 76.9422,
        binId: 'BIN-018',
        photoUrl: 'https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?w=500',
        status: 'IN_PROGRESS',
        upvotesCount: 19,
        downvotesCount: 0,
        reportedBy: 'Anand V. (Residents Welfare Assoc.)',
        aiClassification: 'AI Confidence: 95%. Verified delayed route execution due to morning traffic event TRAF-102.',
        createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: 'REP-004',
        reportId: 'REP-004',
        reportType: 'DAMAGED_BIN',
        title: 'Cracked Base Lid on Recycling Bin BIN-034',
        description: 'Pedal mechanism broken and base lid cracked; rainwater entering the paper compartment.',
        neighborhood: 'Peelamedu',
        locationName: 'Avinashi Road College Axis, Sector 1',
        lat: 11.0260,
        lng: 76.9940,
        binId: 'BIN-034',
        status: 'RESOLVED',
        upvotesCount: 6,
        downvotesCount: 0,
        reportedBy: 'Subhashini T. (Student)',
        aiClassification: 'AI Confidence: 89%. Mechanical latch defect noted. Maintenance dispatch completed.',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString()
      }
    ];
  }

  public getBinStatus(fill: number): BinStatus {
    if (fill <= 30) return 'EMPTY';
    if (fill <= 60) return 'NORMAL';
    if (fill <= 80) return 'MEDIUM';
    if (fill <= 95) return 'HIGH';
    return 'CRITICAL';
  }

  public getPriority(status: BinStatus): PriorityLevel {
    switch (status) {
      case 'CRITICAL': return 'URGENT';
      case 'HIGH': return 'HIGH';
      case 'MEDIUM': return 'NORMAL';
      default: return 'LOW';
    }
  }

  // User Helper Operations with Persistence
  public getUserByEmail(email: string): User | undefined {
    if (!email) return undefined;
    const clean = email.trim().toLowerCase();
    return this.users.find(u => u.email.toLowerCase() === clean);
  }

  public getUserById(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  public getUserByResetToken(token: string): User | undefined {
    if (!token) return undefined;
    return this.users.find(u => u.resetPasswordToken === token);
  }

  public addUser(user: User): User {
    const existing = this.getUserByEmail(user.email);
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }
    this.users.push(user);
    this.saveToDisk();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return undefined;

    this.users[index] = {
      ...this.users[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.saveToDisk();
    return this.users[index];
  }

  public sanitizeUser(user: User): Omit<User, 'passwordHash' | 'resetPasswordToken' | 'resetPasswordExpires'> {
    const { passwordHash, resetPasswordToken, resetPasswordExpires, ...safeUser } = user;
    return safeUser;
  }
}

export const store = new DatabaseStore();
