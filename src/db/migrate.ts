import * as SQLite from 'expo-sqlite';

interface Migration {
  idx: number;
  version: string;
  sql: string;
}

// List of all migrations in order
const migrations: Migration[] = [
  {
    idx: 1,
    version: '0001',
    sql: require('./0001_initial.sql').default,
  },
];

/**
 * Run all pending migrations on the database.
 * Checks the _journal table for applied migrations, runs pending ones idempotently,
 * and records completion.
 */
export async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  // Ensure _journal table exists
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS _journal (
      idx INTEGER PRIMARY KEY,
      version TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);

  // Get applied migrations
  const journal = await db.getAllAsync<{ idx: number }>('SELECT idx FROM _journal');
  const appliedMigrations = new Set(journal.map((j) => j.idx));

  // Run pending migrations
  for (const migration of migrations) {
    if (!appliedMigrations.has(migration.idx)) {
      console.log(`Running migration ${migration.version}...`);

      // Execute migration SQL
      await db.execAsync(migration.sql);

      // Record completion
      await db.runAsync(
        'INSERT INTO _journal (idx, version, created_at) VALUES (?, ?, ?)',
        [migration.idx, migration.version, Date.now()]
      );

      console.log(`Migration ${migration.version} completed.`);
    }
  }
}
