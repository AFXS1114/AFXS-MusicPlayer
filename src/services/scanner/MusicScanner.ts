// AFXS Music Player and Organizer
// Music scanner — uses expo-media-library to discover and index music files

import * as MediaLibrary from 'expo-media-library/legacy';
import { upsertSong, markSongDeleted, getAllSongUris } from '@/database/daos/songDao';
import { saveArtworkBase64, artworkExists } from '@/services/artwork/ArtworkManager';

export type ScanStatus = 'idle' | 'scanning' | 'completed' | 'error';

export interface ScanProgress {
  status: ScanStatus;
  total: number;
  processed: number;
  newFiles: number;
  updatedFiles: number;
  deletedFiles: number;
  errorMessage?: string;
}

export type ScanProgressCallback = (progress: ScanProgress) => void;

const SUPPORTED_EXTENSIONS = [
  '.mp3', '.m4a', '.aac', '.flac', '.wav', '.ogg', '.opus', '.wma',
];

function isSupportedAudio(filename: string): boolean {
  const lower = filename.toLowerCase();
  return SUPPORTED_EXTENSIONS.some(ext => lower.endsWith(ext));
}

export async function scanMusicLibrary(
  onProgress?: ScanProgressCallback
): Promise<ScanProgress> {
  const progress: ScanProgress = {
    status: 'scanning',
    total: 0,
    processed: 0,
    newFiles: 0,
    updatedFiles: 0,
    deletedFiles: 0,
  };

  const report = () => onProgress?.(progress);
  report();

  try {
    // 1. Get existing URIs from DB for change detection
    const existingEntries = await getAllSongUris();
    const existingMap = new Map(
      existingEntries.map(e => [e.uri, { dateModified: e.dateModified, fileSize: e.fileSize }])
    );
    const seenUris = new Set<string>();

    // 2. Fetch all audio assets from MediaLibrary in pages
    let hasNextPage = true;
    let after: string | undefined;

    while (hasNextPage) {
      const page = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.audio,
        first: 200,
        after,
        sortBy: [[MediaLibrary.SortBy.creationTime, true]],
      });

      hasNextPage = page.hasNextPage;
      after = page.endCursor;

      const audioAssets = page.assets.filter(a => isSupportedAudio(a.filename));

      for (const asset of audioAssets) {
        const uri = asset.uri;
        seenUris.add(uri);

        const existing = existingMap.get(uri);
        const modifiedMs = asset.modificationTime * 1000;
        const isNew = !existing;
        const isModified = existing && existing.dateModified !== modifiedMs;

        if (isNew || isModified) {
          // Get full asset info for more metadata
          let info: MediaLibrary.AssetInfo | null = null;
          try {
            info = await MediaLibrary.getAssetInfoAsync(asset);
          } catch {
            // Fall back to asset data
          }

          const songId = await upsertSong({
            uri,
            filename: asset.filename,
            title: cleanString(asset.filename.replace(/\.[^/.]+$/, '')),
            artist: null,
            album: null,
            albumArtist: null,
            genre: null,
            year: null,
            trackNumber: null,
            discNumber: null,
            duration: Math.round(asset.duration * 1000),
            artworkUri: null,
            dateAdded: asset.creationTime * 1000,
            dateModified: modifiedMs,
            fileSize: 0,
          });

          if (isNew) {
            progress.newFiles++;
          } else {
            progress.updatedFiles++;
          }

          // Extract artwork if not cached
          if (songId && !(await artworkExists(songId))) {
            await extractAndCacheArtwork(songId, uri);
          }
        }

        progress.processed++;
        if (progress.processed % 10 === 0) report();
      }
    }

    // 3. Mark deleted files
    for (const uri of existingMap.keys()) {
      if (!seenUris.has(uri)) {
        await markSongDeleted(uri);
        progress.deletedFiles++;
      }
    }

    progress.status = 'completed';
    progress.total = progress.processed;
    report();
    return progress;
  } catch (err) {
    progress.status = 'error';
    progress.errorMessage = err instanceof Error ? err.message : 'Unknown scan error';
    report();
    return progress;
  }
}

async function extractAndCacheArtwork(songId: number, uri: string): Promise<void> {
  // expo-media-library doesn't provide embedded artwork directly.
  // Artwork extraction from audio files requires native modules beyond what
  // expo-media-library provides in managed workflow.
  // We store null and will enhance this with a native module in a dev build.
  // This is a safe no-op fallback.
}

function cleanString(s: string): string {
  return s.replace(/_/g, ' ').trim();
}
