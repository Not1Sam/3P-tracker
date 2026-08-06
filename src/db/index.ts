import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { getEncryptionKey } from '@/services/key-manager';
import * as schema from '@/db/schema';

const DATABASE_NAME = '3ptracker.db';

let database: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * Get the encrypted database instance.
 * On first call: retrieves encryption key, opens database, applies PRAGMA key,
 * enables WAL mode, and initializes Drizzle ORM.
 * Returns cached instance on subsequent calls.
 */
export async function getDatabase() {
  if (database) {
    return database;
  }

  // Get encryption key from SecureStore
  const encryptionKey = await getEncryptionKey();

  // Open the database
  const sqliteDb = await SQLite.openDatabaseAsync(DATABASE_NAME);

  // Set encryption key via PRAGMA (must be first operation)
  await sqliteDb.execAsync(`PRAGMA key = '${encryptionKey}'`);

  // Enable WAL mode for better performance
  await sqliteDb.execAsync('PRAGMA journal_mode = WAL');

  // Initialize Drizzle ORM
  database = drizzle(sqliteDb, { schema });

  return database;
}

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
  if (database) {
    // Drizzle doesn't have a direct close method, but we can clear our reference
    database = null;
  }
}
