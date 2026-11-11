import app from '../src/app.js';
import { assertEnv } from '../src/config/env.js';
import { connectDB } from '../src/config/db.js';

export default async function handler(req, res) {
  // let CORS preflight through without touching the DB
  if (req.method === 'OPTIONS') return app(req, res);

  try {
    assertEnv();
    await connectDB();
  } catch (error) {
    console.error('Startup error:', error);
    return res.status(500).json({ message: 'Server startup failed' });
  }
  return app(req, res);
}