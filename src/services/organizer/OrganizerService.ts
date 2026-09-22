// AFXS Music Player and Organizer
// OrganizerService — analyzes library and generates file move plans
// Uses SAF (Storage Access Framework) for external storage access

import * as FileSystem from 'expo-file-system/legacy';
import { updateSongUri } from '@/database/daos/songDao';
import {
  recordOrganizationOp,
  updateOrganizationStatus,
} from '@/database/daos/organizerDao';
import type { Song, MovePlan } from '@/types/music';

export type OrganizePattern = '{artist}/{album}/{filename}' | '{artist}/{album}/{track} - {title}' | '{artist}/{filename}';

/**
 * Sanitize a string for safe use as a directory or filename
 */
function sanitizePath(s: string): string {
  return s
    .replace(/[<>:"/\\|?*]/g, '_')  // invalid filesystem chars
    .replace(/\s+/g, ' ')
    .replace(/^\.+/, '')             // no leading dots
    .trim() || 'Unknown';
}

/**
 * Get the file extension from a URI or filename
 */
function getExtension(uriOrFilename: string): string {
  const match = uriOrFilename.match(/\.([^/.]+)$/);
  return match ? `.${match[1]}` : '';
}

/**
 * Generate the ideal path for a song based on a pattern
 */
function generateNewPath(
  song: Song,
  baseDir: string,
  pattern: OrganizePattern
): string {
  const artist = sanitizePath(song.artist || song.albumArtist || 'Unknown Artist');
  const album = sanitizePath(song.album || 'Unknown Album');
  const title = sanitizePath(song.title || FileSystem.documentDirectory ? song.filename : 'Unknown');
  const track = song.trackNumber ? String(song.trackNumber).padStart(2, '0') : '00';
  const ext = getExtension(song.filename);

  let relative: string;
  switch (pattern) {
    case '{artist}/{album}/{track} - {title}':
      relative = `${artist}/${album}/${track} - ${title}${ext}`;
      break;
    case '{artist}/{filename}':
      relative = `${artist}/${song.filename}`;
      break;
    case '{artist}/{album}/{filename}':
    default:
      relative = `${artist}/${album}/${song.filename}`;
      break;
  }

  // Ensure base dir ends with /
  const base = baseDir.endsWith('/') ? baseDir : `${baseDir}/`;
  return `${base}${relative}`;
}

/**
 * Extract the base directory from a song's URI (everything up to the last /)
 */
function getDirectory(uri: string): string {
  const lastSlash = uri.lastIndexOf('/');
  return lastSlash > 0 ? uri.substring(0, lastSlash) : uri;
}

/**
 * Find the most common root directory from a set of song URIs
 */
function findCommonRoot(songs: Song[]): string {
  if (songs.length === 0) return '';
  const dirs = songs.map(s => getDirectory(s.uri));
  
  // Find the shortest common prefix
  let prefix = dirs[0];
  for (const dir of dirs) {
    while (!dir.startsWith(prefix) && prefix.length > 0) {
      const lastSlash = prefix.lastIndexOf('/');
      prefix = lastSlash > 0 ? prefix.substring(0, lastSlash) : '';
    }
  }
  return prefix;
}

export interface MovePlanItem {
  songId: number;
  song: Song;
  originalUri: string;
  newUri: string;
  status: 'pending' | 'completed' | 'failed' | 'skipped';
}

/**
 * Analyze library and generate a move plan
 */
export function generateMovePlan(
  songs: Song[],
  pattern: OrganizePattern = '{artist}/{album}/{filename}'
): { plan: MovePlanItem[]; baseDir: string; stats: MoveStats } {
  const baseDir = findCommonRoot(songs);
  const plan: MovePlanItem[] = [];
  const stats: MoveStats = {
    totalSongs: songs.length,
    songsToMove: 0,
    alreadyOrganized: 0,
    newFolders: new Set<string>(),
  };

  for (const song of songs) {
    const newUri = generateNewPath(song, baseDir, pattern);
    
    if (newUri === song.uri) {
      stats.alreadyOrganized++;
    } else {
      const newDir = getDirectory(newUri);
      stats.newFolders.add(newDir);
      stats.songsToMove++;
      plan.push({
        songId: song.id,
        song,
        originalUri: song.uri,
        newUri,
        status: 'pending',
      });
    }
  }

  return { plan, baseDir, stats };
}

export interface MoveStats {
  totalSongs: number;
  songsToMove: number;
  alreadyOrganized: number;
  newFolders: Set<string>;
}

export type MoveProgressCallback = (completed: number, total: number, current: string) => void;

/**
 * Execute a move plan — copies files and updates database
 */
export async function executeMoveplan(
  plan: MovePlanItem[],
  onProgress?: MoveProgressCallback
): Promise<{ completed: number; failed: number; errors: string[] }> {

  let completed = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < plan.length; i++) {
    const item = plan[i];
    if (item.status !== 'pending') continue;

    onProgress?.(i, plan.length, item.song.title || item.song.filename);

    try {
      // Ensure destination directory exists
      const destDir = getDirectory(item.newUri);
      const dirInfo = await FileSystem.getInfoAsync(destDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });
      }

      // Check if destination already exists
      const destInfo = await FileSystem.getInfoAsync(item.newUri);
      if (destInfo.exists) {
        item.status = 'skipped';
        errors.push(`Skipped: ${item.song.filename} — destination already exists`);
        continue;
      }

      // Record the operation first
      const historyId = await recordOrganizationOp(
        item.songId,
        item.originalUri,
        item.newUri,
        'move'
      );

      // Copy file to new location
      await FileSystem.copyAsync({
        from: item.originalUri,
        to: item.newUri,
      });

      // Verify copy
      const verifyInfo = await FileSystem.getInfoAsync(item.newUri);
      if (!verifyInfo.exists) {
        throw new Error('Copy verification failed');
      }

      // Update database
      await updateSongUri(item.songId, item.newUri);
      await updateOrganizationStatus(historyId, 'completed');

      // Delete original only after everything succeeded
      try {
        await FileSystem.deleteAsync(item.originalUri, { idempotent: true });
      } catch {
        // Non-fatal: original file remains as backup
      }

      item.status = 'completed';
      completed++;
    } catch (err) {
      item.status = 'failed';
      failed++;
      const msg = err instanceof Error ? err.message : 'Unknown error';
      errors.push(`Failed: ${item.song.filename} — ${msg}`);
    }
  }

  onProgress?.(plan.length, plan.length, 'Done');
  return { completed, failed, errors };
}

export const executeMovePlan = executeMoveplan;

export async function undoLastOperation(historyId: number): Promise<number> {
  const { undoOrganizationOp } = await import('@/database/daos/organizerDao');
  const record = await undoOrganizationOp(historyId);
  if (record && record.originalUri && record.newUri) {
    try {
      await FileSystem.copyAsync({
        from: record.newUri,
        to: record.originalUri,
      });
      await updateSongUri(record.songId, record.originalUri);
      return 1;
    } catch {
      return 0;
    }
  }
  return 0;
}

/**
 * Get available organize patterns with labels
 */
export function getPatternOptions(): Array<{ pattern: OrganizePattern; label: string; example: string }> {
  return [
    {
      pattern: '{artist}/{album}/{filename}',
      label: 'Artist / Album / File',
      example: 'Radiohead/OK Computer/01 Airbag.mp3',
    },
    {
      pattern: '{artist}/{album}/{track} - {title}',
      label: 'Artist / Album / Track - Title',
      example: 'Radiohead/OK Computer/01 - Airbag.mp3',
    },
    {
      pattern: '{artist}/{filename}',
      label: 'Artist / File',
      example: 'Radiohead/01 Airbag.mp3',
    },
  ];
}

