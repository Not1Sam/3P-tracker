import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { ensureSchema, closePool } from './db/index.js';
import { redis } from './cache/index.js';
import { authMiddleware } from './middleware/auth.js';
import poopRoutes from './routes/poop.js';
import pissRoutes from './routes/piss.js';
import customTypeRoutes from './routes/custom-types.js';
import settingsRoutes from './routes/settings.js';
import syncRoutes from './routes/sync.js';
import otaRoutes from './routes/ota.js';

const PORT = parseInt(process.env.API_PORT ?? '3001');
const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

// Health check (no auth)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// All data routes require auth
app.use('/api/poop', authMiddleware, poopRoutes);
app.use('/api/piss', authMiddleware, pissRoutes);
app.use('/api/custom', authMiddleware, customTypeRoutes);
app.use('/api/settings', authMiddleware, settingsRoutes);
app.use('/api/sync', authMiddleware, syncRoutes);

// OTA update routes (no auth — app needs to check updates before login)
app.use('/ota', otaRoutes);

async function start() {
  console.log('[API] Starting 3P Tracker API server...');

  await ensureSchema();
  console.log('[API] PostgreSQL schema ready');

  await redis.connect();
  console.log('[API] Redis connected');

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[API] Listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('[API] Fatal startup error:', err);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  console.log('[API] Shutting down...');
  await closePool();
  redis.disconnect();
  process.exit(0);
});
