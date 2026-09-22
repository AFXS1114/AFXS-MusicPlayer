// AFXS Music Player and Organizer
// Album Artwork Manager Screen — find missing covers, fetch artwork online, or set custom photos

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import type { ArtworkStatus } from '@/types/music';
import {
  getAlbumsArtworkStatus,
  updateAlbumArtwork,
  bulkFetchMissingArtwork,
} from '@/services/artwork/ArtworkManager';
import { ArtworkPickerSheet } from '@/components/ArtworkPickerSheet';

export default function ArtworkManagerScreen() {
  const router = useRouter();

  const [albums, setAlbums] = useState<ArtworkStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'missing' | 'custom' | 'all'>('missing');

  const [selectedAlbum, setSelectedAlbum] = useState<ArtworkStatus | null>(null);
  const [isBulkFetching, setIsBulkFetching] = useState(false);

  const loadAlbums = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAlbumsArtworkStatus();
      setAlbums(data);
    } catch (err) {
      console.error('Failed to load artwork status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlbums();
  }, [loadAlbums]);

  // Statistics
  const stats = React.useMemo(() => {
    let missing = 0;
    let custom = 0;
    for (const a of albums) {
      if (a.hasArtwork) {
        if (a.isCustom) custom++;
      } else {
        missing++;
      }
    }
    return { total: albums.length, missing, custom };
  }, [albums]);

  // Filtered albums
  const filteredAlbums = React.useMemo(() => {
    return albums.filter((album) => {
      if (filter === 'missing') return !album.hasArtwork;
      if (filter === 'custom') return album.isCustom;
      return true;
    });
  }, [albums, filter]);

  // Handle artwork selection for an album
  const handleArtworkSelected = async (uri: string) => {
    if (!selectedAlbum) return;

    try {
      await updateAlbumArtwork(selectedAlbum.album, uri);
      Alert.alert('Updated', `Cover artwork updated for album "${selectedAlbum.album}".`);
      await loadAlbums();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update artwork');
    }
  };

  // Bulk auto-fetch missing covers from online API
  const handleBulkFetch = async () => {
    const missingCount = stats.missing;
    if (missingCount === 0) {
      Alert.alert('All Covered', 'No albums are currently missing artwork!');
      return;
    }

    Alert.alert(
      'Fetch Covers Online',
      `Auto-fetch high quality artwork online for ${missingCount} albums missing covers?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Download',
          onPress: async () => {
            setIsBulkFetching(true);
            try {
              const updated = await bulkFetchMissingArtwork((albumName, index, total) => {
                // progress callback
              });
              Alert.alert('Download Complete', `Successfully fetched artwork for ${updated} albums!`);
              await loadAlbums();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Bulk fetch failed');
            } finally {
              setIsBulkFetching(false);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: ArtworkStatus }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => setSelectedAlbum(item)}
      activeOpacity={0.8}
    >
      <View style={styles.artworkBox}>
        {item.artworkUri ? (
          <Image source={{ uri: item.artworkUri }} style={styles.artworkImage} />
        ) : (
          <View style={[styles.artworkImage, styles.placeholderBox]}>
            <MaterialCommunityIcons name="image-off-outline" size={32} color={Colors.text.muted} />
          </View>
        )}

        {!item.hasArtwork && (
          <View style={styles.missingBadge}>
            <Text style={styles.missingBadgeText}>Missing</Text>
          </View>
        )}

        {item.isCustom && (
          <View style={styles.customBadge}>
            <MaterialCommunityIcons name="check-decagram" size={12} color="#fff" />
            <Text style={styles.customBadgeText}>Custom</Text>
          </View>
        )}
      </View>

      <View style={styles.albumMeta}>
        <Text style={styles.albumTitle} numberOfLines={1}>
          {item.album}
        </Text>
        <Text style={styles.artistName} numberOfLines={1}>
          {item.artist}
        </Text>
        <Text style={styles.songCount}>
          {item.songCount} {item.songCount === 1 ? 'song' : 'songs'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Album Artwork Manager</Text>
        <TouchableOpacity onPress={handleBulkFetch} disabled={isBulkFetching} style={styles.batchBtn}>
          {isBulkFetching ? (
            <ActivityIndicator size="small" color={Colors.accent.purple} />
          ) : (
            <MaterialCommunityIcons name="cloud-download-outline" size={22} color={Colors.accent.purple} />
          )}
        </TouchableOpacity>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Albums</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: Colors.status.error }]}>{stats.missing}</Text>
          <Text style={styles.statLabel}>Missing Cover</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: Colors.accent.purple }]}>{stats.custom}</Text>
          <Text style={styles.statLabel}>Custom Covers</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'missing' && styles.filterTabActive]}
          onPress={() => setFilter('missing')}
        >
          <Text style={[styles.filterTabText, filter === 'missing' && styles.filterTabTextActive]}>
            Missing ({stats.missing})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'custom' && styles.filterTabActive]}
          onPress={() => setFilter('custom')}
        >
          <Text style={[styles.filterTabText, filter === 'custom' && styles.filterTabTextActive]}>
            Custom ({stats.custom})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
            All Albums ({stats.total})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Album Grid */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.accent.purple} />
          <Text style={styles.loadingText}>Loading album artwork catalog...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredAlbums}
          keyExtractor={(item) => item.album}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="image-check" size={56} color={Colors.status.success} />
              <Text style={styles.emptyTitle}>No Missing Artwork!</Text>
              <Text style={styles.emptySubtitle}>All albums in your library have cover artwork.</Text>
            </View>
          }
        />
      )}

      {/* Artwork Picker Sheet */}
      {selectedAlbum && (
        <ArtworkPickerSheet
          visible={!!selectedAlbum}
          albumName={selectedAlbum.album}
          artistName={selectedAlbum.artist}
          currentArtworkUri={selectedAlbum.artworkUri}
          onClose={() => setSelectedAlbum(null)}
          onArtworkSelected={handleArtworkSelected}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg.deep,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  batchBtn: {
    padding: 6,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: Colors.bg.surface,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.text.muted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.bg.border,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: Colors.bg.surface,
  },
  filterTabActive: {
    backgroundColor: Colors.accent.purple,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.muted,
  },
  filterTabTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    width: '48%',
    backgroundColor: Colors.bg.card,
    borderRadius: 12,
    overflow: 'hidden',
  },
  artworkBox: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
  },
  artworkImage: {
    width: '100%',
    height: '100%',
  },
  placeholderBox: {
    backgroundColor: Colors.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 82, 82, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  missingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  customBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(124, 77, 255, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  customBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  albumMeta: {
    padding: 10,
  },
  albumTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  artistName: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  songCount: {
    fontSize: 10,
    color: Colors.text.muted,
    marginTop: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: Colors.text.muted,
    fontSize: 14,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.text.muted,
    textAlign: 'center',
  },
});
