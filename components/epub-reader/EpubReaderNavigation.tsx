import { useTheme } from '@/contexts/ThemeContext';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface EpubReaderNavigationProps {
  currentChapter: number;
  totalChapters: number;
  displayChapter: number;
  isLoadingMore: boolean;
  onPrevious: () => void;
  onNext: () => void;
  hasBookmark: boolean;
  bookmarkPosition: number;
  bookmarkData: any;
  onMoveBookmarkNext: () => void;
  onMoveBookmarkPrevious: () => void;
  onRemoveBookmark: () => void;
  onGoToChapter: (chapterIndex: number) => void;
  webViewRef: React.RefObject<any>;
  bookData: any;
}

export const EpubReaderNavigation: React.FC<EpubReaderNavigationProps> = ({
  currentChapter,
  totalChapters,
  displayChapter,
  isLoadingMore,
  onPrevious,
  onNext,
  hasBookmark,
  bookmarkPosition,
  bookmarkData,
  onMoveBookmarkNext,
  onMoveBookmarkPrevious,
  onRemoveBookmark,
  onGoToChapter,
  webViewRef,
  bookData
}) => {
  const { isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      {/* Footer with glassmorphism effect matching the image */}
      <View style={[styles.footer, { backgroundColor: isDark ? 'rgba(1, 1, 1, 0.8)' : 'rgba(183, 170, 153, 0.8)' }]}>
        {/* Page Info Row */}
        <View style={styles.pageInfo}>
          <Text style={[styles.pageText, { color: isDark ? 'rgba(224, 224, 224, 0.8)' : 'rgba(58, 46, 36, 0.8)' }]}>
            Page {displayChapter + 1} of {totalChapters}
          </Text>
          <Text style={[styles.timeText, { color: isDark ? 'rgba(224, 224, 224, 0.8)' : 'rgba(58, 46, 36, 0.8)' }]}>
            4 hours left
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={[styles.progressContainer, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }]}>
          <View style={[styles.progressBar, { width: `${((displayChapter + 1) / totalChapters) * 100}%` }]} />
        </View>

        {/* Chapter Navigation */}
        <View style={styles.chapterNavigation}>
          <TouchableOpacity
            style={[styles.chapterButton, { backgroundColor: 'transparent' }, currentChapter === 0 && styles.chapterButtonDisabled]}
            onPress={onPrevious}
            disabled={currentChapter === 0}
          >
            <Text style={[styles.chapterButtonText, { color: isDark ? '#e0e0e0' : '#3a2e24' }]}>‹</Text>
          </TouchableOpacity>
          
          <Text style={[styles.chapterText, { color: '#eb5838' }]}>
            Chapter {displayChapter + 1}
          </Text>
          
          <TouchableOpacity
            style={[styles.chapterButton, { backgroundColor: 'transparent' }, currentChapter === totalChapters - 1 && styles.chapterButtonDisabled]}
            onPress={onNext}
            disabled={currentChapter === totalChapters - 1}
          >
            <Text style={[styles.chapterButtonText, { color: isDark ? '#e0e0e0' : '#3a2e24' }]}>›</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Container
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  // Footer with glassmorphism effect
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  // Page info row
  pageInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pageText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Outfit_400Regular',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Outfit_400Regular',
  },
  // Progress bar
  progressContainer: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#eb5838',
    borderRadius: 3,
  },
  // Chapter navigation
  chapterNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chapterButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chapterButtonDisabled: {
    opacity: 0.5,
  },
  chapterButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Outfit_700Bold',
  },
  chapterText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'Outfit_700Bold',
  },
});
