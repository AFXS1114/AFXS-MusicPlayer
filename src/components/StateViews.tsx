// AFXS Music Player and Organizer
// Reusable: EmptyState, LoadingState, ErrorState

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing, Typography } from '@/constants/theme';

interface EmptyStateProps {
  iconName?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function EmptyState({ iconName = 'library-music', title, subtitle, action }: EmptyStateProps) {
  const { theme } = useTheme();
  return (
    <View style={styles.center}>
      <MaterialIcons name={iconName as any} size={52} color={theme.textTertiary} />
      <Text style={[styles.title, { color: theme.textSecondary }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: theme.textTertiary }]}>{subtitle}</Text>
      )}
      {action && <View style={styles.actionContainer}>{action}</View>}
    </View>
  );
}

export function LoadingState({ message }: { message?: string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={theme.accent} />
      {message && (
        <Text style={[styles.subtitle, { color: theme.textSecondary, marginTop: Spacing.md }]}>
          {message}
        </Text>
      )}
    </View>
  );
}

interface ErrorStateProps {
  message: string;
  action?: React.ReactNode;
}

export function ErrorState({ message, action }: ErrorStateProps) {
  const { theme } = useTheme();
  return (
    <View style={styles.center}>
      <MaterialIcons name="error-outline" size={48} color={theme.error} />
      <Text style={[styles.title, { color: theme.textSecondary }]}>Something went wrong</Text>
      <Text style={[styles.subtitle, { color: theme.textTertiary }]}>{message}</Text>
      {action && <View style={styles.actionContainer}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.sm,
  },
  title: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.base,
    textAlign: 'center',
    lineHeight: Typography.base * Typography.relaxed,
  },
  actionContainer: {
    marginTop: Spacing.lg,
  },
});
