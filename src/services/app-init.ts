import { getEncryptionKey } from '@/services/key-manager';
import { getDatabase } from '@/db';
import { runMigrations } from '@/db/migrate';
import { storage } from '@/services/settings';
import * as SQLite from 'expo-sqlite';

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
  console.log('Starting app initialization...');

  // Step 1: Retrieve encryption key
  console.log('Retrieving encryption key...');
  const encryptionKey = await getEncryptionKey();
  console.log('Encryption key retrieved.');

  // Step 2: Open encrypted database
  console.log('Opening encrypted database...');
  const sqliteDb = await SQLite.openDatabaseAsync(DATABASE_NAME);

  // Set encryption key via PRAGMA (must be first operation)
  await sqliteDb.execAsync(`PRAGMA key = '${encryptionKey}'`);

  // Enable WAL mode for better performance
  await sqliteDb.execAsync('PRAGMA journal_mode = WAL');
  console.log('Database opened with encryption and WAL mode.');

  // Step 3: Run migrations
  console.log('Running migrations...');
  await runMigrations(sqliteDb);
  console.log('Migrations completed.');

  // Step 4: Initialize MMKV settings (already initialized on import)
  // MMKV is a singleton, so just accessing it initializes it
  console.log('MMKV settings initialized.');

  console.log('App initialization complete.');

  return { db: sqliteDb };
}
