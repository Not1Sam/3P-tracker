// Mock expo-location
import * as Location from 'expo-location';
import {
  captureLocation,
  createPoopLog,
  createPissLog,
  undoLastLog,
} from '@/services/logging-service';
import {
  createPoopLog as repoCreatePoopLog,
  deletePoopLog,
} from '@/db/repositories/poop-repository';
import {
  createPissLog as repoCreatePissLog,
  deletePissLog,
} from '@/db/repositories/piss-repository';

jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
  Accuracy: { Balanced: 'balanced' },
}));

// Mock repositories
jest.mock('@/db/repositories/poop-repository', () => ({
  createPoopLog: jest.fn(),
  deletePoopLog: jest.fn(),
}));

jest.mock('@/db/repositories/piss-repository', () => ({
  createPissLog: jest.fn(),
  deletePissLog: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('captureLocation', () => {
  it('returns null when permission not granted', async () => {
    (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied',
    });

    const result = await captureLocation();

    expect(result).toBeNull();
    expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
  });

  it('returns lat, lng, city on success', async () => {
    (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: { latitude: 40.7128, longitude: -74.006 },
    });
    (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValue([
      { city: 'New York', name: 'Manhattan' },
    ]);

    const result = await captureLocation();

    expect(result).toEqual({
      lat: 40.7128,
      lng: -74.006,
      city: 'New York',
    });
  });

  it('returns null on any error (GPS off, etc.)', async () => {
    (Location.getForegroundPermissionsAsync as jest.Mock).mockRejectedValue(
      new Error('GPS unavailable')
    );

    const result = await captureLocation();

    expect(result).toBeNull();
  });

  it('uses Accuracy.Balanced for position', async () => {
    (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: { latitude: 0, longitude: 0 },
    });
    (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValue([]);

    await captureLocation();

    expect(Location.getCurrentPositionAsync).toHaveBeenCalledWith({
      accuracy: Location.Accuracy.Balanced,
    });
  });

  it('returns city from name when city is null', async () => {
    (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: { latitude: 0, longitude: 0 },
    });
    (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValue([
      { city: null, name: 'SomePlace' },
    ]);

    const result = await captureLocation();

    expect(result?.city).toBe('SomePlace');
  });
});

describe('createPoopLog', () => {
  it('generates UUID via captureLocation and calls repository', async () => {
    (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied',
    });
    (repoCreatePoopLog as jest.Mock).mockResolvedValue('new-id-123');

    const result = await createPoopLog({ typeId: 3, comment: 'test' });

    expect(result.id).toBe('new-id-123');
    expect(result.error).toBeUndefined();
    expect(repoCreatePoopLog).toHaveBeenCalledWith({
      typeId: 3,
      comment: 'test',
      location: undefined,
    });
  });

  it('returns empty id and error on repository failure', async () => {
    (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied',
    });
    (repoCreatePoopLog as jest.Mock).mockRejectedValue(
      new Error('DB write failed')
    );

    const result = await createPoopLog({});

    expect(result.id).toBe('');
    expect(result.error).toBe('DB write failed');
  });

  it('returns entry saved even when location fails', async () => {
    (Location.getForegroundPermissionsAsync as jest.Mock).mockRejectedValue(
      new Error('No GPS')
    );
    (repoCreatePoopLog as jest.Mock).mockResolvedValue('saved-id');

    const result = await createPoopLog({ typeId: 1 });

    expect(result.id).toBe('saved-id');
    expect(result.error).toBeUndefined();
  });
});

describe('createPissLog', () => {
  it('generates UUID via captureLocation and calls repository', async () => {
    (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: { latitude: 1, longitude: 2 },
    });
    (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValue([
      { city: 'TestCity' },
    ]);
    (repoCreatePissLog as jest.Mock).mockResolvedValue('piss-id-456');

    const result = await createPissLog({
      colorId: 2,
      smell: 'strong',
      comment: 'note',
    });

    expect(result.id).toBe('piss-id-456');
    expect(result.error).toBeUndefined();
    expect(repoCreatePissLog).toHaveBeenCalledWith({
      colorId: 2,
      smell: 'strong',
      comment: 'note',
      location: { lat: 1, lng: 2, city: 'TestCity' },
    });
  });

  it('returns empty id and error on failure', async () => {
    (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied',
    });
    (repoCreatePissLog as jest.Mock).mockRejectedValue(
      new Error('Piss repo error')
    );

    const result = await createPissLog({});

    expect(result.id).toBe('');
    expect(result.error).toBe('Piss repo error');
  });
});

describe('undoLastLog', () => {
  it('calls deletePoopLog for poop type', async () => {
    (deletePoopLog as jest.Mock).mockResolvedValue(undefined);

    const result = await undoLastLog('poop', 'poop-id-1');

    expect(result.success).toBe(true);
    expect(deletePoopLog).toHaveBeenCalledWith('poop-id-1');
  });

  it('calls deletePissLog for piss type', async () => {
    (deletePissLog as jest.Mock).mockResolvedValue(undefined);

    const result = await undoLastLog('piss', 'piss-id-1');

    expect(result.success).toBe(true);
    expect(deletePissLog).toHaveBeenCalledWith('piss-id-1');
  });

  it('returns success false on error', async () => {
    (deletePoopLog as jest.Mock).mockRejectedValue(new Error('Delete failed'));

    const result = await undoLastLog('poop', 'bad-id');

    expect(result.success).toBe(false);
  });
});
