// AFXS Music Player and Organizer
// Root layout — providers and navigation stack

import React, { useEffect, useState } from 'react';
import { View, StatusBar, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { PlayerProvider } from '@/contexts/PlayerContext';
import { getDatabase } from '@/database/db';

function AppContent() {
  const { theme } = useTheme();
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    getDatabase()
      .then(() => setDbReady(true))
      .catch(err => {
        console.error('Failed to initialize database:', err);
        setDbReady(true); // continue anyway, screens will handle errors
      });
  }, []);

  if (!dbReady) return <View style={[styles.loading, { backgroundColor: theme.background }]} />;

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.background} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="player"
          options={{
            animation: 'slide_from_bottom',
            presentation: 'modal',
          }}
        />
        <Stack.Screen name="metadata" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="organizer" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="artwork-manager" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="duplicates" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <PlayerProvider>
            <AppContent />
          </PlayerProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1 },
});
