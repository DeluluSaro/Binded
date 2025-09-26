import { useThemeColors } from '@/hooks/use-theme-color';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../themed-text';

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
  const colors = useThemeColors();

  return (
    <>
      {/* Progress Bar Section */}
      <View style={[styles.progressSection, { backgroundColor: colors.surfaceSecondary, borderBottomColor: colors.border }]}>
        <View style={styles.progressContainer}>
          <View 
            style={[styles.progressBar, { backgroundColor: colors.surfaceSecondary }]}
            onLayout={(event) => {
              const { width } = event.nativeEvent.layout;
              console.log('Progress bar width set to:', width);
            }}
            {...progressBarPanResponder.panHandlers}
          >
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${((isProgressBarPressed ? displayChapter : currentChapter) + 1) / totalChapters * 100}%`,
                  backgroundColor: colors.tint
                }
              ]} 
            />
            {isProgressBarPressed && (
              <View style={[styles.progressIndicator, { backgroundColor: colors.tint }]}>
                <ThemedText style={[styles.progressIndicatorText, { color: '#fff' }]}>
                  {displayChapter + 1}
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Font Controls */}
      <View style={[styles.fontControls, { backgroundColor: colors.surfaceSecondary, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.fontControlsCenter}>
          <TouchableOpacity 
            style={[styles.fontButton, { backgroundColor: colors.tint }]} 
            onPress={() => onFontSizeChange(Math.max(12, fontSize - 2))}
          >
            <Text style={styles.fontButtonText}>A-</Text>
          </TouchableOpacity>
          
          <ThemedText style={styles.fontSizeText}>{fontSize}px</ThemedText>
          
          <TouchableOpacity 
            style={[styles.fontButton, { backgroundColor: colors.tint }]} 
            onPress={() => onFontSizeChange(Math.min(24, fontSize + 2))}
          >
            <Text style={styles.fontButtonText}>A+</Text>
          </TouchableOpacity>
          
          {/* Go to Beginning Button */}
          <TouchableOpacity 
            style={[styles.fontButton, { 
              backgroundColor: colors.tint,
              marginLeft: 10
            }]} 
            onPress={onResetToBeginning}
          >
            <Text style={styles.fontButtonText}>🏠</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={[styles.closeButtonText, { color: colors.text }]}>✕</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  progressSection: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  progressContainer: {
    flex: 1,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#e0e0e0',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressIndicator: {
    position: 'absolute',
    top: -30,
    left: '50%',
    transform: [{ translateX: -20 }],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    minWidth: 50,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  progressIndicatorText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  fontControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  fontControlsCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  backButton: {
    padding: 12,
    borderRadius: 25,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  fontButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginHorizontal: 10,
  },
  fontButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  fontSizeText: {
    fontSize: 14,
    fontWeight: '500',
    minWidth: 40,
    textAlign: 'center',
  },
  closeButton: {
    padding: 8,
    borderRadius: 25,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
