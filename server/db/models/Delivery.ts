import mongoose from 'mongoose';

export interface IDeliveryDocument extends mongoose.Document {
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
  escrowStatus: 'AWAITING_DEPOSIT' | 'HELD_IN_ESCROW' | 'RELEASED_TO_FARMER' | 'REFUNDED_TO_BUYER';
  deliveryStatus: 'PENDING' | 'IN_TRANSIT' | 'RECEIVED' | 'QUALITY_CERTIFIED' | 'DISPATCHED' | 'DELIVERED';
  trackingTimeline: {
    status: string;
    timestamp: string;
    updatedBy: string;
    description: string;
  }[];
  paymentTxHash?: string;
  qualityReportId?: string;
  createdAt: string;
  updatedAt: string;
}

const timelineEntrySchema = new mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: String, required: true },
  updatedBy: { type: String, required: true },
  description: { type: String, required: true }
}, { _id: false });

const deliverySchema = new mongoose.Schema<IDeliveryDocument>({
  id: { type: String, required: true, unique: true },
  demandContractId: { type: String, required: true },
  cropName: { type: String, required: true },
  buyerId: { type: String, required: true },
  buyerName: { type: String, required: true },
  farmerId: { type: String, required: true },
  farmerName: { type: String, required: true },
  cropCommitmentId: { type: String, required: true },
  graderId: { type: String },
  graderName: { type: String },
  quantityDeliveredKg: { type: Number, required: true },
  pricePerKg: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  escrowStatus: {
    type: String,
    enum: ['AWAITING_DEPOSIT', 'HELD_IN_ESCROW', 'RELEASED_TO_FARMER', 'REFUNDED_TO_BUYER'],
    default: 'AWAITING_DEPOSIT'
  },
  deliveryStatus: {
    type: String,
    enum: ['PENDING', 'IN_TRANSIT', 'RECEIVED', 'QUALITY_CERTIFIED', 'DISPATCHED', 'DELIVERED'],
    default: 'PENDING'
  },
  trackingTimeline: [timelineEntrySchema],
  paymentTxHash: { type: String },
  qualityReportId: { type: String },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
}, {
  timestamps: true
});

export const MongoDeliveryModel: mongoose.Model<IDeliveryDocument> = (mongoose.models.Delivery as mongoose.Model<IDeliveryDocument>) || mongoose.model<IDeliveryDocument>('Delivery', deliverySchema);
