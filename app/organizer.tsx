// AFXS Music Player and Organizer
// Storage & File Organizer Screen — organize music files into clean directory hierarchy

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import type { MovePlan, FileMoveItem, OrganizationHistoryEntry } from '@/types/music';
import { generateMovePlan, executeMovePlan, undoLastOperation, type MovePlanItem } from '@/services/organizer/OrganizerService';
import { getOrganizationHistory } from '@/database/daos/organizerDao';
import { getAllSongs } from '@/database/daos/songDao';
import { OrganizeMovePreview } from '@/components/OrganizeMovePreview';

export default function StorageOrganizerScreen() {
  const router = useRouter();

  const [pattern, setPattern] = useState<'{artist}/{album}/{filename}' | '{artist}/{album}/{track} - {title}' | '{artist}/{filename}'>(
    '{artist}/{album}/{filename}'
  );
  const [targetFolder, setTargetFolder] = useState('/Music/AFXS Organized');

  const [generating, setGenerating] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [movePlan, setMovePlan] = useState<MovePlan | null>(null);
  const [rawPlanItems, setRawPlanItems] = useState<MovePlanItem[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);


  const [history, setHistory] = useState<OrganizationHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const records = await getOrganizationHistory();
      setHistory(records);
    } catch (err) {
      console.error('Failed to load organization history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Generate reorganization plan
  const handleGeneratePlan = async () => {
    setGenerating(true);
    try {
      const allSongs = await getAllSongs();
      const planResult = generateMovePlan(allSongs, pattern);
      
      const itemsToMove: FileMoveItem[] = planResult.plan.map((p) => ({
        songId: p.songId,
        songTitle: p.song.title || p.song.filename,
        oldPath: p.originalUri,
        newPath: p.newUri,
        targetFolder: p.newUri.substring(0, Math.max(0, p.newUri.lastIndexOf('/'))),
      }));

      const plan: MovePlan = {
        totalFiles: planResult.stats.totalSongs,
        itemsToMove,
        itemsSkipped: [],
      };

      setMovePlan(plan);
      setRawPlanItems(planResult.plan);
      setPreviewVisible(true);
    } catch (err: any) {
      Alert.alert('Plan Error', err.message || 'Could not generate organization plan.');
    } finally {
      setGenerating(false);
    }
  };

  // Confirm and execute reorganization plan
  const handleConfirmExecute = async () => {
    if (rawPlanItems.length === 0) return;
    setExecuting(true);
    setProgressText('Starting reorganization...');

    try {
      const result = await executeMovePlan(rawPlanItems, (completed, total, filename) => {
        setProgressText(`Moving (${completed}/${total}): ${filename}`);
      });

      setPreviewVisible(false);
      setMovePlan(null);
      await loadHistory();

      Alert.alert(
        'Organization Complete',
        `Moved ${result.completed} files successfully!${
          result.failed > 0 ? ` (${result.failed} failed)` : ''
        }`
      );
    } catch (err: any) {
      Alert.alert('Execution Failed', err.message || 'An error occurred during file move.');
    } finally {
      setExecuting(false);
      setProgressText('');
    }
  };


  // Undo last operation
  const handleUndo = async (historyId: number) => {
    Alert.alert(
      'Undo Organization',
      'This will move files back to their original locations. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Undo Moves',
          style: 'destructive',
          onPress: async () => {
            try {
              const undoneCount = await undoLastOperation(historyId);
              Alert.alert('Undo Complete', `Restored ${undoneCount} files to original paths.`);
              await loadHistory();
            } catch (err: any) {
              Alert.alert('Undo Failed', err.message || 'Could not restore files.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Storage & File Organizer</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner */}
        <View style={styles.banner}>
          <MaterialCommunityIcons name="folder-swap" size={32} color={Colors.accent.cyan} />
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>Automatic Folder Structuring</Text>
            <Text style={styles.bannerSubtitle}>
              Clean up messy downloads by organizing audio files into neat artist & album folders.
            </Text>
          </View>
        </View>

        {/* Pattern Selection */}
        <Text style={styles.sectionTitle}>Select Folder Pattern</Text>
        <View style={styles.patternGrid}>
          <TouchableOpacity
            style={[styles.patternCard, pattern === '{artist}/{album}/{filename}' && styles.patternCardActive]}
            onPress={() => setPattern('{artist}/{album}/{filename}')}
          >
            <MaterialCommunityIcons
              name="folder-text-outline"
              size={24}
              color={pattern === '{artist}/{album}/{filename}' ? Colors.accent.cyan : Colors.text.muted}
            />
            <Text style={[styles.patternTitle, pattern === '{artist}/{album}/{filename}' && styles.patternTextActive]}>
              Artist / Album
            </Text>
            <Text style={styles.patternDesc}>/Artist Name/Album Title/Song.mp3</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.patternCard, pattern === '{artist}/{filename}' && styles.patternCardActive]}
            onPress={() => setPattern('{artist}/{filename}')}
          >
            <MaterialCommunityIcons
              name="folder-music-outline"
              size={24}
              color={pattern === '{artist}/{filename}' ? Colors.accent.cyan : Colors.text.muted}
            />
            <Text style={[styles.patternTitle, pattern === '{artist}/{filename}' && styles.patternTextActive]}>
              Artist / File
            </Text>
            <Text style={styles.patternDesc}>/Artist Name/Song.mp3</Text>
          </TouchableOpacity>
        </View>


        {/* Target Folder Setting */}
        <Text style={styles.sectionTitle}>Target Organization Directory</Text>
        <View style={styles.targetCard}>
          <MaterialCommunityIcons name="folder-account" size={20} color={Colors.accent.cyan} />
          <Text style={styles.targetPath} numberOfLines={1}>
            {targetFolder}
          </Text>
          <TouchableOpacity style={styles.changeTargetBtn} onPress={() => {}}>
            <Text style={styles.changeTargetText}>SAF Browse</Text>
          </TouchableOpacity>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.actionBtn, generating && styles.disabledBtn]}
          onPress={handleGeneratePlan}
          disabled={generating}
        >
          {generating ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <>
              <MaterialCommunityIcons name="scan-helper" size={20} color="#000" />
              <Text style={styles.actionBtnText}>Analyze Library & Preview Plan</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Reorganization History */}
        <Text style={styles.sectionTitle}>Organization History & Restore</Text>
        {loadingHistory ? (
          <ActivityIndicator size="small" color={Colors.accent.cyan} style={{ marginVertical: 12 }} />
        ) : history.length === 0 ? (
          <View style={styles.emptyHistoryBox}>
            <MaterialCommunityIcons name="history" size={32} color={Colors.text.muted} />
            <Text style={styles.emptyHistoryText}>No past file organization history found.</Text>
          </View>
        ) : (
          history.map((record) => (
            <View key={record.id} style={styles.historyCard}>
              <View style={styles.historyInfo}>
                <Text style={styles.historyDate}>
                  {new Date(record.executedAt || record.performedAt).toLocaleString()}
                </Text>
                <Text style={styles.historyDetails}>
                  Moved {record.filesMoved ?? 1} files • Pattern: {record.pattern || '{artist}/{album}'}
                </Text>

              </View>

              {!record.isUndone ? (
                <TouchableOpacity
                  style={styles.undoBtn}
                  onPress={() => handleUndo(record.id)}
                >
                  <MaterialCommunityIcons name="undo-variant" size={16} color={Colors.status.error} />
                  <Text style={styles.undoBtnText}>Undo</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.undoneBadge}>
                  <Text style={styles.undoneText}>Restored</Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Plan Preview Modal */}
      <OrganizeMovePreview
        visible={previewVisible}
        plan={movePlan}
        executing={executing}
        progressText={progressText}
        onClose={() => setPreviewVisible(false)}
        onConfirm={handleConfirmExecute}
      />
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.surface,
    borderRadius: 14,
    padding: 16,
    gap: 14,
    marginBottom: 20,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: Colors.text.muted,
    marginTop: 2,
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.secondary,
    marginBottom: 10,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  patternGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  patternCard: {
    flex: 1,
    backgroundColor: Colors.bg.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.bg.border,
  },
  patternCardActive: {
    borderColor: Colors.accent.cyan,
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
  },
  patternTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: 8,
  },
  patternTextActive: {
    color: Colors.accent.cyan,
  },
  patternDesc: {
    fontSize: 10,
    color: Colors.text.muted,
    marginTop: 4,
  },
  targetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.card,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginBottom: 20,
  },
  targetPath: {
    flex: 1,
    fontSize: 13,
    color: Colors.text.primary,
    fontFamily: 'monospace',
  },
  changeTargetBtn: {
    backgroundColor: Colors.bg.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changeTargetText: {
    fontSize: 12,
    color: Colors.accent.cyan,
    fontWeight: '600',
  },
  actionBtn: {
    height: 50,
    backgroundColor: Colors.accent.cyan,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  actionBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  emptyHistoryBox: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.bg.card,
    borderRadius: 12,
    gap: 8,
  },
  emptyHistoryText: {
    fontSize: 13,
    color: Colors.text.muted,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bg.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  historyInfo: {
    flex: 1,
  },
  historyDate: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  historyDetails: {
    fontSize: 11,
    color: Colors.text.muted,
    marginTop: 2,
  },
  undoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  undoBtnText: {
    fontSize: 12,
    color: Colors.status.error,
    fontWeight: '600',
  },
  undoneBadge: {
    backgroundColor: Colors.bg.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  undoneText: {
    fontSize: 11,
    color: Colors.text.muted,
  },
});
