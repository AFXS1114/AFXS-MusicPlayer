// AFXS Music Player and Organizer
// Tab navigation layout

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { MiniPlayer } from '@/components/MiniPlayer';
import { usePlayer } from '@/contexts/PlayerContext';

function TabBarIcon({ name, color, size }: { name: string; color: any; size: number }) {
  return <MaterialIcons name={name as any} size={size} color={color} />;
}

export default function TabLayout() {
  const { theme } = useTheme();
  const { currentSong } = usePlayer();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.tabBarBackground,
            borderTopColor: theme.tabBarBorder,
            borderTopWidth: StyleSheet.hairlineWidth,
            height: 58,
            paddingBottom: 6,
            elevation: 0,
          },
          tabBarActiveTintColor: theme.tabBarActive,
          tabBarInactiveTintColor: theme.tabBarInactive,
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '500',
            letterSpacing: 0.3,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <TabBarIcon name="home" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: 'Library',
            tabBarIcon: ({ color, size }) => (
              <TabBarIcon name="library-music" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="playlists"
          options={{
            title: 'Playlists',
            tabBarIcon: ({ color, size }) => (
              <TabBarIcon name="queue-music" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="tools"
          options={{
            title: 'Tools',
            tabBarIcon: ({ color, size }) => (
              <TabBarIcon name="build" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => (
              <TabBarIcon name="settings" color={color} size={size} />
            ),
          }}
        />
      </Tabs>

      {/* MiniPlayer sits above the tab bar */}
      {currentSong && (
        <View style={styles.miniPlayerWrapper}>
          <MiniPlayer />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  miniPlayerWrapper: {
    position: 'absolute',
    bottom: 58, // above tab bar (tab bar height)
    left: 0,
    right: 0,
    zIndex: 100,
  },
});
