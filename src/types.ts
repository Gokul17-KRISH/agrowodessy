export type UserRole = 'FARMER' | 'BUYER' | 'GRADER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  district?: string; // Farmers and Buyers are tied to districts for saturation intelligence
  farmSizeAcres?: number; // Farmer specific
  businessName?: string; // Buyer specific
  isActive?: boolean;
  isEmailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
  passwordHash?: string;
}

export type DemandStatus = 'OPEN' | 'FULLY_COMMITTED' | 'LOCKED' | 'COMPLETED' | 'CANCELLED';

export interface DemandContract {
  id: string;
  buyerId: string;
  buyerName: string;
  businessName?: string;
  cropName: string;
  quantityRequiredKg: number;
  quantityCommittedKg: number; // Sum of farmer commitments
  pricePerKg: number; // in Rupees
  targetMonth: string; // e.g. "November 2026"
  district: string; // Saturation district
  terms: string;
  qualityRequirements: string;
  status: DemandStatus;
  createdAt: string;
  updatedAt: string;
}

export type CommitmentStatus = 'PLANNED' | 'SEEDED' | 'HARVESTED' | 'DELIVERED';

export interface CropCommitment {
  id: string;
  farmerId: string;
  farmerName: string;
  demandContractId: string; // Reference to the demand contract they are fulfilling
  cropName: string;
  quantityKg: number;
  district: string;
  plantingDate: string;
  harvestDateAvailable: string;
  status: CommitmentStatus;
  createdAt: string;
  updatedAt: string;
}

export type QualityGrade = 'A' | 'B' | 'C' | 'REJECTED';

export interface QualityReport {
  id: string;
  graderId: string;
  graderName: string;
  cropCommitmentId: string;
  grade: QualityGrade;
  parameters: {
    moisturePct: number;
    avgSizeCm: number;
    defectsPct: number;
    organicRating: number; // 1-5 scale
  };
  notes: string;
  certifiedAt: string;
}

export type EscrowStatus = 'AWAITING_DEPOSIT' | 'HELD_IN_ESCROW' | 'RELEASED_TO_FARMER' | 'REFUNDED_TO_BUYER';
export type DeliveryStatus = 'PENDING' | 'IN_TRANSIT' | 'RECEIVED' | 'QUALITY_CERTIFIED' | 'DISPATCHED' | 'DELIVERED';

export interface TimelineEntry {
  status: string;
  timestamp: string;
  updatedBy: string;
  description: string;
}

export interface Delivery {
  id: string;
  demandContractId: string;
  cropName: string;
  buyerId: string;
  buyerName: string;
  farmerId: string;
  farmerName: string;
  cropCommitmentId: string;
  graderId?: string;
  graderName?: string;
  quantityDeliveredKg: number;
  pricePerKg: number;
  totalAmount: number;
  escrowStatus: EscrowStatus;
  deliveryStatus: DeliveryStatus;
  trackingTimeline: TimelineEntry[];
  paymentTxHash?: string;
  qualityReportId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  type: 'DEMAND' | 'COMMITMENT' | 'QUALITY' | 'DELIVERY' | 'ESCROW' | 'ALERT';
  isRead: boolean;
  createdAt: string;
}

export interface SaturationMetrics {
  cropName: string;
  totalDemandKg: number;
  totalCommitmentKg: number;
  saturationPercentage: number; // (commitment / demand) * 100
  alertLevel: 'LOW' | 'OPTIMAL' | 'HIGH' | 'CRITICAL';
  contributingFarmers: number;
}

export interface DistrictSaturationIntelligence {
  district: string;
  lastUpdated: string;
  metrics: SaturationMetrics[];
  recommendations: {
    cropName: string;
    action: 'PLANT' | 'AVOID' | 'MONITOR';
    reason: string;
  }[];
}

export interface SystemMetrics {
  totalFarmers: number;
  totalBuyers: number;
  activeDemandsCount: number;
  totalCommitmentsKg: number;
  escrowVolumeRupees: number;
  successfulDeliveriesCount: number;
  districtSaturationData: DistrictSaturationIntelligence[];
}
