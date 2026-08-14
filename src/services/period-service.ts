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
import { logger } from '@/utils/logger';

/**
 * Log a new period entry.
 * Returns { id } on success, { id: '', error: message } on failure.
 */
export async function logPeriodEntry(
  input: PeriodLogInput,
): Promise<{ id: string; error?: string }> {
  logger.period('Logging period entry');
  try {
    const id = await createPeriodLog(input);
    logger.periodAction('Period entry created', { id });
    return { id };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'Unknown error saving period log';
    logger.error('PERIOD', 'Failed to create period entry', { error: message });
    return { id: '', error: message };
  }
}

/**
 * Get full cycle overview — prediction, lengths, confidence.
 */
export async function getCycleOverview(): Promise<CycleData> {
  logger.period('Fetching cycle overview');
  const logs = await getPeriodLogs();
  const data = calculateCycleData(logs);
  logger.period('Cycle overview calculated', {
    cycleStartDates: data.cycleStartDates.length,
    averageCycleLength: data.averageCycleLength,
    confidence: data.confidence,
    daysUntilNextPeriod: data.daysUntilNextPeriod,
  });
  return data;
}

/**
 * Get current cycle phase (or null if no data).
 */
export async function getCyclePhase(): Promise<CyclePhase | null> {
  logger.period('Fetching cycle phase');
  const overview = await getCycleOverview();
  if (overview.cycleStartDates.length === 0) {
    logger.period('No cycle data available');
    return null;
  }
  const phase = pureGetCyclePhase(
    overview.currentCycleDay,
    overview.averageCycleLength,
  );
  logger.period('Cycle phase determined', { phase: phase.name, currentCycleDay: overview.currentCycleDay });
  return phase;
}

/**
 * Get period statistics — averages, ranges, regularity.
 */
export async function getPeriodStats(): Promise<PeriodStats> {
  logger.period('Calculating period stats');
  const logs = await getPeriodLogs();
  const stats = calculatePeriodStats(logs);
  logger.period('Period stats calculated', { totalCycles: stats.totalCycles, regularity: stats.regularity });
  return stats;
}

/**
 * Get period log entries for UI consumption.
 */
export async function getPeriodLogsForUI(
  limit?: number,
): Promise<PeriodLogEntry[]> {
  logger.period('Fetching period logs for UI', { limit });
  const logs = await getPeriodLogs(limit);
  logger.period('Period logs fetched', { count: logs.length });
  return logs;
}

/**
 * Update a period entry's editable fields.
 */
export async function updatePeriodEntry(
  id: string,
  fields: Partial<PeriodLogInput>,
): Promise<{ success: boolean }> {
  logger.period('Updating period entry', { id });
  try {
    await updatePeriodLog(id, fields);
    logger.periodAction('Period entry updated', { id });
    return { success: true };
  } catch (e) {
    logger.error('PERIOD', 'Failed to update period entry', { id, error: e instanceof Error ? e.message : 'Unknown' });
    return { success: false };
  }
}

/**
 * Delete a period entry.
 */
export async function deletePeriodEntry(
  id: string,
): Promise<{ success: boolean }> {
  logger.period('Deleting period entry', { id });
  try {
    await deletePeriodLog(id);
    logger.periodAction('Period entry deleted', { id });
    return { success: true };
  } catch (e) {
    logger.error('PERIOD', 'Failed to delete period entry', { id, error: e instanceof Error ? e.message : 'Unknown' });
    return { success: false };
  }
}
