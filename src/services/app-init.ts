import { getEncryptionKey } from '@/services/key-manager';
import { getDatabase } from '@/db';
import { runMigrations } from '@/db/migrate';
import { storage } from '@/services/settings';
import * as SQLite from 'expo-sqlite';
import { logger } from '@/utils/logger';

const DATABASE_NAME = '3ptracker.db';

/**
 * Initialize the application.
 * Orchestrates the startup sequence:
 * 1. Retrieve encryption key from SecureStore
 * 2. Open encrypted database with key
 * 3. Run Drizzle migrations
 * 4. Initialize MMKV settings
 *
 * This is the single entry point called on app launch.
 */
export async function initializeApp(): Promise<{ db: SQLite.SQLiteDatabase }> {
  logger.appInit('Starting app initialization...');

  // Step 1: Retrieve encryption key
  logger.appInit('Retrieving encryption key...');
  const encryptionKey = await getEncryptionKey();
  logger.appInit('Encryption key retrieved.');

  // Step 2: Open encrypted database
  logger.appInit('Opening encrypted database...');
  const sqliteDb = await SQLite.openDatabaseAsync(DATABASE_NAME);

  // Set encryption key via PRAGMA (must be first operation)
  await sqliteDb.execAsync(`PRAGMA key = '${encryptionKey}'`);

  // Enable WAL mode for better performance
  await sqliteDb.execAsync('PRAGMA journal_mode = WAL');
  logger.db('Database opened with encryption and WAL mode');

  // Step 3: Run migrations
  logger.db('Running migrations...');
  await runMigrations(sqliteDb);
  logger.db('Migrations completed');

  // Step 4: Initialize MMKV settings (already initialized on import)
  // MMKV is a singleton, so just accessing it initializes it
  logger.appInit('MMKV settings initialized');

  logger.appReady('App initialization complete');
  await logger.flush();

  return { db: sqliteDb };
}
