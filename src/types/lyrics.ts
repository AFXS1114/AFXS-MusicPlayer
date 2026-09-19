// AFXS Music Player and Organizer
// Lyrics types and provider interface

export interface LyricLine {
  timestamp: number; // milliseconds from start
  text: string;
}

export interface LyricsResult {
  source: 'embedded' | 'lrc' | 'cache' | 'none';
  isTimestamped: boolean;
  lines: LyricLine[];
  plainText: string | null;
}

export interface LyricsProvider {
  name: string;
  priority: number;
  canProvide: (songId: number, uri: string) => Promise<boolean>;
  getLyrics: (songId: number, uri: string) => Promise<LyricsResult | null>;
}

// Future online provider interface (not implemented in Phase 1)
export interface OnlineLyricsProvider extends LyricsProvider {
  search: (title: string, artist: string, album?: string) => Promise<LyricsResult[]>;
}

export type SortField = 'title' | 'artist' | 'album' | 'dateAdded' | 'dateLastPlayed' | 'trackNumber' | 'duration';
export type SortDirection = 'asc' | 'desc';

export interface SortOptions {
  field: SortField;
  direction: SortDirection;
}
