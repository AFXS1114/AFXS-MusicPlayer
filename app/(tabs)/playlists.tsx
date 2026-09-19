// AFXS Music Player and Organizer
// Playlists tab

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { AppHeader, PrimaryButton, SecondaryButton } from '@/components/UI';
import { EmptyState, LoadingState } from '@/components/StateViews';
import {
  getPlaylists,
  createPlaylist,
  deletePlaylist,
  renamePlaylist,
} from '@/database/daos/playlistDao';
import { Spacing, Typography, Radius } from '@/constants/theme';
import { formatCount } from '@/utils/format';
import type { Playlist } from '@/types/music';

export default function PlaylistsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [playlists, setPlaylists] = useState<Array<Playlist & { songCount: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const loadPlaylists = useCallback(async () => {
    setLoading(true);
    try {
      setPlaylists(await getPlaylists());
    } catch {}
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => {
    loadPlaylists();
  }, [loadPlaylists]));

  const handleCreate = useCallback(async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      await createPlaylist(name);
      setNewName('');
      setShowCreate(false);
      await loadPlaylists();
    } catch {}
    setCreating(false);
  }, [newName, loadPlaylists]);

  const handleDelete = useCallback((playlist: Playlist) => {
    Alert.alert(
      'Delete Playlist',
      `Delete "${playlist.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deletePlaylist(playlist.id);
            await loadPlaylists();
          },
        },
      ]
    );
  }, [loadPlaylists]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AppHeader
        title="Playlists"
        style={{ paddingTop: insets.top + Spacing.sm }}
        rightContent={
          <TouchableOpacity onPress={() => setShowCreate(true)} hitSlop={8}>
            <MaterialIcons name="add" size={26} color={theme.accent} />
          </TouchableOpacity>
        }
      />

      {loading ? (
        <LoadingState />
      ) : playlists.length === 0 ? (
        <EmptyState
          iconName="queue-music"
          title="No playlists yet"
          subtitle="Tap + to create your first playlist"
          action={
            <PrimaryButton
              label="Create Playlist"
              iconName="add"
              onPress={() => setShowCreate(true)}
            />
          }
        />
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.row, { borderBottomColor: theme.borderSubtle }]}
              activeOpacity={0.7}
            >
              <View style={[styles.playlistIcon, { backgroundColor: theme.surface }]}>
                <MaterialIcons name="queue-music" size={24} color={theme.accent} />
              </View>
              <View style={styles.info}>
                <Text style={[styles.name, { color: theme.textPrimary }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.count, { color: theme.textSecondary }]}>
                  {formatCount(item.songCount, 'song')}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDelete(item)}
                hitSlop={8}
                style={styles.deleteBtn}
              >
                <MaterialIcons name="more-vert" size={20} color={theme.textTertiary} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Create playlist modal */}
      <Modal
        visible={showCreate}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreate(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modal, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>New Playlist</Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  color: theme.textPrimary,
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
              placeholder="Playlist name"
              placeholderTextColor={theme.textTertiary}
              value={newName}
              onChangeText={setNewName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreate}
            />
            <View style={styles.modalActions}>
              <SecondaryButton
                label="Cancel"
                onPress={() => { setShowCreate(false); setNewName(''); }}
                style={styles.modalBtn}
              />
              <PrimaryButton
                label="Create"
                onPress={handleCreate}
                disabled={!newName.trim() || creating}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
  },
  playlistIcon: {
    width: 50,
    height: 50,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  info: { flex: 1, gap: 3, minWidth: 0 },
  name: { fontSize: Typography.base, fontWeight: '500' },
  count: { fontSize: Typography.sm },
  deleteBtn: { padding: 4 },
  listContent: { paddingBottom: 140 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  modal: {
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.lg,
    fontWeight: '600',
  },
  modalInput: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.base,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalBtn: { flex: 1 },
});
