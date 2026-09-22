// AFXS Music Player and Organizer
// Duplicate File Cleaner Screen — detect duplicate songs by title/artist/duration/size & clean up storage

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import type { Song, DuplicateGroup } from '@/types/music';
import { getAllSongs, deleteSong } from '@/database/daos/songDao';
import { findDuplicates, computeReclaimableStorage } from '@/services/duplicates/DuplicateService';
import { DuplicateGroupCard } from '@/components/DuplicateGroupCard';
import { usePlayer } from '@/contexts/PlayerContext';

export default function DuplicateCleanerScreen() {
  const router = useRouter();
  const { play } = usePlayer();


  const [songs, setSongs] = useState<Song[]>([]);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedForDeletion, setSelectedForDeletion] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const runScan = useCallback(async () => {
    setLoading(true);
    setSelectedForDeletion(new Set());
    try {
      const allSongs = await getAllSongs();
      setSongs(allSongs);

      const groups = findDuplicates(allSongs);
      setDuplicateGroups(groups);
    } catch (err) {
      console.error('Failed to run duplicate scan:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    runScan();
  }, [runScan]);

  // Compute total reclaimable bytes
  const reclaimableMB = React.useMemo(() => {
    const bytes = computeReclaimableStorage(duplicateGroups);
    return (bytes / (1024 * 1024)).toFixed(1);
  }, [duplicateGroups]);

  // Toggle selection for individual duplicate song
  const handleToggleSelectSong = (songId: number) => {
    setSelectedForDeletion((prev) => {
      const next = new Set(prev);
      if (next.has(songId)) {
        next.delete(songId);
      } else {
        next.add(songId);
      }
      return next;
    });
  };

  // Preview play a duplicate song
  const handlePreviewSong = async (song: Song) => {
    await play(song, [song]);
  };


  // Execute deletion of selected duplicate songs
  const handleDeleteSelected = async () => {
    const count = selectedForDeletion.size;
    if (count === 0) {
      Alert.alert('No Selection', 'Please select duplicate songs to remove.');
      return;
    }

    Alert.alert(
      'Delete Duplicate Files',
      `Are you sure you want to permanently delete ${count} duplicate files from storage?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Delete ${count} Songs`,
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              let deletedCount = 0;
              for (const songId of selectedForDeletion) {
                await deleteSong(songId);
                deletedCount++;
              }
              Alert.alert('Cleanup Complete', `Successfully removed ${deletedCount} duplicate songs.`);
              await runScan();
            } catch (err: any) {
              Alert.alert('Delete Failed', err.message || 'Error occurred while deleting files.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: DuplicateGroup }) => (
    <DuplicateGroupCard
      group={item}
      selectedIds={selectedForDeletion}
      onToggleSelect={handleToggleSelectSong}
      onPreview={handlePreviewSong}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Duplicate File Cleaner</Text>
        <TouchableOpacity onPress={runScan} disabled={loading} style={styles.batchBtn}>
          <MaterialCommunityIcons name="refresh" size={22} color={Colors.accent.gold} />
        </TouchableOpacity>
      </View>

      {/* Stats Summary Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{duplicateGroups.length}</Text>
          <Text style={styles.statLabel}>Duplicate Groups</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: Colors.accent.gold }]}>{reclaimableMB} MB</Text>
          <Text style={styles.statLabel}>Reclaimable Storage</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: Colors.status.error }]}>
            {selectedForDeletion.size}
          </Text>
          <Text style={styles.statLabel}>Selected to Delete</Text>
        </View>
      </View>

      {/* Duplicate Groups List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.accent.gold} />
          <Text style={styles.loadingText}>Scanning audio files for duplicates...</Text>
        </View>
      ) : (
        <FlatList
          data={duplicateGroups}
          keyExtractor={(item) => item.id}

          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="checkbox-multiple-marked-circle" size={56} color={Colors.status.success} />
              <Text style={styles.emptyTitle}>No Duplicate Songs Found!</Text>
              <Text style={styles.emptySubtitle}>
                Your music library is clean with zero duplicate files.
              </Text>
            </View>
          }
        />
      )}

      {/* Bottom Floating Delete Action Bar */}
      {selectedForDeletion.size > 0 && (
        <View style={styles.bottomBar}>
          <Text style={styles.bottomBarText}>
            {selectedForDeletion.size} song{selectedForDeletion.size > 1 ? 's' : ''} selected
          </Text>
          <TouchableOpacity
            style={[styles.deleteBtn, deleting && styles.disabledBtn]}
            onPress={handleDeleteSelected}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="trash-can-outline" size={18} color="#fff" />
                <Text style={styles.deleteBtnText}>Delete Selected</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  separator: {
    height: 12,
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
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.bg.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.bg.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomBarText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  deleteBtn: {
    backgroundColor: Colors.status.error,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deleteBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  disabledBtn: {
    opacity: 0.5,
  },
});
