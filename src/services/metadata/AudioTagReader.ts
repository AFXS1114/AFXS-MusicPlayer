// AFXS Music Player and Organizer
// AudioTagReader — parses ID3, MP4, FLAC, Vorbis metadata & extracts embedded artwork

import * as FileSystem from 'expo-file-system/legacy';
import { Buffer } from 'buffer';
import { parseBuffer } from 'music-metadata';
import { suggestFixFromFilename } from './MetadataService';

export interface ExtractedAudioMetadata {
  title: string;
  artist: string | null;
  album: string | null;
  albumArtist: string | null;
  genre: string | null;
  year: number | null;
  trackNumber: number | null;
  discNumber: number | null;
  durationMs: number;
  pictureBase64: string | null;
}

export async function readAudioFileTags(
  uri: string,
  filename: string,
  assetDurationSec = 0
): Promise<ExtractedAudioMetadata> {
  const fallbackTitle = filename.replace(/\.[^/.]+$/, '').replace(/_/g, ' ').trim();
  const filenameSuggestion = suggestFixFromFilename({ filename } as any);

  let title = filenameSuggestion?.title || fallbackTitle;
  let artist = filenameSuggestion?.artist || null;
  let album = filenameSuggestion?.album || null;
  let albumArtist = filenameSuggestion?.albumArtist || null;
  let genre = filenameSuggestion?.genre || null;
  let year: number | null = filenameSuggestion?.year || null;
  let trackNumber: number | null = filenameSuggestion?.trackNumber || null;
  let discNumber: number | null = filenameSuggestion?.discNumber || null;
  let durationMs = Math.round(assetDurationSec * 1000);
  let pictureBase64: string | null = null;

  try {
    const base64Str = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (base64Str) {
      const buf = Buffer.from(base64Str, 'base64');
      const parsed = await parseBuffer(buf);

      if (parsed && parsed.common) {
        const c = parsed.common;
        if (c.title && c.title.trim()) title = c.title.trim();
        if (c.artist && c.artist.trim()) artist = c.artist.trim();
        if (c.album && c.album.trim()) album = c.album.trim();
        if (c.albumartist && c.albumartist.trim()) albumArtist = c.albumartist.trim();

        if (c.genre && c.genre.length > 0) {
          genre = Array.isArray(c.genre) ? c.genre.join(', ') : String(c.genre);
        }
        if (c.year) year = c.year;
        if (c.track && c.track.no) trackNumber = c.track.no;
        if (c.disk && c.disk.no) discNumber = c.disk.no;

        // Extract embedded cover photo
        if (c.picture && c.picture.length > 0 && c.picture[0].data) {
          pictureBase64 = Buffer.from(c.picture[0].data).toString('base64');
        }
      }

      if (parsed && parsed.format && parsed.format.duration) {
        durationMs = Math.round(parsed.format.duration * 1000);
      }
    }
  } catch (err) {
    // Non-fatal: if ID3 parse fails, fallback to filename suggestions
  }

  return {
    title,
    artist: artist || albumArtist || null,
    album: album || null,
    albumArtist: albumArtist || artist || null,
    genre,
    year,
    trackNumber,
    discNumber,
    durationMs,
    pictureBase64,
  };
}
