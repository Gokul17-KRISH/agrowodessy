import mongoose from 'mongoose';

let isConnected = false;

export async function connectToDatabase(): Promise<boolean> {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.log('[Database] MONGODB_URI not set. Operating in high-performance JSON persistence mode.');
    return false;
  }

  if (isConnected) {
    return true;
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log('[Database] Successfully connected to MongoDB cluster.');
    return true;
  } catch (err) {
    console.warn('[Database] MongoDB connection error, falling back to JSON file store:', err);
    return false;
  }
}

export function isMongoConnected(): boolean {
  return isConnected;
}
