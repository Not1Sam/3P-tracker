import { eq, desc } from 'drizzle-orm';
import { randomUUID } from 'expo-crypto';
import { getDatabase } from '@/db';
import { pissLogs } from '@/db/schema';
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
  const db = await getDatabase();
  await db.delete(pissLogs).where(eq(pissLogs.id, id));
}
