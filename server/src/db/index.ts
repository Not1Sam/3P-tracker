import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message);
});

export const db = drizzle(pool, { schema });

export async function ensureSchema() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS poop_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        type_id INTEGER,
        comment TEXT,
        location_lat DOUBLE PRECISION,
        location_lng DOUBLE PRECISION,
        location_city TEXT,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_poop_logs_user_ts ON poop_logs(user_id, timestamp);
      CREATE INDEX IF NOT EXISTS idx_poop_logs_user_date ON poop_logs(user_id, timestamp);

      CREATE TABLE IF NOT EXISTS piss_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        color_id INTEGER,
        smell TEXT,
        comment TEXT,
        location_lat DOUBLE PRECISION,
        location_lng DOUBLE PRECISION,
        location_city TEXT,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_piss_logs_user_ts ON piss_logs(user_id, timestamp);

      CREATE TABLE IF NOT EXISTS custom_types (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_custom_types_user ON custom_types(user_id);

      CREATE TABLE IF NOT EXISTS custom_colors (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        hex_value TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_custom_colors_user ON custom_colors(user_id);

      CREATE TABLE IF NOT EXISTS user_settings (
        key TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        value TEXT NOT NULL,
        updated_at TIMESTAMP NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id);
    `);
    console.log('[DB] Schema ensured');
  } finally {
    client.release();
  }
}

export async function closePool() {
  await pool.end();
}
