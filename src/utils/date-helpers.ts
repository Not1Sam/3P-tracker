import { format, isToday, isYesterday } from 'date-fns';
import type { PoopLogEntry, PissLogEntry } from '@/types/logging';

/**
 * Format date for section header (D-03).
 * Returns "Today", "Yesterday", "MMM d", or "MMM d, yyyy".
 */
export function formatDateHeader(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';

  const now = new Date();
  if (date.getFullYear() === now.getFullYear()) {
    return format(date, 'MMM d');
  }
  return format(date, 'MMM d, yyyy');
}

/**
 * Format timestamp for entry card (D-04).
 * Returns "h:mm a" for today, "MMM d, h:mm a" for older entries.
 */
export function formatEntryTime(date: Date): string {
  if (isToday(date)) {
    return format(date, 'h:mm a');
  }
  return format(date, 'MMM d, h:mm a');
}

/**
 * Get local date string in "YYYY-MM-DD" format.
 * Uses local date components to avoid timezone issues (Pitfall 6).
 */
export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface DateSection {
  title: string;
  dateKey: string;
  data: (PoopLogEntry | PissLogEntry)[];
}

/**
 * Group entries by date with SectionList-compatible sections.
 * Sorted by timestamp descending (newest first).
 * Per D-03: chronological scroll with date headers.
 */
export function groupEntriesByDate(
  entries: (PoopLogEntry | PissLogEntry)[],
): DateSection[] {
  if (entries.length === 0) return [];

  // Sort by timestamp descending (newest first)
  const sorted = [...entries].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
  );

  // Group by date key
  const grouped = new Map<string, (PoopLogEntry | PissLogEntry)[]>();
  for (const entry of sorted) {
    const dateKey = toLocalDateString(entry.timestamp);
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(entry);
  }

  // Convert to SectionList format with friendly headers
  return Array.from(grouped.entries()).map(([dateKey, items]) => {
    // Parse date at noon to avoid timezone edge cases
    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(year, month - 1, day, 12, 0, 0);
    return {
      title: formatDateHeader(date),
      dateKey,
      data: items,
    };
  });
}
