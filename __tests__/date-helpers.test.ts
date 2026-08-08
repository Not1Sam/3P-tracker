/**
 * Tests for date-helpers.ts
 * These are RED-phase scaffolds — they define expected behavior
 * before implementation exists. All tests should fail until Task 2.
 */

import {
  formatDateHeader,
  formatEntryTime,
  toLocalDateString,
  groupEntriesByDate,
} from '@/utils/date-helpers';

describe('date-helpers', () => {
  describe('formatDateHeader', () => {
    it('returns "Today" for today', () => {
      const today = new Date();
      expect(formatDateHeader(today)).toBe('Today');
    });

    it('returns "Yesterday" for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(formatDateHeader(yesterday)).toBe('Yesterday');
    });

    it('returns "MMM d" format for same-year dates', () => {
      const now = new Date();
      const sameYearDate = new Date(now.getFullYear(), 0, 15); // Jan 15
      const result = formatDateHeader(sameYearDate);
      expect(result).toMatch(/^[A-Z][a-z]{2} \d{1,2}$/); // e.g. "Jan 15"
    });

    it('returns "MMM d, yyyy" format for different-year dates', () => {
      const oldDate = new Date(2020, 5, 15); // June 15, 2020
      const result = formatDateHeader(oldDate);
      expect(result).toMatch(/^[A-Z][a-z]{2} \d{1,2}, \d{4}$/); // e.g. "Jun 15, 2020"
    });
  });

  describe('formatEntryTime', () => {
    it('returns time-only for today entries', () => {
      const today = new Date();
      const result = formatEntryTime(today);
      // Should be like "3:45 PM" — no date component
      expect(result).toMatch(/^\d{1,2}:\d{2} [AP]M$/);
    });

    it('returns "MMM d, h:mm a" for older entries', () => {
      const oldDate = new Date(2020, 5, 15, 14, 30); // June 15, 2020, 2:30 PM
      const result = formatEntryTime(oldDate);
      expect(result).toMatch(/^[A-Z][a-z]{2} \d{1,2}, \d{1,2}:\d{2} [AP]M$/);
    });
  });

  describe('toLocalDateString', () => {
    it('returns "YYYY-MM-DD" format', () => {
      const date = new Date(2026, 7, 8); // Aug 8, 2026
      const result = toLocalDateString(date);
      expect(result).toBe('2026-08-08');
    });

    it('zero-pads month and day', () => {
      const date = new Date(2026, 0, 5); // Jan 5, 2026
      const result = toLocalDateString(date);
      expect(result).toBe('2026-01-05');
    });
  });

  describe('groupEntriesByDate', () => {
    it('returns empty array for empty input', () => {
      const result = groupEntriesByDate([]);
      expect(result).toEqual([]);
    });

    it('groups entries by date with section headers', () => {
      const entries = [
        {
          id: '1',
          timestamp: new Date(2026, 7, 8, 10, 0),
          typeId: 1,
          comment: null,
          locationLat: null,
          locationLng: null,
          locationCity: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          timestamp: new Date(2026, 7, 8, 14, 0),
          typeId: 2,
          comment: null,
          locationLat: null,
          locationLng: null,
          locationCity: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = groupEntriesByDate(entries as any);
      expect(result.length).toBe(1);
      expect(result[0].title).toBe('Today');
      expect(result[0].data.length).toBe(2);
    });
  });
});
