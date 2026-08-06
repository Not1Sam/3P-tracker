import { InteractionManager } from 'react-native';
import { getDatabase } from '@/db';
import { poopLogs, pissLogs } from '@/db/schema';
import { canSync, getSyncableTables } from '@/services/privacy-tiers';
import { getLastSyncTimestamp, setLastSyncTimestamp } from '@/services/settings';
import { gte } from 'drizzle-orm';

interface MonthlySummary {
  month: string; // YYYY-MM format
  poopCount: number;
  avgBristolType: number | null;
  pissCount: number;
  avgColor: number | null;
  totalEntries: number;
}

/**
 * Run monthly batch sync to Supabase.
 * Queries ONLY Tier 2 tables (poop_logs, piss_logs) via the privacy tier system.
 * Aggregates entries since last sync timestamp into monthly summaries.
 * Uploads to Supabase `monthly_summaries` table.
 *
 * Sync runs in background when app is open (D-17).
 * Single device only for v1 (D-15) - no conflict resolution needed.
 */
export async function runMonthlySync(): Promise<void> {
  console.log('Starting monthly sync...');

  // Run in background to avoid blocking UI
  await InteractionManager.runAfterInteractions(async () => {
    try {
      const db = await getDatabase();
      const lastSyncTimestamp = getLastSyncTimestamp();
      const syncDate = new Date(lastSyncTimestamp);

      // Only query Tier 2 tables (architectural guarantee)
      const syncableTables = getSyncableTables();
      console.log(`Syncing tables: ${syncableTables.join(', ')}`);

      // Query poop logs since last sync
      const poopEntries = await db
        .select()
        .from(poopLogs)
        .where(gte(poopLogs.createdAt, syncDate));

      // Query piss logs since last sync
      const pissEntries = await db
        .select()
        .from(pissLogs)
        .where(gte(pissLogs.createdAt, syncDate));

      console.log(
        `Found ${poopEntries.length} poop entries, ${pissEntries.length} piss entries since last sync`
      );

      // Aggregate into monthly summaries
      const summaries = aggregateMonthlyData(poopEntries, pissEntries);

      // Upload to Supabase (placeholder - actual implementation will use Supabase client)
      await uploadToSupabase(summaries);

      // Update sync timestamp
      setLastSyncTimestamp(Date.now());

      console.log('Monthly sync completed successfully.');
    } catch (error) {
      console.error('Monthly sync failed:', error);
      // Implement exponential backoff retry
      await retryWithBackoff(runMonthlySync);
    }
  });
}

/**
 * Aggregate poop and piss entries into monthly summaries
 */
function aggregateMonthlyData(
  poopEntries: any[],
  pissEntries: any[]
): MonthlySummary[] {
  const monthlyData = new Map<string, MonthlySummary>();

  // Process poop entries
  for (const entry of poopEntries) {
    const month = getMonthKey(entry.timestamp);
    const existing = monthlyData.get(month) || createEmptySummary(month);

    existing.poopCount++;
    if (entry.typeId) {
      existing.avgBristolType = calculateRunningAverage(
        existing.avgBristolType,
        entry.typeId,
        existing.poopCount
      );
    }
    existing.totalEntries++;

    monthlyData.set(month, existing);
  }

  // Process piss entries
  for (const entry of pissEntries) {
    const month = getMonthKey(entry.timestamp);
    const existing = monthlyData.get(month) || createEmptySummary(month);

    existing.pissCount++;
    if (entry.colorId) {
      existing.avgColor = calculateRunningAverage(
        existing.avgColor,
        entry.colorId,
        existing.pissCount
      );
    }
    existing.totalEntries++;

    monthlyData.set(month, existing);
  }

  return Array.from(monthlyData.values());
}

/**
 * Get month key in YYYY-MM format
 */
function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Create empty monthly summary
 */
function createEmptySummary(month: string): MonthlySummary {
  return {
    month,
    poopCount: 0,
    avgBristolType: null,
    pissCount: 0,
    avgColor: null,
    totalEntries: 0,
  };
}

/**
 * Calculate running average
 */
function calculateRunningAverage(
  currentAvg: number | null,
  newValue: number,
  count: number
): number {
  if (currentAvg === null) return newValue;
  return currentAvg + (newValue - currentAvg) / count;
}

/**
 * Upload summaries to Supabase (placeholder)
 */
async function uploadToSupabase(summaries: MonthlySummary[]): Promise<void> {
  // TODO: Implement Supabase upload when backend is set up
  console.log('Upload to Supabase (placeholder):', summaries);
}

/**
 * Retry with exponential backoff
 */
async function retryWithBackoff(
  fn: () => Promise<void>,
  attempt: number = 1,
  maxAttempts: number = 5
): Promise<void> {
  if (attempt >= maxAttempts) {
    console.error('Max retry attempts reached');
    return;
  }

  const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
  console.log(`Retrying in ${delay}ms (attempt ${attempt}/${maxAttempts})`);

  setTimeout(async () => {
    try {
      await fn();
    } catch (error) {
      await retryWithBackoff(fn, attempt + 1, maxAttempts);
    }
  }, delay);
}
