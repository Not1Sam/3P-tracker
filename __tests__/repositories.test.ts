// Mock database module
// Import after mocks
import {
  createCustomType,
  getCustomTypes,
  deleteCustomType,
  createCustomColor,
  getCustomColors,
  deleteCustomColor,
} from '@/db/repositories/custom-type-repository';

import {
  createPoopLog,
  getPoopLogs,
  getPoopLogById,
  deletePoopLog,
} from '@/db/repositories/poop-repository';

import {
  createPissLog,
  getPissLogs,
  deletePissLog,
} from '@/db/repositories/piss-repository';

const mockDb: any = {
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockResolvedValue(undefined),
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn(),
  delete: jest.fn().mockReturnThis(),
};

jest.mock('@/db', () => ({
  getDatabase: jest.fn().mockResolvedValue(mockDb),
}));

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid-123'),
}));

beforeEach(() => {
  jest.clearAllMocks();
  // Reset mockDb methods
  mockDb.insert.mockReturnValue(mockDb);
  mockDb.values.mockResolvedValue(undefined);
  mockDb.select.mockReturnValue(mockDb);
  mockDb.from.mockReturnValue(mockDb);
  mockDb.where.mockReturnValue(mockDb);
  mockDb.orderBy.mockReturnValue(mockDb);
  mockDb.delete.mockReturnValue(mockDb);
  // limit defaults to empty array; tests override per-test
  mockDb.limit.mockResolvedValue([]);
});

describe('custom-type-repository', () => {
  describe('createCustomType', () => {
    it('creates a custom type with UUID and name', async () => {
      const result = await createCustomType('My Type');

      expect(result.id).toBe('test-uuid-123');
      expect(result.name).toBe('My Type');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalledWith({
        id: 'test-uuid-123',
        name: 'My Type',
        createdAt: expect.any(Date),
      });
    });
  });

  describe('getCustomTypes', () => {
    it('returns all custom types ordered by createdAt desc', async () => {
      const mockRows = [
        { id: '1', name: 'Type A', createdAt: new Date('2026-01-02') },
        { id: '2', name: 'Type B', createdAt: new Date('2026-01-01') },
      ];
      // getCustomTypes uses select().from().orderBy() — no limit()
      // Make orderBy return a promise resolving to the data
      mockDb.orderBy.mockReturnValue({
        then: (resolve: Function) => resolve(mockRows),
        [Symbol.toStringTag]: 'Promise',
      });

      const result = await getCustomTypes();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Type A');
      expect(result[1].name).toBe('Type B');
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('returns empty array when no custom types exist', async () => {
      mockDb.orderBy.mockReturnValue(Promise.resolve([]));

      const result = await getCustomTypes();

      expect(result).toHaveLength(0);
    });
  });

  describe('deleteCustomType', () => {
    it('deletes a custom type by id', async () => {
      await deleteCustomType('test-id');

      expect(mockDb.delete).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
    });
  });

  describe('createCustomColor', () => {
    it('creates a custom color with UUID, name, and hexValue', async () => {
      const result = await createCustomColor('My Color', '#FF0000');

      expect(result.id).toBe('test-uuid-123');
      expect(result.name).toBe('My Color');
      expect(result.hexValue).toBe('#FF0000');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(mockDb.values).toHaveBeenCalledWith({
        id: 'test-uuid-123',
        name: 'My Color',
        hexValue: '#FF0000',
        createdAt: expect.any(Date),
      });
    });
  });

  describe('getCustomColors', () => {
    it('returns all custom colors ordered by createdAt desc', async () => {
      const mockRows = [
        { id: '1', name: 'Color A', hexValue: '#AAA', createdAt: new Date() },
        { id: '2', name: 'Color B', hexValue: '#BBB', createdAt: new Date() },
      ];
      mockDb.orderBy.mockReturnValue(Promise.resolve(mockRows));

      const result = await getCustomColors();

      expect(result).toHaveLength(2);
      expect(result[0].hexValue).toBe('#AAA');
    });
  });

  describe('deleteCustomColor', () => {
    it('deletes a custom color by id', async () => {
      await deleteCustomColor('test-id');

      expect(mockDb.delete).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
    });
  });
});

describe('poop-repository', () => {
  describe('createPoopLog', () => {
    it('generates UUID and inserts with timestamp and location', async () => {
      const input = {
        typeId: 3,
        comment: 'Test comment',
        location: { lat: 40.7128, lng: -74.006, city: 'New York' },
      };

      const id = await createPoopLog(input);

      expect(id).toBe('test-uuid-123');
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-uuid-123',
          typeId: 3,
          comment: 'Test comment',
          locationLat: 40.7128,
          locationLng: -74.006,
          locationCity: 'New York',
        })
      );
    });

    it('handles null typeId and comment', async () => {
      const id = await createPoopLog({});

      expect(id).toBe('test-uuid-123');
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          typeId: null,
          comment: null,
          locationLat: null,
          locationLng: null,
          locationCity: null,
        })
      );
    });
  });

  describe('getPoopLogs', () => {
    it('returns entries ordered by timestamp desc', async () => {
      const mockRows = [
        { id: '1', timestamp: new Date(), typeId: 1, comment: null, locationLat: null, locationLng: null, locationCity: null, createdAt: new Date(), updatedAt: new Date() },
        { id: '2', timestamp: new Date(), typeId: 2, comment: null, locationLat: null, locationLng: null, locationCity: null, createdAt: new Date(), updatedAt: new Date() },
      ];
      mockDb.limit.mockResolvedValue(mockRows);

      const result = await getPoopLogs();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
    });
  });

  describe('getPoopLogById', () => {
    it('returns single entry by id', async () => {
      const mockRow = { id: 'test-id', timestamp: new Date(), typeId: 3, comment: 'note', locationLat: 1.0, locationLng: 2.0, locationCity: 'City', createdAt: new Date(), updatedAt: new Date() };
      mockDb.limit.mockResolvedValue([mockRow]);

      const result = await getPoopLogById('test-id');

      expect(result).toBeDefined();
      expect(result!.id).toBe('test-id');
    });

    it('returns undefined when not found', async () => {
      mockDb.limit.mockResolvedValue([]);

      const result = await getPoopLogById('nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('deletePoopLog', () => {
    it('removes entry by id', async () => {
      await deletePoopLog('test-id');

      expect(mockDb.delete).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
    });
  });
});

describe('piss-repository', () => {
  describe('createPissLog', () => {
    it('generates UUID, inserts with colorId, smell, location', async () => {
      const input = {
        colorId: 2,
        smell: 'mild' as const,
        comment: 'Test',
        location: { lat: 40.7128, lng: -74.006, city: 'New York' },
      };

      const id = await createPissLog(input);

      expect(id).toBe('test-uuid-123');
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-uuid-123',
          colorId: 2,
          smell: 'mild',
          comment: 'Test',
          locationLat: 40.7128,
          locationLng: -74.006,
          locationCity: 'New York',
        })
      );
    });

    it('handles null smell', async () => {
      const id = await createPissLog({ colorId: 1 });

      expect(id).toBe('test-uuid-123');
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          smell: null,
        })
      );
    });
  });

  describe('getPissLogs', () => {
    it('returns entries', async () => {
      const mockRows = [
        { id: '1', timestamp: new Date(), colorId: 1, smell: 'none', comment: null, locationLat: null, locationLng: null, locationCity: null, createdAt: new Date(), updatedAt: new Date() },
      ];
      mockDb.limit.mockResolvedValue(mockRows);

      const result = await getPissLogs();

      expect(result).toHaveLength(1);
    });
  });

  describe('deletePissLog', () => {
    it('removes entry by id', async () => {
      await deletePissLog('test-id');

      expect(mockDb.delete).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
    });
  });
});
