// AFXS Music Player and Organizer
// Song DAO — all database operations for the songs table

import { getDatabase } from '../db';
import type { Song } from '@/types/music';

export interface UpsertSongInput {
  uri: string;
  filename: string;
  title: string | null;
  artist: string | null;
  album: string | null;
  albumArtist: string | null;
  genre: string | null;
  year: number | null;
  trackNumber: number | null;
  discNumber: number | null;
  duration: number;
  artworkUri: string | null;
  dateAdded: number;
  dateModified: number;
  fileSize: number;
}

export interface SongQueryOptions {
  limit?: number;
  offset?: number;
  search?: string;
  sortField?: string;
  sortDir?: 'ASC' | 'DESC';
  artist?: string;
  album?: string;
  genre?: string;
  folder?: string;
}

export async function upsertSong(input: UpsertSongInput): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO songs
      (uri, filename, title, artist, album, albumArtist, genre, year,
       trackNumber, discNumber, duration, artworkUri, dateAdded, dateModified, fileSize, isDeleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
     ON CONFLICT(uri) DO UPDATE SET
       filename     = excluded.filename,
       title        = excluded.title,
       artist       = excluded.artist,
       album        = excluded.album,
       albumArtist  = excluded.albumArtist,
       genre        = excluded.genre,
       year         = excluded.year,
       trackNumber  = excluded.trackNumber,
       discNumber   = excluded.discNumber,
       duration     = excluded.duration,
       artworkUri   = COALESCE(excluded.artworkUri, artworkUri),
       dateModified = excluded.dateModified,
       fileSize     = excluded.fileSize,
       isDeleted    = 0`,
    [
      input.uri, input.filename,
      input.title ?? input.filename,
      input.artist ?? 'Unknown Artist',
      input.album ?? 'Unknown Album',
      input.albumArtist ?? input.artist ?? 'Unknown Artist',
      input.genre ?? '',
      input.year, input.trackNumber, input.discNumber,
      input.duration, input.artworkUri,
      input.dateAdded, input.dateModified, input.fileSize,
    ]
  );
  return result.lastInsertRowId;
}

export async function markSongDeleted(uri: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE songs SET isDeleted = 1 WHERE uri = ?', [uri]);
}

export async function getSongById(id: number): Promise<Song | null> {
  const db = await getDatabase();
  return await db.getFirstAsync<Song>(
    'SELECT * FROM songs WHERE id = ? AND isDeleted = 0',
    [id]
  );
}

export async function getSongByUri(uri: string): Promise<Song | null> {
  const db = await getDatabase();
  return await db.getFirstAsync<Song>(
    'SELECT * FROM songs WHERE uri = ?',
    [uri]
  );
}

export async function getSongs(options: SongQueryOptions = {}): Promise<Song[]> {
  const db = await getDatabase();
  const {
    limit = 100,
    offset = 0,
    search,
    sortField = 'title',
    sortDir = 'ASC',
    artist,
    album,
    genre,
    folder,
  } = options;

  const conditions: string[] = ['isDeleted = 0'];
  const params: (string | number)[] = [];

  if (search) {
    conditions.push('(title LIKE ? OR artist LIKE ? OR album LIKE ? OR filename LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }
  if (artist) {
    conditions.push('(artist = ? OR albumArtist = ?)');
    params.push(artist, artist);
  }
  if (album) {
    conditions.push('album = ?');
    params.push(album);
  }
  if (genre) {
    conditions.push('genre = ?');
    params.push(genre);
  }
  if (folder) {
    conditions.push("uri LIKE ?");
    params.push(`${folder}%`);
  }

  const allowedSort = ['title', 'artist', 'album', 'dateAdded', 'duration', 'trackNumber', 'discNumber'];
  const safe = allowedSort.includes(sortField) ? sortField : 'title';
  const dir = sortDir === 'DESC' ? 'DESC' : 'ASC';

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const query = `SELECT * FROM songs ${where} ORDER BY ${safe} ${dir} LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  return await db.getAllAsync<Song>(query, params);
}

export async function getSongCount(search?: string): Promise<number> {
  const db = await getDatabase();
  if (search) {
    const term = `%${search}%`;
    const row = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM songs WHERE isDeleted = 0
       AND (title LIKE ? OR artist LIKE ? OR album LIKE ? OR filename LIKE ?)`,
      [term, term, term, term]
    );
    return row?.count ?? 0;
  }
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM songs WHERE isDeleted = 0'
  );
  return row?.count ?? 0;
}

export async function getAllSongUris(): Promise<Array<{ uri: string; dateModified: number; fileSize: number }>> {
  const db = await getDatabase();
  return await db.getAllAsync<{ uri: string; dateModified: number; fileSize: number }>(
    'SELECT uri, dateModified, fileSize FROM songs WHERE isDeleted = 0'
  );
}

export async function updateSongArtwork(songId: number, artworkUri: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE songs SET artworkUri = ? WHERE id = ?', [artworkUri, songId]);
}

// ─── Phase 2: Metadata Fixer ─────────────────────────────────────────────────

export interface MetadataFields {
  title?: string;
  artist?: string;
  album?: string;
  albumArtist?: string;
  genre?: string;
  year?: number | null;
  trackNumber?: number | null;
  discNumber?: number | null;
}

export async function updateSongMetadata(
  songId: number,
  fields: MetadataFields
): Promise<void> {
  const db = await getDatabase();
  const setClauses: string[] = [];
  const params: (string | number | null)[] = [];

  if (fields.title !== undefined) { setClauses.push('title = ?'); params.push(fields.title); }
  if (fields.artist !== undefined) { setClauses.push('artist = ?'); params.push(fields.artist); }
  if (fields.album !== undefined) { setClauses.push('album = ?'); params.push(fields.album); }
  if (fields.albumArtist !== undefined) { setClauses.push('albumArtist = ?'); params.push(fields.albumArtist); }
  if (fields.genre !== undefined) { setClauses.push('genre = ?'); params.push(fields.genre); }
  if (fields.year !== undefined) { setClauses.push('year = ?'); params.push(fields.year); }
  if (fields.trackNumber !== undefined) { setClauses.push('trackNumber = ?'); params.push(fields.trackNumber); }
  if (fields.discNumber !== undefined) { setClauses.push('discNumber = ?'); params.push(fields.discNumber); }

  if (setClauses.length === 0) return;

  setClauses.push('dateModified = ?');
  params.push(Date.now());
  params.push(songId);

  await db.runAsync(
    `UPDATE songs SET ${setClauses.join(', ')} WHERE id = ?`,
    params
  );
}

export async function getSongsWithMissingMetadata(): Promise<Song[]> {
  const db = await getDatabase();
  return await db.getAllAsync<Song>(
    `SELECT * FROM songs WHERE isDeleted = 0 AND (
      title IS NULL OR title = '' OR title = filename
      OR artist IS NULL OR artist = '' OR artist = 'Unknown Artist'
      OR album IS NULL OR album = '' OR album = 'Unknown Album'
      OR genre IS NULL OR genre = ''
      OR year IS NULL
      OR trackNumber IS NULL
    ) ORDER BY artist ASC, album ASC, title ASC`
  );
}

export async function getAllSongsForTools(): Promise<Song[]> {
  const db = await getDatabase();
  return await db.getAllAsync<Song>(
    `SELECT * FROM songs WHERE isDeleted = 0 ORDER BY artist ASC, album ASC, trackNumber ASC, title ASC`
  );
}

export async function bulkUpdateMetadata(
  updates: Array<{ songId: number; fields: MetadataFields }>
): Promise<number> {
  let count = 0;
  for (const update of updates) {
    await updateSongMetadata(update.songId, update.fields);
    count++;
  }
  return count;
}

// ─── Phase 2: Duplicate Finder ───────────────────────────────────────────────

export async function getDuplicateCandidates(): Promise<Song[]> {
  const db = await getDatabase();
  // Get all non-deleted songs for client-side duplicate analysis
  return await db.getAllAsync<Song>(
    `SELECT * FROM songs WHERE isDeleted = 0
     ORDER BY title COLLATE NOCASE ASC, artist COLLATE NOCASE ASC`
  );
}

export async function deleteSongsBatch(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await getDatabase();
  const placeholders = ids.map(() => '?').join(', ');
  await db.runAsync(
    `UPDATE songs SET isDeleted = 1 WHERE id IN (${placeholders})`,
    ids
  );
}

// ─── Phase 2: Artwork Manager ────────────────────────────────────────────────

export async function getSongsByAlbumGroup(
  albumTitle: string,
  albumArtist: string
): Promise<Song[]> {
  const db = await getDatabase();
  return await db.getAllAsync<Song>(
    `SELECT * FROM songs
     WHERE isDeleted = 0
       AND album = ?
       AND (albumArtist = ? OR artist = ?)
     ORDER BY discNumber ASC, trackNumber ASC, title ASC`,
    [albumTitle, albumArtist, albumArtist]
  );
}

export async function updateAlbumArtwork(
  albumTitle: string,
  albumArtist: string,
  artworkUri: string | null
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE songs SET artworkUri = ?
     WHERE isDeleted = 0
       AND album = ?
       AND (albumArtist = ? OR artist = ?)`,
    [artworkUri, albumTitle, albumArtist, albumArtist]
  );
}

export async function updateSongUri(songId: number, newUri: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE songs SET uri = ?, dateModified = ? WHERE id = ?',
    [newUri, Date.now(), songId]
  );
}

export const getAllSongs = getAllSongsForTools;

export async function deleteSong(id: number): Promise<void> {
  await deleteSongsBatch([id]);
}


