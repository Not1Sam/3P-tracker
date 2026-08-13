/**
 * Period service — orchestrator combining repository + cycle calculation.
 * All computation is local (D-14, D-34).
 */

import {
  createPeriodLog,
  getPeriodLogs,
  updatePeriodLog,
  deletePeriodLog,
} from '@/db/repositories/period-repository';
import {
  calculateCycleData,
  getCyclePhase as pureGetCyclePhase,
  calculatePeriodStats,
} from '@/services/cycle-service';
import type {
  PeriodLogInput,
  PeriodLogEntry,
  CycleData,
  CyclePhase,
  PeriodStats,
} from '@/types/period';
import { DEFAULT_CYCLE_LENGTH } from '@/constants/period';

/**
 * Log a new period entry.
 * Returns { id } on success, { id: '', error: message } on failure.
 */
export async function logPeriodEntry(
  input: PeriodLogInput,
): Promise<{ id: string; error?: string }> {
  try {
    const id = await createPeriodLog(input);
    return { id };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'Unknown error saving period log';
    return { id: '', error: message };
  }
}

/**
 * Get full cycle overview — prediction, lengths, confidence.
 */
export async function getCycleOverview(): Promise<CycleData> {
  const logs = await getPeriodLogs();
  return calculateCycleData(logs);
}

/**
 * Get current cycle phase (or null if no data).
 */
export async function getCyclePhase(): Promise<CyclePhase | null> {
  const overview = await getCycleOverview();
  if (overview.cycleStartDates.length === 0) return null;
  return pureGetCyclePhase(
    overview.currentCycleDay,
    overview.averageCycleLength,
  );
}

/**
 * Get period statistics — averages, ranges, regularity.
 */
export async function getPeriodStats(): Promise<PeriodStats> {
  const logs = await getPeriodLogs();
  return calculatePeriodStats(logs);
}

/**
 * Get period log entries for UI consumption.
 */
export async function getPeriodLogsForUI(
  limit?: number,
): Promise<PeriodLogEntry[]> {
  return getPeriodLogs(limit);
}

/**
 * Update a period entry's editable fields.
 */
export async function updatePeriodEntry(
  id: string,
  fields: Partial<PeriodLogInput>,
): Promise<{ success: boolean }> {
  try {
    await updatePeriodLog(id, fields);
    return { success: true };
  } catch {
    return { success: false };
  }
}

/**
 * Delete a period entry.
 */
export async function deletePeriodEntry(
  id: string,
): Promise<{ success: boolean }> {
  try {
    await deletePeriodLog(id);
    return { success: true };
  } catch {
    return { success: false };
  }
}
