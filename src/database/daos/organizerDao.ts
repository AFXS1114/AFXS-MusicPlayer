// AFXS Music Player and Organizer
// Organization history DAO — tracks file move/rename/copy operations

import { getDatabase } from '../db';
import type { OrganizationHistoryEntry } from '@/types/music';

export async function recordOrganizationOp(
  songId: number,
  originalUri: string,
  newUri: string,
  operationType: 'move' | 'rename' | 'copy' = 'move'
): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO organization_history
      (songId, originalUri, newUri, operationType, status, performedAt)
     VALUES (?, ?, ?, ?, 'pending', ?)`,
    [songId, originalUri, newUri, operationType, Date.now()]
  );
  return result.lastInsertRowId;
}

export async function updateOrganizationStatus(
  id: number,
  status: 'pending' | 'completed' | 'failed' | 'undone',
  errorMessage?: string
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE organization_history SET status = ?, errorMessage = ? WHERE id = ?',
    [status, errorMessage ?? null, id]
  );
}

export async function getOrganizationHistory(
  limit = 100
): Promise<OrganizationHistoryEntry[]> {
  const db = await getDatabase();
  return await db.getAllAsync<OrganizationHistoryEntry>(
    `SELECT * FROM organization_history
     ORDER BY performedAt DESC
     LIMIT ?`,
    [limit]
  );
}

export async function getUndoableOperations(): Promise<OrganizationHistoryEntry[]> {
  const db = await getDatabase();
  return await db.getAllAsync<OrganizationHistoryEntry>(
    `SELECT * FROM organization_history
     WHERE status = 'completed'
     ORDER BY performedAt DESC`
  );
}

export async function recordBatchOrganization(
  operations: Array<{
    songId: number;
    originalUri: string;
    newUri: string;
    operationType: 'move' | 'rename' | 'copy';
  }>
): Promise<number[]> {
  const ids: number[] = [];
  for (const op of operations) {
    const id = await recordOrganizationOp(
      op.songId,
      op.originalUri,
      op.newUri,
      op.operationType
    );
    ids.push(id);
  }
  return ids;
}

export async function undoOrganizationOp(id: number): Promise<OrganizationHistoryEntry | null> {
  const db = await getDatabase();
  const op = await db.getFirstAsync<OrganizationHistoryEntry>(
    'SELECT * FROM organization_history WHERE id = ?',
    [id]
  );
  if (op) {
    await updateOrganizationStatus(id, 'undone');
  }
  return op;
}


