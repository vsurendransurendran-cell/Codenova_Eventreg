import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongodInstance: MongoMemoryServer | null = null;

export async function connectDB(): Promise<typeof mongoose | null> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  // CRITICAL: fail fast, don't hang
  mongoose.set('bufferCommands', false);

  try {
    let mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      console.log('[Database] MONGODB_URI not provided; launching embedded MongoDB instance...');
      try {
        mongodInstance = await MongoMemoryServer.create();
        mongoUri = mongodInstance.getUri();
        console.log(`[Database] Embedded MongoDB running at: ${mongoUri}`);
      } catch (memErr) {
        console.warn('[Database] Embedded MongoMemoryServer could not start, falling back to default URI:', memErr);
        mongoUri = 'mongodb://127.0.0.1:27017/eventflow';
      }
    } else {
      console.log(`[Database] Connecting to external MongoDB at configured URI...`);
    }

    await mongoose.connect(mongoUri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
    });

    console.log('[Database] Mongoose successfully connected.');
    return mongoose;
  } catch (error) {
    console.warn('[Database] MongoDB not connected — some features may not work:', error);
    return null;
  }
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongodInstance) {
    await mongodInstance.stop();
    mongodInstance = null;
  }
  console.log('[Database] Disconnected from MongoDB.');
}
