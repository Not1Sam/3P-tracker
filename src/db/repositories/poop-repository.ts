import { eq, desc, and, gte, lte, count } from 'drizzle-orm';
import { startOfDay, endOfDay } from 'date-fns';
import { randomUUID } from 'expo-crypto';
import { getDatabase } from '@/db';
import { poopLogs } from '@/db/schema';
import type {
  PoopLogInput,
  PoopLogEntry,
  CapturedLocation,
} from '@/types/logging';

/**
 * Create a poop log entry
 * Returns the generated id for the new entry
 */
export async function createPoopLog(
  input: PoopLogInput & { location?: CapturedLocation },
): Promise<string> {
  const db = await getDatabase();
  const id = randomUUID();
  const now = new Date();

  await db.insert(poopLogs).values({
    id,
    timestamp: now,
    typeId: input.typeId ?? null,
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
 * Get poop log entries, most recent first
 * @param limit Maximum number of entries to return (default: 50)
 */
export async function getPoopLogs(limit = 50): Promise<PoopLogEntry[]> {
  const db = await getDatabase();
  const rows = await db
    .select()
    .from(poopLogs)
    .orderBy(desc(poopLogs.timestamp))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    timestamp: row.timestamp,
    typeId: row.typeId,
    comment: row.comment,
    locationLat: row.locationLat,
    locationLng: row.locationLng,
    locationCity: row.locationCity,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

/**
 * Get a single poop log entry by id
 */
export async function getPoopLogById(
  id: string,
): Promise<PoopLogEntry | undefined> {
  const db = await getDatabase();
  const rows = await db
    .select()
    .from(poopLogs)
    .where(eq(poopLogs.id, id))
    .limit(1);

  if (rows.length === 0) return undefined;

  const row = rows[0];
  return {
    id: row.id,
    timestamp: row.timestamp,
    typeId: row.typeId,
    comment: row.comment,
    locationLat: row.locationLat,
    locationLng: row.locationLng,
    locationCity: row.locationCity,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Delete a poop log entry by id
 * Used for the undo feature
 */
export async function deletePoopLog(id: string): Promise<void> {
  const db = await getDatabase();
  await db.delete(poopLogs).where(eq(poopLogs.id, id));
}

/**
 * Get poop log entries within a date range, ordered by timestamp ascending.
 * Supports calendar dot aggregation and list view date grouping.
 */
export async function getPoopLogsByDateRange(
  start: Date,
  end: Date,
): Promise<PoopLogEntry[]> {
  const db = await getDatabase();
  const rows = await db
    .select()
    .from(poopLogs)
    .where(and(gte(poopLogs.timestamp, start), lte(poopLogs.timestamp, end)))
    .orderBy(poopLogs.timestamp);

  return rows.map((row) => ({
    id: row.id,
    timestamp: row.timestamp,
    typeId: row.typeId,
    comment: row.comment,
    locationLat: row.locationLat,
    locationLng: row.locationLng,
    locationCity: row.locationCity,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

/**
 * Get all poop log entries for a specific date.
 * Convenience wrapper around getPoopLogsByDateRange with day boundaries.
 */
export async function getPoopLogsByDate(
  date: Date,
): Promise<PoopLogEntry[]> {
  return getPoopLogsByDateRange(startOfDay(date), endOfDay(date));
}

/**
 * Get all poop log entries (for backup export)
 */
export async function getAllPoopLogs(): Promise<any[]> {
  const db = await getDatabase();
  return db.select().from(poopLogs);
}

/**
 * Insert a poop log entry (for backup import)
 */
export async function insertPoopLog(row: any): Promise<void> {
  const db = await getDatabase();
  await db.insert(poopLogs).values(row).onConflictDoNothing();
}

/**
 * Get count of poop logs in a date range (for leaderboard scoring)
 */
export async function getPoopLogsCount(start: Date, end: Date): Promise<number> {
  const db = await getDatabase();
  const [{ result }] = await db
    .select({ result: count() })
    .from(poopLogs)
    .where(and(gte(poopLogs.timestamp, start), lte(poopLogs.timestamp, end)));
  return result;
}

/**
 * Get all poop log timestamps since a cutoff date (for streak calculation)
 */
export async function getPoopLogsSince(cutoff: Date): Promise<Date[]> {
  const db = await getDatabase();
  const rows = await db
    .select({ timestamp: poopLogs.timestamp })
    .from(poopLogs)
    .where(gte(poopLogs.timestamp, cutoff))
    .orderBy(poopLogs.timestamp);
  return rows.map(r => r.timestamp);
}

/**
 * Update specific fields on a poop log entry.
 * Only typeId and comment are editable (D-06: timestamp and location locked).
 */
export async function updatePoopLog(
  id: string,
  fields: { typeId?: number; comment?: string },
): Promise<void> {
  const db = await getDatabase();
  await db
    .update(poopLogs)
    .set({
      ...fields,
      updatedAt: new Date(),
    })
    .where(eq(poopLogs.id, id));
}
