// AFXS Music Player and Organizer
// Reusable: SongRow

import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing, Typography, Radius } from '@/constants/theme';
import { formatDuration } from '@/utils/format';
import type { Song } from '@/types/music';

interface SongRowProps {
  song: Song;
  isPlaying?: boolean;
  isFavorite?: boolean;
  showTrackNumber?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  onMorePress?: () => void;
  rightContent?: React.ReactNode;
}

export const SongRow = memo(function SongRow({
  song,
  isPlaying,
  isFavorite,
  showTrackNumber,
  onPress,
  onLongPress,
  onMorePress,
  rightContent,
}: SongRowProps) {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      style={[
        styles.container,
        isPlaying && { backgroundColor: theme.surfaceElevated },
      ]}
    >
      {/* Artwork / Track number */}
      <View style={styles.left}>
        {showTrackNumber && song.trackNumber ? (
          <View style={[styles.artwork, styles.trackNumContainer]}>
            <Text style={[styles.trackNum, { color: theme.textTertiary }]}>
              {song.trackNumber}
            </Text>
          </View>
        ) : song.artworkUri ? (
          <Image
            source={{ uri: song.artworkUri }}
            style={styles.artwork}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.artwork, styles.artworkPlaceholder, { backgroundColor: theme.surfaceSecondary }]}>
            <MaterialIcons name="music-note" size={18} color={theme.textTertiary} />
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text
          style={[
            styles.title,
            { color: isPlaying ? theme.accent : theme.textPrimary },
          ]}
          numberOfLines={1}
        >
          {song.title || song.filename}
        </Text>
        <Text style={[styles.sub, { color: theme.textSecondary }]} numberOfLines={1}>
          {[song.artist, song.album].filter(Boolean).join(' · ')}
        </Text>
      </View>

      {/* Right side */}
      <View style={styles.right}>
        {rightContent ?? (
          <>
            {isFavorite && (
              <MaterialIcons
                name="favorite"
                size={14}
                color={theme.accent}
                style={styles.favoriteIcon}
              />
            )}
            <Text style={[styles.duration, { color: theme.textTertiary }]}>
              {formatDuration(song.duration)}
            </Text>
            {onMorePress && (
              <TouchableOpacity onPress={onMorePress} hitSlop={8} style={styles.moreBtn}>
                <MaterialIcons name="more-vert" size={20} color={theme.textTertiary} />
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.md,
  },
  left: {
    flexShrink: 0,
  },
  artwork: {
    width: 46,
    height: 46,
    borderRadius: Radius.sm,
  },
  artworkPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackNumContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackNum: {
    fontSize: Typography.base,
    fontWeight: Typography.medium,
  },
  info: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  title: {
    fontSize: Typography.base,
    fontWeight: Typography.medium,
    letterSpacing: Typography.tracking.tight,
  },
  sub: {
    fontSize: Typography.sm,
    fontWeight: Typography.regular,
  },
  right: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  favoriteIcon: {
    marginRight: 2,
  },
  duration: {
    fontSize: Typography.xs,
    fontWeight: Typography.regular,
    minWidth: 36,
    textAlign: 'right',
  },
  moreBtn: {
    padding: 2,
  },
});
