// AFXS Music Player and Organizer
// Database singleton — opens and initializes the SQLite database

import * as SQLite from 'expo-sqlite';
import { ALL_TABLES, SCHEMA_VERSION } from './schema';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('afxs_library.db');
  await initializeDatabase(_db);
  return _db;
}

async function initializeDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  // Enable WAL mode for better concurrent read performance
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // Create all tables and indexes
  for (const statement of ALL_TABLES) {
    await db.execAsync(statement);
  }

  // Ensure schema version is recorded
  const versionRow = await db.getFirstAsync<{ version: number }>(
    'SELECT version FROM schema_version LIMIT 1'
  );
  if (!versionRow) {
    await db.runAsync(
      'INSERT INTO schema_version (version) VALUES (?)',
      [SCHEMA_VERSION]
    );
  }
}

export function closeDatabase(): void {
  if (_db) {
    _db.closeAsync().catch(() => {});
    _db = null;
  }
}
