import mongoose from 'mongoose';

export interface IUserDocument extends mongoose.Document {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  phone?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  passwordHash?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: string;
}

const userSchema = new mongoose.Schema<IUserDocument>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: false },
  role: { type: String, enum: ['ADMIN', 'DISPATCHER', 'ANALYST', 'USER'], default: 'USER' },
  avatar: { type: String },
  phone: { type: String },
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
  lastLoginAt: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: String }
}, {
  timestamps: true
});

userSchema.index({ email: 1 }, { unique: true });

export const MongoUserModel = mongoose.models.User || mongoose.model<IUserDocument>('User', userSchema);
