import { Platform } from 'react-native';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { getEncryptionKey } from '@/services/key-manager';
import { runMigrations } from '@/db/migrate';
import * as schema from '@/db/schema';
import { logger } from '@/utils/logger';

const BASE_DATABASE_NAME = '3ptracker';

let sqliteDb: any = null;
let database: any = null;
let currentUserId: string | null = null;
let pendingOpen: Promise<any> | null = null;

function getDatabaseName(userId: string | null): string {
  return userId ? `${BASE_DATABASE_NAME}-${userId}.db` : `${BASE_DATABASE_NAME}.db`;
}

/**
 * Set the current user ID for database scoping.
 */
export function setCurrentUserId(userId: string | null): void {
  if (currentUserId !== userId) {
    logger.db('Setting current user', { from: currentUserId, to: userId });
    currentUserId = userId;
    database = null;
    sqliteDb = null;
  }
}

/**
 * Get the Drizzle ORM database instance.
 */
export async function getDatabase(): Promise<any> {
  if (database) return database;
  if (pendingOpen) return pendingOpen;

  pendingOpen = openDatabase();
  try {
    return await pendingOpen;
  } finally {
    pendingOpen = null;
  }
}

async function openDatabase(): Promise<any> {
  if (Platform.OS === 'web') {
    logger.db('SQLite not available on web — running in preview mode');
    return null;
  }

  const SQLite = await import('expo-sqlite');
  const dbName = getDatabaseName(currentUserId);
  logger.db('Opening database', { name: dbName, userId: currentUserId });
  const encryptionKey = await getEncryptionKey();

  const sqlite = await SQLite.openDatabaseAsync(dbName);

  await sqlite.execAsync(`PRAGMA key = '${encryptionKey}'`);
  await sqlite.execAsync('PRAGMA journal_mode = WAL');

  await runMigrations(sqlite);

  const db = drizzle(sqlite, { schema });
  sqliteDb = sqlite;
  database = db;
  logger.db('Database opened and initialized', { name: dbName });

  return db;
}

/**
 * Get the raw expo-sqlite database handle.
 */
export async function getSqliteDatabase(): Promise<any> {
  if (Platform.OS === 'web') return null;
  if (!sqliteDb) {
    logger.db('SQLite handle requested, initializing database');
    await getDatabase();
  }
  return sqliteDb;
}

/**
 * Close the database connection.
 */
export async function closeDatabase(): Promise<void> {
  if (database) {
    logger.db('Closing database connection', { userId: currentUserId });
    database = null;
    sqliteDb = null;
    logger.db('Database connection closed');
  }
}
