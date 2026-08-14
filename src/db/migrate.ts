import * as SQLite from 'expo-sqlite';
import { logger } from '@/utils/logger';

interface Migration {
  idx: number;
  version: string;
  sql: string;
}

// List of all migrations in order
const migrations: Migration[] = [
  {
    idx: 1,
    version: '0001',
    sql: `
CREATE TABLE IF NOT EXISTS poop_logs (
  id TEXT PRIMARY KEY,
  timestamp INTEGER NOT NULL,
  type_id INTEGER,
  comment TEXT,
  location_lat REAL,
  location_lng REAL,
  location_city TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS piss_logs (
  id TEXT PRIMARY KEY,
  timestamp INTEGER NOT NULL,
  color_id INTEGER,
  smell TEXT,
  comment TEXT,
  location_lat REAL,
  location_lng REAL,
  location_city TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS period_logs (
  id TEXT PRIMARY KEY,
  timestamp INTEGER NOT NULL,
  flow_level TEXT,
  symptoms TEXT,
  mood TEXT,
  cycle_day INTEGER,
  comment TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS custom_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS custom_colors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  hex_value TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS user_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS _journal (
  idx INTEGER PRIMARY KEY,
  version TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
`,
  },
];

/**
 * Run all pending migrations on the database.
 * Checks the _journal table for applied migrations, runs pending ones idempotently,
 * and records completion.
 */
export async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  logger.db('Starting database migrations');

  // Ensure _journal table exists
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS _journal (
      idx INTEGER PRIMARY KEY,
      version TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);

  // Get applied migrations
  const journal = await db.getAllAsync<{ idx: number }>('SELECT idx FROM _journal');
  const appliedMigrations = new Set(journal.map((j) => j.idx));

  logger.db('Migration journal loaded', { applied: Array.from(appliedMigrations) });

  // Run pending migrations
  for (const migration of migrations) {
    if (!appliedMigrations.has(migration.idx)) {
      logger.db(`Running migration ${migration.version}...`);

      // Execute migration SQL
      await db.execAsync(migration.sql);

      // Record completion
      await db.runAsync(
        'INSERT INTO _journal (idx, version, created_at) VALUES (?, ?, ?)',
        [migration.idx, migration.version, Date.now()]
      );

      logger.db(`Migration ${migration.version} completed.`);
    }
  }

  logger.db('All migrations complete');
}
