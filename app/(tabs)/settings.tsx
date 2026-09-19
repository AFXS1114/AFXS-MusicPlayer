// AFXS Music Player and Organizer
// Settings tab — appearance, library, playback

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { AppHeader } from '@/components/UI';
import { ACCENT_PRESETS } from '@/constants/colors';
import { Spacing, Typography, Radius } from '@/constants/theme';

function SettingRow({
  label,
  value,
  icon,
  onPress,
  rightContent,
  destructive,
}: {
  label: string;
  value?: string;
  icon: string;
  onPress?: () => void;
  rightContent?: React.ReactNode;
  destructive?: boolean;
}) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress && !rightContent}
      activeOpacity={onPress ? 0.7 : 1}
      style={[styles.row, { borderBottomColor: theme.borderSubtle }]}
    >
      <View style={[styles.rowIcon, { backgroundColor: theme.surface }]}>
        <MaterialIcons
          name={icon as any}
          size={20}
          color={destructive ? theme.error : theme.accent}
        />
      </View>
      <View style={styles.rowInfo}>
        <Text
          style={[
            styles.rowLabel,
            { color: destructive ? theme.error : theme.textPrimary },
          ]}
        >
          {label}
        </Text>
        {value && (
          <Text style={[styles.rowValue, { color: theme.textSecondary }]}>{value}</Text>
        )}
      </View>
      {rightContent ?? (
        onPress ? (
          <MaterialIcons name="chevron-right" size={20} color={theme.textTertiary} />
        ) : null
      )}
    </TouchableOpacity>
  );
}

function SectionLabel({ title }: { title: string }) {
  const { theme } = useTheme();
  return (
    <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>
      {title.toUpperCase()}
    </Text>
  );
}

export default function SettingsScreen() {
  const { theme, accentId, setAccent } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AppHeader
        title="Settings"
        style={{ paddingTop: insets.top + Spacing.sm }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Appearance */}
        <SectionLabel title="Appearance" />
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.row, { borderBottomColor: theme.borderSubtle }]}>
            <View style={[styles.rowIcon, { backgroundColor: theme.background }]}>
              <MaterialIcons name="palette" size={20} color={theme.accent} />
            </View>
            <View style={styles.rowInfo}>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Accent Color</Text>
            </View>
          </View>
          {/* Accent color swatches */}
          <View style={styles.swatchGrid}>
            {ACCENT_PRESETS.map(preset => (
              <TouchableOpacity
                key={preset.id}
                onPress={() => setAccent(preset.id)}
                style={[
                  styles.swatch,
                  { backgroundColor: preset.color },
                  accentId === preset.id && styles.swatchActive,
                ]}
                activeOpacity={0.8}
              >
                {accentId === preset.id && (
                  <MaterialIcons name="check" size={16} color="#000" />
                )}
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.swatchLabels}>
            {ACCENT_PRESETS.map(preset => (
              <Text
                key={preset.id}
                style={[
                  styles.swatchLabel,
                  {
                    color: accentId === preset.id ? theme.accent : theme.textTertiary,
                  },
                ]}
              >
                {preset.label.replace('Neon ', '')}
              </Text>
            ))}
          </View>
        </View>

        {/* Library */}
        <SectionLabel title="Library" />
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <SettingRow
            label="Scan Library"
            value="Re-scan your device for music files"
            icon="refresh"
            onPress={() => {}}
          />
          <SettingRow
            label="Supported Formats"
            value="MP3, M4A, AAC, FLAC, WAV, OGG, OPUS"
            icon="audiotrack"
          />
        </View>

        {/* Playback */}
        <SectionLabel title="Playback" />
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <SettingRow
            label="Background Playback"
            value="Audio continues when app is minimized"
            icon="headphones"
          />
        </View>

        {/* About */}
        <SectionLabel title="About" />
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <SettingRow
            label="AFXS Music Player and Organizer"
            value="Version 1.0.0 · Offline Edition"
            icon="info"
          />
          <SettingRow
            label="Database"
            value="Local SQLite — no cloud required"
            icon="storage"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: 140,
    gap: Spacing.sm,
  },
  sectionLabel: {
    fontSize: Typography.xs,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  section: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowInfo: { flex: 1, gap: 2 },
  rowLabel: { fontSize: Typography.base, fontWeight: '500' },
  rowValue: { fontSize: Typography.sm },
  swatchGrid: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchActive: {
    borderWidth: 2,
    borderColor: '#fff',
  },
  swatchLabels: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    paddingTop: Spacing.xs,
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  swatchLabel: {
    fontSize: 9,
    fontWeight: '500',
    width: 34,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
