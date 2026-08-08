/**
 * Tests for history-service.ts
 * GREEN-phase tests with mocked database layer.
 */

// Mock database module
const mockDb: any = {
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockResolvedValue(undefined),
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  offset: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
};

jest.mock('@/db', () => ({
  getDatabase: jest.fn().mockResolvedValue(mockDb),
}));

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid-123'),
}));

// Import after mocks
import {
  getCalendarMarkedDates,
  getEntriesForDate,
  getEntriesPaginated,
  getEntryById,
  updateEntry,
} from '@/services/history-service';

beforeEach(() => {
  jest.clearAllMocks();
  // Reset mockDb methods — orderBy resolves to empty array (terminal for range queries)
  mockDb.insert.mockReturnValue(mockDb);
  mockDb.values.mockResolvedValue(undefined);
  mockDb.select.mockReturnValue(mockDb);
  mockDb.from.mockReturnValue(mockDb);
  mockDb.where.mockReturnValue(mockDb);
  mockDb.orderBy.mockResolvedValue([]);
  mockDb.limit.mockResolvedValue([]);
  mockDb.offset.mockReturnValue(mockDb);
  mockDb.delete.mockReturnValue(mockDb);
  mockDb.update.mockReturnValue(mockDb);
  mockDb.set.mockReturnValue(mockDb);
});

describe('history-service', () => {
  describe('getCalendarMarkedDates', () => {
    it('returns { poopDates, pissDates } sets for a given month', async () => {
      // getPoopLogsByDateRange and getPissLogsByDateRange use orderBy as terminal
      mockDb.orderBy
        .mockResolvedValueOnce([]) // poop rows
        .mockResolvedValueOnce([]); // piss rows

      const result = await getCalendarMarkedDates(2026, 7); // August (0-indexed)
      expect(result).toHaveProperty('poopDates');
      expect(result).toHaveProperty('pissDates');
      expect(result.poopDates).toBeInstanceOf(Set);
      expect(result.pissDates).toBeInstanceOf(Set);
    });

    it('returns empty sets when no entries exist for the month', async () => {
      mockDb.orderBy
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await getCalendarMarkedDates(2099, 0);
      expect(result.poopDates.size).toBe(0);
      expect(result.pissDates.size).toBe(0);
    });

    it('populates poopDates when entries exist', async () => {
      const now = new Date(2026, 7, 15, 10, 0);
      mockDb.orderBy
        .mockResolvedValueOnce([{ timestamp: now }]) // poop
        .mockResolvedValueOnce([]); // piss

      const result = await getCalendarMarkedDates(2026, 7);
      expect(result.poopDates.size).toBe(1);
      expect(result.poopDates.has('2026-08-15')).toBe(true);
    });
  });

  describe('getEntriesForDate', () => {
    it('returns { poop, piss } arrays for a given date', async () => {
      mockDb.orderBy
        .mockResolvedValueOnce([]) // poop
        .mockResolvedValueOnce([]); // piss

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
      const now = new Date();
      const earlier = new Date(now.getTime() - 60000);

      mockDb.orderBy
        .mockResolvedValueOnce([
          { id: 'p1', timestamp: earlier, typeId: 1, comment: null, locationLat: null, locationLng: null, locationCity: null, createdAt: now, updatedAt: now },
        ]) // poop
        .mockResolvedValueOnce([
          { id: 'q1', timestamp: now, colorId: 1, smell: 'none', comment: null, locationLat: null, locationLng: null, locationCity: null, createdAt: now, updatedAt: now },
        ]); // piss

      const entries = await getEntriesPaginated(10, 0);
      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(2);
      // Should be sorted newest first
      expect(entries[0].timestamp.getTime()).toBeGreaterThanOrEqual(
        entries[1].timestamp.getTime()
      );
    });
  });

  describe('getEntryById', () => {
    it('dispatches to correct repo by type', async () => {
      // getPoopLogById uses select().from().where().limit(1) — terminal is limit
      mockDb.limit.mockResolvedValue([]);

      const result = await getEntryById('non-existent-id', 'poop');
      expect(result).toBeUndefined();
    });

    it('returns poop entry when type is poop', async () => {
      const mockRow = { id: 'test-id', timestamp: new Date(), typeId: 3, comment: 'note', locationLat: null, locationLng: null, locationCity: null, createdAt: new Date(), updatedAt: new Date() };
      mockDb.limit.mockResolvedValue([mockRow]);

      const result = await getEntryById('test-id', 'poop');
      expect(result).toBeDefined();
      expect(result!.id).toBe('test-id');
    });
  });

  describe('updateEntry', () => {
    it('updates typeId and comment for poop entries', async () => {
      await updateEntry('test-id', 'poop', { typeId: 3, comment: 'updated' });
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({ typeId: 3, comment: 'updated' })
      );
    });

    it('updates colorId, smell, and comment for piss entries', async () => {
      await updateEntry('test-id', 'piss', { colorId: 2, smell: 'mild', comment: 'test' });
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({ colorId: 2, smell: 'mild', comment: 'test' })
      );
    });
  });
});
