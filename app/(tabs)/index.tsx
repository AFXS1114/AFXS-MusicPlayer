// AFXS Music Player and Organizer
// Home tab — recently played, quick access

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { SongRow } from '@/components/SongRow';
import { SectionHeader, AppHeader } from '@/components/UI';
import { LoadingState, EmptyState } from '@/components/StateViews';
import { getRecentlyPlayed } from '@/database/daos/playlistDao';
import { getFavoriteSongs } from '@/database/daos/playlistDao';
import { Spacing, Typography } from '@/constants/theme';
import type { Song } from '@/types/music';
import { useFocusEffect } from 'expo-router';

export default function HomeScreen() {
  const { theme } = useTheme();
  const { play, currentSong } = usePlayer();
  const insets = useSafeAreaInsets();
  const [recentSongs, setRecentSongs] = useState<Song[]>([]);
  const [favoriteSongs, setFavoriteSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [recent, favorites] = await Promise.all([
        getRecentlyPlayed(10),
        getFavoriteSongs(10),
      ]);
      setRecentSongs(recent);
      setFavoriteSongs(favorites);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadData();
  }, [loadData]));

  const handlePlay = useCallback((song: Song, queue: Song[]) => {
    const idx = queue.findIndex(s => s.id === song.id);
    play(song, queue, idx >= 0 ? idx : 0);
  }, [play]);

  const isEmpty = !loading && recentSongs.length === 0 && favoriteSongs.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AppHeader
        title="AFXS"
        subtitle="Music Player & Organizer"
        style={{ paddingTop: insets.top + Spacing.sm }}
      />

      {loading ? (
        <LoadingState />
      ) : isEmpty ? (
        <EmptyState
          iconName="library-music"
          title="Your library is empty"
          subtitle="Go to Library → Scan Library to discover your music"
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {recentSongs.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="Recently Played" count={recentSongs.length} />
              {recentSongs.map(song => (
                <SongRow
                  key={song.id}
                  song={song}
                  isPlaying={currentSong?.id === song.id}
                  onPress={() => handlePlay(song, recentSongs)}
                />
              ))}
            </View>
          )}

          {favoriteSongs.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="Favorites" count={favoriteSongs.length} />
              {favoriteSongs.map(song => (
                <SongRow
                  key={song.id}
                  song={song}
                  isPlaying={currentSong?.id === song.id}
                  isFavorite
                  onPress={() => handlePlay(song, favoriteSongs)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: Spacing.xxxl },
  section: { marginTop: Spacing.sm },
});
