import { getDatabase } from '@/db';
import { logger } from '@/utils/logger';

/**
 * Initialize the application.
 * Ensures the database connection is established (encryption, WAL, Drizzle, migrations).
 * Migrations run automatically inside getDatabase() on each newly opened DB.
 */
export async function initializeApp() {
  logger.appInit('Starting app initialization...');

  // Initialize DB connection (migrations run inside getDatabase)
  logger.appInit('Opening encrypted database...');
  await getDatabase();
  logger.db('Database opened with encryption, WAL mode, and migrations');

  logger.appReady('App initialization complete');
  await logger.flush();
}
