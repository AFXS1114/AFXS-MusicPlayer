// AFXS Music Player and Organizer
// ArtworkPickerSheet — modal sheet for selecting cover artwork for albums/songs

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
// import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/colors';
import { searchAlbumArtworkWeb } from '@/services/artwork/ArtworkManager';

interface ArtworkPickerSheetProps {
  visible: boolean;
  albumName: string;
  artistName: string;
  currentArtworkUri: string | null;
  onClose: () => void;
  onArtworkSelected: (uri: string) => void;
}

export function ArtworkPickerSheet({
  visible,
  albumName,
  artistName,
  currentArtworkUri,
  onClose,
  onArtworkSelected,
}: ArtworkPickerSheetProps) {
  const [urlInput, setUrlInput] = useState('');
  const [showUrlField, setShowUrlField] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<string[]>([]);

  const handlePickFromGallery = async () => {
    try {
      const ImagePicker: any = await import('expo-image-picker');
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Media library access is required to choose artwork.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        onArtworkSelected(result.assets[0].uri);
        onClose();
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to pick image');
    }
  };


  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    onArtworkSelected(urlInput.trim());
    setUrlInput('');
    setShowUrlField(false);
    onClose();
  };

  const handleSearchWeb = async () => {
    if (!albumName) {
      Alert.alert('Missing Info', 'Album title is required to search cover artwork.');
      return;
    }
    setSearching(true);
    setSearchResults([]);
    try {
      const results = await searchAlbumArtworkWeb(artistName, albumName);
      setSearchResults(results);
      if (results.length === 0) {
        Alert.alert('No Results', 'Could not find artwork online for this album.');
      }
    } catch (err: any) {
      Alert.alert('Search Error', err.message || 'Failed to search artwork');
    } finally {
      setSearching(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <MaterialCommunityIcons name="image-edit" size={24} color={Colors.accent.purple} />
              <Text style={styles.headerTitle}>Change Cover Artwork</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color={Colors.text.muted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.albumSubtitle} numberOfLines={1}>
            {albumName || 'Unknown Album'} — {artistName || 'Unknown Artist'}
          </Text>

          {/* Current Artwork Preview */}
          <View style={styles.previewContainer}>
            {currentArtworkUri ? (
              <Image source={{ uri: currentArtworkUri }} style={styles.previewImage} />
            ) : (
              <View style={[styles.previewImage, styles.previewPlaceholder]}>
                <MaterialCommunityIcons name="music-note" size={40} color={Colors.text.muted} />
              </View>
            )}
            <Text style={styles.previewLabel}>Current Artwork</Text>
          </View>

          {/* Options */}
          <View style={styles.optionsList}>
            <TouchableOpacity style={styles.optionItem} onPress={handlePickFromGallery}>
              <View style={[styles.optionIcon, { backgroundColor: 'rgba(124, 77, 255, 0.15)' }]}>
                <MaterialCommunityIcons name="folder-image" size={22} color={Colors.accent.purple} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Choose from Device Gallery</Text>
                <Text style={styles.optionDesc}>Select custom image file from your photos</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionItem} onPress={handleSearchWeb} disabled={searching}>
              <View style={[styles.optionIcon, { backgroundColor: 'rgba(0, 229, 255, 0.15)' }]}>

                <MaterialCommunityIcons name="cloud-search" size={22} color={Colors.accent.cyan} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Search Online Covers</Text>
                <Text style={styles.optionDesc}>Fetch high-resolution album cover from iTunes API</Text>
              </View>
              {searching && <ActivityIndicator size="small" color={Colors.accent.cyan} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => setShowUrlField(!showUrlField)}
            >
              <View style={[styles.optionIcon, { backgroundColor: 'rgba(255, 171, 0, 0.15)' }]}>
                <MaterialCommunityIcons name="link-variant" size={22} color={Colors.accent.gold} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Image URL</Text>
                <Text style={styles.optionDesc}>Paste direct image web link</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* URL Input Box */}
          {showUrlField && (
            <View style={styles.urlContainer}>
              <TextInput
                style={styles.urlInput}
                placeholder="https://example.com/cover.jpg"
                placeholderTextColor={Colors.text.muted}
                value={urlInput}
                onChangeText={setUrlInput}
                autoCapitalize="none"
                keyboardType="url"
              />
              <TouchableOpacity style={styles.applyUrlBtn} onPress={handleApplyUrl}>
                <Text style={styles.applyUrlText}>Apply</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Search Results Grid */}
          {searchResults.length > 0 && (
            <View style={styles.searchResultsContainer}>
              <Text style={styles.resultsTitle}>Select Cover Result:</Text>
              <View style={styles.resultsGrid}>
                {searchResults.map((uri, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.resultCard}
                    onPress={() => {
                      onArtworkSelected(uri);
                      onClose();
                    }}
                  >
                    <Image source={{ uri }} style={styles.resultImage} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Close button */}
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.bg.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  closeBtn: {
    padding: 4,
  },
  albumSubtitle: {
    fontSize: 13,
    color: Colors.text.muted,
    marginBottom: 16,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: Colors.bg.card,
  },
  previewPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.bg.border,
  },
  previewLabel: {
    fontSize: 11,
    color: Colors.text.muted,
    marginTop: 6,
  },
  optionsList: {
    gap: 10,
    marginBottom: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.card,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  optionDesc: {
    fontSize: 12,
    color: Colors.text.muted,
    marginTop: 2,
  },
  urlContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  urlInput: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.bg.card,
    borderWidth: 1,
    borderColor: Colors.bg.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    color: Colors.text.primary,
    fontSize: 13,
  },
  applyUrlBtn: {
    height: 44,
    paddingHorizontal: 18,
    backgroundColor: Colors.accent.purple,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyUrlText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  searchResultsContainer: {
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  resultsGrid: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  resultCard: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.bg.card,
  },
  resultImage: {
    width: '100%',
    height: '100%',
  },
  cancelBtn: {
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.bg.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  cancelBtnText: {
    color: Colors.text.primary,
    fontWeight: '600',
    fontSize: 15,
  },
});
