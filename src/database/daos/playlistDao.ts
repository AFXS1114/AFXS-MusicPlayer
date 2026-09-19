// AFXS Music Player and Organizer
// Playlist, Favorites, and Play History DAOs

import { getDatabase } from '../db';
import type { Playlist, PlaylistSong, Favorite, PlayHistoryEntry } from '@/types/music';
import type { Song } from '@/types/music';

// ─── Playlists ────────────────────────────────────────────────────────────────

export async function createPlaylist(name: string, description = ''): Promise<number> {
  const db = await getDatabase();
  const now = Date.now();
  const result = await db.runAsync(
    'INSERT INTO playlists (name, description, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
    [name, description, now, now]
  );
  return result.lastInsertRowId;
}

export async function getPlaylists(): Promise<Array<Playlist & { songCount: number }>> {
  const db = await getDatabase();
  return await db.getAllAsync<Playlist & { songCount: number }>(
    `SELECT p.*, COUNT(ps.id) AS songCount
     FROM playlists p
     LEFT JOIN playlist_songs ps ON ps.playlistId = p.id
     GROUP BY p.id
     ORDER BY p.updatedAt DESC`
  );
}

export async function getPlaylistById(id: number): Promise<Playlist | null> {
  const db = await getDatabase();
  return await db.getFirstAsync<Playlist>(
    'SELECT * FROM playlists WHERE id = ?', [id]
  );
}

export async function getPlaylistSongs(playlistId: number): Promise<Song[]> {
  const db = await getDatabase();
  return await db.getAllAsync<Song>(
    `SELECT s.*
     FROM songs s
     JOIN playlist_songs ps ON ps.songId = s.id
     WHERE ps.playlistId = ? AND s.isDeleted = 0
     ORDER BY ps.position ASC`,
    [playlistId]
  );
}

export async function addSongToPlaylist(playlistId: number, songId: number): Promise<void> {
  const db = await getDatabase();
  const maxPos = await db.getFirstAsync<{ maxPos: number | null }>(
    'SELECT MAX(position) AS maxPos FROM playlist_songs WHERE playlistId = ?',
    [playlistId]
  );
  const position = (maxPos?.maxPos ?? -1) + 1;
  await db.runAsync(
    'INSERT OR IGNORE INTO playlist_songs (playlistId, songId, position, addedAt) VALUES (?, ?, ?, ?)',
    [playlistId, songId, position, Date.now()]
  );
  await db.runAsync('UPDATE playlists SET updatedAt = ? WHERE id = ?', [Date.now(), playlistId]);
}

export async function removeSongFromPlaylist(playlistId: number, songId: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'DELETE FROM playlist_songs WHERE playlistId = ? AND songId = ?',
    [playlistId, songId]
  );
  await db.runAsync('UPDATE playlists SET updatedAt = ? WHERE id = ?', [Date.now(), playlistId]);
}

export async function deletePlaylist(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM playlists WHERE id = ?', [id]);
}

export async function renamePlaylist(id: number, name: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE playlists SET name = ?, updatedAt = ? WHERE id = ?',
    [name, Date.now(), id]
  );
}

// ─── Favorites ────────────────────────────────────────────────────────────────

export async function addFavorite(songId: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR IGNORE INTO favorites (songId, addedAt) VALUES (?, ?)',
    [songId, Date.now()]
  );
}

export async function removeFavorite(songId: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM favorites WHERE songId = ?', [songId]);
}

export async function isFavorite(songId: number): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ exists: number }>(
    'SELECT 1 AS exists FROM favorites WHERE songId = ?',
    [songId]
  );
  return !!row;
}

export async function getFavoriteSongs(limit = 200, offset = 0): Promise<Song[]> {
  const db = await getDatabase();
  return await db.getAllAsync<Song>(
    `SELECT s.*
     FROM songs s
     JOIN favorites f ON f.songId = s.id
     WHERE s.isDeleted = 0
     ORDER BY f.addedAt DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );
}

export async function getFavoriteIds(): Promise<Set<number>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ songId: number }>('SELECT songId FROM favorites');
  return new Set(rows.map(r => r.songId));
}

// ─── Play History ─────────────────────────────────────────────────────────────

export async function recordPlay(songId: number, completionPercent?: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO play_history (songId, playedAt, completionPercent) VALUES (?, ?, ?)',
    [songId, Date.now(), completionPercent ?? null]
  );
}

export async function getRecentlyPlayed(limit = 50): Promise<Song[]> {
  const db = await getDatabase();
  return await db.getAllAsync<Song>(
    `SELECT s.*
     FROM songs s
     JOIN (
       SELECT songId, MAX(playedAt) AS lastPlayed
       FROM play_history
       GROUP BY songId
     ) ph ON ph.songId = s.id
     WHERE s.isDeleted = 0
     ORDER BY ph.lastPlayed DESC
     LIMIT ?`,
    [limit]
  );
}

export async function getPlayCount(songId: number): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM play_history WHERE songId = ?',
    [songId]
  );
  return row?.count ?? 0;
}
