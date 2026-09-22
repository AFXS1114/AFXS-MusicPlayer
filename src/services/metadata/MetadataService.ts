// AFXS Music Player and Organizer
// MetadataService — analyzes, suggests, and applies metadata fixes

import type { Song, MetadataQuality, MetadataUpdate } from '@/types/music';
import { updateSongMetadata, bulkUpdateMetadata, type MetadataFields } from '@/database/daos/songDao';

// Common filename patterns for extracting artist and title
const FILENAME_PATTERNS = [
  // "Artist - Title"
  /^(.+?)\s*-\s*(.+)$/,
  // "01 Title" or "01. Title"
  /^(\d{1,3})[\.\s]+(.+)$/,
  // "01 - Title"
  /^(\d{1,3})\s*-\s*(.+)$/,
  // "Artist - 01 - Title"
  /^(.+?)\s*-\s*\d{1,3}\s*-\s*(.+)$/,
];

// Words that indicate default/missing metadata
const DEFAULT_VALUES = new Set([
  'unknown artist', 'unknown album', 'various artists',
  'untitled', '', 'track',
]);

function isDefaultValue(value: string | null | undefined): boolean {
  if (!value) return true;
  return DEFAULT_VALUES.has(value.toLowerCase().trim());
}

function stripExtension(filename: string): string {
  return filename.replace(/\.[^/.]+$/, '');
}

function cleanParsed(s: string): string {
  return s
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Attempt to extract artist and title from filename
 */
function parseFilename(filename: string): { artist?: string; title?: string; trackNumber?: number } {
  const base = stripExtension(filename);
  const result: { artist?: string; title?: string; trackNumber?: number } = {};

  // Try "Artist - Title"
  const dashMatch = base.match(/^(.+?)\s*-\s*(.+)$/);
  if (dashMatch) {
    const left = cleanParsed(dashMatch[1]);
    const right = cleanParsed(dashMatch[2]);

    // Check if left side is a track number
    const trackNum = parseInt(left, 10);
    if (!isNaN(trackNum) && left.length <= 3) {
      result.trackNumber = trackNum;
      result.title = right;
    } else {
      result.artist = left;
      // Check if right side starts with a track number
      const rightTrack = right.match(/^(\d{1,3})[\.\s\-]+(.+)$/);
      if (rightTrack) {
        result.trackNumber = parseInt(rightTrack[1], 10);
        result.title = cleanParsed(rightTrack[2]);
      } else {
        result.title = right;
      }
    }
    return result;
  }

  // Try "01 Title" or "01. Title"
  const numMatch = base.match(/^(\d{1,3})[\.\s]+(.+)$/);
  if (numMatch) {
    result.trackNumber = parseInt(numMatch[1], 10);
    result.title = cleanParsed(numMatch[2]);
    return result;
  }

  // Fallback: just clean the filename
  result.title = cleanParsed(base);
  return result;
}

/**
 * Score a song's metadata quality from 0–100
 */
export function scoreMetadataQuality(song: Song): MetadataQuality {
  const missingFields: string[] = [];
  let score = 100;
  const fieldWeights: Array<[string, string | number | null, number]> = [
    ['title', song.title, 20],
    ['artist', song.artist, 20],
    ['album', song.album, 15],
    ['genre', song.genre, 10],
    ['year', song.year, 10],
    ['trackNumber', song.trackNumber, 10],
    ['albumArtist', song.albumArtist, 5],
    ['discNumber', song.discNumber, 5],
    ['artworkUri', song.artworkUri, 5],
  ];

  for (const [field, value, weight] of fieldWeights) {
    if (typeof value === 'string' && isDefaultValue(value)) {
      missingFields.push(field);
      score -= weight;
    } else if (value === null || value === undefined) {
      missingFields.push(field);
      score -= weight;
    }
  }

  // Bonus: title matches filename = likely unfixed
  if (song.title === stripExtension(song.filename) || song.title === song.filename) {
    if (!missingFields.includes('title')) {
      missingFields.push('title');
      score -= 10;
    }
  }

  // Generate suggestions from filename parsing
  const suggestions: Partial<MetadataUpdate> = {};
  if (missingFields.includes('title') || missingFields.includes('artist') || missingFields.includes('trackNumber')) {
    const parsed = parseFilename(song.filename);
    if (parsed.title && (isDefaultValue(song.title) || song.title === stripExtension(song.filename))) {
      suggestions.title = parsed.title;
    }
    if (parsed.artist && isDefaultValue(song.artist)) {
      suggestions.artist = parsed.artist;
    }
    if (parsed.trackNumber !== undefined && song.trackNumber === null) {
      suggestions.trackNumber = parsed.trackNumber;
    }
  }

  return {
    song,
    score: Math.max(0, score),
    missingFields,
    suggestions,
  };
}

/**
 * Analyze an array of songs and return quality scores, sorted worst-first
 */
export function analyzeMetadataQuality(songs: Song[]): MetadataQuality[] {
  return songs
    .map(scoreMetadataQuality)
    .sort((a, b) => a.score - b.score);
}

/**
 * Apply a metadata update to the database
 */
export async function applyMetadataFix(
  songId: number,
  fields: MetadataFields
): Promise<void> {
  await updateSongMetadata(songId, fields);
}

/**
 * Batch apply auto-suggestions for all songs with suggestions
 */
export async function autoFixAll(
  qualities: MetadataQuality[]
): Promise<number> {
  const updates: Array<{ songId: number; fields: MetadataFields }> = [];
  for (const q of qualities) {
    if (Object.keys(q.suggestions).length > 0) {
      const fields: MetadataFields = {};
      if (q.suggestions.title) fields.title = q.suggestions.title;
      if (q.suggestions.artist) fields.artist = q.suggestions.artist;
      if (q.suggestions.album) fields.album = q.suggestions.album;
      if (q.suggestions.albumArtist) fields.albumArtist = q.suggestions.albumArtist;
      if (q.suggestions.genre) fields.genre = q.suggestions.genre;
      if (q.suggestions.year !== undefined) fields.year = q.suggestions.year;
      if (q.suggestions.trackNumber !== undefined) fields.trackNumber = q.suggestions.trackNumber;
      if (q.suggestions.discNumber !== undefined) fields.discNumber = q.suggestions.discNumber;
      updates.push({ songId: q.song.id, fields });
    }
  }
  if (updates.length === 0) return 0;
  return await bulkUpdateMetadata(updates);
}


export const assessMetadataQuality = scoreMetadataQuality;


export function suggestFixFromFilename(song: Song): MetadataFields | null {
  const quality = scoreMetadataQuality(song);
  if (Object.keys(quality.suggestions).length === 0) return null;
  const fields: MetadataFields = {};
  if (quality.suggestions.title) fields.title = quality.suggestions.title;
  if (quality.suggestions.artist) fields.artist = quality.suggestions.artist;
  if (quality.suggestions.album) fields.album = quality.suggestions.album;
  if (quality.suggestions.albumArtist) fields.albumArtist = quality.suggestions.albumArtist;
  if (quality.suggestions.genre) fields.genre = quality.suggestions.genre;
  if (quality.suggestions.year !== undefined) fields.year = quality.suggestions.year;
  if (quality.suggestions.trackNumber !== undefined) fields.trackNumber = quality.suggestions.trackNumber;
  if (quality.suggestions.discNumber !== undefined) fields.discNumber = quality.suggestions.discNumber;
  return fields;
}

