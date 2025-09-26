import { useThemeColors } from '@/hooks/use-theme-color';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { useEpubReader } from '../../hooks/useEpubReader';
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
    <ThemedView style={styles.container}>
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
        webViewRef={webViewRef}
        bookData={bookData}
      />
    </ThemedView>
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
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default EpubReaderMain;
