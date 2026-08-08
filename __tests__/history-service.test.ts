/**
 * Tests for history-service.ts
 * These are RED-phase scaffolds — they define expected behavior
 * before implementation exists. All tests should fail until Task 2.
 */

import {
  getCalendarMarkedDates,
  getEntriesForDate,
  getEntriesPaginated,
  getEntryById,
  updateEntry,
} from '@/services/history-service';

describe('history-service', () => {
  describe('getCalendarMarkedDates', () => {
    it('returns { poopDates, pissDates } sets for a given month', async () => {
      const result = await getCalendarMarkedDates(2026, 7); // August (0-indexed)
      expect(result).toHaveProperty('poopDates');
      expect(result).toHaveProperty('pissDates');
      expect(result.poopDates).toBeInstanceOf(Set);
      expect(result.pissDates).toBeInstanceOf(Set);
    });

    it('returns empty sets when no entries exist for the month', async () => {
      // Use a far-future date that should have no entries
      const result = await getCalendarMarkedDates(2099, 0);
      expect(result.poopDates.size).toBe(0);
      expect(result.pissDates.size).toBe(0);
    });
  });

  describe('getEntriesForDate', () => {
    it('returns { poop, piss } arrays for a given date', async () => {
      const today = new Date();
      const result = await getEntriesForDate(today);
      expect(result).toHaveProperty('poop');
      expect(result).toHaveProperty('piss');
      expect(Array.isArray(result.poop)).toBe(true);
      expect(Array.isArray(result.piss)).toBe(true);
    });
  });

  describe('getEntriesPaginated', () => {
    it('returns merged sorted entries with limit/offset', async () => {
      const entries = await getEntriesPaginated(10, 0);
      expect(Array.isArray(entries)).toBe(true);
      // Entries should be sorted by timestamp descending
      for (let i = 1; i < entries.length; i++) {
        expect(entries[i - 1].timestamp.getTime()).toBeGreaterThanOrEqual(
          entries[i].timestamp.getTime()
        );
      }
    });
  });

  describe('getEntryById', () => {
    it('dispatches to correct repo by type', async () => {
      // Test with a non-existent ID — should return undefined
      const result = await getEntryById('non-existent-id', 'poop');
      expect(result).toBeUndefined();
    });
  });

  describe('updateEntry', () => {
    it('updates typeId and comment for poop entries', async () => {
      // This test verifies the function exists and accepts correct params
      // Will fail with actual DB until implementation exists
      await expect(
        updateEntry('non-existent-id', 'poop', { typeId: 3, comment: 'updated' })
      ).resolves.toBeUndefined();
    });
  });
});
