import { startOfMonth, endOfMonth } from 'date-fns';
import {
  getPoopLogsByDateRange,
  getPoopLogsByDate,
  getPoopLogById,
  updatePoopLog,
  deletePoopLog,
  createPoopLog,
} from '@/db/repositories/poop-repository';
import {
  getPissLogsByDateRange,
  getPissLogsByDate,
  getPissLogById,
  updatePissLog,
  deletePissLog,
  createPissLog,
} from '@/db/repositories/piss-repository';
import { toLocalDateString } from '@/utils/date-helpers';
import type {
  PoopLogEntry,
  PissLogEntry,
  LogType,
  SmellLevel,
} from '@/types/logging';

/**
 * Get markedDates for calendar from a month's entries.
 * Only queries timestamp column for performance (Pitfall 1).
 * Per D-01: calendar color-coded dots.
 */
export async function getCalendarMarkedDates(
  year: number,
  month: number,
): Promise<{ poopDates: Set<string>; pissDates: Set<string> }> {
  const start = startOfMonth(new Date(year, month));
  const end = endOfMonth(new Date(year, month));

  const [poopEntries, pissEntries] = await Promise.all([
    getPoopLogsByDateRange(start, end),
    getPissLogsByDateRange(start, end),
  ]);

  return {
    poopDates: new Set(poopEntries.map((e) => toLocalDateString(e.timestamp))),
    pissDates: new Set(pissEntries.map((e) => toLocalDateString(e.timestamp))),
  };
}

/**
 * Get all entries for a specific date (day detail view).
 * Per D-02: tapping a day shows all entries for that day.
 */
export async function getEntriesForDate(
  date: Date,
): Promise<{ poop: PoopLogEntry[]; piss: PissLogEntry[] }> {
  const [poop, piss] = await Promise.all([
    getPoopLogsByDate(date),
    getPissLogsByDate(date),
  ]);
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
  const [poopEntries, pissEntries] = await Promise.all([
    getPoopLogsByDateRange(new Date(0), new Date()),
    getPissLogsByDateRange(new Date(0), new Date()),
  ]);

  // Merge and sort by timestamp descending
  const all = [...poopEntries, ...pissEntries].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
  );

  return all.slice(offset, offset + limit);
}

/**
 * Get a single entry by id, dispatching to the correct repo by type.
 * Per D-05: entry detail screen data.
 */
export async function getEntryById(
  id: string,
  type: LogType,
): Promise<PoopLogEntry | PissLogEntry | undefined> {
  if (type === 'poop') {
    return getPoopLogById(id);
  }
  return getPissLogById(id);
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
  // Fetch entry for potential undo re-creation
  const entry = await getEntryById(id, type);

  // Delete from DB
  if (type === 'poop') {
    await deletePoopLog(id);
  } else {
    await deletePissLog(id);
  }

  // Show undo toast with 3-second window
  toastCallback('Entry deleted', async () => {
    // Undo: re-create the entry
    if (entry) {
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
      refreshCallback();
    }
  });
}
