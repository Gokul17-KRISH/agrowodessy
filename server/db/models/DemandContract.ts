import mongoose from 'mongoose';

export interface IDemandContractDocument extends mongoose.Document {
  id: string;
  buyerId: string;
  buyerName: string;
  businessName?: string;
  cropName: string;
  quantityRequiredKg: number;
  quantityCommittedKg: number;
  pricePerKg: number;
  targetMonth: string;
  district: string;
  terms: string;
  qualityRequirements: string;
  status: 'OPEN' | 'FULLY_COMMITTED' | 'LOCKED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

const demandContractSchema = new mongoose.Schema<IDemandContractDocument>({
  id: { type: String, required: true, unique: true },
  buyerId: { type: String, required: true },
  buyerName: { type: String, required: true },
  businessName: { type: String },
  cropName: { type: String, required: true },
  quantityRequiredKg: { type: Number, required: true },
  quantityCommittedKg: { type: Number, default: 0 },
  pricePerKg: { type: Number, required: true },
  targetMonth: { type: String, required: true },
  district: { type: String, required: true },
  terms: { type: String, required: true },
  qualityRequirements: { type: String, required: true },
  status: { type: String, enum: ['OPEN', 'FULLY_COMMITTED', 'LOCKED', 'COMPLETED', 'CANCELLED'], default: 'OPEN' },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
}, {
  timestamps: true
});

demandContractSchema.index({ district: 1 });
demandContractSchema.index({ cropName: 1 });

export const MongoDemandContractModel: mongoose.Model<IDemandContractDocument> = (mongoose.models.DemandContract as mongoose.Model<IDemandContractDocument>) || mongoose.model<IDemandContractDocument>('DemandContract', demandContractSchema);
