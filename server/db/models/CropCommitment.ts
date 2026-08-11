import mongoose from 'mongoose';

export interface ICropCommitmentDocument extends mongoose.Document {
  id: string;
  farmerId: string;
  farmerName: string;
  demandContractId: string;
  cropName: string;
  quantityKg: number;
  district: string;
  plantingDate: string;
  harvestDateAvailable: string;
  status: 'PLANNED' | 'SEEDED' | 'HARVESTED' | 'DELIVERED';
  createdAt: string;
  updatedAt: string;
}

const cropCommitmentSchema = new mongoose.Schema<ICropCommitmentDocument>({
  id: { type: String, required: true, unique: true },
  farmerId: { type: String, required: true },
  farmerName: { type: String, required: true },
  demandContractId: { type: String, required: true },
  cropName: { type: String, required: true },
  quantityKg: { type: Number, required: true },
  district: { type: String, required: true },
  plantingDate: { type: String, required: true },
  harvestDateAvailable: { type: String, required: true },
  status: { type: String, enum: ['PLANNED', 'SEEDED', 'HARVESTED', 'DELIVERED'], default: 'PLANNED' },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
}, {
  timestamps: true
});

cropCommitmentSchema.index({ demandContractId: 1 });
cropCommitmentSchema.index({ farmerId: 1 });
cropCommitmentSchema.index({ district: 1 });

export const MongoCropCommitmentModel: mongoose.Model<ICropCommitmentDocument> = (mongoose.models.CropCommitment as mongoose.Model<ICropCommitmentDocument>) || mongoose.model<ICropCommitmentDocument>('CropCommitment', cropCommitmentSchema);
