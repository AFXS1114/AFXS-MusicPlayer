// AFXS Music Player and Organizer
// Accent color presets and theme token definitions

export interface AccentPreset {
  id: string;
  label: string;
  color: string;
  glow: string; // lower-opacity version for glow effects
}

export const ACCENT_PRESETS: AccentPreset[] = [
  { id: 'cyan',   label: 'Neon Cyan',   color: '#00E5FF', glow: 'rgba(0,229,255,0.18)' },
  { id: 'blue',   label: 'Neon Blue',   color: '#2979FF', glow: 'rgba(41,121,255,0.18)' },
  { id: 'green',  label: 'Neon Green',  color: '#00E676', glow: 'rgba(0,230,118,0.18)' },
  { id: 'purple', label: 'Neon Purple', color: '#D500F9', glow: 'rgba(213,0,249,0.18)' },
  { id: 'pink',   label: 'Neon Pink',   color: '#FF4081', glow: 'rgba(255,64,129,0.18)' },
  { id: 'orange', label: 'Neon Orange', color: '#FF6D00', glow: 'rgba(255,109,0,0.18)' },
  { id: 'red',    label: 'Neon Red',    color: '#FF1744', glow: 'rgba(255,23,68,0.18)' },
];

export const DEFAULT_ACCENT_ID = 'cyan';

export function getAccentPreset(id: string): AccentPreset {
  return ACCENT_PRESETS.find(p => p.id === id) ?? ACCENT_PRESETS[0];
}

export function makeGlow(hex: string): string {
  // Parse hex and return rgba with 0.18 alpha
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},0.18)`;
}

export const Colors = {
  bg: {
    deep: '#080808',
    surface: '#111111',
    card: '#161616',
    border: '#242424',
  },
  text: {
    primary: '#F0F0F0',
    secondary: '#909090',
    muted: '#555555',
  },
  accent: {
    cyan: '#00E5FF',
    purple: '#D500F9',
    gold: '#FFD700',
    blue: '#2979FF',
  },
  status: {
    success: '#30D158',
    error: '#FF3B30',
    warning: '#FF9F0A',
  },
};

