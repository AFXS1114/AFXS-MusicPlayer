// AFXS Music Player and Organizer
// Lyrics service — provider pattern for embedded and local LRC lyrics

import * as FileSystem from 'expo-file-system/legacy';
import { getDatabase } from '@/database/db';
import type { LyricLine, LyricsResult, LyricsProvider } from '@/types/lyrics';

// ─── LRC Parser ──────────────────────────────────────────────────────────────

function parseLrc(content: string): LyricLine[] {
  const lines: LyricLine[] = [];
  const timeRegex = /\[(\d{2,3}):(\d{2})\.(\d{2,3})\]/g;
  const lineRegex = /^(\[[\d:.]+\])+(.*)$/;

  for (const rawLine of content.split('\n')) {
    const trimmed = rawLine.trim();
    if (!lineRegex.test(trimmed)) continue;

    const text = trimmed.replace(/\[[\d:.]+\]/g, '').trim();
    let match;
    timeRegex.lastIndex = 0;

    while ((match = timeRegex.exec(trimmed)) !== null) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const centis = parseInt(match[3].padEnd(3, '0'), 10);
      const timestampMs = (minutes * 60 + seconds) * 1000 + centis;
      lines.push({ timestamp: timestampMs, text });
    }
  }

  return lines.sort((a, b) => a.timestamp - b.timestamp);
}

// ─── Providers ───────────────────────────────────────────────────────────────

class LocalLrcProvider implements LyricsProvider {
  name = 'LocalLRC';
  priority = 2;

  async canProvide(_songId: number, uri: string): Promise<boolean> {
    const lrcPath = uri.replace(/\.[^/.]+$/, '.lrc');
    try {
      const info = await FileSystem.getInfoAsync(lrcPath);
      return info.exists;
    } catch {
      return false;
    }
  }

  async getLyrics(_songId: number, uri: string): Promise<LyricsResult | null> {
    const lrcPath = uri.replace(/\.[^/.]+$/, '.lrc');
    try {
      const content = await FileSystem.readAsStringAsync(lrcPath);
      const lines = parseLrc(content);
      if (lines.length === 0) {
        return {
          source: 'lrc',
          isTimestamped: false,
          lines: [],
          plainText: content.replace(/\[[\d:.]+\]/g, '').trim(),
        };
      }
      return { source: 'lrc', isTimestamped: true, lines, plainText: null };
    } catch {
      return null;
    }
  }
}

class CachedLyricsProvider implements LyricsProvider {
  name = 'Cache';
  priority = 1;

  async canProvide(songId: number, _uri: string): Promise<boolean> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM lyrics_cache WHERE songId = ?',
      [songId]
    );
    return !!row;
  }

  async getLyrics(songId: number, _uri: string): Promise<LyricsResult | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{
      source: string;
      isTimestamped: number;
      content: string;
    }>('SELECT source, isTimestamped, content FROM lyrics_cache WHERE songId = ?', [songId]);

    if (!row) return null;

    try {
      const parsed = JSON.parse(row.content) as LyricLine[];
      return {
        source: row.source as LyricsResult['source'],
        isTimestamped: row.isTimestamped === 1,
        lines: parsed,
        plainText: null,
      };
    } catch {
      return {
        source: row.source as LyricsResult['source'],
        isTimestamped: false,
        lines: [],
        plainText: row.content,
      };
    }
  }
}

// ─── LyricsManager ───────────────────────────────────────────────────────────

class LyricsManagerClass {
  private providers: LyricsProvider[] = [
    new LocalLrcProvider(),
    new CachedLyricsProvider(),
  ];

  async getLyrics(songId: number, uri: string): Promise<LyricsResult> {
    const sorted = [...this.providers].sort((a, b) => b.priority - a.priority);

    for (const provider of sorted) {
      try {
        const canProvide = await provider.canProvide(songId, uri);
        if (!canProvide) continue;
        const result = await provider.getLyrics(songId, uri);
        if (result) return result;
      } catch {
        // try next provider
      }
    }

    return { source: 'none', isTimestamped: false, lines: [], plainText: null };
  }

  registerProvider(provider: LyricsProvider): void {
    this.providers.push(provider);
  }

  findActiveLine(lines: LyricLine[], positionMs: number): number {
    let activeIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].timestamp <= positionMs) {
        activeIndex = i;
      } else {
        break;
      }
    }
    return activeIndex;
  }
}

export const LyricsManager = new LyricsManagerClass();
