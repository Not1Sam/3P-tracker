import { InteractionManager } from 'react-native';
import { getDatabase } from '@/db';
import { poopLogs, pissLogs } from '@/db/schema';
import { getSyncableTables } from '@/services/privacy-tiers';
import { getLastSyncTimestamp, setLastSyncTimestamp } from '@/services/settings';
import { supabase } from '@/services/supabase-client';
import { getCurrentUser } from '@/services/auth-service';
import { logger } from '@/utils/logger';
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
export async function runMonthlySync(): Promise<{ success: boolean; error?: string }> {
  logger.syncStart('monthly');

  // Check if user is authenticated
  const user = await getCurrentUser();
  if (!user) {
    logger.sync('User not authenticated, skipping sync');
    return { success: true }; // Not an error - sync is optional
  }

  return new Promise((resolve) => {
    InteractionManager.runAfterInteractions(async () => {
      try {
        const db = await getDatabase();
        const lastSyncTimestamp = getLastSyncTimestamp();
        const syncDate = new Date(lastSyncTimestamp);

        // Only query Tier 2 tables (architectural guarantee)
        const syncableTables = getSyncableTables();
        logger.sync(`Syncing tables: ${syncableTables.join(', ')}`);

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

        logger.sync(`Found entries since last sync`, {
          poop: poopEntries.length,
          piss: pissEntries.length,
        });

        // Aggregate into monthly summaries
        const summaries = aggregateMonthlyData(poopEntries, pissEntries);

        // Upload to Supabase
        await uploadToSupabase(user.id, summaries);

        // Update sync timestamp
        setLastSyncTimestamp(Date.now());

        logger.syncComplete('monthly', { summaries: summaries.length });
        resolve({ success: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Sync failed';
        logger.syncError('Monthly sync failed', { error: message });
        // Implement exponential backoff retry
        await retryWithBackoff(async () => { await runMonthlySync(); });
        resolve({ success: false, error: message });
      }
    });
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
 * Upload summaries to Supabase
 */
async function uploadToSupabase(userId: string, summaries: MonthlySummary[]): Promise<void> {
  if (summaries.length === 0) {
    logger.sync('No summaries to upload');
    return;
  }

  for (const summary of summaries) {
    const [year, month] = summary.month.split('-').map(Number);

    // Upsert monthly summary (insert or update if exists)
    const { error } = await supabase
      .from('monthly_summaries' as any)
      .upsert(
        {
          user_id: userId,
          month,
          year,
          poop_count: summary.poopCount,
          piss_count: summary.pissCount,
          avg_bristol_type: summary.avgBristolType,
          common_piss_color: summary.avgColor,
        } as any,
        { onConflict: 'user_id,month,year' }
      );

    if (error) {
      logger.syncError('Failed to upload summary', { error: error.message });
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  logger.sync(`Uploaded ${summaries.length} monthly summaries to Supabase`);
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
    logger.syncError('Max retry attempts reached');
    return;
  }

  const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
  logger.sync(`Retrying in ${delay}ms (attempt ${attempt}/${maxAttempts})`);

  setTimeout(async () => {
    try {
      await fn();
    } catch {
      await retryWithBackoff(fn, attempt + 1, maxAttempts);
    }
  }, delay);
}
