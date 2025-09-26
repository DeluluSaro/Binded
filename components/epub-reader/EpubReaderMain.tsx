import { useTheme } from '@/contexts/ThemeContext';
import { useThemeColors } from '@/hooks/use-theme-color';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useEpubReader } from '../../hooks/useEpubReader';
import { BookmarkManager } from '../../utils/BookmarkManager';
import Loading from '../loading';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';
import { BookmarkListModal } from './BookmarkListModal';
import { EpubReaderContent } from './EpubReaderContent';
import { EpubReaderControls } from './EpubReaderControls';
import { EpubReaderNavigation } from './EpubReaderNavigation';
import { ModernModal } from './ModernModal';

interface EpubReaderMainProps {
  epubUrl: string;
  onClose: () => void;
}

const EpubReaderMain: React.FC<EpubReaderMainProps> = ({ epubUrl, onClose }) => {
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const webViewRef = useRef<WebView>(null);
  
  // Modal states
  const [showBookmarkList, setShowBookmarkList] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalData, setModalData] = useState<{
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
  }>({ title: '', message: '', type: 'info' });
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  
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
      const bookmarksData = await BookmarkManager.getBookBookmarks(bookData?.title || 'Unknown Book');
      
      if (bookmarksData.length === 0) {
        setModalData({
          title: 'No Bookmarks Found',
          message: 'Set a bookmark by long-pressing any word while reading.',
          type: 'info'
        });
        setShowErrorModal(true);
        return;
      }

      // Sort bookmarks by chapter index for better organization
      const sortedBookmarks = bookmarksData.sort((a, b) => a.chapterIndex - b.chapterIndex);
      setBookmarks(sortedBookmarks);
      setShowBookmarkList(true);
    } catch (error) {
      console.error('❌ Error loading bookmarks:', error);
      setModalData({
        title: 'Error',
        message: 'Failed to load bookmarks. Please try again.',
        type: 'error'
      });
      setShowErrorModal(true);
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
        
        setModalData({
          title: 'Jumped to Last Bookmark!',
          message: `Chapter ${lastBookmarkChapter + 1}: "${stats.lastBookmark.wordText || 'Bookmarked word'}"`,
          type: 'success'
        });
        setShowSuccessModal(true);
      } else {
        setModalData({
          title: 'No Bookmarks Found',
          message: 'Set a bookmark by long-pressing any word while reading.',
          type: 'info'
        });
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('❌ Error jumping to last bookmark:', error);
      setModalData({
        title: 'Error',
        message: 'Failed to jump to last bookmark. Please try again.',
        type: 'error'
      });
      setShowErrorModal(true);
    }
  };

  const handleClearAllBookmarks = async () => {
    setModalData({
      title: 'Clear All Bookmarks',
      message: 'Are you sure you want to remove all bookmarks from this book?',
      type: 'warning'
    });
    setShowConfirmModal(true);
  };

  const handleConfirmClearBookmarks = async () => {
    try {
      const bookmarksData = await BookmarkManager.getBookBookmarks(bookData?.title || 'Unknown Book');
      for (const bookmark of bookmarksData) {
        await BookmarkManager.removeBookmark(bookData?.title || 'Unknown Book', bookmark.chapterIndex);
      }
      setModalData({
        title: 'All Bookmarks Cleared!',
        message: 'All bookmarks have been successfully removed.',
        type: 'success'
      });
      setShowSuccessModal(true);
    } catch (error) {
      console.error('❌ Error clearing bookmarks:', error);
      setModalData({
        title: 'Error',
        message: 'Failed to clear bookmarks. Please try again.',
        type: 'error'
      });
      setShowErrorModal(true);
    }
  };

  const handleBookmarkCurrentPage = () => {
    setModalData({
      title: 'Bookmark Current Page',
      message: 'Long-press any word in the text to set a bookmark at that position.',
      type: 'info'
    });
    setShowErrorModal(true);
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

      {/* Modern Modals */}
      <BookmarkListModal
        visible={showBookmarkList}
        onClose={() => setShowBookmarkList(false)}
        bookmarks={bookmarks}
        onBookmarkSelect={(bookmark) => {
          console.log('🔖 Navigating to bookmark:', bookmark);
          console.log('🔖 Chapter:', bookmark.chapterIndex, 'Word Index:', bookmark.wordIndex, 'Word Text:', bookmark.wordText);
          goToChapter(bookmark.chapterIndex, bookmark.wordIndex);
        }}
      />

      <ModernModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={modalData.title}
        message={modalData.message}
        type={modalData.type}
        options={[{ text: 'OK', onPress: () => {} }]}
      />

      <ModernModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title={modalData.title}
        message={modalData.message}
        type={modalData.type}
        options={[{ text: 'OK', onPress: () => {} }]}
      />

      <ModernModal
        visible={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={modalData.title}
        message={modalData.message}
        type={modalData.type}
        options={[
          { text: 'Cancel', onPress: () => {}, style: 'cancel' },
          { text: 'Clear All', onPress: handleConfirmClearBookmarks, style: 'destructive' }
        ]}
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
