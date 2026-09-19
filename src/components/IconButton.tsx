// AFXS Music Player and Organizer
// Reusable: IconButton

import React from 'react';
import { TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

type IconLibrary = 'material' | 'ionicons';

interface IconButtonProps {
  iconName: string;
  library?: IconLibrary;
  size?: number;
  color?: string;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  hitSlop?: number;
}

export function IconButton({
  iconName,
  library = 'material',
  size = 24,
  color,
  onPress,
  onLongPress,
  disabled,
  style,
  hitSlop = 8,
}: IconButtonProps) {
  const { theme } = useTheme();
  const iconColor = color ?? theme.textPrimary;

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      hitSlop={hitSlop}
      style={[styles.base, disabled && styles.disabled, style]}
      activeOpacity={0.65}
    >
      {library === 'ionicons' ? (
        <Ionicons name={iconName as any} size={size} color={disabled ? theme.textDisabled : iconColor} />
      ) : (
        <MaterialIcons name={iconName as any} size={size} color={disabled ? theme.textDisabled : iconColor} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
});
