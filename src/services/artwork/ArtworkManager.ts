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
