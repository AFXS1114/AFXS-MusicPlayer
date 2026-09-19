// AFXS Music Player and Organizer
// Library tab — Songs, Artists, Albums, Genres, Folders, Favorites, Recent

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { SongRow } from '@/components/SongRow';
import { SectionHeader, AppHeader, PrimaryButton, SecondaryButton } from '@/components/UI';
import { EmptyState, LoadingState } from '@/components/StateViews';
import { getSongs, getSongCount } from '@/database/daos/songDao';
import { getArtists, getAlbums, getGenres, getFolders } from '@/database/daos/libraryDao';
import { scanMusicLibrary, type ScanProgress } from '@/services/scanner/MusicScanner';
import { Spacing, Typography, Radius } from '@/constants/theme';
import { formatCount, formatDuration } from '@/utils/format';
import * as MediaLibrary from 'expo-media-library/legacy';
import type { Song, Artist, Album, Genre } from '@/types/music';

type LibraryView = 'songs' | 'artists' | 'albums' | 'genres' | 'folders';

const PAGE_SIZE = 80;

export default function LibraryScreen() {
  const { theme } = useTheme();
  const { play, currentSong } = usePlayer();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [activeView, setActiveView] = useState<LibraryView>('songs');
  const [songs, setSongs] = useState<Song[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [folders, setFolders] = useState<Array<{ path: string; name: string; songCount: number }>>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalSongs, setTotalSongs] = useState(0);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadData = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const newOffset = reset ? 0 : offset;
      if (activeView === 'songs') {
        const [data, total] = await Promise.all([
          getSongs({ limit: PAGE_SIZE, offset: newOffset, search: search || undefined }),
          reset ? getSongCount(search || undefined) : Promise.resolve(totalSongs),
        ]);
        setSongs(prev => reset ? data : [...prev, ...data]);
        if (reset) setTotalSongs(total);
        setHasMore(data.length === PAGE_SIZE);
        setOffset(newOffset + data.length);
      } else if (activeView === 'artists') {
        setArtists(await getArtists(search || undefined));
      } else if (activeView === 'albums') {
        setAlbums(await getAlbums(search || undefined));
      } else if (activeView === 'genres') {
        setGenres(await getGenres());
      } else if (activeView === 'folders') {
        setFolders(await getFolders());
      }
    } catch {}
    setLoading(false);
  }, [activeView, search, offset, totalSongs]);

  // Reload when view changes or screen gains focus
  useFocusEffect(useCallback(() => {
    setOffset(0);
    setSongs([]);
    setHasMore(true);
    loadData(true);
  }, [activeView, search]));

  // Debounce search
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      setOffset(0);
      setSongs([]);
      loadData(true);
    }, 300);
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [search]);

  const handleScan = useCallback(async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') return;
    setScanning(true);
    await scanMusicLibrary(setScanProgress);
    setScanning(false);
    setScanProgress(null);
    loadData(true);
  }, [loadData]);

  const handlePlaySong = useCallback((song: Song) => {
    play(song, songs, songs.findIndex(s => s.id === song.id));
  }, [play, songs]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore && activeView === 'songs') {
      loadData(false);
    }
  }, [loading, hasMore, activeView, loadData]);

  const isEmpty = !loading && !scanning && (
    (activeView === 'songs' && songs.length === 0) ||
    (activeView === 'artists' && artists.length === 0) ||
    (activeView === 'albums' && albums.length === 0) ||
    (activeView === 'genres' && genres.length === 0) ||
    (activeView === 'folders' && folders.length === 0)
  );

  const tabs: Array<{ key: LibraryView; label: string; icon: string }> = [
    { key: 'songs', label: 'Songs', icon: 'music-note' },
    { key: 'artists', label: 'Artists', icon: 'person' },
    { key: 'albums', label: 'Albums', icon: 'album' },
    { key: 'genres', label: 'Genres', icon: 'label' },
    { key: 'folders', label: 'Folders', icon: 'folder' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AppHeader
        title="Library"
        subtitle={totalSongs > 0 ? formatCount(totalSongs, 'song') : undefined}
        style={{ paddingTop: insets.top + Spacing.sm }}
        rightContent={
          <TouchableOpacity onPress={handleScan} disabled={scanning} hitSlop={8}>
            <MaterialIcons
              name="refresh"
              size={24}
              color={scanning ? theme.accent : theme.textSecondary}
            />
          </TouchableOpacity>
        }
      />

      {/* Sub-navigation tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabScroll, { borderBottomColor: theme.border }]}
        contentContainerStyle={styles.tabContent}
      >
        {tabs.map(tab => {
          const isActive = activeView === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveView(tab.key)}
              style={[
                styles.tab,
                isActive && { borderBottomColor: theme.accent },
              ]}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name={tab.icon as any}
                size={16}
                color={isActive ? theme.accent : theme.textTertiary}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? theme.accent : theme.textSecondary },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Search bar */}
      {(activeView === 'songs' || activeView === 'artists' || activeView === 'albums') && (
        <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <MaterialIcons name="search" size={20} color={theme.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder={`Search ${activeView}…`}
            placeholderTextColor={theme.textTertiary}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <MaterialIcons name="close" size={18} color={theme.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Scan progress */}
      {scanning && scanProgress && (
        <View style={[styles.scanBanner, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <MaterialIcons name="sync" size={16} color={theme.accent} />
          <Text style={[styles.scanText, { color: theme.textSecondary }]}>
            Scanning… {scanProgress.processed} files
            {scanProgress.newFiles > 0 ? ` (+${scanProgress.newFiles} new)` : ''}
          </Text>
        </View>
      )}

      {/* Content */}
      {loading && songs.length === 0 && artists.length === 0 && albums.length === 0 ? (
        <LoadingState />
      ) : isEmpty ? (
        <EmptyState
          iconName="library-music"
          title={search ? 'No results found' : 'No music found'}
          subtitle={search ? 'Try a different search term' : 'Tap the refresh icon to scan for music'}
          action={
            !search ? (
              <PrimaryButton label="Scan Library" iconName="refresh" onPress={handleScan} />
            ) : undefined
          }
        />
      ) : (
        <>
          {activeView === 'songs' && (
            <FlatList
              data={songs}
              keyExtractor={item => String(item.id)}
              renderItem={({ item }) => (
                <SongRow
                  song={item}
                  isPlaying={currentSong?.id === item.id}
                  onPress={() => handlePlaySong(item)}
                />
              )}
              onEndReached={loadMore}
              onEndReachedThreshold={0.3}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews
            />
          )}

          {activeView === 'artists' && (
            <FlatList
              data={artists}
              keyExtractor={item => item.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.row, { borderBottomColor: theme.borderSubtle }]}
                  onPress={() => {}}
                  activeOpacity={0.7}
                >
                  <View style={[styles.avatarCircle, { backgroundColor: theme.surface }]}>
                    <MaterialIcons name="person" size={22} color={theme.textTertiary} />
                  </View>
                  <View style={styles.rowInfo}>
                    <Text style={[styles.rowTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                      {formatCount(item.albumCount, 'album')} · {formatCount(item.songCount, 'song')}
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={theme.textTertiary} />
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}

          {activeView === 'albums' && (
            <FlatList
              data={albums}
              keyExtractor={item => `${item.title}-${item.albumArtist}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.row, { borderBottomColor: theme.borderSubtle }]}
                  onPress={() => {}}
                  activeOpacity={0.7}
                >
                  {item.artworkUri ? (
                    <Image source={{ uri: item.artworkUri }} style={styles.albumThumb} resizeMode="cover" />
                  ) : (
                    <View style={[styles.albumThumb, styles.albumThumbPlaceholder, { backgroundColor: theme.surface }]}>
                      <MaterialIcons name="album" size={24} color={theme.textTertiary} />
                    </View>
                  )}
                  <View style={styles.rowInfo}>
                    <Text style={[styles.rowTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                      {item.albumArtist || item.artist}
                      {item.year ? ` · ${item.year}` : ''}
                    </Text>
                  </View>
                  <View style={styles.rowRight}>
                    <Text style={[styles.rowCount, { color: theme.textTertiary }]}>
                      {item.songCount}
                    </Text>
                    <MaterialIcons name="chevron-right" size={20} color={theme.textTertiary} />
                  </View>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}

          {activeView === 'genres' && (
            <FlatList
              data={genres}
              keyExtractor={item => item.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.row, { borderBottomColor: theme.borderSubtle }]}
                  onPress={() => {}}
                  activeOpacity={0.7}
                >
                  <View style={[styles.genreIcon, { backgroundColor: theme.surface }]}>
                    <MaterialIcons name="label" size={20} color={theme.accent} />
                  </View>
                  <View style={styles.rowInfo}>
                    <Text style={[styles.rowTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                      {formatCount(item.songCount, 'song')}
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={theme.textTertiary} />
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}

          {activeView === 'folders' && (
            <FlatList
              data={folders}
              keyExtractor={item => item.path}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.row, { borderBottomColor: theme.borderSubtle }]}
                  onPress={() => {}}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="folder" size={28} color={theme.accent} />
                  <View style={[styles.rowInfo, { marginLeft: Spacing.sm }]}>
                    <Text style={[styles.rowTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.rowSub, { color: theme.textSecondary }]} numberOfLines={1}>
                      {item.path}
                    </Text>
                  </View>
                  <View style={styles.rowRight}>
                    <Text style={[styles.rowCount, { color: theme.textTertiary }]}>
                      {item.songCount}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabScroll: { borderBottomWidth: StyleSheet.hairlineWidth },
  tabContent: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabLabel: {
    fontSize: Typography.sm,
    fontWeight: '500',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.base,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.base,
    padding: 0,
  },
  scanBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  scanText: {
    fontSize: Typography.sm,
    flex: 1,
  },
  listContent: { paddingBottom: 140 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  genreIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  albumThumb: {
    width: 50,
    height: 50,
    borderRadius: Radius.sm,
    flexShrink: 0,
  },
  albumThumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  rowTitle: {
    fontSize: Typography.base,
    fontWeight: '500',
  },
  rowSub: {
    fontSize: Typography.sm,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexShrink: 0,
  },
  rowCount: {
    fontSize: Typography.sm,
  },
});
