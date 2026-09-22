// AFXS Music Player and Organizer
// OrganizeMovePreview — modal/sheet for previewing and confirming file organization moves

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import type { MovePlan, FileMoveItem } from '@/types/music';

interface OrganizeMovePreviewProps {
  visible: boolean;
  plan: MovePlan | null;
  executing: boolean;
  progressText: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function OrganizeMovePreview({
  visible,
  plan,
  executing,
  progressText,
  onClose,
  onConfirm,
}: OrganizeMovePreviewProps) {
  if (!plan) return null;

  const renderMoveItem = ({ item }: { item: FileMoveItem }) => {
    const oldFileName = item.oldPath.split('/').pop() ?? item.oldPath;
    const newFileName = item.newPath.split('/').pop() ?? item.newPath;

    return (
      <View style={styles.moveItem}>
        <View style={styles.moveHeader}>
          <MaterialCommunityIcons name="file-music" size={18} color={Colors.accent.cyan} />
          <Text style={styles.songTitle} numberOfLines={1}>
            {item.songTitle}
          </Text>
        </View>

        <View style={styles.pathRow}>
          <Text style={styles.pathLabel}>From: </Text>
          <Text style={styles.pathText} numberOfLines={1}>
            {oldFileName}
          </Text>
        </View>

        <View style={styles.pathRow}>
          <Text style={styles.pathLabel}>To: </Text>
          <Text style={[styles.pathText, styles.newPathText]} numberOfLines={1}>
            {item.targetFolder}/{newFileName}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <MaterialCommunityIcons name="folder-sync" size={24} color={Colors.accent.cyan} />
              <Text style={styles.headerTitle}>Organization Plan</Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={executing} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color={Colors.text.muted} />
            </TouchableOpacity>
          </View>

          {/* Stats Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{plan.totalFiles}</Text>
              <Text style={styles.statLabel}>Total Files</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: Colors.accent.cyan }]}>
                {plan.itemsToMove.length}
              </Text>
              <Text style={styles.statLabel}>To Move</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: Colors.text.muted }]}>
                {plan.itemsSkipped.length}
              </Text>
              <Text style={styles.statLabel}>Already Organized</Text>
            </View>
          </View>

          <Text style={styles.sectionHeader}>
            Files to be reorganized ({plan.itemsToMove.length}):
          </Text>

          {/* List of moves */}
          <FlatList
            data={plan.itemsToMove}
            keyExtractor={(item) => item.songId.toString()}
            renderItem={renderMoveItem}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <MaterialCommunityIcons name="check-circle-outline" size={48} color={Colors.status.success} />
                <Text style={styles.emptyText}>All files are already cleanly organized!</Text>
              </View>
            }
          />

          {/* Execution Progress */}
          {executing && (
            <View style={styles.progressContainer}>
              <ActivityIndicator size="small" color={Colors.accent.cyan} />
              <Text style={styles.progressText}>{progressText || 'Organizing files...'}</Text>
            </View>
          )}

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.btn, styles.cancelBtn]}
              onPress={onClose}
              disabled={executing}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            {plan.itemsToMove.length > 0 && (
              <TouchableOpacity
                style={[styles.btn, styles.confirmBtn, executing && styles.disabledBtn]}
                onPress={onConfirm}
                disabled={executing}
              >
                <MaterialCommunityIcons name="folder-move" size={18} color="#000" />
                <Text style={styles.confirmBtnText}>
                  {executing ? 'Organizing...' : 'Apply Reorganization'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.bg.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  closeBtn: {
    padding: 4,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: Colors.bg.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
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
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingBottom: 10,
  },
  moveItem: {
    backgroundColor: Colors.bg.card,
    borderRadius: 10,
    padding: 12,
  },
  moveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  songTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
  },
  pathRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  pathLabel: {
    fontSize: 11,
    color: Colors.text.muted,
    width: 40,
  },
  pathText: {
    fontSize: 12,
    color: Colors.text.secondary,
    flex: 1,
    fontFamily: 'monospace',
  },
  newPathText: {
    color: Colors.accent.cyan,
    fontWeight: '500',
  },
  itemSeparator: {
    height: 8,
  },
  emptyBox: {
    padding: 30,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
    backgroundColor: Colors.bg.card,
    borderRadius: 10,
    marginTop: 10,
  },
  progressText: {
    fontSize: 13,
    color: Colors.accent.cyan,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  cancelBtn: {
    backgroundColor: Colors.bg.card,
    borderWidth: 1,
    borderColor: Colors.bg.border,
  },
  cancelBtnText: {
    color: Colors.text.primary,
    fontWeight: '600',
    fontSize: 15,
  },
  confirmBtn: {
    backgroundColor: Colors.accent.cyan,
  },
  confirmBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 15,
  },
  disabledBtn: {
    opacity: 0.5,
  },
});
