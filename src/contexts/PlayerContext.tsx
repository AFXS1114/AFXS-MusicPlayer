// AFXS Music Player and Organizer
// PlayerContext — manages queue, shuffle, repeat, and playback state

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { useAudioPlayer, useAudioPlayerStatus, AudioPlayer } from 'expo-audio';
import { AudioService, AUDIO_MODE } from '@/services/audio/AudioService';
import { recordPlay } from '@/database/daos/playlistDao';
import type { Song } from '@/types/music';
import type {
  PlayerContextValue,
  PlayerState,
  QueueItem,
  RepeatMode,
  ShuffleMode,
  PlaybackState,
} from '@/types/player';

// ─── State ───────────────────────────────────────────────────────────────────

const initialPlaybackState: PlaybackState = {
  isPlaying: false,
  isLoading: false,
  positionMs: 0,
  durationMs: 0,
  bufferedMs: 0,
};

const initialState: PlayerState = {
  queue: [],
  currentIndex: -1,
  shuffleMode: 'off',
  repeatMode: 'none',
  playback: initialPlaybackState,
};

// ─── Reducer ─────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_QUEUE'; queue: QueueItem[]; index: number }
  | { type: 'SET_INDEX'; index: number }
  | { type: 'SET_SHUFFLE'; mode: ShuffleMode }
  | { type: 'SET_REPEAT'; mode: RepeatMode }
  | { type: 'SET_PLAYBACK'; playback: Partial<PlaybackState> }
  | { type: 'ADD_TO_QUEUE'; item: QueueItem }
  | { type: 'PLAY_NEXT'; item: QueueItem }
  | { type: 'REMOVE_FROM_QUEUE'; index: number }
  | { type: 'CLEAR_QUEUE' };

function makeQueueItems(songs: Song[]): QueueItem[] {
  return songs.map((song, i) => ({
    id: `${song.id}-${i}-${Date.now()}`,
    song,
    originalIndex: i,
  }));
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function reducer(state: PlayerState, action: Action): PlayerState {
  switch (action.type) {
    case 'SET_QUEUE':
      return { ...state, queue: action.queue, currentIndex: action.index };
    case 'SET_INDEX':
      return { ...state, currentIndex: action.index };
    case 'SET_SHUFFLE':
      return { ...state, shuffleMode: action.mode };
    case 'SET_REPEAT':
      return { ...state, repeatMode: action.mode };
    case 'SET_PLAYBACK':
      return { ...state, playback: { ...state.playback, ...action.playback } };
    case 'ADD_TO_QUEUE': {
      return { ...state, queue: [...state.queue, action.item] };
    }
    case 'PLAY_NEXT': {
      const insertAt = state.currentIndex + 1;
      const newQueue = [...state.queue];
      newQueue.splice(insertAt, 0, action.item);
      return { ...state, queue: newQueue };
    }
    case 'REMOVE_FROM_QUEUE': {
      const newQueue = state.queue.filter((_, i) => i !== action.index);
      let newIndex = state.currentIndex;
      if (action.index < state.currentIndex) newIndex--;
      if (action.index === state.currentIndex) newIndex = Math.min(newIndex, newQueue.length - 1);
      return { ...state, queue: newQueue, currentIndex: Math.max(0, newIndex) };
    }
    case 'CLEAR_QUEUE':
      return { ...state, queue: [], currentIndex: -1, playback: initialPlaybackState };
    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const player = useAudioPlayer(undefined, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const hasRecordedRef = useRef(false);
  const currentSongIdRef = useRef<number | null>(null);

  // Register player with AudioService
  useEffect(() => {
    AudioService.setPlayer(player);
    player.muted = false;
  }, [player]);

  // Sync playback status to state
  useEffect(() => {
    dispatch({
      type: 'SET_PLAYBACK',
      playback: {
        isPlaying: status.playing,
        isLoading: status.isBuffering,
        positionMs: (status.currentTime ?? 0) * 1000,
        durationMs: (status.duration ?? 0) * 1000,
      },
    });

    // Record play when > 30% complete
    const duration = (status.duration ?? 0) * 1000;
    const position = (status.currentTime ?? 0) * 1000;
    if (
      duration > 0 &&
      position / duration > 0.3 &&
      !hasRecordedRef.current &&
      currentSongIdRef.current !== null
    ) {
      hasRecordedRef.current = true;
      recordPlay(currentSongIdRef.current, (position / duration) * 100).catch(() => {});
    }
  }, [status]);

  // Auto-advance on end
  useEffect(() => {
    if (status.didJustFinish) {
      handleTrackEnd();
    }
  }, [status.didJustFinish]);

  const handleTrackEnd = useCallback(() => {
    const { repeatMode, currentIndex, queue } = state;
    if (repeatMode === 'one') {
      player.seekTo(0);
      player.play();
      return;
    }
    const nextIndex = currentIndex + 1;
    if (nextIndex < queue.length) {
      playIndex(nextIndex);
    } else if (repeatMode === 'all' && queue.length > 0) {
      playIndex(0);
    }
  }, [state]);

  const playIndex = useCallback(async (index: number) => {
    const item = state.queue[index];
    if (!item) return;
    hasRecordedRef.current = false;
    currentSongIdRef.current = item.song.id;
    dispatch({ type: 'SET_INDEX', index });
    dispatch({ type: 'SET_PLAYBACK', playback: { isLoading: true, positionMs: 0 } });
    try {
      player.replace({ uri: item.song.uri });
      await player.play();
    } catch {
      dispatch({ type: 'SET_PLAYBACK', playback: { isLoading: false, isPlaying: false } });
    }
  }, [state.queue, player]);

  // ─── Public API ─────────────────────────────────────────────────────────────

  const play = useCallback(async (song: Song, queue?: Song[], startIndex = 0) => {
    const songs = queue ?? [song];
    let items = makeQueueItems(songs);
    let targetIndex = startIndex;

    if (state.shuffleMode === 'on') {
      const targetItem = items[startIndex];
      const rest = items.filter((_, i) => i !== startIndex);
      items = [targetItem, ...shuffleArray(rest)];
      targetIndex = 0;
    }

    dispatch({ type: 'SET_QUEUE', queue: items, index: targetIndex });
    hasRecordedRef.current = false;
    currentSongIdRef.current = items[targetIndex].song.id;

    try {
      player.replace({ uri: items[targetIndex].song.uri });
      await player.play();
    } catch {
      dispatch({ type: 'SET_PLAYBACK', playback: { isLoading: false, isPlaying: false } });
    }
  }, [state.shuffleMode, player]);

  const pause = useCallback(async () => {
    await player.pause();
  }, [player]);

  const resume = useCallback(async () => {
    await player.play();
  }, [player]);

  const togglePlayPause = useCallback(async () => {
    if (status.playing) {
      await player.pause();
    } else {
      await player.play();
    }
  }, [status.playing, player]);

  const seekTo = useCallback(async (positionMs: number) => {
    await player.seekTo(positionMs / 1000);
  }, [player]);

  const skipToNext = useCallback(async () => {
    const next = state.currentIndex + 1;
    if (next < state.queue.length) {
      await playIndex(next);
    } else if (state.repeatMode === 'all' && state.queue.length > 0) {
      await playIndex(0);
    }
  }, [state.currentIndex, state.queue, state.repeatMode, playIndex]);

  const skipToPrevious = useCallback(async () => {
    const posMs = (status.currentTime ?? 0) * 1000;
    if (posMs > 3000) {
      await player.seekTo(0);
      return;
    }
    const prev = state.currentIndex - 1;
    if (prev >= 0) {
      await playIndex(prev);
    }
  }, [status.currentTime, state.currentIndex, player, playIndex]);

  const setRepeatMode = useCallback((mode: RepeatMode) => {
    dispatch({ type: 'SET_REPEAT', mode });
  }, []);

  const setShuffleMode = useCallback((mode: ShuffleMode) => {
    dispatch({ type: 'SET_SHUFFLE', mode });
    if (mode === 'on' && state.queue.length > 1) {
      const current = state.queue[state.currentIndex];
      const rest = state.queue.filter((_, i) => i !== state.currentIndex);
      const shuffled = [current, ...shuffleArray(rest)];
      dispatch({ type: 'SET_QUEUE', queue: shuffled, index: 0 });
    }
  }, [state.queue, state.currentIndex]);

  const addToQueue = useCallback((song: Song) => {
    const item: QueueItem = {
      id: `${song.id}-q-${Date.now()}`,
      song,
      originalIndex: state.queue.length,
    };
    dispatch({ type: 'ADD_TO_QUEUE', item });
  }, [state.queue.length]);

  const playNext = useCallback((song: Song) => {
    const item: QueueItem = {
      id: `${song.id}-n-${Date.now()}`,
      song,
      originalIndex: state.currentIndex + 1,
    };
    dispatch({ type: 'PLAY_NEXT', item });
  }, [state.currentIndex]);

  const removeFromQueue = useCallback((index: number) => {
    dispatch({ type: 'REMOVE_FROM_QUEUE', index });
  }, []);

  const clearQueue = useCallback(() => {
    player.pause();
    dispatch({ type: 'CLEAR_QUEUE' });
  }, [player]);

  const playQueueIndex = useCallback(async (index: number) => {
    await playIndex(index);
  }, [playIndex]);

  const currentSong = state.currentIndex >= 0
    ? state.queue[state.currentIndex]?.song ?? null
    : null;

  const value: PlayerContextValue = {
    state,
    currentSong,
    play,
    pause,
    resume,
    togglePlayPause,
    seekTo,
    skipToNext,
    skipToPrevious,
    setRepeatMode,
    setShuffleMode,
    addToQueue,
    playNext,
    removeFromQueue,
    clearQueue,
    playQueueIndex,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}
