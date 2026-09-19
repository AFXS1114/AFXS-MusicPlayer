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
