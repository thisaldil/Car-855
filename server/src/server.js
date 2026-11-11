import app from './app.js';
import { env, assertEnv } from './config/env.js';
import { connectDB } from './config/db.js';

async function startServer() {
  try {
    assertEnv();
    await connectDB();
    app.listen(env.port, () => console.log(`Cars@855 API listening on :${env.port}`));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Unable to start the API: ${message}`);
    console.error(
      'Check MONGODB_URI, MONGODB_DNS_SERVERS, and Atlas network access in server/.env.',
    );
    process.exit(1);
  }
}

await startServer();
