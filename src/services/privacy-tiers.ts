import {
  DataTier,
  SYNCABLE_TABLES,
  classifyTable as classifyTableConstant,
  getSyncableTables as getSyncableTablesConstant,
  canSync as canSyncConstant,
} from '@/constants/privacy-tiers';
import { logger } from '@/utils/logger';

// Re-export the constants and functions for convenience
export { DataTier, SYNCABLE_TABLES };

/**
 * Classify a table by its privacy tier
 * Returns the tier for any table, or null if unknown
 */
export const classifyTable = classifyTableConstant;

/**
 * Get all tables that can be synced (Tier 2 only)
 * Returns ONLY poop_logs and piss_logs
 */
export const getSyncableTables = getSyncableTablesConstant;

/**
 * Check if a table can be synced
 * Returns false for period_logs (Tier 1 - never syncs)
 * Returns true for poop_logs, piss_logs (Tier 2 - syncs monthly)
 */
export const canSync = canSyncConstant;

/**
 * Get tables that NEVER sync (Tier 1 - period data)
 */
export function getNonSyncableTables(): string[] {
  const tables = ['period_logs'];
  logger.debug('SYNC', 'Non-syncable tables', { tables });
  return tables;
}

/**
 * Get all tables in the database
 */
export function getAllTables(): string[] {
  const tables = [
    'poop_logs',
    'piss_logs',
    'period_logs',
    'custom_types',
    'custom_colors',
    'user_settings',
  ];
  logger.debug('SYNC', 'All database tables', { tables });
  return tables;
}
