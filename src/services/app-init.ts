import { getDatabase, getSqliteDatabase } from '@/db';
import { runMigrations } from '@/db/migrate';
import { logger } from '@/utils/logger';

/**
 * Initialize the application.
 * Orchestrates the startup sequence:
 * 1. Get the shared database connection (singleton)
 * 2. Run migrations on the raw SQLite handle
 *
 * This is the single entry point called on app launch.
 */
export async function initializeApp() {
  logger.appInit('Starting app initialization...');

  // Step 1: Initialize shared DB connection (encryption, WAL, Drizzle wrapper)
  logger.appInit('Opening encrypted database...');
  await getDatabase();
  logger.db('Database opened with encryption and WAL mode');

  // Step 2: Run migrations on the raw SQLite handle
  logger.db('Running migrations...');
  const sqliteDb = await getSqliteDatabase();
  await runMigrations(sqliteDb);
  logger.db('Migrations completed');

  logger.appReady('App initialization complete');
  await logger.flush();
}
