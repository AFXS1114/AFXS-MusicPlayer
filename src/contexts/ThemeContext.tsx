// AFXS Music Player and Organizer
// ThemeContext — provides theme tokens to all components

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  buildTheme,
  type AppTheme,
} from '@/constants/theme';
import {
  getAccentPreset,
  makeGlow,
  DEFAULT_ACCENT_ID,
} from '@/constants/colors';

const STORAGE_KEY_ACCENT = '@afxs/accent_id';
const STORAGE_KEY_CUSTOM_ACCENT = '@afxs/accent_custom';

interface ThemeContextValue {
  theme: AppTheme;
  accentId: string;
  customAccent: string | null;
  setAccent: (id: string, customHex?: string) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [accentId, setAccentId] = useState(DEFAULT_ACCENT_ID);
  const [customAccent, setCustomAccent] = useState<string | null>(null);
  const [theme, setTheme] = useState<AppTheme>(() => {
    const preset = getAccentPreset(DEFAULT_ACCENT_ID);
    return buildTheme(preset.color, preset.glow);
  });

  // Load persisted accent on mount
  useEffect(() => {
    (async () => {
      try {
        const storedId = await AsyncStorage.getItem(STORAGE_KEY_ACCENT);
        const storedCustom = await AsyncStorage.getItem(STORAGE_KEY_CUSTOM_ACCENT);
        if (storedId) {
          applyAccent(storedId, storedCustom ?? undefined);
        }
      } catch {
        // Use defaults on storage failure
      }
    })();
  }, []);

  const applyAccent = useCallback((id: string, customHex?: string) => {
    setAccentId(id);
    if (id === 'custom' && customHex) {
      setCustomAccent(customHex);
      setTheme(buildTheme(customHex, makeGlow(customHex)));
    } else {
      setCustomAccent(null);
      const preset = getAccentPreset(id);
      setTheme(buildTheme(preset.color, preset.glow));
    }
  }, []);

  const setAccent = useCallback(async (id: string, customHex?: string) => {
    applyAccent(id, customHex);
    try {
      await AsyncStorage.setItem(STORAGE_KEY_ACCENT, id);
      if (id === 'custom' && customHex) {
        await AsyncStorage.setItem(STORAGE_KEY_CUSTOM_ACCENT, customHex);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY_CUSTOM_ACCENT);
      }
    } catch {
      // Theme still applied in-memory even if persistence fails
    }
  }, [applyAccent]);

  return (
    <ThemeContext.Provider value={{ theme, accentId, customAccent, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
