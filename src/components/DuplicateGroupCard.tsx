// AFXS Music Player and Organizer
// DuplicateGroupCard — displays a group of duplicate songs for review

import React, { useState } from 'react';
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
import { getMatchReasonLabel, getConfidenceLabel } from '@/services/duplicates/DuplicateService';
import type { Song, DuplicateGroup } from '@/types/music';


interface DuplicateGroupCardProps {
  group: DuplicateGroup;
  selectedIds: Set<number>;
  onToggleSelect: (songId: number) => void;
  onPlaySong?: (songId: number) => void;
  onPreview?: (song: Song) => void;
}

export function DuplicateGroupCard({
  group,
  selectedIds,
  onToggleSelect,
  onPlaySong,
  onPreview,
}: DuplicateGroupCardProps) {

  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(true);
  const confidenceLabel = getConfidenceLabel(group.confidence);
  const reasonLabel = getMatchReasonLabel(group.matchReason);

  const confidenceColor =
    confidenceLabel === 'High' ? theme.error :
    confidenceLabel === 'Medium' ? theme.warning :
    theme.textTertiary;

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {/* Group header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.confidenceBadge, { backgroundColor: confidenceColor + '22' }]}>
            <Text style={[styles.confidenceText, { color: confidenceColor }]}>
              {confidenceLabel}
            </Text>
          </View>
          <Text style={[styles.reasonText, { color: theme.textSecondary }]}>
            {reasonLabel}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={[styles.countText, { color: theme.textTertiary }]}>
            {group.songs.length} files
          </Text>
          <MaterialIcons
            name={expanded ? 'expand-less' : 'expand-more'}
            size={20}
            color={theme.textTertiary}
          />
        </View>
      </TouchableOpacity>

      {/* Songs list */}
      {expanded && group.songs.map((song, index) => {
        const isSelected = selectedIds.has(song.id);
        return (
          <View
            key={song.id}
            style={[
              styles.songRow,
              index < group.songs.length - 1 && { borderBottomColor: theme.borderSubtle, borderBottomWidth: StyleSheet.hairlineWidth },
              isSelected && { backgroundColor: theme.errorSurface },
            ]}
          >
            {/* Checkbox */}
            <TouchableOpacity
              onPress={() => onToggleSelect(song.id)}
              style={styles.checkbox}
              hitSlop={6}
            >
              <MaterialIcons
                name={isSelected ? 'check-box' : 'check-box-outline-blank'}
                size={22}
                color={isSelected ? theme.error : theme.textTertiary}
              />
            </TouchableOpacity>

            {/* Artwork */}
            {song.artworkUri ? (
              <Image source={{ uri: song.artworkUri }} style={styles.artwork} resizeMode="cover" />
            ) : (
              <View style={[styles.artwork, styles.artworkPlaceholder, { backgroundColor: theme.background }]}>
                <MaterialIcons name="music-note" size={16} color={theme.textTertiary} />
              </View>
            )}

            {/* Info */}
            <View style={styles.info}>
              <Text style={[styles.songTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                {song.title || song.filename}
              </Text>
              <Text style={[styles.songSub, { color: theme.textSecondary }]} numberOfLines={1}>
                {song.artist} · {formatDuration(song.duration)}
              </Text>
              <Text style={[styles.songPath, { color: theme.textTertiary }]} numberOfLines={1}>
                {song.uri.split('/').slice(-2).join('/')}
              </Text>
            </View>

            {/* Preview play */}
            <TouchableOpacity
              onPress={() => {
                if (onPreview) onPreview(song);
                else if (onPlaySong) onPlaySong(song.id);
              }}
              hitSlop={8}
              style={styles.playBtn}
            >
              <MaterialIcons name="play-circle-outline" size={22} color={theme.textTertiary} />
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  confidenceBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  confidenceText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    letterSpacing: 0.5,
  },
  reasonText: {
    fontSize: Typography.sm,
  },
  countText: {
    fontSize: Typography.xs,
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  checkbox: {
    flexShrink: 0,
  },
  artwork: {
    width: 38,
    height: 38,
    borderRadius: Radius.xs,
    flexShrink: 0,
  },
  artworkPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  songTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  songSub: {
    fontSize: Typography.xs,
  },
  songPath: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  playBtn: {
    flexShrink: 0,
    padding: 2,
  },
});

// Import Platform at module level
import { Platform } from 'react-native';
