// AFXS Music Player and Organizer
// Reusable: MiniPlayer

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { Spacing, Typography, Radius } from '@/constants/theme';

export function MiniPlayer() {
  const { theme } = useTheme();
  const { currentSong, state, togglePlayPause, skipToNext } = usePlayer();
  const router = useRouter();

  if (!currentSong) return null;

  const { isPlaying } = state.playback;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: theme.miniPlayerBackground,
          borderTopWidth: 1,
          borderTopColor: theme.border,
        },
      ]}
      onPress={() => router.push('/player')}
      activeOpacity={0.9}
    >
      {/* Progress bar at top */}
      <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
        {state.playback.durationMs > 0 && (
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: theme.accent,
                width: `${(state.playback.positionMs / state.playback.durationMs) * 100}%`,
              },
            ]}
          />
        )}
      </View>

      <View style={styles.inner}>
        {/* Artwork */}
        {currentSong.artworkUri ? (
          <Image
            source={{ uri: currentSong.artworkUri }}
            style={styles.artwork}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.artwork, styles.artworkPlaceholder, { backgroundColor: theme.surface }]}>
            <MaterialIcons name="music-note" size={20} color={theme.textTertiary} />
          </View>
        )}

        {/* Info */}
        <View style={styles.info}>
          <Text
            style={[styles.title, { color: theme.textPrimary }]}
            numberOfLines={1}
          >
            {currentSong.title || currentSong.filename}
          </Text>
          <Text style={[styles.artist, { color: theme.textSecondary }]} numberOfLines={1}>
            {currentSong.artist}
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            onPress={togglePlayPause}
            hitSlop={8}
            style={styles.playBtn}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={isPlaying ? 'pause' : 'play-arrow'}
              size={30}
              color={theme.accent}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={skipToNext} hitSlop={8} activeOpacity={0.7}>
            <MaterialIcons name="skip-next" size={26} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  progressTrack: {
    height: 2,
    width: '100%',
  },
  progressFill: {
    height: '100%',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
    height: 64,
  },
  artwork: {
    width: 44,
    height: 44,
    borderRadius: Radius.xs,
    flexShrink: 0,
  },
  artworkPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  title: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    letterSpacing: Typography.tracking.tight,
  },
  artist: {
    fontSize: Typography.sm,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flexShrink: 0,
  },
  playBtn: {},
});
