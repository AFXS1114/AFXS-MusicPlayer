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
}

// Extended song type with favorite/history metadata
export interface SongWithMeta extends Song {
  isFavorite?: boolean;
  lastPlayedAt?: number | null;
  playCount?: number;
}
