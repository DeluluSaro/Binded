import { useThemeColors } from '@/hooks/use-theme-color';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../themed-text';

interface EpubReaderHeaderProps {
  currentChapter: number;
  totalChapters: number;
  onClose: () => void;
}

export const EpubReaderHeader: React.FC<EpubReaderHeaderProps> = ({
  currentChapter,
  totalChapters,
  onClose
}) => {
  const colors = useThemeColors();

  return (
    <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={styles.chapterInfo}>
        <ThemedText variant="secondary" style={styles.chapterText}>
          {currentChapter + 1}/{totalChapters}
        </ThemedText>
      </View>
      
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Text style={[styles.closeButtonText, { color: colors.text }]}>✕</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  closeButton: {
    padding: 8,
    borderRadius: 25,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  chapterInfo: {
    alignItems: 'center',
  },
  chapterText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
