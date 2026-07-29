export type WasteType = 'mixed' | 'organic' | 'plastic' | 'paper' | 'glass' | 'degradable' | 'non-degradable';
export type BinStatus = 'EMPTY' | 'NORMAL' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type PriorityLevel = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type TruckStatus = 'IDLE' | 'IN_TRANSIT' | 'COLLECTING' | 'MAINTENANCE';
export type RouteApprovalStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED';
export type TrafficSeverity = 'LIGHT' | 'MODERATE' | 'HEAVY' | 'BLOCKED';
export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type UserRole = 'ADMIN' | 'DISPATCHER' | 'ANALYST' | 'USER';

export interface HistoricalReading {
  timestamp: string;
  fillLevel: number;
}

export interface Bin {
  id: string;
  binId: string;
  locationName: string;
  neighborhood: string;
  lat: number;
  lng: number;
  fillLevel: number; // 0 - 100%
  wasteType: WasteType;
  status: BinStatus;
  priority: PriorityLevel;
  estimatedOverflowRisk: number; // 0 - 1
  lastUpdated: string;
  historicalReadings: HistoricalReading[];
  imageUrl?: string;
  stopId?: string;
  binCategory?: 'degradable' | 'non-degradable';
  isMixed?: boolean;
  contaminationDetails?: string;
}

export interface Truck {
  id: string;
  truckId: string;
  driverName: string;
  capacityKg: number;
  currentLoadKg: number;
  fuelLevel: number; // 0 - 100%
  currentLat: number;
  currentLng: number;
  status: TruckStatus;
  assignedRouteId?: string | null;
}

export interface RouteBin {
  binId: string;
  locationName: string;
  neighborhood: string;
  lat: number;
  lng: number;
  fillLevel: number;
  wasteType: WasteType;
  priority: PriorityLevel;
}

export interface Route {
  id: string;
  routeId: string;
  truckId: string;
  truckName: string;
  assignedBinIds: string[];
  orderedBins: RouteBin[];
  totalDistanceKm: number;
  estimatedTimeMin: number;
  capacityUsagePct: number;
  trafficImpact: TrafficSeverity;
  reason: string;
  approvalStatus: RouteApprovalStatus;
  modifiedByHuman: boolean;
  replanned?: boolean;
  disruptionCause?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WasteBreakdown {
  plastic: number; // percentage
  organic: number;
  paper: number;
  glass: number;
  mixed: number;
}

export interface WasteHistory {
  id: string;
  neighborhood: string;
  date: string;
  totalVolumeTons: number;
  recyclingRatePct: number;
  separationRatePct: number;
  landfillDiversionPct: number;
  breakdown: WasteBreakdown;
}

export interface Campaign {
  id: string;
  neighborhood: string;
  wasteIssue: string;
  titleEn: string;
  titleTa: string;
  explanationEn: string;
  explanationTa: string;
  citizenActionEn: string;
  citizenActionTa: string;
  posterCopyEn: string;
  posterCopyTa: string;
  socialMediaEn: string;
  socialMediaTa: string;
  targetGroup: string;
  duration: string;
  expectedImpact: string;
  status: 'DRAFT' | 'APPROVED' | 'PUBLISHED';
  createdAt: string;
}

export type AgentName =
  | 'Bin Density & Waste Composition Agent'
  | 'Logistics & Dynamic Routing Agent'
  | 'Recycling Intelligence & Analytics Agent'
  | 'Civic Campaign & Engagement Agent'
  | 'Orchestrator';

export interface AgentEvent {
  id: string;
  agentName: AgentName | string;
  eventType: string;
  inputSummary: string;
  outputSummary: string;
  toolUsed?: string;
  reasoning: string;
  latencyMs: number;
  timestamp: string;
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
  workflowId?: string;
}

export interface WasteObservationInput {
  binId: string;
  zone?: string;
  timestamp?: string;
  capacityKg?: number;
  fillPercentage?: number;
  fillLevel?: number;
  estimatedVolumeM3?: number;
  estimatedWeightKg?: number;
  wasteObservation?: {
    plasticBottles?: number;
    plasticCovers?: number;
    glassBottles?: number;
    metalCans?: number;
    aluminumContainers?: number;
    paper?: number;
    cardboard?: number;
    organicWaste?: number;
    eWaste?: number;
    other?: number;
  };
  previousFillPercentage?: number;
  previousTimestamp?: string;
  imageDescription?: string;
}

export interface WasteCompositionDetails {
  plasticBottles: number;
  plasticCovers: number;
  glassBottles: number;
  metalCans: number;
  aluminumContainers: number;
  paper: number;
  cardboard: number;
  organicWaste: number;
  eWaste: number;
  other: number;
  totalItemCount: number;
  categoryPercentages: {
    plastic: number;
    glass: number;
    metal: number;
    paperCardboard: number;
    organic: number;
    other: number;
  };
  dominantCategory: string;
  recyclablePercentage: number;
  organicPercentage: number;
  contaminationPercentage: number;
}

export type DensityClassification = 'EMPTY' | 'LOW' | 'NORMAL' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type PriorityCode = 'P1' | 'P2' | 'P3' | 'P4' | 'P5';

export interface BinAnalysisResult {
  binId: string;
  zone: string;
  timestamp: string;
  fillLevel: number;
  density: DensityClassification;
  capacityKg: number;
  estimatedVolumeM3: number;
  estimatedWeightKg: number;
  fillRatePctPerHour: number;
  estimatedTimeToOverflowHours: number;
  overflowRiskScore: number;
  overflowRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  priority: PriorityCode;
  composition: WasteCompositionDetails;
  decision: string;
  decisionSummary: string;
  nextAction: string;
}

export interface RoutingDecisionResult {
  routeId: string;
  truckAssignments: {
    truckId: string;
    truckName: string;
    driverName: string;
    bins: string[];
    capacityUtilizationPct: number;
  }[];
  estimatedDistanceKm: number;
  estimatedDurationMin: number;
  capacityUtilizationPct: number;
  trafficCondition: TrafficSeverity;
  roadConstraints: string[];
  decisionSummary: string;
  approvalStatus: RouteApprovalStatus;
  replanned: boolean;
  disruptionCause?: string;
}

export interface RecyclingInsightFinding {
  zone: string;
  issue: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  evidence: {
    currentPlasticPercentage: number;
    historicalAverage: number;
    recyclingRatePct: number;
    contaminationRatePct: number;
    anomalyDelta: number;
  };
  recommendedAction: string;
  decisionSummary: string;
}

export interface CampaignProposalResult {
  campaignId: string;
  neighborhood: string;
  wasteIssue: string;
  targetAudience: string;
  campaignStrategy: string;
  titleEn: string;
  titleTa: string;
  explanationEn: string;
  explanationTa: string;
  citizenActionEn: string;
  citizenActionTa: string;
  posterCopyEn: string;
  posterCopyTa: string;
  socialMediaEn: string;
  socialMediaTa: string;
  duration: string;
  expectedImpact: string;
  priority: 'HIGH' | 'MEDIUM' | 'URGENT';
  approvalStatus: 'PROPOSED' | 'APPROVED' | 'PUBLISHED';
  decisionSummary: string;
}

export interface AgentMessage {
  id: string;
  workflowId: string;
  eventType: string;
  sourceAgent: AgentName | 'Human Dispatcher' | 'Simulation Engine' | string;
  targetAgent: AgentName | 'All' | string;
  payload: any;
  timestamp: string;
}

export interface ToolCallLog {
  id: string;
  workflowId?: string;
  agentName: AgentName | string;
  toolName: string;
  arguments: any;
  resultSummary: string;
  timestamp: string;
  latencyMs: number;
}

export interface HumanApprovalRecord {
  id: string;
  workflowId: string;
  entityType: 'ROUTE' | 'CAMPAIGN';
  entityId: string;
  action: 'APPROVED' | 'REJECTED' | 'REOPTIMIZED' | 'MODIFIED';
  comments?: string;
  actionBy: string;
  timestamp: string;
}

export interface SharedWorkflowState {
  workflowId: string;
  timestamp: string;
  trigger: string;
  currentAgent: AgentName | string;
  workflowStatus: 'INITIATED' | 'PROCESSING' | 'AWAITING_HUMAN_APPROVAL' | 'REOPTIMIZING' | 'COMPLETED' | 'FAILED';
  binAnalysis: BinAnalysisResult | null;
  wasteComposition: WasteCompositionDetails | null;
  criticalBins: string[];
  truckStatus: Truck[];
  traffic: TrafficEvent[];
  roadClosures: RoadClosure[];
  routes: Route[];
  analyticsFindings: RecyclingInsightFinding | null;
  campaign: CampaignProposalResult | null;
  agentMessages: AgentMessage[];
  toolCalls: ToolCallLog[];
  humanApprovals: HumanApprovalRecord[];
  errors: string[];
  timestamps: Record<string, string>;
}

export interface TrafficEvent {
  id: string;
  roadName: string;
  neighborhood: string;
  severity: TrafficSeverity;
  description: string;
  active: boolean;
  lat: number;
  lng: number;
}

export interface RoadClosure {
  id: string;
  roadName: string;
  neighborhood: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  description: string;
  active: boolean;
}

export interface SystemAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: string;
  entityId?: string;
  entityType?: 'bin' | 'truck' | 'route' | 'agent';
}

export interface AgentStatus {
  id: string;
  name: string;
  role: string;
  status: 'IDLE' | 'PROCESSING' | 'ACTIVE' | 'OFFLINE';
  lastAction: string;
  latencyMs: number;
  eventsCount: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
  passwordHash?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: string;
}

export interface SystemMetrics {
  totalBins: number;
  criticalBins: number;
  overflowingBins: number;
  activeTrucks: number;
  availableTrucks: number;
  routesGenerated: number;
  routesAwaitingApproval: number;
  recyclingRatePct: number;
  landfillDiversionPct: number;
  campaignReach: number;
  avgRouteGenerationLatencyMs: number;
}

export type CitizenReportType = 'OVERFLOWING_BIN' | 'ILLEGAL_DUMPING' | 'MISSED_COLLECTION' | 'DAMAGED_BIN' | 'LITTER_HOTSPOT';
export type CitizenReportStatus = 'PENDING_VERIFICATION' | 'VERIFIED' | 'IN_PROGRESS' | 'RESOLVED';

export interface CitizenReport {
  id: string;
  reportId: string;
  reportType: CitizenReportType;
  title: string;
  description: string;
  neighborhood: string;
  locationName: string;
  lat: number;
  lng: number;
  binId?: string;
  photoUrl?: string;
  status: CitizenReportStatus;
  upvotesCount: number;
  downvotesCount: number;
  reportedBy: string;
  aiClassification?: string;
  createdAt: string;
  updatedAt: string;
}
