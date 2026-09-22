// AFXS Music Player and Organizer
// MetadataEditModal — inline editing modal for song metadata fields

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing, Typography, Radius } from '@/constants/theme';
import type { Song, MetadataQuality } from '@/types/music';
import type { MetadataFields } from '@/database/daos/songDao';

interface MetadataEditModalProps {
  visible: boolean;
  song: Song | null;
  quality?: MetadataQuality | null;
  onSave: (songId: number, fields: MetadataFields) => void;
  onClose: () => void;
}

interface FieldConfig {
  key: keyof MetadataFields;
  label: string;
  icon: string;
  keyboard?: 'default' | 'numeric';
  placeholder: string;
}

const FIELDS: FieldConfig[] = [
  { key: 'title', label: 'Title', icon: 'title', placeholder: 'Song title' },
  { key: 'artist', label: 'Artist', icon: 'person', placeholder: 'Artist name' },
  { key: 'album', label: 'Album', icon: 'album', placeholder: 'Album name' },
  { key: 'albumArtist', label: 'Album Artist', icon: 'people', placeholder: 'Album artist' },
  { key: 'genre', label: 'Genre', icon: 'category', placeholder: 'Genre' },
  { key: 'year', label: 'Year', icon: 'calendar-today', keyboard: 'numeric', placeholder: 'Year' },
  { key: 'trackNumber', label: 'Track #', icon: 'format-list-numbered', keyboard: 'numeric', placeholder: '#' },
  { key: 'discNumber', label: 'Disc #', icon: 'disc-full', keyboard: 'numeric', placeholder: '#' },
];

export function MetadataEditModal({
  visible,
  song,
  quality,
  onSave,
  onClose,
}: MetadataEditModalProps) {
  const { theme } = useTheme();
  const [values, setValues] = useState<Record<string, string>>({});
  const hasSuggestions = quality && Object.keys(quality.suggestions).length > 0;

  useEffect(() => {
    if (song) {
      setValues({
        title: song.title || '',
        artist: song.artist || '',
        album: song.album || '',
        albumArtist: song.albumArtist || '',
        genre: song.genre || '',
        year: song.year != null ? String(song.year) : '',
        trackNumber: song.trackNumber != null ? String(song.trackNumber) : '',
        discNumber: song.discNumber != null ? String(song.discNumber) : '',
      });
    }
  }, [song]);

  if (!song) return null;

  const handleSave = () => {
    const fields: MetadataFields = {};
    if (values.title !== (song.title || '')) fields.title = values.title;
    if (values.artist !== (song.artist || '')) fields.artist = values.artist;
    if (values.album !== (song.album || '')) fields.album = values.album;
    if (values.albumArtist !== (song.albumArtist || '')) fields.albumArtist = values.albumArtist;
    if (values.genre !== (song.genre || '')) fields.genre = values.genre;

    const yearVal = values.year ? parseInt(values.year, 10) : null;
    if (yearVal !== song.year) fields.year = yearVal;

    const trackVal = values.trackNumber ? parseInt(values.trackNumber, 10) : null;
    if (trackVal !== song.trackNumber) fields.trackNumber = trackVal;

    const discVal = values.discNumber ? parseInt(values.discNumber, 10) : null;
    if (discVal !== song.discNumber) fields.discNumber = discVal;

    if (Object.keys(fields).length > 0) {
      onSave(song.id, fields);
    }
    onClose();
  };

  const applySuggestions = () => {
    if (!quality?.suggestions) return;
    const s = quality.suggestions;
    setValues(prev => ({
      ...prev,
      ...(s.title ? { title: s.title } : {}),
      ...(s.artist ? { artist: s.artist } : {}),
      ...(s.album ? { album: s.album } : {}),
      ...(s.albumArtist ? { albumArtist: s.albumArtist } : {}),
      ...(s.genre ? { genre: s.genre } : {}),
      ...(s.year !== undefined ? { year: s.year != null ? String(s.year) : '' } : {}),
      ...(s.trackNumber !== undefined ? { trackNumber: s.trackNumber != null ? String(s.trackNumber) : '' } : {}),
      ...(s.discNumber !== undefined ? { discNumber: s.discNumber != null ? String(s.discNumber) : '' } : {}),
    }));
  };

  const isMissing = (key: string) => quality?.missingFields.includes(key);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.surface }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <MaterialIcons name="close" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]} numberOfLines={1}>
              Edit Metadata
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={[styles.saveBtn, { color: theme.accent }]}>Save</Text>
            </TouchableOpacity>
          </View>

          {/* Filename info */}
          <View style={[styles.fileInfo, { backgroundColor: theme.background }]}>
            <MaterialIcons name="audio-file" size={16} color={theme.textTertiary} />
            <Text style={[styles.fileInfoText, { color: theme.textTertiary }]} numberOfLines={1}>
              {song.filename}
            </Text>
          </View>

          {/* Suggestion bar */}
          {hasSuggestions && (
            <TouchableOpacity
              style={[styles.suggestionBar, { backgroundColor: theme.accentGlow }]}
              onPress={applySuggestions}
              activeOpacity={0.8}
            >
              <MaterialIcons name="auto-fix-high" size={18} color={theme.accent} />
              <Text style={[styles.suggestionText, { color: theme.accent }]}>
                Auto-fix available — tap to apply suggestions
              </Text>
            </TouchableOpacity>
          )}

          {/* Fields */}
          <ScrollView
            contentContainerStyle={styles.fieldsContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {FIELDS.map(field => (
              <View key={field.key} style={styles.fieldRow}>
                <View style={styles.fieldLabel}>
                  <MaterialIcons
                    name={field.icon as any}
                    size={16}
                    color={isMissing(field.key) ? theme.warning : theme.textTertiary}
                  />
                  <Text style={[
                    styles.fieldLabelText,
                    { color: isMissing(field.key) ? theme.warning : theme.textSecondary },
                  ]}>
                    {field.label}
                  </Text>
                </View>
                <TextInput
                  style={[
                    styles.fieldInput,
                    {
                      backgroundColor: theme.background,
                      color: theme.textPrimary,
                      borderColor: isMissing(field.key) ? theme.warning + '44' : theme.border,
                    },
                  ]}
                  value={values[field.key] ?? ''}
                  onChangeText={text => setValues(prev => ({ ...prev, [field.key]: text }))}
                  placeholder={field.placeholder}
                  placeholderTextColor={theme.textDisabled}
                  keyboardType={field.keyboard ?? 'default'}
                  returnKeyType="next"
                  autoCorrect={false}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContainer: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Spacing.sm,
  },
  saveBtn: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.sm,
    borderRadius: Radius.sm,
  },
  fileInfoText: {
    fontSize: Typography.xs,
    flex: 1,
  },
  suggestionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm + 2,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.sm,
    borderRadius: Radius.sm,
  },
  suggestionText: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    flex: 1,
  },
  fieldsContainer: {
    padding: Spacing.base,
    gap: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  fieldRow: {
    gap: Spacing.xs,
  },
  fieldLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  fieldLabelText: {
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldInput: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    fontSize: Typography.base,
  },
});
