// AFXS Music Player and Organizer
// DuplicateService — detects duplicate songs by various heuristics

import type { Song, DuplicateGroup, DuplicateMatchReason } from '@/types/music';

/**
 * Normalize a string for comparison: lowercase, trim, remove diacritics, collapse spaces
 */
function normalize(s: string | null): string {
  if (!s) return '';
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^a-z0-9\s]/g, '')    // strip non-alphanumeric
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Strip extension from filename
 */
function stripExt(filename: string): string {
  return filename.replace(/\.[^/.]+$/, '');
}

/**
 * Calculate similarity between two strings (0–1) using Dice coefficient
 */
function stringSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;

  const bigrams = new Map<string, number>();
  for (let i = 0; i < a.length - 1; i++) {
    const bi = a.substring(i, i + 2);
    bigrams.set(bi, (bigrams.get(bi) ?? 0) + 1);
  }

  let intersections = 0;
  for (let i = 0; i < b.length - 1; i++) {
    const bi = b.substring(i, i + 2);
    const count = bigrams.get(bi) ?? 0;
    if (count > 0) {
      bigrams.set(bi, count - 1);
      intersections++;
    }
  }

  return (2.0 * intersections) / (a.length + b.length - 2);
}

interface DuplicatePair {
  songA: Song;
  songB: Song;
  confidence: number;
  reason: DuplicateMatchReason;
}

/**
 * Check if two songs are potential duplicates
 */
function compareSongs(a: Song, b: Song): DuplicatePair | null {
  const normTitleA = normalize(a.title || stripExt(a.filename));
  const normTitleB = normalize(b.title || stripExt(b.filename));
  const normArtistA = normalize(a.artist);
  const normArtistB = normalize(b.artist);
  const normFileA = normalize(stripExt(a.filename));
  const normFileB = normalize(stripExt(b.filename));

  // 1. Exact filename match (different folders)
  if (normFileA === normFileB && a.uri !== b.uri && normFileA.length > 0) {
    return {
      songA: a,
      songB: b,
      confidence: 95,
      reason: 'exact_filename',
    };
  }

  // 2. Title + Artist exact match
  if (
    normTitleA === normTitleB &&
    normArtistA === normArtistB &&
    normTitleA.length > 0 &&
    normArtistA.length > 0
  ) {
    return {
      songA: a,
      songB: b,
      confidence: 90,
      reason: 'title_artist',
    };
  }

  // 3. Duration match (within 2s) + similar file size (within 20%) + title similarity
  const durationDiff = Math.abs(a.duration - b.duration);
  const titleSim = stringSimilarity(normTitleA, normTitleB);

  if (durationDiff < 2000 && titleSim > 0.7 && a.duration > 0) {
    let confidence = 60;

    // Boost confidence with file size similarity
    if (a.fileSize > 0 && b.fileSize > 0) {
      const sizeRatio = Math.min(a.fileSize, b.fileSize) / Math.max(a.fileSize, b.fileSize);
      if (sizeRatio > 0.8) confidence += 15;
    }

    // Boost with artist similarity
    const artistSim = stringSimilarity(normArtistA, normArtistB);
    if (artistSim > 0.7) confidence += 10;

    if (confidence >= 65) {
      return {
        songA: a,
        songB: b,
        confidence: Math.min(confidence, 95),
        reason: titleSim > 0.9 ? 'combined' : 'duration_size',
      };
    }
  }

  return null;
}

/**
 * Find all duplicate groups in a list of songs
 */
export function findDuplicates(songs: Song[]): DuplicateGroup[] {
  const pairs: DuplicatePair[] = [];
  const n = songs.length;

  // O(n²) comparison — acceptable for typical libraries (< 10k songs)
  // We optimize by sorting by normalized title first and only comparing nearby songs
  const sorted = [...songs].sort((a, b) => {
    const na = normalize(a.title || stripExt(a.filename));
    const nb = normalize(b.title || stripExt(b.filename));
    return na.localeCompare(nb);
  });

  for (let i = 0; i < n; i++) {
    // Compare with a window of nearby songs (by sorted title)
    const windowSize = Math.min(50, n - i);
    for (let j = i + 1; j < i + windowSize; j++) {
      const pair = compareSongs(sorted[i], sorted[j]);
      if (pair) {
        pairs.push(pair);
      }
    }
  }

  // Group pairs into clusters using Union-Find
  const parent = new Map<number, number>();
  const find = (id: number): number => {
    if (!parent.has(id)) parent.set(id, id);
    if (parent.get(id) !== id) parent.set(id, find(parent.get(id)!));
    return parent.get(id)!;
  };
  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };

  const pairMetadata = new Map<string, { confidence: number; reason: DuplicateMatchReason }>();

  for (const pair of pairs) {
    union(pair.songA.id, pair.songB.id);
    const key = `${Math.min(pair.songA.id, pair.songB.id)}-${Math.max(pair.songA.id, pair.songB.id)}`;
    const existing = pairMetadata.get(key);
    if (!existing || pair.confidence > existing.confidence) {
      pairMetadata.set(key, { confidence: pair.confidence, reason: pair.reason });
    }
  }

  // Build groups
  const groups = new Map<number, Song[]>();
  const songMap = new Map<number, Song>();
  for (const song of songs) songMap.set(song.id, song);

  for (const pair of pairs) {
    const root = find(pair.songA.id);
    if (!groups.has(root)) groups.set(root, []);
    const group = groups.get(root)!;
    if (!group.some(s => s.id === pair.songA.id)) group.push(pair.songA);
    if (!group.some(s => s.id === pair.songB.id)) group.push(pair.songB);
  }

  // Convert to DuplicateGroup[]
  const result: DuplicateGroup[] = [];
  let groupIndex = 0;

  for (const [, groupSongs] of groups) {
    if (groupSongs.length < 2) continue;

    // Find best confidence and reason for this group
    let bestConfidence = 0;
    let bestReason: DuplicateMatchReason = 'combined';

    for (let i = 0; i < groupSongs.length; i++) {
      for (let j = i + 1; j < groupSongs.length; j++) {
        const key = `${Math.min(groupSongs[i].id, groupSongs[j].id)}-${Math.max(groupSongs[i].id, groupSongs[j].id)}`;
        const meta = pairMetadata.get(key);
        if (meta && meta.confidence > bestConfidence) {
          bestConfidence = meta.confidence;
          bestReason = meta.reason;
        }
      }
    }

    result.push({
      id: `dup-${groupIndex++}`,
      songs: groupSongs,
      confidence: bestConfidence,
      matchReason: bestReason,
    });
  }

  return result.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Get a human-readable label for a match reason
 */
export function getMatchReasonLabel(reason: DuplicateMatchReason): string {
  switch (reason) {
    case 'exact_filename': return 'Same filename';
    case 'title_artist': return 'Same title & artist';
    case 'duration_size': return 'Similar duration & size';
    case 'combined': return 'Multiple matches';
  }
}

/**
 * Get confidence level label
 */
export function getConfidenceLabel(confidence: number): 'High' | 'Medium' | 'Low' {
  if (confidence >= 85) return 'High';
  if (confidence >= 65) return 'Medium';
  return 'Low';
}

export function computeReclaimableStorage(groups: DuplicateGroup[]): number {
  let totalBytes = 0;
  for (const g of groups) {
    if (g.songs.length > 1) {
      // Sort songs by size descending, keep the largest/best quality song, calculate sum of others
      const sorted = [...g.songs].sort((a, b) => (b.fileSize || 0) - (a.fileSize || 0));
      for (let i = 1; i < sorted.length; i++) {
        totalBytes += sorted[i].fileSize || 0;
      }
    }
  }
  return totalBytes;
}

