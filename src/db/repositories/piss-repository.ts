import { eq, desc, and, gte, lte, count } from 'drizzle-orm';
import { startOfDay, endOfDay } from 'date-fns';
import { randomUUID } from 'expo-crypto';
import { getDatabase } from '@/db';
import { pissLogs } from '@/db/schema';
import { logger } from '@/utils/logger';
import type {
  PissLogInput,
  PissLogEntry,
  SmellLevel,
  CapturedLocation,
} from '@/types/logging';

/**
 * Create a piss log entry
 * Returns the generated id for the new entry
 */
export async function createPissLog(
  input: PissLogInput & { location?: CapturedLocation },
): Promise<string> {
  logger.dbWrite('piss_logs', { colorId: input.colorId, smell: input.smell, hasLocation: !!input.location });
  const db = await getDatabase();
  const id = randomUUID();
  const now = new Date();

  await db.insert(pissLogs).values({
    id,
    timestamp: now,
    colorId: input.colorId ?? null,
    smell: (input.smell as string) ?? null,
    comment: input.comment ?? null,
    locationLat: input.location?.lat ?? null,
    locationLng: input.location?.lng ?? null,
    locationCity: input.location?.city ?? null,
    createdAt: now,
    updatedAt: now,
  });

  return id;
}

/**
 * Get piss log entries, most recent first
 * @param limit Maximum number of entries to return (default: 50)
 */
export async function getPissLogs(limit = 50): Promise<PissLogEntry[]> {
  logger.dbRead('piss_logs', { limit });
  const db = await getDatabase();
  const rows = await db
    .select()
    .from(pissLogs)
    .orderBy(desc(pissLogs.timestamp))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    timestamp: row.timestamp,
    colorId: row.colorId,
    smell: row.smell as SmellLevel | null,
    comment: row.comment,
    locationLat: row.locationLat,
    locationLng: row.locationLng,
    locationCity: row.locationCity,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

/**
 * Get a single piss log entry by id
 */
export async function getPissLogById(
  id: string,
): Promise<PissLogEntry | undefined> {
  logger.dbRead('piss_logs', { action: 'getById', id });
  const db = await getDatabase();
  const rows = await db
    .select()
    .from(pissLogs)
    .where(eq(pissLogs.id, id))
    .limit(1);

  if (rows.length === 0) return undefined;

  const row = rows[0];
  return {
    id: row.id,
    timestamp: row.timestamp,
    colorId: row.colorId,
    smell: row.smell as SmellLevel | null,
    comment: row.comment,
    locationLat: row.locationLat,
    locationLng: row.locationLng,
    locationCity: row.locationCity,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Delete a piss log entry by id
 * Used for the undo feature
 */
export async function deletePissLog(id: string): Promise<void> {
  logger.dbWrite('piss_logs', { action: 'delete', id });
  const db = await getDatabase();
  await db.delete(pissLogs).where(eq(pissLogs.id, id));
}

/**
 * Get piss log entries within a date range, ordered by timestamp ascending.
 * Supports calendar dot aggregation and list view date grouping.
 */
export async function getPissLogsByDateRange(
  start: Date,
  end: Date,
): Promise<PissLogEntry[]> {
  logger.dbRead('piss_logs', { action: 'byDateRange', start: start.toISOString(), end: end.toISOString() });
  const db = await getDatabase();
  const rows = await db
    .select()
    .from(pissLogs)
    .where(and(gte(pissLogs.timestamp, start), lte(pissLogs.timestamp, end)))
    .orderBy(pissLogs.timestamp);

  return rows.map((row) => ({
    id: row.id,
    timestamp: row.timestamp,
    colorId: row.colorId,
    smell: row.smell as SmellLevel | null,
    comment: row.comment,
    locationLat: row.locationLat,
    locationLng: row.locationLng,
    locationCity: row.locationCity,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

/**
 * Get all piss log entries for a specific date.
 * Convenience wrapper around getPissLogsByDateRange with day boundaries.
 */
export async function getPissLogsByDate(
  date: Date,
): Promise<PissLogEntry[]> {
  return getPissLogsByDateRange(startOfDay(date), endOfDay(date));
}

/**
 * Get all piss log entries (for backup export)
 */
export async function getAllPissLogs(): Promise<any[]> {
  logger.dbRead('piss_logs', { action: 'getAllForBackup' });
  const db = await getDatabase();
  return db.select().from(pissLogs);
}

/**
 * Insert a piss log entry (for backup import)
 */
export async function insertPissLog(row: any): Promise<void> {
  logger.dbWrite('piss_logs', { action: 'import' });
  const db = await getDatabase();
  await db.insert(pissLogs).values(row).onConflictDoNothing();
}

/**
 * Get count of piss logs in a date range (for leaderboard scoring)
 */
export async function getPissLogsCount(start: Date, end: Date): Promise<number> {
  logger.dbRead('piss_logs', { action: 'count' });
  const db = await getDatabase();
  const [{ result }] = await db
    .select({ result: count() })
    .from(pissLogs)
    .where(and(gte(pissLogs.timestamp, start), lte(pissLogs.timestamp, end)));
  return result;
}

/**
 * Get all piss log timestamps since a cutoff date (for streak calculation)
 */
export async function getPissLogsSince(cutoff: Date): Promise<Date[]> {
  logger.dbRead('piss_logs', { action: 'since', cutoff: cutoff.toISOString() });
  const db = await getDatabase();
  const rows = await db
    .select({ timestamp: pissLogs.timestamp })
    .from(pissLogs)
    .where(gte(pissLogs.timestamp, cutoff))
    .orderBy(pissLogs.timestamp);
  return rows.map(r => r.timestamp);
}

/**
 * Update specific fields on a piss log entry.
 * ColorId, smell, and comment are editable (D-06/D-07: timestamp and location locked).
 */
export async function updatePissLog(
  id: string,
  fields: { colorId?: number; smell?: SmellLevel; comment?: string },
): Promise<void> {
  logger.dbWrite('piss_logs', { action: 'update', id, fields: Object.keys(fields) });
  const db = await getDatabase();
  await db
    .update(pissLogs)
    .set({
      ...fields,
      updatedAt: new Date(),
    })
    .where(eq(pissLogs.id, id));
}
