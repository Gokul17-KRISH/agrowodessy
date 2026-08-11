import mongoose from 'mongoose';

export interface IQualityReportDocument extends mongoose.Document {
  id: string;
  graderId: string;
  graderName: string;
  cropCommitmentId: string;
  grade: 'A' | 'B' | 'C' | 'REJECTED';
  parameters: {
    moisturePct: number;
    avgSizeCm: number;
    defectsPct: number;
    organicRating: number;
  };
  notes: string;
  certifiedAt: string;
}

const qualityReportSchema = new mongoose.Schema<IQualityReportDocument>({
  id: { type: String, required: true, unique: true },
  graderId: { type: String, required: true },
  graderName: { type: String, required: true },
  cropCommitmentId: { type: String, required: true, unique: true },
  grade: { type: String, enum: ['A', 'B', 'C', 'REJECTED'], required: true },
  parameters: {
    moisturePct: { type: Number, required: true },
    avgSizeCm: { type: Number, required: true },
    defectsPct: { type: Number, required: true },
    organicRating: { type: Number, required: true, min: 1, max: 5 }
  },
  notes: { type: String },
  certifiedAt: { type: String, default: () => new Date().toISOString() }
}, {
  timestamps: true
});

export const MongoQualityReportModel: mongoose.Model<IQualityReportDocument> = (mongoose.models.QualityReport as mongoose.Model<IQualityReportDocument>) || mongoose.model<IQualityReportDocument>('QualityReport', qualityReportSchema);
