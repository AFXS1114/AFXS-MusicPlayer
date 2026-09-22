// AFXS Music Player and Organizer
// Artwork manager — extracts, caches, and retrieves album artwork

import * as FileSystem from 'expo-file-system/legacy';
import { updateSongArtwork } from '@/database/daos/songDao';

const ARTWORK_DIR = `${FileSystem.documentDirectory}artwork/`;

export async function ensureArtworkDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(ARTWORK_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(ARTWORK_DIR, { intermediates: true });
  }
}

export function getArtworkPath(songId: number): string {
  return `${ARTWORK_DIR}${songId}.jpg`;
}

export async function artworkExists(songId: number): Promise<boolean> {
  const path = getArtworkPath(songId);
  const info = await FileSystem.getInfoAsync(path);
  return info.exists;
}

// Save base64 artwork data to the artwork cache
export async function saveArtworkBase64(
  songId: number,
  base64Data: string
): Promise<string | null> {
  try {
    await ensureArtworkDir();
    const path = getArtworkPath(songId);
    await FileSystem.writeAsStringAsync(path, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });
    await updateSongArtwork(songId, path);
    return path;
  } catch {
    return null;
  }
}

export async function deleteArtwork(songId: number): Promise<void> {
  const path = getArtworkPath(songId);
  const info = await FileSystem.getInfoAsync(path);
  if (info.exists) {
    await FileSystem.deleteAsync(path, { idempotent: true });
  }
}

export function artworkUriToSource(uri: string | null): { uri: string } | undefined {
  if (!uri) return undefined;
  return { uri };
}

// ─── Phase 2: Artwork Manager ────────────────────────────────────────────────

/**
 * Save artwork from a local file URI (e.g., picked from gallery)
 */
export async function saveArtworkFromFile(
  songId: number,
  sourceUri: string
): Promise<string | null> {
  try {
    await ensureArtworkDir();
    const destPath = getArtworkPath(songId);
    await FileSystem.copyAsync({ from: sourceUri, to: destPath });
    await updateSongArtwork(songId, destPath);
    return destPath;
  } catch {
    return null;
  }
}

/**
 * Save the same artwork to all songs in an album
 */
export async function saveArtworkForAlbum(
  songs: Array<{ id: number }>,
  sourceUri: string
): Promise<number> {
  await ensureArtworkDir();
  let count = 0;
  for (const song of songs) {
    const result = await saveArtworkFromFile(song.id, sourceUri);
    if (result) count++;
  }
  return count;
}

/**
 * Clear artwork for a specific song
 */
export async function clearSongArtwork(songId: number): Promise<void> {
  await deleteArtwork(songId);
  await updateSongArtwork(songId, '' as any); // set to null equivalent
}

/**
 * Get list of all album artwork cache files and their total size
 */
export async function searchAlbumArtworkWeb(
  artistName: string,
  albumName: string
): Promise<string[]> {
  try {
    const query = encodeURIComponent(`${artistName} ${albumName}`);
    const response = await fetch(
      `https://itunes.apple.com/search?term=${query}&entity=album&limit=4`
    );
    if (!response.ok) return [];
    const data = await response.json();
    if (!data.results) return [];

    return data.results
      .map((item: any) => item.artworkUrl100?.replace('100x100bb', '600x600bb'))
      .filter(Boolean);
  } catch {
    return [];
  }
}

export async function getAlbumsArtworkStatus(): Promise<import('@/types/music').ArtworkStatus[]> {
  const { getAllSongsForTools } = await import('@/database/daos/songDao');
  const songs = await getAllSongsForTools();
  
  const albumMap = new Map<string, { album: string; artist: string; songs: typeof songs }>();
  for (const s of songs) {
    const key = `${s.album || 'Unknown Album'}---${s.artist || 'Unknown Artist'}`;
    if (!albumMap.has(key)) {
      albumMap.set(key, { album: s.album || 'Unknown Album', artist: s.artist || 'Unknown Artist', songs: [] });
    }
    albumMap.get(key)!.songs.push(s);
  }

  const result: import('@/types/music').ArtworkStatus[] = [];
  for (const item of albumMap.values()) {
    const firstWithArt = item.songs.find(s => !!s.artworkUri);
    const hasArtwork = !!firstWithArt;
    const artworkUri = firstWithArt ? firstWithArt.artworkUri : null;
    const isCustom = artworkUri ? artworkUri.includes('artwork/') : false;

    result.push({
      albumTitle: item.album,
      albumArtist: item.artist,
      album: item.album,
      artist: item.artist,
      songCount: item.songs.length,
      hasArtwork,
      isCustom,
      artworkUri,
      songs: item.songs,
    });
  }

  return result;
}

export async function updateAlbumArtwork(
  albumTitle: string,
  artworkUri: string
): Promise<void> {
  const { updateAlbumArtwork: updateDao } = await import('@/database/daos/songDao');
  await updateDao(albumTitle, '', artworkUri);
}

export async function bulkFetchMissingArtwork(
  onProgress?: (albumName: string, index: number, total: number) => void
): Promise<number> {
  const albums = await getAlbumsArtworkStatus();
  const missing = albums.filter(a => !a.hasArtwork);
  let updatedCount = 0;

  for (let i = 0; i < missing.length; i++) {
    const item = missing[i];
    onProgress?.(item.album, i + 1, missing.length);

    const covers = await searchAlbumArtworkWeb(item.artist, item.album);
    if (covers.length > 0) {
      await updateAlbumArtwork(item.album, covers[0]);
      updatedCount++;
    }
  }

  return updatedCount;
}


