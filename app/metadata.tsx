// AFXS Music Player and Organizer
// Metadata Editor Screen — view quality scores, search/filter songs, auto-fix & batch edit tags

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import type { Song, MetadataQuality, MetadataUpdate } from '@/types/music';
import { getAllSongs } from '@/database/daos/songDao';
import {
  assessMetadataQuality,
  suggestFixFromFilename,
  applyMetadataFix,
} from '@/services/metadata/MetadataService';
import { MetadataEditModal } from '@/components/MetadataEditModal';

export default function MetadataEditorScreen() {
  const router = useRouter();

  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'incomplete' | 'fixable'>('incomplete');

  // Selected song for modal edit
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [isFixingAll, setIsFixingAll] = useState(false);

  const loadSongs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllSongs();
      setSongs(data);
    } catch (err) {
      console.error('Failed to load songs for metadata editor:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  // Compute quality map for all songs
  const qualityMap = React.useMemo(() => {
    const map = new Map<number, MetadataQuality>();
    for (const song of songs) {
      map.set(song.id, assessMetadataQuality(song));
    }
    return map;
  }, [songs]);

  // Summary counts
  const stats = React.useMemo(() => {
    let incomplete = 0;
    let fixable = 0;
    for (const q of qualityMap.values()) {
      if (q.score < 100) incomplete++;
      if (q.hasFilenameSuggestion) fixable++;
    }
    return { total: songs.length, incomplete, fixable };
  }, [songs, qualityMap]);

  // Filtered song list
  const filteredSongs = React.useMemo(() => {
    return songs.filter((song) => {
      const q = qualityMap.get(song.id);
      const matchesSearch =
        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.filename.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filterMode === 'incomplete') {
        return (q?.score ?? 100) < 100;
      }
      if (filterMode === 'fixable') {
        return (q?.suggestions && Object.keys(q.suggestions).length > 0) ?? false;
      }
      return true;
    });
  }, [songs, qualityMap, searchQuery, filterMode]);


  // Quick auto-fix individual song
  const handleQuickFix = async (song: Song) => {
    const suggestion = suggestFixFromFilename(song);
    if (!suggestion) return;

    try {
      await applyMetadataFix(song.id, suggestion);
      await loadSongs();
    } catch (err: any) {
      Alert.alert('Fix Failed', err.message || 'Could not auto-fix song');
    }
  };

  // Auto-fix all fixable songs in library
  const handleFixAll = async () => {
    const fixableSongs = songs.filter((s) => {
      const q = qualityMap.get(s.id);
      return q && Object.keys(q.suggestions).length > 0;
    });

    if (fixableSongs.length === 0) {
      Alert.alert('No Fixable Songs', 'No songs with parseable filenames were found.');
      return;
    }

    Alert.alert(
      'Batch Auto-Fix',
      `Automatically parse filenames and fix titles/artists for ${fixableSongs.length} songs?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply All',
          onPress: async () => {
            setIsFixingAll(true);
            try {
              let count = 0;
              for (const song of fixableSongs) {
                const suggestion = suggestFixFromFilename(song);
                if (suggestion) {
                  await applyMetadataFix(song.id, suggestion);
                  count++;
                }
              }
              Alert.alert('Success', `Successfully updated metadata for ${count} songs!`);
              await loadSongs();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Batch fix encountered an error.');
            } finally {
              setIsFixingAll(false);
            }
          },
        },
      ]
    );
  };

  // Save changes from modal
  const handleSaveMetadata = async (songId: number, update: any) => {
    try {
      await applyMetadataFix(songId, update);
      setEditingSong(null);
      await loadSongs();
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Failed to update song metadata.');
    }
  };


  const renderQualityBadge = (quality: MetadataQuality) => {
    let color = Colors.status.success;
    if (quality.score < 50) color = Colors.status.error;
    else if (quality.score < 80) color = Colors.accent.gold;

    return (
      <View style={[styles.badge, { borderColor: color }]}>
        <Text style={[styles.badgeText, { color }]}>{quality.score}% Score</Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: Song }) => {
    const quality = qualityMap.get(item.id) || assessMetadataQuality(item);

    return (
      <View style={styles.card}>
        <View style={styles.cardMain}>
          <View style={styles.songInfo}>
            <Text style={styles.songTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.songArtist} numberOfLines={1}>
              {item.artist} {item.album ? `• ${item.album}` : ''}
            </Text>
            <Text style={styles.songFilename} numberOfLines={1}>
              📁 {item.filename}
            </Text>
          </View>
          {renderQualityBadge(quality)}
        </View>

        {/* Missing fields warning */}
        {quality.missingFields.length > 0 && (
          <View style={styles.missingRow}>
            <MaterialCommunityIcons name="alert-circle-outline" size={14} color={Colors.accent.gold} />
            <Text style={styles.missingText}>
              Missing: {quality.missingFields.join(', ')}
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.cardActions}>
          {quality.suggestions && Object.keys(quality.suggestions).length > 0 && (
            <TouchableOpacity
              style={styles.quickFixBtn}
              onPress={() => handleQuickFix(item)}
            >
              <MaterialCommunityIcons name="magic-staff" size={14} color={Colors.accent.cyan} />
              <Text style={styles.quickFixText}>Auto-Fix from Filename</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => setEditingSong(item)}
          >
            <MaterialCommunityIcons name="pencil" size={14} color={Colors.text.primary} />
            <Text style={styles.editText}>Edit Tags</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };


  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Metadata Tag Editor</Text>
        <TouchableOpacity onPress={handleFixAll} disabled={isFixingAll} style={styles.batchBtn}>
          {isFixingAll ? (
            <ActivityIndicator size="small" color={Colors.accent.cyan} />
          ) : (
            <MaterialCommunityIcons name="magic-staff" size={22} color={Colors.accent.cyan} />
          )}
        </TouchableOpacity>

      </View>

      {/* Stats Summary Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Songs</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: Colors.accent.gold }]}>{stats.incomplete}</Text>
          <Text style={styles.statLabel}>Incomplete</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: Colors.accent.cyan }]}>{stats.fixable}</Text>
          <Text style={styles.statLabel}>Auto-Fixable</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <MaterialCommunityIcons name="magnify" size={20} color={Colors.text.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title, artist, filename..."
          placeholderTextColor={Colors.text.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialCommunityIcons name="close-circle" size={18} color={Colors.text.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.filterTab, filterMode === 'incomplete' && styles.filterTabActive]}
          onPress={() => setFilterMode('incomplete')}
        >
          <Text style={[styles.filterTabText, filterMode === 'incomplete' && styles.filterTabTextActive]}>
            Incomplete ({stats.incomplete})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filterMode === 'fixable' && styles.filterTabActive]}
          onPress={() => setFilterMode('fixable')}
        >
          <Text style={[styles.filterTabText, filterMode === 'fixable' && styles.filterTabTextActive]}>
            Auto-Fixable ({stats.fixable})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filterMode === 'all' && styles.filterTabActive]}
          onPress={() => setFilterMode('all')}
        >
          <Text style={[styles.filterTabText, filterMode === 'all' && styles.filterTabTextActive]}>
            All ({stats.total})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Song List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.accent.purple} />
          <Text style={styles.loadingText}>Analyzing metadata quality...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredSongs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="check-decagram" size={56} color={Colors.status.success} />
              <Text style={styles.emptyTitle}>All Tags Clean!</Text>
              <Text style={styles.emptySubtitle}>No songs matching the selected filter criteria.</Text>
            </View>
          }
        />
      )}

      {/* Edit Modal */}
      {editingSong && (
        <MetadataEditModal
          visible={!!editingSong}
          song={editingSong}
          onClose={() => setEditingSong(null)}
          onSave={handleSaveMetadata}
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.surface,
    marginHorizontal: 16,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: 14,
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
  separator: {
    height: 10,
  },
  card: {
    backgroundColor: Colors.bg.card,
    borderRadius: 12,
    padding: 12,
  },
  cardMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  songInfo: {
    flex: 1,
    marginRight: 10,
  },
  songTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  songArtist: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  songFilename: {
    fontSize: 11,
    color: Colors.text.muted,
    marginTop: 4,
    fontFamily: 'monospace',
  },
  badge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  missingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    backgroundColor: 'rgba(255, 171, 0, 0.1)',
    padding: 6,
    borderRadius: 6,
  },
  missingText: {
    fontSize: 11,
    color: Colors.accent.gold,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.bg.border,
  },
  quickFixBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  quickFixText: {
    fontSize: 12,
    color: Colors.accent.cyan,
    fontWeight: '600',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.bg.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editText: {
    fontSize: 12,
    color: Colors.text.primary,
    fontWeight: '600',
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
