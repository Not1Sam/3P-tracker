import { eq, desc } from 'drizzle-orm';
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
