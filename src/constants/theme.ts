// AFXS Music Player and Organizer
// Central theme token system

export interface AppTheme {
  // Backgrounds
  background: string;        // primary background (near-black)
  surface: string;           // card / panel surface
  surfaceSecondary: string;  // secondary surface (modals, sheets)
  surfaceElevated: string;   // slightly lighter for contrast

  // Text
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textDisabled: string;
  textOnAccent: string;      // text shown on accent-colored background

  // Borders
  border: string;
  borderSubtle: string;

  // Accent (user-customizable)
  accent: string;
  accentGlow: string;        // semi-transparent for glow effects
  accentDim: string;         // muted accent for inactive states

  // Status
  error: string;
  errorSurface: string;
  success: string;
  warning: string;

  // Player specific
  playerBackground: string;
  miniPlayerBackground: string;

  // Tab bar
  tabBarBackground: string;
  tabBarBorder: string;
  tabBarActive: string;      // = accent
  tabBarInactive: string;
}

export function buildTheme(accent: string, accentGlow: string): AppTheme {
  return {
    background: '#080808',
    surface: '#111111',
    surfaceSecondary: '#161616',
    surfaceElevated: '#1C1C1C',

    textPrimary: '#F0F0F0',
    textSecondary: '#909090',
    textTertiary: '#555555',
    textDisabled: '#3A3A3A',
    textOnAccent: '#000000',

    border: '#242424',
    borderSubtle: '#1A1A1A',

    accent,
    accentGlow,
    accentDim: accent + '55', // 33% opacity hex

    error: '#FF3B30',
    errorSurface: 'rgba(255,59,48,0.12)',
    success: '#30D158',
    warning: '#FF9F0A',

    playerBackground: '#0A0A0A',
    miniPlayerBackground: '#101010',

    tabBarBackground: '#0A0A0A',
    tabBarBorder: '#1E1E1E',
    tabBarActive: accent,
    tabBarInactive: '#454545',
  };
}

// Typography scale
export const Typography = {
  // Sizes
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 28,
  display: 34,

  // Weights
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,

  // Line heights
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,

  // Letter spacing
  tracking: {
    tight: -0.3,
    normal: 0,
    wide: 0.5,
    wider: 1.5,
  },
};

// Spacing scale
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

// Border radius scale
export const Radius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 999,
};
