import { eq, desc, asc, and, gte, lte, count } from 'drizzle-orm';
import { randomUUID } from 'expo-crypto';
import { getDatabase } from '@/db';
import { periodLogs } from '@/db/schema';
import type { PeriodLogInput, PeriodLogEntry, FlowLevel, Mood } from '@/types/period';

/**
 * Map a raw database row to a typed PeriodLogEntry.
 * Handles JSON parsing for symptoms and null coercion for optional fields.
 */
function mapRowToEntry(
  row: typeof periodLogs.$inferSelect,
): PeriodLogEntry {
  let symptoms: PeriodLogEntry['symptoms'] = null;
  if (row.symptoms) {
    try {
      const parsed = JSON.parse(row.symptoms);
      symptoms = Array.isArray(parsed) ? parsed : null;
    } catch {
      symptoms = null;
    }
  }

  return {
    id: row.id,
    timestamp: row.timestamp,
    flowLevel: (row.flowLevel as FlowLevel) ?? null,
    symptoms,
    mood: (row.mood as Mood) ?? null,
    cycleDay: row.cycleDay ?? null,
    comment: row.comment ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Create a period log entry.
 * Auto-captures timestamp (D-19). Returns the generated id.
 */
export async function createPeriodLog(
  input: PeriodLogInput,
): Promise<string> {
  const db = await getDatabase();
  const id = randomUUID();
  const now = new Date();

  await db.insert(periodLogs).values({
    id,
    timestamp: now,
    flowLevel: input.flowLevel ?? null,
    symptoms: input.symptoms ? JSON.stringify(input.symptoms) : null,
    mood: input.mood ?? null,
    cycleDay: null,
    comment: input.comment ?? null,
    createdAt: now,
    updatedAt: now,
  });

  return id;
}

/**
 * Get period log entries, most recent first.
 * @param limit Maximum number of entries to return (default: 100)
 */
export async function getPeriodLogs(
  limit = 100,
): Promise<PeriodLogEntry[]> {
  const db = await getDatabase();
  const rows = await db
    .select()
    .from(periodLogs)
    .orderBy(desc(periodLogs.timestamp))
    .limit(limit);

  return rows.map(mapRowToEntry);
}

/**
 * Get period log entries within a date range, ordered by timestamp ascending.
 * Supports cycle calculation and calendar views.
 */
export async function getPeriodLogsByDateRange(
  start: Date,
  end: Date,
): Promise<PeriodLogEntry[]> {
  const db = await getDatabase();
  const rows = await db
    .select()
    .from(periodLogs)
    .where(and(gte(periodLogs.timestamp, start), lte(periodLogs.timestamp, end)))
    .orderBy(asc(periodLogs.timestamp));

  return rows.map(mapRowToEntry);
}

/**
 * Get a single period log entry by id.
 */
export async function getPeriodLogById(
  id: string,
): Promise<PeriodLogEntry | undefined> {
  const db = await getDatabase();
  const rows = await db
    .select()
    .from(periodLogs)
    .where(eq(periodLogs.id, id))
    .limit(1);

  if (rows.length === 0) return undefined;

  return mapRowToEntry(rows[0]);
}

/**
 * Update specific fields on a period log entry.
 * Editable: flowLevel, symptoms, mood, comment.
 */
export async function updatePeriodLog(
  id: string,
  fields: Partial<PeriodLogInput>,
): Promise<void> {
  const db = await getDatabase();
  await db
    .update(periodLogs)
    .set({
      ...fields,
      symptoms: fields.symptoms
        ? JSON.stringify(fields.symptoms)
        : undefined,
      updatedAt: new Date(),
    })
    .where(eq(periodLogs.id, id));
}

/**
 * Delete a period log entry by id.
 */
export async function deletePeriodLog(id: string): Promise<void> {
  const db = await getDatabase();
  await db.delete(periodLogs).where(eq(periodLogs.id, id));
}

/**
 * Get the total count of period log entries.
 */
export async function getPeriodLogCount(): Promise<number> {
  const db = await getDatabase();
  const [result] = await db
    .select({ count: count() })
    .from(periodLogs);
  return result?.count ?? 0;
}
