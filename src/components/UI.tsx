// AFXS Music Player and Organizer
// Reusable: AppHeader, SectionHeader, ProgressBar, PrimaryButton

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  type ViewStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing, Typography, Radius } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── AppHeader ─────────────────────────────────────────────────────────────

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightContent?: React.ReactNode;
  style?: ViewStyle;
}

export function AppHeader({
  title,
  subtitle,
  showBack,
  onBack,
  rightContent,
  style,
}: AppHeaderProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: theme.background,
          paddingTop: insets.top + Spacing.sm,
          borderBottomColor: theme.border,
        },
        style,
      ]}
    >
      {showBack && (
        <TouchableOpacity onPress={onBack} hitSlop={8} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
      )}
      <View style={styles.headerTitles}>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.headerSub, { color: theme.textSecondary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightContent && <View style={styles.headerRight}>{rightContent}</View>}
    </View>
  );
}

// ─── SectionHeader ─────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string;
  count?: number;
  action?: React.ReactNode;
}

export function SectionHeader({ title, count, action }: SectionHeaderProps) {
  const { theme } = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionLeft}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          {title.toUpperCase()}
        </Text>
        {count !== undefined && (
          <Text style={[styles.sectionCount, { color: theme.textTertiary }]}>
            {count}
          </Text>
        )}
      </View>
      {action}
    </View>
  );
}

// ─── ProgressBar ───────────────────────────────────────────────────────────

interface ProgressBarProps {
  progress: number; // 0–1
  style?: ViewStyle;
  height?: number;
}

export function ProgressBar({ progress, style, height = 3 }: ProgressBarProps) {
  const { theme } = useTheme();
  const clamped = Math.min(1, Math.max(0, progress));
  return (
    <View
      style={[
        styles.progressTrack,
        { backgroundColor: theme.border, height },
        style,
      ]}
    >
      <View
        style={[
          styles.progressFill,
          { backgroundColor: theme.accent, width: `${clamped * 100}%` },
        ]}
      />
    </View>
  );
}

// ─── PrimaryButton ─────────────────────────────────────────────────────────

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  iconName?: string;
  disabled?: boolean;
  style?: ViewStyle;
  small?: boolean;
}

export function PrimaryButton({
  label,
  onPress,
  iconName,
  disabled,
  style,
  small,
}: PrimaryButtonProps) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.primaryBtn,
        {
          backgroundColor: disabled ? theme.textDisabled : theme.accent,
          paddingVertical: small ? Spacing.sm : Spacing.md,
          paddingHorizontal: small ? Spacing.base : Spacing.xl,
        },
        style,
      ]}
    >
      {iconName && (
        <MaterialIcons
          name={iconName as any}
          size={small ? 16 : 18}
          color={theme.textOnAccent}
          style={{ marginRight: Spacing.xs }}
        />
      )}
      <Text
        style={[
          styles.primaryBtnText,
          { color: theme.textOnAccent, fontSize: small ? Typography.sm : Typography.base },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── SecondaryButton ───────────────────────────────────────────────────────

interface SecondaryButtonProps extends PrimaryButtonProps {}

export function SecondaryButton({
  label,
  onPress,
  iconName,
  disabled,
  style,
  small,
}: SecondaryButtonProps) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
      style={[
        styles.secondaryBtn,
        {
          borderColor: disabled ? theme.textDisabled : theme.accent,
          paddingVertical: small ? Spacing.sm : Spacing.md,
          paddingHorizontal: small ? Spacing.base : Spacing.xl,
        },
        style,
      ]}
    >
      {iconName && (
        <MaterialIcons
          name={iconName as any}
          size={small ? 16 : 18}
          color={disabled ? theme.textDisabled : theme.accent}
          style={{ marginRight: Spacing.xs }}
        />
      )}
      <Text
        style={[
          styles.secondaryBtnText,
          {
            color: disabled ? theme.textDisabled : theme.accent,
            fontSize: small ? Typography.sm : Typography.base,
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  backBtn: {
    flexShrink: 0,
    padding: 2,
  },
  headerTitles: {
    flex: 1,
    gap: 1,
  },
  headerTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    letterSpacing: Typography.tracking.tight,
  },
  headerSub: {
    fontSize: Typography.sm,
  },
  headerRight: {
    flexShrink: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    letterSpacing: Typography.tracking.wider,
  },
  sectionCount: {
    fontSize: Typography.xs,
  },
  progressTrack: {
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.pill,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
  primaryBtnText: {
    fontWeight: Typography.semibold,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontWeight: Typography.semibold,
  },
});
