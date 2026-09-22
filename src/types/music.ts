// AFXS Music Player and Organizer
// Core music entity types

export interface Song {
  id: number;
  uri: string;
  filename: string;
  title: string;
  artist: string;
  album: string;
  albumArtist: string;
  genre: string;
  year: number | null;
  trackNumber: number | null;
  discNumber: number | null;
  duration: number; // milliseconds
  artworkUri: string | null;
  dateAdded: number; // unix timestamp ms
  dateModified: number; // unix timestamp ms
  fileSize: number;
  isDeleted: number; // 0 | 1
}

export interface Artist {
  id: number;
  name: string;
  songCount: number;
  albumCount: number;
}

export interface Album {
  id: number;
  title: string;
  artist: string;
  albumArtist: string;
  year: number | null;
  artworkUri: string | null;
  songCount: number;
  totalDuration: number;
}

export interface Genre {
  id: number;
  name: string;
  songCount: number;
}

export interface Folder {
  path: string;
  name: string;
  songCount: number;
}

export interface Playlist {
  id: number;
  name: string;
  description: string;
  artworkUri: string | null;
  songCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface PlaylistSong {
  id: number;
  playlistId: number;
  songId: number;
  position: number;
  addedAt: number;
}

export interface Favorite {
  id: number;
  songId: number;
  addedAt: number;
}

export interface PlayHistoryEntry {
  id: number;
  songId: number;
  playedAt: number;
  completionPercent: number | null;
}

export interface OrganizationHistoryEntry {
  id: number;
  songId: number;
  originalUri: string;
  newUri: string;
  operationType: 'move' | 'rename' | 'copy';
  status: 'pending' | 'completed' | 'failed' | 'undone';
  errorMessage: string | null;
  performedAt: number;
  executedAt?: number;
  filesMoved?: number;
  pattern?: string;
  isUndone?: boolean;
}

// Extended song type with favorite/history metadata
export interface SongWithMeta extends Song {
  isFavorite?: boolean;
  lastPlayedAt?: number | null;
  playCount?: number;
}

// ─── Phase 2: Metadata Fixer ───────────────────────────────────────────────

export interface MetadataUpdate {
  songId: number;
  title?: string;
  artist?: string;
  album?: string;
  albumArtist?: string;
  genre?: string;
  year?: number | null;
  trackNumber?: number | null;
  discNumber?: number | null;
}

export interface MetadataQuality {
  song: Song;
  score: number; // 0–100
  missingFields: string[];
  suggestions: Partial<MetadataUpdate>;
  hasFilenameSuggestion?: boolean;
}

// ─── Phase 2: Duplicate Finder ─────────────────────────────────────────────

export type DuplicateMatchReason =
  | 'exact_filename'
  | 'title_artist'
  | 'duration_size'
  | 'combined';

export interface DuplicateGroup {
  id: string;
  groupId?: string;
  songs: Song[];
  confidence: number; // 0–100
  matchReason: DuplicateMatchReason;
}

// ─── Phase 2: Music Organizer ──────────────────────────────────────────────

export interface FileMoveItem {
  songId: number;
  songTitle: string;
  oldPath: string;
  newPath: string;
  targetFolder: string;
}

export interface MovePlan {
  totalFiles: number;
  itemsToMove: FileMoveItem[];
  itemsSkipped: FileMoveItem[];
}

// ─── Phase 2: Artwork Manager ──────────────────────────────────────────────

export interface ArtworkStatus {
  albumTitle: string;
  albumArtist: string;
  album: string;
  artist: string;
  songCount: number;
  hasArtwork: boolean;
  isCustom?: boolean;
  artworkUri: string | null;
  songs: Song[];
}

