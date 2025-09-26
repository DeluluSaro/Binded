import { useTheme } from '@/contexts/ThemeContext';
import { useThemeColors } from '@/hooks/use-theme-color';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface EpubReaderControlsProps {
  currentChapter: number;
  totalChapters: number;
  displayChapter: number;
  progressBarWidth: number;
  isProgressBarPressed: boolean;
  progressBarPanResponder: any;
  fontSize: number;
  onFontSizeChange: (newSize: number) => void;
  onResetToBeginning: () => void;
  onClose: () => void;
}

export const EpubReaderControls: React.FC<EpubReaderControlsProps> = ({
  currentChapter,
  totalChapters,
  displayChapter,
  progressBarWidth,
  isProgressBarPressed,
  progressBarPanResponder,
  fontSize,
  onFontSizeChange,
  onResetToBeginning,
  onClose
}) => {
  const { toggleTheme, isDark } = useTheme();
  const colors = useThemeColors();

  const handleFontSizeIncrease = () => {
    const newSize = Math.min(24, fontSize + 2);
    console.log(`📝 Increasing font size from ${fontSize}px to ${newSize}px`);
    onFontSizeChange(newSize);
  };

  const handleFontSizeDecrease = () => {
    const newSize = Math.max(12, fontSize - 2);
    console.log(`📝 Decreasing font size from ${fontSize}px to ${newSize}px`);
    onFontSizeChange(newSize);
  };

  return (
    <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <TouchableOpacity 
        style={[styles.headerButton, { backgroundColor: colors.tint, borderColor: colors.border }]}
        onPress={onClose}
      >
        <Text style={[styles.headerButtonText, { color: colors.text }]}>←</Text>
      </TouchableOpacity>
      
      <View style={styles.headerRight}>
        <TouchableOpacity 
          style={[styles.headerButton, { backgroundColor: colors.tint, borderColor: colors.border }]}
          onPress={handleFontSizeDecrease}
        >
          <Text style={[styles.headerButtonText, { color: colors.text }]}>A-</Text>
        </TouchableOpacity>
        
        <View style={[styles.fontSizeIndicator, { backgroundColor: colors.tint, borderColor: colors.border }]}>
          <Text style={[styles.fontSizeText, { color: colors.text }]}>{fontSize}px</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.headerButton, { backgroundColor: colors.tint, borderColor: colors.border }]}
          onPress={handleFontSizeIncrease}
        >
          <Text style={[styles.headerButtonText, { color: colors.text }]}>A+</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.headerButton, { backgroundColor: colors.tint, borderColor: colors.border }]}
          onPress={toggleTheme}
        >
          <Text style={[styles.headerButtonText, { color: colors.text }]}>
            {isDark ? '☀️' : '🌙'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    paddingTop: 50, // Add safe area padding
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerButtonText: {
    fontSize: 20,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  fontSizeIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 50,
    alignItems: 'center',
    borderWidth: 1,
  },
  fontSizeText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
