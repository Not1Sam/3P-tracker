import * as Location from 'expo-location';
import { createPoopLog as repoCreatePoopLog } from '@/db/repositories/poop-repository';
import { createPissLog as repoCreatePissLog } from '@/db/repositories/piss-repository';
import { deletePoopLog } from '@/db/repositories/poop-repository';
import { deletePissLog } from '@/db/repositories/piss-repository';
import { logger } from '@/utils/logger';
import type {
  PoopLogInput,
  PissLogInput,
  CapturedLocation,
  LogType,
} from '@/types/logging';

/**
 * Capture the user's current location silently.
 * Returns lat/lng + reverse-geocoded city name, or null on any failure.
 * Never throws — all errors are caught and return null.
 */
export async function captureLocation(): Promise<CapturedLocation | null> {
  try {
    logger.db('Capturing location...');
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      logger.db('Location permission not granted');
      return null;
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const { latitude, longitude } = position.coords;

    const addresses = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    const city = addresses[0]?.city || addresses[0]?.name || null;
    logger.db('Location captured', { lat: latitude, lng: longitude, city });

    return { lat: latitude, lng: longitude, city };
  } catch (e) {
    logger.dbError('Failed to capture location', { error: e });
    return null;
  }
}

/**
 * Create a poop log entry.
 * Generates UUID, captures location, writes to database.
 * Returns { id } on success, { id: '', error: message } on failure.
 */
export async function createPoopLog(
  input: PoopLogInput,
): Promise<{ id: string; error?: string }> {
  logger.inputAction('Create poop log', input);
  try {
    const captured = await captureLocation();
    const location = captured ?? undefined;
    const id = await repoCreatePoopLog({ ...input, location });
    logger.dbWrite('poop_logs', { id, typeId: input.typeId });
    return { id };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error saving poop log';
    logger.dbError('Failed to create poop log', { error: message });
    return { id: '', error: message };
  }
}

/**
 * Create a piss log entry.
 * Generates UUID, captures location, writes to database with smell.
 * Returns { id } on success, { id: '', error: message } on failure.
 */
export async function createPissLog(
  input: PissLogInput,
): Promise<{ id: string; error?: string }> {
  logger.inputAction('Create piss log', input);
  try {
    const captured = await captureLocation();
    const location = captured ?? undefined;
    const id = await repoCreatePissLog({ ...input, location });
    logger.dbWrite('piss_logs', { id, colorId: input.colorId });
    return { id };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error saving piss log';
    logger.dbError('Failed to create piss log', { error: message });
    return { id: '', error: message };
  }
}

/**
 * Undo (delete) a logged entry by id.
 * Returns { success: true } or { success: false } on error.
 */
export async function undoLastLog(
  type: LogType,
  id: string,
): Promise<{ success: boolean }> {
  logger.inputAction(`Delete ${type} log`, { id });
  try {
    if (type === 'poop') {
      await deletePoopLog(id);
    } else {
      await deletePissLog(id);
    }
    logger.dbWrite(`${type}_logs (deleted)`, { id });
    return { success: true };
  } catch (e) {
    logger.dbError(`Failed to delete ${type} log`, { id, error: e });
    return { success: false };
  }
}
