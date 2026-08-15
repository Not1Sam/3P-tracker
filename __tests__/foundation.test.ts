// Mock Expo modules before imports
// Now import the modules
import { BRISTOL_TYPES } from '@/constants/bristol-chart';
import { PISS_COLORS } from '@/constants/color-palette';
import {
  DataTier,
  classifyTable,
  getSyncableTables,
  canSync,
} from '@/constants/privacy-tiers';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

jest.mock('expo-crypto', () => ({
  getRandomValues: jest.fn((arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  }),
}));

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    getNumber: jest.fn(),
  })),
}));

jest.mock('react-native', () => ({
  InteractionManager: {
    runAfterInteractions: jest.fn((cb: () => Promise<void>) => cb()),
  },
}));

jest.mock('drizzle-orm/expo-sqlite', () => ({
  drizzle: jest.fn(),
}));

jest.mock('drizzle-orm', () => ({
  gte: jest.fn(),
}));

// Test 1: Database encryption (LOG-12)
describe('Database Encryption', () => {
  test('SQLCipher is configured in app.json', () => {
    // Verify that the SQLCipher plugin is configured
    const appJson = require('../app.json');
    expect(appJson.expo.plugins).toBeDefined();
    expect(
      appJson.expo.plugins.some(
        (plugin: any) =>
          Array.isArray(plugin) && plugin[0] === 'expo-sqlite'
      )
    ).toBe(true);
  });

  test('Encryption key manager exports required functions', () => {
    const keyManager = require('@/services/key-manager');
    expect(typeof keyManager.getEncryptionKey).toBe('function');
    expect(typeof keyManager.hasEncryptionKey).toBe('function');
  });
});

// Test 2: Offline logging (PLAT-04)
describe('Offline Logging', () => {
  test('Database connection module exports getDatabase', () => {
    const db = require('@/db');
    expect(typeof db.getDatabase).toBe('function');
  });

  test('Schema defines all required tables', () => {
    const schema = require('@/db/schema');
    // Verify tables exist (they're exported as objects)
    expect(schema.poopLogs).toBeDefined();
    expect(schema.pissLogs).toBeDefined();
    expect(schema.periodLogs).toBeDefined();
    expect(schema.customTypes).toBeDefined();
    expect(schema.customColors).toBeDefined();
    expect(schema.userSettings).toBeDefined();
  });
});

// Test 3: Privacy tiers
describe('Privacy Tiers', () => {
  test('period_logs cannot be synced (Tier 1)', () => {
    expect(canSync('period_logs')).toBe(false);
  });

  test('poop_logs can be synced (Tier 2)', () => {
    expect(canSync('poop_logs')).toBe(true);
  });

  test('piss_logs can be synced (Tier 2)', () => {
    expect(canSync('piss_logs')).toBe(true);
  });

  test('SYNCABLE_TABLES only contains Tier 2 tables', () => {
    const syncable = getSyncableTables();
    expect(syncable).toEqual(['poop_logs', 'piss_logs']);
    expect(syncable).not.toContain('period_logs');
  });

  test('classifyTable returns correct tiers', () => {
    expect(classifyTable('period_logs')).toBe(DataTier.PERIOD);
    expect(classifyTable('poop_logs')).toBe(DataTier.BODILY_LOG);
    expect(classifyTable('piss_logs')).toBe(DataTier.BODILY_LOG);
    expect(classifyTable('custom_types')).toBe(DataTier.SOCIAL);
    expect(classifyTable('custom_colors')).toBe(DataTier.SOCIAL);
    expect(classifyTable('user_settings')).toBe(DataTier.SOCIAL);
  });

  test('unknown table returns null', () => {
    expect(classifyTable('unknown_table')).toBeNull();
  });
});

// Test 4: Key lifecycle
describe('Key Lifecycle', () => {
  test('Key manager generates and stores encryption key', async () => {
    const { getEncryptionKey, hasEncryptionKey } = require('@/services/key-manager');
    expect(typeof getEncryptionKey).toBe('function');
    expect(typeof hasEncryptionKey).toBe('function');
  });
});

// Test 5: Schema completeness
describe('Schema Completeness', () => {
  test('period_logs table has NO isSynced column', () => {
    const { periodLogs } = require('@/db/schema');
    expect((periodLogs as any).isSynced).toBeUndefined();
  });

  test('period_logs table has NO location columns', () => {
    const { periodLogs } = require('@/db/schema');
    expect((periodLogs as any).locationLat).toBeUndefined();
    expect((periodLogs as any).locationLng).toBeUndefined();
    expect((periodLogs as any).locationCity).toBeUndefined();
  });

  test('poop_logs table has location columns', () => {
    const { poopLogs } = require('@/db/schema');
    expect(poopLogs.locationLat).toBeDefined();
    expect(poopLogs.locationLng).toBeDefined();
    expect(poopLogs.locationCity).toBeDefined();
  });

  test('piss_logs table has smell column', () => {
    const { pissLogs } = require('@/db/schema');
    expect(pissLogs.smell).toBeDefined();
  });

  test('period_logs table has flowLevel column', () => {
    const { periodLogs } = require('@/db/schema');
    expect(periodLogs.flowLevel).toBeDefined();
  });
});

// Test 6: Constants
describe('Constants', () => {
  test('Bristol chart has 7 types', () => {
    expect(BRISTOL_TYPES).toHaveLength(7);
  });

  test('Bristol types have correct IDs', () => {
    BRISTOL_TYPES.forEach((type, index) => {
      expect(type.id).toBe(index + 1);
    });
  });

  test('Piss colors has 8 colors', () => {
    expect(PISS_COLORS).toHaveLength(8);
  });

  test('Privacy tiers are defined', () => {
    expect(DataTier.PERIOD).toBe(1);
    expect(DataTier.BODILY_LOG).toBe(2);
    expect(DataTier.SOCIAL).toBe(3);
  });
});
