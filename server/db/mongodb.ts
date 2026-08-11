import mongoose from 'mongoose';

let isConnected = false;

export async function connectToDatabase(): Promise<boolean> {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.log('[Database] MONGODB_URI not configured. Operating in local JSON persistence mode with MongoDB Atlas fallback ready.');
    return false;
  }

  if (isConnected && mongoose.connection.readyState === 1) {
    return true;
  }

  try {
    mongoose.connection.on('connected', () => {
      isConnected = true;
      console.log('[Database] 🟢 MongoDB Atlas cluster connected successfully.');
    });

    mongoose.connection.on('error', (err) => {
      console.error('[Database] 🔴 MongoDB Atlas connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      console.warn('[Database] 🟡 MongoDB Atlas cluster disconnected.');
    });

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 2,
    });
    
    isConnected = true;
    console.log(`[Database] 🚀 Connected to MongoDB Atlas cluster at: ${mongoose.connection.host} / Database: "${mongoose.connection.name}"`);
    return true;
  } catch (err) {
    console.warn('[Database] ⚠️ MongoDB Atlas connection attempt failed:', err instanceof Error ? err.message : err);
    console.log('[Database] Falling back to high-performance local JSON persistence mode.');
    isConnected = false;
    return false;
  }
}

export function isMongoConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

export function getMongoDbInfo() {
  const readyStateMap: Record<number, string> = {
    0: 'Disconnected',
    1: 'Connected (Atlas Cluster)',
    2: 'Connecting...',
    3: 'Disconnecting...'
  };

  if (!isMongoConnected()) {
    return {
      connected: false,
      mode: 'JSON Persistence Mode (Ready for MongoDB Atlas)',
      status: readyStateMap[mongoose.connection.readyState] || 'Disconnected',
      databaseName: process.env.MONGODB_URI ? 'Connecting / Retrying...' : 'Local Store (Set MONGODB_URI)',
      host: null,
      collections: []
    };
  }

  const collections = Object.keys(mongoose.connection.collections);

  return {
    connected: true,
    mode: 'MongoDB Atlas Cloud Cluster',
    status: readyStateMap[mongoose.connection.readyState] || 'Connected',
    databaseName: mongoose.connection.name,
    host: mongoose.connection.host,
    collectionsCount: collections.length,
    collections: collections
  };
}
