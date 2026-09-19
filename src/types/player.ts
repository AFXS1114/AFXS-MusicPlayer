// AFXS Music Player and Organizer
// Player and queue types

import type { Song } from './music';

export type RepeatMode = 'none' | 'all' | 'one';
export type ShuffleMode = 'off' | 'on';

export interface QueueItem {
  id: string; // unique queue entry id (song.id + position for deduplication)
  song: Song;
  originalIndex: number;
}

export interface PlaybackState {
  isPlaying: boolean;
  isLoading: boolean;
  positionMs: number;
  durationMs: number;
  bufferedMs: number;
}

export interface PlayerState {
  queue: QueueItem[];
  currentIndex: number;
  shuffleMode: ShuffleMode;
  repeatMode: RepeatMode;
  playback: PlaybackState;
}

export interface PlayerContextValue {
  state: PlayerState;
  currentSong: Song | null;
  play: (song: Song, queue?: Song[], startIndex?: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  togglePlayPause: () => Promise<void>;
  seekTo: (positionMs: number) => Promise<void>;
  skipToNext: () => Promise<void>;
  skipToPrevious: () => Promise<void>;
  setRepeatMode: (mode: RepeatMode) => void;
  setShuffleMode: (mode: ShuffleMode) => void;
  addToQueue: (song: Song) => void;
  playNext: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  playQueueIndex: (index: number) => Promise<void>;
}
