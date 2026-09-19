// AFXS Music Player and Organizer
// Artist, Album, Genre DAOs

import { getDatabase } from '../db';
import type { Artist, Album, Genre } from '@/types/music';

// ─── Artists ─────────────────────────────────────────────────────────────────

export async function getArtists(search?: string): Promise<Artist[]> {
  const db = await getDatabase();
  if (search) {
    const term = `%${search}%`;
    return await db.getAllAsync<Artist>(
      `SELECT
        COALESCE(albumArtist, artist, 'Unknown Artist') AS name,
        COUNT(*) AS songCount,
        COUNT(DISTINCT album) AS albumCount,
        ROW_NUMBER() OVER () AS id
       FROM songs
       WHERE isDeleted = 0
         AND (artist LIKE ? OR albumArtist LIKE ?)
       GROUP BY COALESCE(albumArtist, artist, 'Unknown Artist')
       ORDER BY name ASC`,
      [term, term]
    );
  }
  return await db.getAllAsync<Artist>(
    `SELECT
      COALESCE(albumArtist, artist, 'Unknown Artist') AS name,
      COUNT(*) AS songCount,
      COUNT(DISTINCT album) AS albumCount,
      ROW_NUMBER() OVER () AS id
     FROM songs
     WHERE isDeleted = 0
     GROUP BY COALESCE(albumArtist, artist, 'Unknown Artist')
     ORDER BY name ASC`
  );
}

// ─── Albums ──────────────────────────────────────────────────────────────────

export async function getAlbums(search?: string, artistFilter?: string): Promise<Album[]> {
  const db = await getDatabase();
  const conditions: string[] = ['isDeleted = 0', "album != ''", "album != 'Unknown Album'"];
  const params: (string | number)[] = [];

  if (search) {
    conditions.push('(album LIKE ? OR albumArtist LIKE ? OR artist LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term, term);
  }
  if (artistFilter) {
    conditions.push('(artist = ? OR albumArtist = ?)');
    params.push(artistFilter, artistFilter);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;
  return await db.getAllAsync<Album>(
    `SELECT
      ROW_NUMBER() OVER () AS id,
      album AS title,
      COALESCE(albumArtist, artist, 'Unknown Artist') AS albumArtist,
      artist,
      year,
      MIN(artworkUri) AS artworkUri,
      COUNT(*) AS songCount,
      SUM(duration) AS totalDuration
     FROM songs
     ${where}
     GROUP BY album, COALESCE(albumArtist, artist)
     ORDER BY albumArtist ASC, year ASC, album ASC`,
    params
  );
}

// ─── Genres ──────────────────────────────────────────────────────────────────

export async function getGenres(): Promise<Genre[]> {
  const db = await getDatabase();
  return await db.getAllAsync<Genre>(
    `SELECT
      ROW_NUMBER() OVER () AS id,
      genre AS name,
      COUNT(*) AS songCount
     FROM songs
     WHERE isDeleted = 0 AND genre != '' AND genre IS NOT NULL
     GROUP BY genre
     ORDER BY genre ASC`
  );
}

// ─── Folders ─────────────────────────────────────────────────────────────────

export async function getFolders(): Promise<Array<{ path: string; name: string; songCount: number }>> {
  const db = await getDatabase();
  const songs = await db.getAllAsync<{ uri: string }>(
    'SELECT uri FROM songs WHERE isDeleted = 0'
  );

  const folderMap = new Map<string, number>();
  for (const { uri } of songs) {
    const lastSlash = uri.lastIndexOf('/');
    const folder = lastSlash > 0 ? uri.substring(0, lastSlash) : uri;
    folderMap.set(folder, (folderMap.get(folder) ?? 0) + 1);
  }

  return Array.from(folderMap.entries())
    .map(([path, songCount]) => {
      const parts = path.split('/');
      const name = parts[parts.length - 1] || path;
      return { path, name, songCount };
    })
    .sort((a, b) => a.path.localeCompare(b.path));
}
