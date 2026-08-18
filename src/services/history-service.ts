import { startOfMonth, endOfMonth } from 'date-fns';
import { startOfDay, endOfDay } from 'date-fns';
import {
  getPoopLogsByDateRange,
  getPoopLogById,
  updatePoopLog,
  deletePoopLog,
  createPoopLog,
  getPissLogsByDateRange,
  getPissLogById,
  updatePissLog,
  deletePissLog,
  createPissLog,
} from '@/services/api/repositories';
import { toLocalDateString } from '@/utils/date-helpers';
import type {
  PoopLogEntry,
  PissLogEntry,
  LogType,
  SmellLevel,
} from '@/types/logging';
import { logger } from '@/utils/logger';

/**
 * Get markedDates for calendar from a month's entries.
 * Only queries timestamp column for performance (Pitfall 1).
 * Per D-01: calendar color-coded dots.
 */
export async function getCalendarMarkedDates(
  year: number,
  month: number,
): Promise<{ poopDates: Set<string>; pissDates: Set<string> }> {
  logger.db('Fetching calendar marked dates', { year, month });
  const start = startOfMonth(new Date(year, month));
  const end = endOfMonth(new Date(year, month));

  const [poopEntries, pissEntries] = await Promise.all([
    getPoopLogsByDateRange(start, end),
    getPissLogsByDateRange(start, end),
  ]);

  const poopDates = new Set(poopEntries.map((e) => toLocalDateString(e.timestamp)));
  const pissDates = new Set(pissEntries.map((e) => toLocalDateString(e.timestamp)));
  logger.db('Calendar dates fetched', { poopCount: poopDates.size, pissCount: pissDates.size });
  return { poopDates, pissDates };
}

/**
 * Get all entries for a specific date (day detail view).
 * Per D-02: tapping a day shows all entries for that day.
 */
export async function getEntriesForDate(
  date: Date,
): Promise<{ poop: PoopLogEntry[]; piss: PissLogEntry[] }> {
  logger.db('Fetching entries for date', { date: date.toISOString() });
  const [poop, piss] = await Promise.all([
    getPoopLogsByDate(date),
    getPissLogsByDate(date),
  ]);
  logger.db('Entries fetched', { poopCount: poop.length, pissCount: piss.length });
  return { poop, piss };
}

/**
 * Get paginated entries for list view.
 * Queries both repos, merges and sorts by timestamp descending.
 * Per D-03: chronological scroll with pagination.
 */
export async function getEntriesPaginated(
  limit: number,
  offset: number,
): Promise<(PoopLogEntry | PissLogEntry)[]> {
  logger.db('Fetching paginated entries', { limit, offset });
  const [poopEntries, pissEntries] = await Promise.all([
    getPoopLogsByDateRange(new Date(0), new Date()),
    getPissLogsByDateRange(new Date(0), new Date()),
  ]);

  // Merge and sort by timestamp descending
  const all = [...poopEntries, ...pissEntries].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
  );

  const result = all.slice(offset, offset + limit);
  logger.db('Paginated entries fetched', { total: all.length, returned: result.length });
  return result;
}

/**
 * Get a single entry by id, dispatching to the correct repo by type.
 * Per D-05: entry detail screen data.
 */
export async function getEntryById(
  id: string,
  type: LogType,
): Promise<PoopLogEntry | PissLogEntry | undefined> {
  logger.db('Fetching entry by id', { id, type });
  let entry;
  if (type === 'poop') {
    entry = await getPoopLogById(id);
  } else {
    entry = await getPissLogById(id);
  }
  logger.db('Entry fetch result', { id, found: entry != null });
  return entry;
}

/**
 * Update an entry's editable fields.
 * Per D-06: only typeId/colorId/comment/smell are editable.
 * Per D-07: smell is editable for piss entries.
 */
export async function updateEntry(
  id: string,
  type: LogType,
  fields: {
    typeId?: number;
    colorId?: number;
    smell?: SmellLevel;
    comment?: string;
  },
): Promise<void> {
  logger.db('Updating entry', { id, type });
  if (type === 'poop') {
    await updatePoopLog(id, {
      typeId: fields.typeId,
      comment: fields.comment,
    });
  } else {
    await updatePissLog(id, {
      colorId: fields.colorId,
      smell: fields.smell,
      comment: fields.comment,
    });
  }
  logger.db('Entry updated', { id, type });
}

/**
 * Delete an entry with undo support.
 * Fetches entry for potential undo, deletes, shows toast with 3s window.
 * Per D-08/D-09: swipe-to-delete with undo toast.
 */
export async function deleteEntryWithUndo(
  id: string,
  type: LogType,
  toastCallback: (msg: string, onUndo: () => void) => void,
  refreshCallback: () => void,
): Promise<void> {
  logger.db('Deleting entry with undo support', { id, type });

  // Fetch entry for potential undo re-creation
  const entry = await getEntryById(id, type);

  // Delete from DB
  if (type === 'poop') {
    await deletePoopLog(id);
  } else {
    await deletePissLog(id);
  }

  logger.db('Entry deleted', { id, type });

  // Show undo toast with 3-second window
  toastCallback('Entry deleted', async () => {
    // Undo: re-create the entry
    if (entry) {
      logger.db('Undoing delete, re-creating entry', { id, type });
      if (type === 'poop') {
        const poopEntry = entry as PoopLogEntry;
        await createPoopLog({
          typeId: poopEntry.typeId ?? undefined,
          comment: poopEntry.comment ?? undefined,
          location: poopEntry.locationLat != null
            ? {
                lat: poopEntry.locationLat,
                lng: poopEntry.locationLng!,
                city: poopEntry.locationCity,
              }
            : undefined,
        });
      } else {
        const pissEntry = entry as PissLogEntry;
        await createPissLog({
          colorId: pissEntry.colorId ?? undefined,
          smell: pissEntry.smell ?? undefined,
          comment: pissEntry.comment ?? undefined,
          location: pissEntry.locationLat != null
            ? {
                lat: pissEntry.locationLat,
                lng: pissEntry.locationLng!,
                city: pissEntry.locationCity,
              }
            : undefined,
        });
      }
      logger.db('Entry re-created (undo)', { id, type });
      refreshCallback();
    }
  });
}
