// AFXS Music Player and Organizer
// Full-screen player screen

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { Spacing, Typography, Radius } from '@/constants/theme';
import { formatDuration } from '@/utils/format';
import { isFavorite, addFavorite, removeFavorite } from '@/database/daos/playlistDao';

const { width: SCREEN_W } = Dimensions.get('window');
const ARTWORK_SIZE = SCREEN_W - Spacing.xxxl * 2;

export default function PlayerScreen() {
  const { theme } = useTheme();
  const {
    currentSong,
    state,
    togglePlayPause,
    seekTo,
    skipToNext,
    skipToPrevious,
    setRepeatMode,
    setShuffleMode,
  } = usePlayer();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [favorited, setFavorited] = useState(false);
  const [seeking, setSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);

  const { isPlaying, positionMs, durationMs } = state.playback;
  const { shuffleMode, repeatMode } = state;

  // Load favorite state
  useEffect(() => {
    if (!currentSong) return;
    isFavorite(currentSong.id).then(setFavorited).catch(() => {});
  }, [currentSong?.id]);

  const toggleFavorite = useCallback(async () => {
    if (!currentSong) return;
    try {
      if (favorited) {
        await removeFavorite(currentSong.id);
        setFavorited(false);
      } else {
        await addFavorite(currentSong.id);
        setFavorited(true);
      }
    } catch {}
  }, [currentSong, favorited]);

  const cycleRepeat = useCallback(() => {
    if (repeatMode === 'none') setRepeatMode('all');
    else if (repeatMode === 'all') setRepeatMode('one');
    else setRepeatMode('none');
  }, [repeatMode, setRepeatMode]);

  const toggleShuffle = useCallback(() => {
    setShuffleMode(shuffleMode === 'off' ? 'on' : 'off');
  }, [shuffleMode, setShuffleMode]);

  const progressRatio = durationMs > 0 ? positionMs / durationMs : 0;

  if (!currentSong) {
    return (
      <View style={[styles.container, { backgroundColor: theme.playerBackground, paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <MaterialIcons name="keyboard-arrow-down" size={30} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.playerBackground, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <MaterialIcons name="keyboard-arrow-down" size={30} color={theme.textSecondary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerLabel, { color: theme.textTertiary }]}>NOW PLAYING</Text>
          <Text style={[styles.headerAlbum, { color: theme.textSecondary }]} numberOfLines={1}>
            {currentSong.album || ''}
          </Text>
        </View>
        <TouchableOpacity onPress={toggleFavorite} hitSlop={8}>
          <MaterialIcons
            name={favorited ? 'favorite' : 'favorite-border'}
            size={24}
            color={favorited ? theme.accent : theme.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Artwork */}
      <View style={styles.artworkContainer}>
        {currentSong.artworkUri ? (
          <Image
            source={{ uri: currentSong.artworkUri }}
            style={[styles.artwork, { width: ARTWORK_SIZE, height: ARTWORK_SIZE }]}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.artwork,
              styles.artworkPlaceholder,
              {
                width: ARTWORK_SIZE,
                height: ARTWORK_SIZE,
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <MaterialIcons name="album" size={ARTWORK_SIZE * 0.35} color={theme.textTertiary} />
          </View>
        )}
      </View>

      {/* Song info */}
      <View style={styles.infoSection}>
        <Text style={[styles.songTitle, { color: theme.textPrimary }]} numberOfLines={2}>
          {currentSong.title || currentSong.filename}
        </Text>
        <Text style={[styles.songArtist, { color: theme.textSecondary }]} numberOfLines={1}>
          {currentSong.artist || 'Unknown Artist'}
        </Text>
      </View>

      {/* Progress */}
      <View style={styles.progressSection}>
        <TouchableOpacity
          style={styles.progressTouchable}
          onPress={(e) => {
            const { locationX, target } = e.nativeEvent;
            // Measure tap position against track width
            if (durationMs > 0) {
              const barWidth = SCREEN_W - Spacing.xxxl * 2;
              const ratio = Math.min(1, Math.max(0, locationX / barWidth));
              seekTo(ratio * durationMs);
            }
          }}
          activeOpacity={1}
        >
          <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: theme.accent, width: `${progressRatio * 100}%` },
              ]}
            />
            <View
              style={[
                styles.progressThumb,
                {
                  backgroundColor: theme.accent,
                  left: `${progressRatio * 100}%`,
                },
              ]}
            />
          </View>
        </TouchableOpacity>
        <View style={styles.timeRow}>
          <Text style={[styles.time, { color: theme.textTertiary }]}>
            {formatDuration(positionMs)}
          </Text>
          <Text style={[styles.time, { color: theme.textTertiary }]}>
            {formatDuration(durationMs)}
          </Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {/* Shuffle */}
        <TouchableOpacity onPress={toggleShuffle} hitSlop={8}>
          <MaterialIcons
            name="shuffle"
            size={22}
            color={shuffleMode === 'on' ? theme.accent : theme.textSecondary}
          />
        </TouchableOpacity>

        {/* Previous */}
        <TouchableOpacity onPress={skipToPrevious} hitSlop={8}>
          <MaterialIcons name="skip-previous" size={38} color={theme.textPrimary} />
        </TouchableOpacity>

        {/* Play / Pause */}
        <TouchableOpacity
          onPress={togglePlayPause}
          style={[styles.playBtn, { borderColor: theme.accent }]}
          activeOpacity={0.85}
        >
          <MaterialIcons
            name={isPlaying ? 'pause' : 'play-arrow'}
            size={40}
            color={theme.accent}
          />
        </TouchableOpacity>

        {/* Next */}
        <TouchableOpacity onPress={skipToNext} hitSlop={8}>
          <MaterialIcons name="skip-next" size={38} color={theme.textPrimary} />
        </TouchableOpacity>

        {/* Repeat */}
        <TouchableOpacity onPress={cycleRepeat} hitSlop={8}>
          <MaterialIcons
            name={repeatMode === 'one' ? 'repeat-one' : 'repeat'}
            size={22}
            color={repeatMode !== 'none' ? theme.accent : theme.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Queue indicator */}
      <View style={styles.queueRow}>
        <Text style={[styles.queueText, { color: theme.textTertiary }]}>
          {state.queue.length > 0
            ? `${state.currentIndex + 1} of ${state.queue.length}`
            : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  closeBtn: {
    padding: Spacing.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  headerLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    letterSpacing: Typography.tracking.wider,
  },
  headerAlbum: {
    fontSize: Typography.sm,
  },
  artworkContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xxxl,
    marginBottom: Spacing.xl,
  },
  artwork: {
    borderRadius: Radius.md,
  },
  artworkPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  infoSection: {
    paddingHorizontal: Spacing.xxxl,
    marginBottom: Spacing.xl,
    gap: Spacing.xs,
  },
  songTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    letterSpacing: Typography.tracking.tight,
  },
  songArtist: {
    fontSize: Typography.md,
  },
  progressSection: {
    paddingHorizontal: Spacing.xxxl,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  progressTouchable: {
    paddingVertical: Spacing.sm,
  },
  progressTrack: {
    height: 4,
    borderRadius: Radius.pill,
    overflow: 'visible',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.pill,
  },
  progressThumb: {
    position: 'absolute',
    top: -5,
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: -7,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  time: {
    fontSize: Typography.xs,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  playBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueRow: {
    alignItems: 'center',
  },
  queueText: {
    fontSize: Typography.xs,
  },
});
