import { getDatabase } from '@/db';
import { logger } from '@/utils/logger';

/**
 * Initialize the application.
 * Ensures the database connection is established (encryption, WAL, Drizzle, migrations).
 * Migrations run automatically inside getDatabase() on each newly opened DB.
 */
export async function initializeApp() {
  logger.appInit('Starting app initialization...');

  // Initialize DB connection (migrations run inside getDatabase)
  logger.appInit('Opening encrypted database...');
  await getDatabase();
  logger.db('Database opened with encryption, WAL mode, and migrations');

  logger.appReady('App initialization complete');
  await logger.flush();
}

/**
 * Fire-and-forget background tasks that run AFTER the app is visible.
 * These are non-critical: sync, update checks, backups, leaderboards.
 * Each is wrapped in its own try/catch so one failure doesn't affect others.
 */
export function runBackgroundTasks() {
  logger.appInit('Running background tasks');

  import('./update-checker').then(m =>
    m.checkForUpdate().catch(e => logger.syncError('Update check failed', { error: e }))
  );

  import('./sync-engine').then(m =>
    m.runMonthlySync().catch(e => logger.syncError('Monthly sync failed', { error: e }))
  );

  import('./leaderboard-service').then(m =>
    m.syncLeaderboards().catch(e => logger.syncError('Leaderboard sync failed', { error: e }))
  );

  import('./backup-service').then(m =>
    m.checkAutoBackup().catch(e => logger.backupError('Auto backup check failed', { error: e }))
  );
}
