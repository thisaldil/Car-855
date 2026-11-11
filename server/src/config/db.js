import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from './env.js';

function isSrvDnsError(error) {
  return error?.code === 'ECONNREFUSED' && error?.message?.includes('querySrv');
}

export async function connectDB() {
  if (mongoose.connection.readyState === 1) return; // already connected

  mongoose.set('strictQuery', true);
  const options = { serverSelectionTimeoutMS: 5000 };

  try {
    await mongoose.connect(env.mongoUri, options);
  } catch (error) {
    if (!env.mongoUri?.startsWith('mongodb+srv://') || !isSrvDnsError(error)) {
      throw error;
    }

    console.warn(
      'System DNS could not resolve the MongoDB SRV record; retrying with configured fallback DNS servers.',
    );
    dns.setServers(env.mongoDnsServers);
    await mongoose.connect(env.mongoUri, options);
  }

  console.log('MongoDB connected');
}
