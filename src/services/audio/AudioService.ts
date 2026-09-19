// AFXS Music Player and Organizer
// AudioService — wraps expo-audio for local playback

import { AudioPlayer, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import type { Song } from '@/types/music';

// Audio session configuration for background playback
export const AUDIO_MODE = {
  playsInSilentMode: true,
  shouldPlayInBackground: true,
};

export type AudioServiceEvent =
  | { type: 'playbackStateChanged'; isPlaying: boolean }
  | { type: 'positionChanged'; positionMs: number; durationMs: number }
  | { type: 'playbackEnded' }
  | { type: 'error'; message: string };

export type AudioEventListener = (event: AudioServiceEvent) => void;

class AudioServiceClass {
  private listeners: AudioEventListener[] = [];
  private _player: AudioPlayer | null = null;

  setPlayer(player: AudioPlayer) {
    this._player = player;
  }

  addListener(listener: AudioEventListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  emit(event: AudioServiceEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  async loadAndPlay(song: Song): Promise<void> {
    if (!this._player) return;
    try {
      this._player.replace({ uri: song.uri });
      await this._player.play();
    } catch (err) {
      this.emit({
        type: 'error',
        message: err instanceof Error ? err.message : 'Playback error',
      });
    }
  }

  async pause(): Promise<void> {
    if (!this._player) return;
    await this._player.pause();
  }

  async play(): Promise<void> {
    if (!this._player) return;
    await this._player.play();
  }

  async seekTo(positionMs: number): Promise<void> {
    if (!this._player) return;
    await this._player.seekTo(positionMs / 1000);
  }

  getPositionMs(): number {
    return this._player ? this._player.currentTime * 1000 : 0;
  }

  getDurationMs(): number {
    return this._player ? this._player.duration * 1000 : 0;
  }

  isPlaying(): boolean {
    return this._player?.playing ?? false;
  }
}

export const AudioService = new AudioServiceClass();
