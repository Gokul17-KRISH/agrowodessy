import mongoose from 'mongoose';

export interface INotificationDocument extends mongoose.Document {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  type: 'DEMAND' | 'COMMITMENT' | 'QUALITY' | 'DELIVERY' | 'ESCROW' | 'ALERT';
  isRead: boolean;
  createdAt: string;
}

const notificationSchema = new mongoose.Schema<INotificationDocument>({
  id: { type: String, required: true, unique: true },
  recipientId: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['DEMAND', 'COMMITMENT', 'QUALITY', 'DELIVERY', 'ESCROW', 'ALERT'],
    required: true
  },
  isRead: { type: Boolean, default: false },
  createdAt: { type: String, default: () => new Date().toISOString() }
}, {
  timestamps: true
});

notificationSchema.index({ recipientId: 1 });

export const MongoNotificationModel: mongoose.Model<INotificationDocument> = (mongoose.models.Notification as mongoose.Model<INotificationDocument>) || mongoose.model<INotificationDocument>('Notification', notificationSchema);
