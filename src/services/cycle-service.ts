/**
 * Pure cycle prediction functions — no side effects, no DB access.
 * All computation stays on-device (D-14).
 */

import type {
  PeriodLogEntry,
  CycleData,
  CyclePhase,
  PeriodStats,
  ConfidenceLevel,
} from '@/types/period';
import {
  CYCLE_PHASES,
  DEFAULT_CYCLE_LENGTH,
  MIN_CYCLES_FOR_PREDICTION,
} from '@/constants/period';
import { logger } from '@/utils/logger';

/**
 * Extract unique period start dates from raw logs.
 * Clusters logs within 2-day windows (Pitfall 4 prevention).
 * Returns dates sorted ascending (oldest first).
 */
export function extractPeriodStartDates(logs: PeriodLogEntry[]): Date[] {
  logger.period('Extracting period start dates', { logCount: logs.length });
  if (logs.length === 0) return [];

  // Sort by timestamp ascending
  const sorted = [...logs].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
  );

  const starts: Date[] = [];
  let currentStart = sorted[0].timestamp;

  for (let i = 1; i < sorted.length; i++) {
    const daysDiff = Math.round(
      (sorted[i].timestamp.getTime() - sorted[i - 1].timestamp.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    // If gap > 2 days, previous cluster was a period, current is a new start
    if (daysDiff > 2) {
      starts.push(currentStart);
      currentStart = sorted[i].timestamp;
    }
  }
  starts.push(currentStart); // Push last cluster

  logger.period('Period start dates extracted', { count: starts.length });
  return starts;
}

/**
 * Calculate cycle lengths (days between consecutive period starts).
 */
export function calculateCycleLengths(startDates: Date[]): number[] {
  const lengths: number[] = [];
  for (let i = 1; i < startDates.length; i++) {
    const diffMs = startDates[i].getTime() - startDates[i - 1].getTime();
    lengths.push(Math.round(diffMs / (1000 * 60 * 60 * 24)));
  }
  logger.period('Cycle lengths calculated', { count: lengths.length, lengths });
  return lengths;
}

/**
 * Calculate full cycle data from period logs.
 * Uses rhythm method: average last 3-6 cycles (D-11).
 * Confidence based on data quantity (D-12, D-13).
 */
export function calculateCycleData(logs: PeriodLogEntry[]): CycleData {
  logger.period('Calculating cycle data', { logCount: logs.length });
  const startDates = extractPeriodStartDates(logs);
  const cycleLengths = calculateCycleLengths(startDates);

  // Use last 6 cycles for average (D-11)
  const recentCycles = cycleLengths.slice(-6);
  const averageCycleLength =
    recentCycles.length > 0
      ? recentCycles.reduce((a, b) => a + b, 0) / recentCycles.length
      : DEFAULT_CYCLE_LENGTH;

  // Predict next period
  const lastStart = startDates[startDates.length - 1];
  const nextPeriod = new Date(lastStart);
  nextPeriod.setDate(nextPeriod.getDate() + Math.round(averageCycleLength));

  // Determine confidence based on data quantity (D-12)
  let confidence: ConfidenceLevel = 'low';
  if (recentCycles.length >= 6) confidence = 'high';
  else if (recentCycles.length >= 3) confidence = 'medium';
  else if (recentCycles.length >= 2) confidence = 'low';

  // No logs → default 28-day cycle with null prediction
  if (startDates.length === 0) {
    logger.period('No period logs, returning default cycle data');
    return {
      cycleStartDates: [],
      cycleLengths: [],
      averageCycleLength: DEFAULT_CYCLE_LENGTH,
      shortestCycle: DEFAULT_CYCLE_LENGTH,
      longestCycle: DEFAULT_CYCLE_LENGTH,
      lastPeriodStart: new Date(),
      nextPeriodPrediction: null,
      daysUntilNextPeriod: null,
      currentCycleDay: 0,
      confidence: 'low',
    };
  }

  return {
    cycleStartDates: startDates,
    cycleLengths,
    averageCycleLength,
    shortestCycle:
      cycleLengths.length > 0 ? Math.min(...cycleLengths) : DEFAULT_CYCLE_LENGTH,
    longestCycle:
      cycleLengths.length > 0 ? Math.max(...cycleLengths) : DEFAULT_CYCLE_LENGTH,
    lastPeriodStart: lastStart,
    // D-13: minimum 2 cycles before predictions appear
    nextPeriodPrediction:
      recentCycles.length >= MIN_CYCLES_FOR_PREDICTION ? nextPeriod : null,
    daysUntilNextPeriod:
      recentCycles.length >= MIN_CYCLES_FOR_PREDICTION
        ? Math.ceil((nextPeriod.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null,
    currentCycleDay: Math.ceil(
      (Date.now() - lastStart.getTime()) / (1000 * 60 * 60 * 24),
    ),
    confidence,
  };
}

/**
 * Determine current menstrual cycle phase based on cycle day.
 * Ovulation day ≈ cycle length / 2. Phase boundaries scale with cycle length.
 */
export function getCyclePhase(
  cycleDay: number,
  averageCycleLength: number = DEFAULT_CYCLE_LENGTH,
): CyclePhase {
  const ovulationDay = Math.round(averageCycleLength / 2);
  const lutealStart = ovulationDay + 2;
  let phase: CyclePhase;

  if (cycleDay <= 5) {
    const info = CYCLE_PHASES.menstrual;
    phase = { name: 'menstrual', ...info };
  } else if (cycleDay < ovulationDay - 1) {
    const info = CYCLE_PHASES.follicular;
    phase = {
      name: 'follicular',
      ...info,
      dayRange: `Days 6–${ovulationDay - 1}`,
    };
  } else if (cycleDay <= ovulationDay + 2) {
    const info = CYCLE_PHASES.ovulation;
    phase = {
      name: 'ovulation',
      ...info,
      dayRange: `Days ${ovulationDay}–${ovulationDay + 2}`,
    };
  } else {
    const info = CYCLE_PHASES.luteal;
    phase = {
      name: 'luteal',
      ...info,
      dayRange: `Days ${lutealStart}–${averageCycleLength}`,
    };
  }

  logger.period('Cycle phase determined', { cycleDay, phase: phase.name });
  return phase;
}

/**
 * Calculate period statistics from raw logs.
 * Includes regularity assessment based on standard deviation.
 */
export function calculatePeriodStats(logs: PeriodLogEntry[]): PeriodStats {
  logger.period('Calculating period stats', { logCount: logs.length });
  const startDates = extractPeriodStartDates(logs);
  const cycleLengths = calculateCycleLengths(startDates);

  if (cycleLengths.length === 0) {
    logger.period('No cycle data, returning default stats');
    return {
      averageCycleLength: DEFAULT_CYCLE_LENGTH,
      averagePeriodDuration: 0,
      shortestCycle: DEFAULT_CYCLE_LENGTH,
      longestCycle: DEFAULT_CYCLE_LENGTH,
      totalCycles: 0,
      regularity: 'Not enough data',
    };
  }

  const averageCycleLength =
    cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length;

  // Calculate average period duration (days from first to last log in each cluster)
  const sortedLogs = [...logs].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
  );
  const periodDurations: number[] = [];
  let clusterStart = sortedLogs[0]?.timestamp;
  let clusterEnd = sortedLogs[0]?.timestamp;

  for (let i = 1; i < sortedLogs.length; i++) {
    const daysDiff = Math.round(
      (sortedLogs[i].timestamp.getTime() - sortedLogs[i - 1].timestamp.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    if (daysDiff > 2) {
      // End of cluster — calculate duration
      const duration =
        Math.round(
          (clusterEnd.getTime() - clusterStart.getTime()) / (1000 * 60 * 60 * 24),
        ) + 1;
      periodDurations.push(duration);
      clusterStart = sortedLogs[i].timestamp;
    }
    clusterEnd = sortedLogs[i].timestamp;
  }
  // Push last cluster
  if (clusterStart && clusterEnd) {
    const duration =
      Math.round(
        (clusterEnd.getTime() - clusterStart.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;
    periodDurations.push(duration);
  }

  const averagePeriodDuration =
    periodDurations.length > 0
      ? periodDurations.reduce((a, b) => a + b, 0) / periodDurations.length
      : 0;

  // Regularity assessment via standard deviation
  const variance =
    cycleLengths.reduce(
      (sum, len) => sum + Math.pow(len - averageCycleLength, 2),
      0,
    ) / cycleLengths.length;
  const stdDev = Math.sqrt(variance);

  let regularity: string;
  if (stdDev < 3) regularity = 'Very regular';
  else if (stdDev < 5) regularity = 'Regular';
  else if (stdDev < 7) regularity = 'Somewhat irregular';
  else regularity = 'Irregular';

  const stats = {
    averageCycleLength,
    averagePeriodDuration,
    shortestCycle: Math.min(...cycleLengths),
    longestCycle: Math.max(...cycleLengths),
    totalCycles: cycleLengths.length,
    regularity,
  };
  logger.period('Period stats calculated', { totalCycles: stats.totalCycles, regularity: stats.regularity });
  return stats;
}
