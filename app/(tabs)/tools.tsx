// AFXS Music Player and Organizer
// Tools tab — Music Tools hub

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { AppHeader } from '@/components/UI';
import { Spacing, Typography, Radius } from '@/constants/theme';

interface ToolCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  status: 'available' | 'coming_soon';
  onPress?: () => void;
}

export default function ToolsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const tools: ToolCard[] = [
    {
      id: 'scanner',
      title: 'Library Scanner',
      description: 'Scan and update your music library from device storage',
      icon: 'radar',
      status: 'available',
    },
    {
      id: 'metadata',
      title: 'Metadata Fixer',
      description: 'Review and correct song titles, artists, albums, and tags',
      icon: 'edit',
      status: 'coming_soon',
    },
    {
      id: 'organizer',
      title: 'Music Organizer',
      description: 'Arrange files into structured folders by artist and album',
      icon: 'create-new-folder',
      status: 'coming_soon',
    },
    {
      id: 'artwork',
      title: 'Artwork Manager',
      description: 'View and update album artwork for your songs',
      icon: 'image',
      status: 'coming_soon',
    },
    {
      id: 'duplicates',
      title: 'Duplicate Finder',
      description: 'Detect and review possible duplicate tracks in your library',
      icon: 'content-copy',
      status: 'coming_soon',
    },
    {
      id: 'lyrics',
      title: 'Lyrics Manager',
      description: 'Manage embedded and local LRC lyrics files',
      icon: 'text-snippet',
      status: 'coming_soon',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AppHeader
        title="Music Tools"
        subtitle="Library management utilities"
        style={{ paddingTop: insets.top + Spacing.sm }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>
          AVAILABLE
        </Text>

        {tools.filter(t => t.status === 'available').map(tool => (
          <TouchableOpacity
            key={tool.id}
            style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
            activeOpacity={0.75}
            onPress={tool.onPress}
          >
            <View style={[styles.iconContainer, { backgroundColor: theme.background }]}>
              <MaterialIcons name={tool.icon as any} size={26} color={theme.accent} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{tool.title}</Text>
              <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>{tool.description}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={theme.textTertiary} />
          </TouchableOpacity>
        ))}

        <Text style={[styles.sectionLabel, { color: theme.textTertiary, marginTop: Spacing.xl }]}>
          COMING SOON
        </Text>

        {tools.filter(t => t.status === 'coming_soon').map(tool => (
          <View
            key={tool.id}
            style={[
              styles.card,
              styles.cardDisabled,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={[styles.iconContainer, { backgroundColor: theme.background }]}>
              <MaterialIcons name={tool.icon as any} size={26} color={theme.textTertiary} />
            </View>
            <View style={styles.cardInfo}>
              <View style={styles.titleRow}>
                <Text style={[styles.cardTitle, { color: theme.textTertiary }]}>{tool.title}</Text>
                <View style={[styles.badge, { backgroundColor: theme.surfaceSecondary }]}>
                  <Text style={[styles.badgeText, { color: theme.textTertiary }]}>SOON</Text>
                </View>
              </View>
              <Text style={[styles.cardDesc, { color: theme.textTertiary }]}>{tool.description}</Text>
            </View>
          </View>
        ))}
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
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
  },
  cardDisabled: {
    opacity: 0.55,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardInfo: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cardTitle: {
    fontSize: Typography.base,
    fontWeight: '600',
  },
  cardDesc: {
    fontSize: Typography.sm,
    lineHeight: Typography.sm * 1.4,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});
