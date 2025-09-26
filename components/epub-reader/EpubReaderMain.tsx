import { useTheme } from '@/contexts/ThemeContext';
import { useThemeColors } from '@/hooks/use-theme-color';
import React, { useEffect, useRef } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useEpubReader } from '../../hooks/useEpubReader';
import { BookmarkManager } from '../../utils/BookmarkManager';
import Loading from '../loading';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';
import { EpubReaderContent } from './EpubReaderContent';
import { EpubReaderControls } from './EpubReaderControls';
import { EpubReaderNavigation } from './EpubReaderNavigation';

interface EpubReaderMainProps {
  epubUrl: string;
  onClose: () => void;
}

const EpubReaderMain: React.FC<EpubReaderMainProps> = ({ epubUrl, onClose }) => {
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const webViewRef = useRef<WebView>(null);
  
  const {
    // State
    currentChapter,
    setCurrentChapter,
    chapterContent,
    setChapterContent,
    bookData,
    setBookData,
    loading,
    setLoading,
    contentLoading,
    setContentLoading,
    fontSize,
    setFontSize,
    loadedChapters,
    setLoadedChapters,
    chapterCache,
    setChapterCache,
    isLoadingMore,
    setIsLoadingMore,
    isProgressBarPressed,
    setIsProgressBarPressed,
    progressBarWidth,
    setProgressBarWidth,
    lastSwipeChapter,
    setLastSwipeChapter,
    pendingChapter,
    setPendingChapter,
    displayChapter,
    setDisplayChapter,
    bookmarkPosition,
    setBookmarkPosition,
    bookmarkData,
    setBookmarkData,
    hasBookmark,
    setHasBookmark,
    
    // Functions
    loadEpub,
    loadSingleChapter,
    loadChapterBatch,
    loadInitialBatch,
    nextChapter,
    prevChapter,
    adjustFontSize,
    resetToBeginning,
    handleWebViewMessage,
    handleBookmarkSet,
    moveBookmarkNext,
    moveBookmarkPrevious,
    removeCurrentBookmark,
    goToChapter,
    progressBarPanResponder,
    cleanup
  } = useEpubReader(epubUrl);

  // Bookmark functions
  const handleViewAllBookmarks = async () => {
    try {
      const bookmarks = await BookmarkManager.getBookBookmarks(bookData?.title || 'Unknown Book');
      
      if (bookmarks.length === 0) {
        Alert.alert('No bookmarks found', 'Set a bookmark by long-pressing any word while reading.', [{ text: 'OK' }]);
        return;
      }

      // Sort bookmarks by chapter index for better organization
      const sortedBookmarks = bookmarks.sort((a, b) => a.chapterIndex - b.chapterIndex);
      
      // Create bookmark options for Alert
      const bookmarkOptions = sortedBookmarks.map((bookmark, index) => ({
        text: `Chapter ${bookmark.chapterIndex + 1}: "${bookmark.wordText || 'Bookmarked word'}"`,
        onPress: () => {
          console.log('🔖 Navigating to bookmark:', bookmark);
          console.log('🔖 Chapter:', bookmark.chapterIndex, 'Word Index:', bookmark.wordIndex, 'Word Text:', bookmark.wordText);
          goToChapter(bookmark.chapterIndex, bookmark.wordIndex);
        }
      }));

      // Add cancel option
      bookmarkOptions.push({ text: 'Cancel', onPress: () => {} });

      Alert.alert(
        'All Bookmarks',
        `Choose a bookmark to navigate to (${bookmarks.length} available):`,
        bookmarkOptions
      );
    } catch (error) {
      console.error('❌ Error loading bookmarks:', error);
      Alert.alert('Error', 'Failed to load bookmarks. Please try again.', [{ text: 'OK' }]);
    }
  };

  const handleJumpToLastBookmark = async () => {
    try {
      const stats = await BookmarkManager.getBookmarkStats(bookData?.title || 'Unknown Book');
      if (stats.lastBookmark) {
        const lastBookmarkChapter = stats.lastBookmark.chapterIndex;
        console.log('🔖 Jumping to last bookmark at chapter:', lastBookmarkChapter);
        
        // Navigate to the last bookmark chapter
        console.log('🔖 Jumping to last bookmark - Chapter:', lastBookmarkChapter, 'Word Index:', stats.lastBookmark.wordIndex, 'Word Text:', stats.lastBookmark.wordText);
        goToChapter(lastBookmarkChapter, stats.lastBookmark.wordIndex);
        
        Alert.alert(
          'Jumped to Last Bookmark!', 
          `Chapter ${lastBookmarkChapter + 1}: "${stats.lastBookmark.wordText || 'Bookmarked word'}"`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('No bookmarks found', 'Set a bookmark by long-pressing any word while reading.', [{ text: 'OK' }]);
      }
    } catch (error) {
      console.error('❌ Error jumping to last bookmark:', error);
      Alert.alert('Error', 'Failed to jump to last bookmark. Please try again.', [{ text: 'OK' }]);
    }
  };

  const handleClearAllBookmarks = async () => {
    Alert.alert(
      'Clear All Bookmarks',
      'Are you sure you want to remove all bookmarks from this book?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            const bookmarks = await BookmarkManager.getBookBookmarks(bookData?.title || 'Unknown Book');
            for (const bookmark of bookmarks) {
              await BookmarkManager.removeBookmark(bookData?.title || 'Unknown Book', bookmark.chapterIndex);
            }
            Alert.alert('All bookmarks cleared!', '', [{ text: 'OK' }]);
          }
        }
      ]
    );
  };

  const handleBookmarkCurrentPage = () => {
    Alert.alert(
      'Bookmark Current Page',
      'Long-press any word in the text to set a bookmark at that position.',
      [{ text: 'OK' }]
    );
  };

  useEffect(() => {
    loadEpub();
    return () => {
      cleanup();
    };
  }, [loadEpub, cleanup]);

  useEffect(() => {
    if (bookData && bookData.chapters.length > 0 && !loading && !contentLoading) {
      console.log('📚 Book data ready, loading chapter batch...');
      loadChapterBatch(currentChapter);
    }
  }, [currentChapter, bookData, loading, contentLoading, loadChapterBatch]);

  useEffect(() => {
    if (!isProgressBarPressed) {
      setDisplayChapter(currentChapter);
    }
  }, [currentChapter, isProgressBarPressed]);

  useEffect(() => {
    if (bookData && bookData.chapters.length > 0 && !loading) {
      loadInitialBatch();
    }
  }, [bookData, loading, loadInitialBatch]);

  if (loading) {
    return <Loading message="Opening Book..." />;
  }

  if (!bookData) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ThemedText style={styles.errorText}>Failed to load EPUB</ThemedText>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.tint }]} onPress={loadEpub}>
          <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#010101' : '#b7aa99' }]}>
      {/* <EpubReaderHeader 
        currentChapter={currentChapter}
        totalChapters={bookData.chapters.length}
        onClose={onClose}
      /> */}





      <EpubReaderControls
        currentChapter={currentChapter}
        totalChapters={bookData.chapters.length}
        displayChapter={displayChapter}
        progressBarWidth={progressBarWidth}
        isProgressBarPressed={isProgressBarPressed}
        progressBarPanResponder={progressBarPanResponder}
        fontSize={fontSize}
        onFontSizeChange={adjustFontSize}
        onResetToBeginning={resetToBeginning}
        onClose={onClose}
        onViewAllBookmarks={handleViewAllBookmarks}
        onGoToLastBookmark={handleJumpToLastBookmark}
        onClearAllBookmarks={handleClearAllBookmarks}
        onBookmarkCurrentPage={handleBookmarkCurrentPage}
      />

      <EpubReaderContent
        webViewRef={webViewRef}
        chapterContent={chapterContent}
        contentLoading={contentLoading}
        onMessage={handleWebViewMessage}
      />

      <EpubReaderNavigation
        currentChapter={currentChapter}
        totalChapters={bookData.chapters.length}
        displayChapter={displayChapter}
        isLoadingMore={isLoadingMore}
        onPrevious={prevChapter}
        onNext={nextChapter}
        hasBookmark={hasBookmark}
        bookmarkPosition={bookmarkPosition}
        bookmarkData={bookmarkData}
        onMoveBookmarkNext={moveBookmarkNext}
        onMoveBookmarkPrevious={moveBookmarkPrevious}
        onRemoveBookmark={removeCurrentBookmark}
        onGoToChapter={goToChapter}
        webViewRef={webViewRef}
        bookData={bookData}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  errorText: {
    fontSize: 18,
    color: '#e74c3c',
    marginBottom: 20,
    fontFamily: 'Outfit_400Regular',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontFamily: 'Outfit_700Bold',
  },
});

export default EpubReaderMain;
