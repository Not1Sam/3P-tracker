/**
 * Privacy tiers for data classification
 * Tier 1: Period data - NEVER syncs off device
 * Tier 2: Poop/Piss data - syncs monthly to Supabase
 */
export enum DataTier {
  PERIOD = 1, // Tier 1: Never leaves device
  BODILY_LOG = 2, // Tier 2: Syncs monthly
  SOCIAL = 3, // Tier 3: Future social features
}

/**
 * Tables that can be synced to Supabase
 * ONLY Tier 2 tables - period data is architecturally excluded
 */
export const SYNCABLE_TABLES = ['poop_logs', 'piss_logs'] as const;

/**
 * Tables that NEVER sync - period data
 */
export const NON_SYNCABLE_TABLES = ['period_logs'] as const;

/**
 * All tables in the database
 */
export const ALL_TABLES = [
  'poop_logs',
  'piss_logs',
  'period_logs',
  'custom_types',
  'custom_colors',
  'user_settings',
] as const;

/**
 * Get the privacy tier for a table
 */
export function classifyTable(tableName: string): DataTier | null {
  switch (tableName) {
    case 'period_logs':
      return DataTier.PERIOD;
    case 'poop_logs':
    case 'piss_logs':
      return DataTier.BODILY_LOG;
    case 'custom_types':
    case 'custom_colors':
    case 'user_settings':
      return DataTier.SOCIAL;
    default:
      return null;
  }
}

/**
 * Get all tables that can be synced (Tier 2 only)
 */
export function getSyncableTables(): string[] {
  return [...SYNCABLE_TABLES];
}

/**
 * Check if a table can be synced
 * Returns false for period_logs (Tier 1 - never syncs)
 * Returns true for poop_logs, piss_logs (Tier 2 - syncs monthly)
 */
export function canSync(tableName: string): boolean {
  return SYNCABLE_TABLES.includes(tableName as (typeof SYNCABLE_TABLES)[number]);
}
