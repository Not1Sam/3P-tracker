import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { getEncryptionKey } from '@/services/key-manager';
import * as schema from '@/db/schema';
import { logger } from '@/utils/logger';

const DATABASE_NAME = '3ptracker.db';

let sqliteDb: SQLite.SQLiteDatabase | null = null;
let database: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * Get the Drizzle ORM database instance.
 * Singleton — first call opens the encrypted DB, sets PRAGMA key, enables WAL,
 * and wraps in Drizzle. Subsequent calls return the cached instance.
 */
export async function getDatabase() {
  if (database) {
    return database;
  }

  logger.db('Opening database', { name: DATABASE_NAME });
  const encryptionKey = await getEncryptionKey();

  sqliteDb = await SQLite.openDatabaseAsync(DATABASE_NAME);

  await sqliteDb.execAsync(`PRAGMA key = '${encryptionKey}'`);
  await sqliteDb.execAsync('PRAGMA journal_mode = WAL');

  database = drizzle(sqliteDb, { schema });
  logger.db('Database opened and initialized', { name: DATABASE_NAME });

  return database;
}

/**
 * Get the raw expo-sqlite database handle (for running raw SQL migrations).
 * Calls getDatabase() internally to ensure the connection exists.
 */
export async function getSqliteDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!sqliteDb) {
    logger.db('SQLite handle requested, initializing database');
    await getDatabase();
  }
  return sqliteDb!;
}

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
  if (database) {
    logger.db('Closing database connection');
    database = null;
    sqliteDb = null;
    logger.db('Database connection closed');
  }
}
