import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

/**
 * Global variable usage for MongoDB connection caching
 * 
 * WHY GLOBAL IS NECESSARY:
 * - Next.js uses Hot Module Replacement (HMR) in development
 * - Without global cache, each HMR reload would create a new connection
 * - This would exhaust MongoDB connection pool and cause errors
 * - Global variable persists across module reloads, preventing connection leaks
 * 
 * PRODUCTION BEHAVIOR:
 * - In production, global variable is reset on each server restart
 * - This is acceptable as production doesn't use HMR
 * - Connection is cached per server instance, which is correct behavior
 * 
 * CODE CANYON COMPLIANCE:
 * - This is an exception to "no global variables" rule
 * - Documented and necessary for Next.js HMR compatibility
 * - Explicitly declared with TypeScript global augmentation
 */
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectMongoDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectMongoDB;

