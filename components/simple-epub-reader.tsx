import { useThemeColors } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  PanResponder,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';

import { WebView } from 'react-native-webview';
import { BookmarkManager } from '../utils/BookmarkManager';
import SimpleEpubParser from '../utils/SimpleEpubParser';
import InPageLoader from './in-page-loader';
import Loading from './loading';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface SimpleEpubReaderProps {
  epubUrl: string;
  onClose: () => void;
}

const SimpleEpubReader: React.FC<SimpleEpubReaderProps> = ({ epubUrl, onClose }) => {
  const [currentChapter, setCurrentChapter] = useState(0);
  const [chapterContent, setChapterContent] = useState('');
  const [bookData, setBookData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [loadedChapters, setLoadedChapters] = useState<Set<number>>(new Set());
  const [chapterCache, setChapterCache] = useState<Map<number, string>>(new Map());
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isProgressBarPressed, setIsProgressBarPressed] = useState(false);
  const [progressBarWidth, setProgressBarWidth] = useState(0);
  const [lastSwipeChapter, setLastSwipeChapter] = useState(-1);
  const [pendingChapter, setPendingChapter] = useState(-1);
  const [displayChapter, setDisplayChapter] = useState(0);
  const [bookmarkPosition, setBookmarkPosition] = useState(-1);
  const [bookmarkData, setBookmarkData] = useState<any>(null);
  const [hasBookmark, setHasBookmark] = useState(false);
  const [showBookmarkControls, setShowBookmarkControls] = useState(false);
  const [isBookmarkSelectionMode, setIsBookmarkSelectionMode] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string>('');
  const [showBookmarkConfirm, setShowBookmarkConfirm] = useState(false);
  
  const colors = useThemeColors();
  const epubParser = useRef(new SimpleEpubParser());
  const webViewRef = useRef<WebView>(null);
  const progressBarRef = useRef<View>(null);

  useEffect(() => {
    loadEpub();
    return () => {
      epubParser.current.cleanup();
    };
  }, []);

  useEffect(() => {
    if (bookData && bookData.chapters.length > 0 && !loading) {
      loadChapterBatch(currentChapter);
    }
  }, [currentChapter, bookData, fontSize, loading]);

  // Update displayChapter when currentChapter changes (but not during swipe)
  useEffect(() => {
    if (!isProgressBarPressed) {
      setDisplayChapter(currentChapter);
    }
  }, [currentChapter, isProgressBarPressed]);

  // Load initial batch of chapters
  useEffect(() => {
    if (bookData && bookData.chapters.length > 0 && !loading) {
      loadInitialBatch();
    }
  }, [bookData, loading]);

  const loadEpub = async () => {
    try {
      setLoading(true);
      setContentLoading(true);
      console.log('Loading EPUB directly from URL...');
      
      // Show loading image for exactly 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Load EPUB directly from URL
      await epubParser.current.loadEpubFromUrl(epubUrl);
      
      // Get book information
      const bookInfo = await epubParser.current.getBookInfo();
      setBookData(bookInfo);
      
      // Load saved reading position
      const savedPosition = await AsyncStorage.getItem(`reading_position_${epubUrl}`);
      if (savedPosition) {
        setCurrentChapter(parseInt(savedPosition));
      }
      
      // Load saved font size
      const savedFontSize = await AsyncStorage.getItem('epub_font_size');
      if (savedFontSize) {
        setFontSize(parseInt(savedFontSize));
      }
      
    } catch (error) {
      console.error('Error loading EPUB:', error);
      Alert.alert('Error', 'Failed to load EPUB file: ' + (error as Error).message);
    } finally {
      setLoading(false);
      setContentLoading(false);
    }
  };

  // Load initial batch of 10 chapters
  const loadInitialBatch = async () => {
    if (!bookData || !bookData.chapters) return;
    
    const batchSize = 10;
    const chaptersToLoad = Math.min(batchSize, bookData.chapters.length);
    
    console.log(`Loading initial batch of ${chaptersToLoad} chapters...`);
    
    for (let i = 0; i < chaptersToLoad; i++) {
      await loadSingleChapter(i);
    }
    
    // Set current chapter content
    if (chapterCache.has(currentChapter)) {
      setChapterContent(chapterCache.get(currentChapter)!);
    }
  };

  // Load a single chapter and cache it
  const loadSingleChapter = async (chapterIndex: number) => {
    if (loadedChapters.has(chapterIndex) || chapterCache.has(chapterIndex)) {
      // If already loaded, set the content immediately
      const cachedContent = chapterCache.get(chapterIndex);
      if (cachedContent) {
        setChapterContent(cachedContent);
      }
      return; // Already loaded
    }

    try {
      setContentLoading(true);
      if (!bookData || !bookData.chapters || bookData.chapters.length === 0) {
        return;
      }
      
      // Load saved bookmark for this chapter
      const savedBookmark = await BookmarkManager.loadBookmark(
        bookData.title, 
        chapterIndex
      );
      
      let bookmarkWordIndex = -1;
      if (savedBookmark) {
        bookmarkWordIndex = savedBookmark.wordIndex;
        setBookmarkPosition(bookmarkWordIndex);
        setBookmarkData(savedBookmark);
        setHasBookmark(true);
        console.log('📖 Restored bookmark at word:', bookmarkWordIndex);
      } else {
        setBookmarkPosition(-1);
        setBookmarkData(null);
        setHasBookmark(false);
      }
      
      const chapterPath = bookData.basePath + bookData.chapters[chapterIndex];
      console.log(`Loading chapter ${chapterIndex}:`, chapterPath);
      
      // Check if EPUB data is still available
      if (!epubParser.current.isLoaded) {
        console.log('EPUB data lost, reloading...');
        await epubParser.current.loadEpubFromUrl(epubUrl);
      }
      
      let content = await epubParser.current.getChapterContent(chapterIndex, fontSize, bookmarkWordIndex);
      
      // Cache the chapter
      setChapterCache(prev => new Map(prev).set(chapterIndex, content));
      setLoadedChapters(prev => new Set(prev).add(chapterIndex));
      
      // Set the current chapter content immediately
      setChapterContent(content);
      
      console.log(`Chapter ${chapterIndex} cached successfully`);
      
    } catch (error) {
      console.error(`Error loading chapter ${chapterIndex}:`, error);
      // Try to reload the EPUB if it's a data issue
      if ((error as Error).message.includes('EPUB data not loaded')) {
        console.log('Attempting to reload EPUB...');
        try {
          await epubParser.current.loadEpubFromUrl(epubUrl);
          // Retry loading the chapter
          setTimeout(() => loadSingleChapter(chapterIndex), 1000);
        } catch (reloadError) {
          console.error('Failed to reload EPUB:', reloadError);
        }
      }
    } finally {
      setContentLoading(false);
    }
  };

  // Load batch of chapters around current chapter
  const loadChapterBatch = async (chapterIndex: number) => {
    if (!bookData || !bookData.chapters) return;
    
    // Check if current chapter is cached
    if (chapterCache.has(chapterIndex)) {
      setChapterContent(chapterCache.get(chapterIndex)!);
      return;
    }
    
    // Load current chapter if not cached
    await loadSingleChapter(chapterIndex);
    
    // Load next batch if we're near the end of loaded chapters
    if (loadedChapters.size > 0) {
      const maxLoadedChapter = Math.max(...Array.from(loadedChapters));
      if (chapterIndex >= maxLoadedChapter - 3) { // Load more when 3 chapters from end
        await loadNextBatch();
      }
    }
  };

  // Load next batch of chapters
  const loadNextBatch = async () => {
    if (isLoadingMore) return;
    
    setIsLoadingMore(true);
    const batchSize = 10;
    const maxLoadedChapter = loadedChapters.size > 0 ? Math.max(...Array.from(loadedChapters)) : -1;
    const nextBatchStart = maxLoadedChapter + 1;
    const nextBatchEnd = Math.min(nextBatchStart + batchSize, bookData.chapters.length);
    
    console.log(`Loading next batch: chapters ${nextBatchStart} to ${nextBatchEnd - 1}`);
    
    for (let i = nextBatchStart; i < nextBatchEnd; i++) {
      await loadSingleChapter(i);
    }
    
    setIsLoadingMore(false);
  };

  const nextChapter = async () => {
    if (currentChapter < bookData.chapters.length - 1) {
      const nextChapterIndex = currentChapter + 1;
      setCurrentChapter(nextChapterIndex);
      await loadSingleChapter(nextChapterIndex);
      
      // Save reading position
      AsyncStorage.setItem(`reading_position_${epubUrl}`, nextChapterIndex.toString());
    }
  };

  const prevChapter = async () => {
    if (currentChapter > 0) {
      const prevChapterIndex = currentChapter - 1;
      setCurrentChapter(prevChapterIndex);
      await loadSingleChapter(prevChapterIndex);
      
      // Save reading position
      AsyncStorage.setItem(`reading_position_${epubUrl}`, prevChapterIndex.toString());
    }
  };

  const adjustFontSize = async (newSize: number) => {
    setFontSize(newSize);
    await AsyncStorage.setItem('epub_font_size', newSize.toString());
    
    // Reload current chapter with new font size
    if (bookData && bookData.chapters.length > 0) {
      await loadSingleChapter(currentChapter);
    }
  };

  // Progress bar swipe functionality
  const goToChapter = async (targetChapter: number) => {
    if (targetChapter >= 0 && targetChapter < bookData.chapters.length && targetChapter !== currentChapter) {
      setCurrentChapter(targetChapter);
      await loadSingleChapter(targetChapter);
      AsyncStorage.setItem(`reading_position_${epubUrl}`, targetChapter.toString());
    }
  };

  const progressBarPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      setIsProgressBarPressed(true);
      console.log('Progress bar pressed at:', evt.nativeEvent.locationX);
    },
    onPanResponderMove: (evt, gestureState) => {
      if (isProgressBarPressed && progressBarWidth > 0) {
        // Calculate target chapter based on absolute position on progress bar
        const touchX = evt.nativeEvent.locationX;
        const progress = Math.max(0, Math.min(1, touchX / progressBarWidth));
        const targetChapter = Math.round(progress * (bookData.chapters.length - 1));
        
        console.log('Swipe - touchX:', touchX, 'progressBarWidth:', progressBarWidth, 'progress:', progress, 'targetChapter:', targetChapter, 'totalChapters:', bookData.chapters.length);
        
        // Only update the display chapter, don't load content yet
        if (targetChapter !== displayChapter && 
            targetChapter !== lastSwipeChapter && 
            targetChapter >= 0 && 
            targetChapter < bookData.chapters.length) {
          setLastSwipeChapter(targetChapter);
          setPendingChapter(targetChapter);
          setDisplayChapter(targetChapter);
        }
      }
    },
    onPanResponderRelease: () => {
      setIsProgressBarPressed(false);
      setLastSwipeChapter(-1); // Reset the last swipe chapter
      
      // Now load the chapter that was selected during the swipe
      if (pendingChapter !== -1 && pendingChapter !== currentChapter) {
        console.log('Loading chapter after swipe:', pendingChapter);
        setCurrentChapter(pendingChapter);
        goToChapter(pendingChapter);
      }
      setPendingChapter(-1);
      console.log('Progress bar released');
    },
  });

  // Enhanced WebView message handler
  const handleWebViewMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      switch (message.type) {
        case 'bookmarkSet':
          handleBookmarkSet(message.data);
          break;
          
        case 'wordSelected':
          if (isBookmarkSelectionMode) {
            setSelectedWord(message.word);
            setShowBookmarkConfirm(true);
          }
          break;
          
        case 'requestNextChapter':
          if (currentChapter < bookData.chapters.length - 1) {
            nextChapter();
          }
          break;
          
        case 'requestPreviousChapter':
          if (currentChapter > 0) {
            prevChapter();
          }
          break;
          
        case 'bookmarkPosition':
          console.log('Current bookmark position:', message.data);
          break;
          
        case 'wordLongPress':
          // Handle word highlighting
          break;
          
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  };

  // Handle bookmark setting
  const handleBookmarkSet = async (data: any) => {
    try {
      setBookmarkPosition(data.wordIndex);
      setBookmarkData(data);
      setHasBookmark(true);
      
      // Save bookmark to AsyncStorage
      const success = await BookmarkManager.saveBookmark(
        bookData.title,
        data.chapterIndex,
        data
      );
      
      if (success) {
        console.log('✅ Bookmark saved successfully');
      } else {
        console.error('❌ Failed to save bookmark');
      }
    } catch (error) {
      console.error('Error handling bookmark set:', error);
    }
  };

  // Handle bookmark confirmation
  const confirmBookmark = async () => {
    try {
      if (!selectedWord || !bookData) return;
      
      // Create bookmark data
      const bookmarkData = {
        wordIndex: 0, // We'll get this from the WebView
        wordText: selectedWord,
        totalWords: 100, // We'll get this from the WebView
        position: { scrollY: 0, x: 0, y: 0 },
        timestamp: new Date().toISOString(),
        lastAccessed: new Date().toISOString()
      };
      
      // Save bookmark
      await BookmarkManager.saveBookmark(bookData.title, currentChapter, bookmarkData);
      
      // Update UI
      setHasBookmark(true);
      setBookmarkData(bookmarkData);
      
      // Exit selection mode
      setIsBookmarkSelectionMode(false);
      setShowBookmarkConfirm(false);
      setSelectedWord('');
      
      // Notify WebView to highlight the word permanently
      webViewRef.current?.postMessage(JSON.stringify({
        type: 'confirmBookmark',
        word: selectedWord
      }));
      
      console.log('✅ Bookmark confirmed and saved');
    } catch (error) {
      console.error('❌ Error confirming bookmark:', error);
    }
  };

  // Notify WebView when bookmark selection mode changes
  useEffect(() => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'setBookmarkSelectionMode',
        enabled: isBookmarkSelectionMode
      }));
    }
  }, [isBookmarkSelectionMode]);

  // Cancel bookmark selection
  const cancelBookmark = () => {
    setIsBookmarkSelectionMode(false);
    setShowBookmarkConfirm(false);
    setSelectedWord('');
    
    // Notify WebView to remove temporary highlight
    webViewRef.current?.postMessage(JSON.stringify({
      type: 'cancelBookmark'
    }));
  };

  // Bookmark navigation functions
  const moveBookmarkNext = () => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'moveBookmarkNext'
      }));
    }
  };

  const moveBookmarkPrevious = () => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'moveBookmarkPrevious'
      }));
    }
  };

  const removeCurrentBookmark = async () => {
    try {
      const success = await BookmarkManager.removeBookmark(
        bookData.title,
        currentChapter
      );
      
      if (success) {
        setBookmarkPosition(-1);
        setBookmarkData(null);
        setHasBookmark(false);
        
        // Remove bookmark from WebView
        if (webViewRef.current) {
          webViewRef.current.postMessage(JSON.stringify({
            type: 'removeBookmark'
          }));
        }
        
        console.log('🗑️ Bookmark removed');
      }
    } catch (error) {
      console.error('Error removing bookmark:', error);
    }
  };

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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, paddingTop: 25 }]}>
           <TouchableOpacity 
          onPress={onClose} 
          style={[styles.headerButton, { backgroundColor: colors.surfaceSecondary }]}
          activeOpacity={0.7}
           >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
           </TouchableOpacity>
           
           <TouchableOpacity 
          onPress={() => setIsBookmarkSelectionMode(!isBookmarkSelectionMode)} 
          style={[
            styles.headerButton, 
            { 
              backgroundColor: isBookmarkSelectionMode ? colors.tint : colors.surfaceSecondary,
              borderWidth: isBookmarkSelectionMode ? 2 : 0,
              borderColor: colors.tint
            }
          ]}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={isBookmarkSelectionMode ? "add-circle" : "add-circle-outline"} 
            size={24} 
            color={isBookmarkSelectionMode ? '#fff' : colors.text} 
          />
           </TouchableOpacity>
           
        <View style={styles.chapterInfo}>
          <ThemedText style={[styles.chapterText, { fontFamily: 'Outfit_400Regular' }]}>
            Chapter {currentChapter + 1} of {bookData.chapters.length}
          </ThemedText>
        </View>
           
           <TouchableOpacity 
          onPress={() => setShowBookmarkControls(!showBookmarkControls)} 
          style={[styles.headerButton, { backgroundColor: colors.surfaceSecondary }]}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={showBookmarkControls ? "bookmark" : "bookmark-outline"} 
            size={24} 
            color={colors.tint} 
          />
           </TouchableOpacity>
         </View>

      {/* Progress Bar */}
      <View style={[styles.progressSection, { backgroundColor: colors.surfaceSecondary, borderBottomColor: colors.border }]}>
        <View style={styles.progressContainer}>
          <View 
            ref={progressBarRef}
            style={[styles.progressBar, { backgroundColor: colors.border }]}
            onLayout={(event) => {
              const { width } = event.nativeEvent.layout;
              setProgressBarWidth(width);
            }}
            {...progressBarPanResponder.panHandlers}
          >
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${((isProgressBarPressed ? displayChapter : currentChapter) + 1) / bookData.chapters.length * 100}%`,
                  backgroundColor: colors.tint
                }
              ]} 
            />
            {isProgressBarPressed && (
              <View style={[styles.progressIndicator, { backgroundColor: colors.tint }]}>
                <ThemedText style={[styles.progressIndicatorText, { color: '#fff', fontFamily: 'Outfit_700Bold' }]}>
                  {displayChapter + 1}
               </ThemedText>
             </View>
            )}
         </View>
               </View>
                 </View>
                 
      {/* Bookmark Controls */}
      {showBookmarkControls && (
        <View style={[styles.bookmarkControls, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.bookmarkStatus}>
            {hasBookmark ? (
              <View style={styles.bookmarkInfo}>
                <Ionicons name="bookmark" size={20} color={colors.tint} />
                <ThemedText style={[styles.bookmarkText, { fontFamily: 'Outfit_400Regular' }]}>
                  Word {bookmarkPosition + 1}
                  {bookmarkData && bookmarkData.wordText ? ` "${bookmarkData.wordText}"` : ''}
                 </ThemedText>
               <TouchableOpacity
                  style={[styles.removeBookmarkButton, { backgroundColor: colors.error }]}
                  onPress={removeCurrentBookmark}
                >
                  <Ionicons name="close" size={16} color="#fff" />
               </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.bookmarkInfo}>
                <Ionicons name="bookmark-outline" size={20} color={colors.icon} />
                <ThemedText style={[styles.noBookmarkText, { fontFamily: 'Outfit_400Regular' }]}>
                  Tap any word to set bookmark
                   </ThemedText>
           </View>
         )}
          </View>

          <View style={styles.bookmarkActions}>
         <TouchableOpacity
              style={[styles.bookmarkActionButton, !hasBookmark && styles.disabledButton]}
           onPress={moveBookmarkPrevious}
           disabled={!hasBookmark}
         >
              <Ionicons name="chevron-back" size={20} color={hasBookmark ? colors.text : colors.icon} />
              <ThemedText style={[styles.bookmarkActionText, { fontFamily: 'Outfit_400Regular' }]}>
                Previous
             </ThemedText>
         </TouchableOpacity>
         
           <TouchableOpacity
              style={[styles.bookmarkActionButton, !hasBookmark && styles.disabledButton]}
              onPress={moveBookmarkNext}
              disabled={!hasBookmark}
            >
              <ThemedText style={[styles.bookmarkActionText, { fontFamily: 'Outfit_400Regular' }]}>
                Next
             </ThemedText>
              <Ionicons name="chevron-forward" size={20} color={hasBookmark ? colors.text : colors.icon} />
           </TouchableOpacity>
         </View>
        </View>
      )}
         
      {/* Font Controls */}
      <View style={[styles.fontControls, { backgroundColor: colors.surfaceSecondary, borderBottomColor: colors.border }]}>
         <TouchableOpacity
          style={[styles.fontButton, { backgroundColor: colors.tint }]} 
          onPress={() => adjustFontSize(Math.max(12, fontSize - 2))}
        >
          <Ionicons name="remove" size={20} color="#fff" />
        </TouchableOpacity>
        
        <ThemedText style={[styles.fontSizeText, { fontFamily: 'Outfit_700Bold' }]}>
          {fontSize}px
             </ThemedText>
        
        <TouchableOpacity 
          style={[styles.fontButton, { backgroundColor: colors.tint }]} 
          onPress={() => adjustFontSize(Math.min(24, fontSize + 2))}
        >
          <Ionicons name="add" size={20} color="#fff" />
         </TouchableOpacity>
       </View>

      {/* Content */}
      <View style={styles.contentContainer}>
          <WebView
            ref={webViewRef}
            source={{ html: chapterContent }}
            style={styles.webView}
          showsVerticalScrollIndicator={true}
          bounces={true}
          scalesPageToFit={false}
          startInLoadingState={true}
          scrollEnabled={true}
          nestedScrollEnabled={true}
          automaticallyAdjustContentInsets={false}
          contentInsetAdjustmentBehavior="never"
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          onMessage={handleWebViewMessage}
          renderLoading={() => (
            <View style={styles.webViewLoading}>
              <ThemedText style={{ fontFamily: 'Outfit_400Regular' }}>Loading chapter...</ThemedText>
            </View>
          )}
        />
        
        {/* In-page loader for content loading */}
        {contentLoading && (
          <InPageLoader message="Loading page..." />
        )}
      </View>

      {/* Navigation */}
      <View style={[styles.navigationContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        {/* Page Number */}
        <View style={[styles.pageIndicator, { backgroundColor: colors.surfaceSecondary }]}>
          <ThemedText style={[styles.pageIndicatorText, { fontFamily: 'Outfit_700Bold' }]}>
            Page {displayChapter + 1} of {bookData.chapters.length}
          </ThemedText>
        </View>
        
        {/* Navigation Buttons */}
        <View style={styles.navButtonsContainer}>
        <TouchableOpacity
            style={[
              styles.navButton, 
              { backgroundColor: colors.tint },
              currentChapter === 0 && styles.navButtonDisabled
            ]}
            onPress={prevChapter}
            disabled={currentChapter === 0}
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
            <ThemedText style={[styles.navButtonText, { fontFamily: 'Outfit_700Bold' }]}>
              Previous
            </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
            style={[
              styles.navButton, 
              { backgroundColor: colors.tint },
              currentChapter === bookData.chapters.length - 1 && styles.navButtonDisabled
            ]}
            onPress={nextChapter}
            disabled={currentChapter === bookData.chapters.length - 1}
          >
            <ThemedText style={[styles.navButtonText, { fontFamily: 'Outfit_700Bold' }]}>
              Next
            </ThemedText>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>
        </View>
        
        {isLoadingMore && (
          <View style={styles.loadingMoreIndicator}>
            <ThemedText style={[styles.loadingMoreText, { fontFamily: 'Outfit_400Regular' }]}>
              Loading more chapters...
            </ThemedText>
          </View>
        )}
      </View>

      {/* Bookmark Confirmation Modal */}
      {showBookmarkConfirm && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <ThemedText style={[styles.modalTitle, { fontFamily: 'Outfit_700Bold' }]}>
              Add Bookmark
            </ThemedText>
            <ThemedText style={[styles.modalText, { fontFamily: 'Outfit_400Regular' }]}>
              Add "{selectedWord}" to bookmarks?
            </ThemedText>
            <View style={styles.modalButtons}>
        <TouchableOpacity
                onPress={cancelBookmark}
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.surfaceSecondary }]}
                activeOpacity={0.7}
              >
                <ThemedText style={[styles.modalButtonText, { fontFamily: 'Outfit_400Regular' }]}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={confirmBookmark}
                style={[styles.modalButton, styles.confirmButton, { backgroundColor: colors.tint }]}
                activeOpacity={0.7}
              >
                <ThemedText style={[styles.modalButtonText, { color: '#fff', fontFamily: 'Outfit_700Bold' }]}>
                  Add Bookmark
                </ThemedText>
        </TouchableOpacity>
      </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerButton: {
    padding: 12,
    borderRadius: 25,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterInfo: {
    alignItems: 'center',
    flex: 1,
  },
  chapterText: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressSection: {
    paddingVertical: 18,
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
  bookmarkControls: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  bookmarkStatus: {
    marginBottom: 15,
  },
  bookmarkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 10,
  },
  removeBookmarkButton: {
    padding: 8,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noBookmarkText: {
    fontSize: 14,
    opacity: 0.7,
    fontStyle: 'italic',
    marginLeft: 10,
  },
  bookmarkActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bookmarkActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  bookmarkActionText: {
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  fontControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  fontButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 20,
  },
  fontSizeText: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 50,
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
  },
  webViewLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navigationContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
  },
  pageIndicator: {
      alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  pageIndicatorText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  navButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navButton: {
      flexDirection: 'row',
      alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 120,
      justifyContent: 'center',
    },
  navButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  navButtonText: {
    color: '#fff',
      fontWeight: 'bold',
    fontSize: 14,
    marginHorizontal: 8,
  },
  loadingMoreIndicator: {
    marginTop: 10,
    alignItems: 'center',
  },
  loadingMoreText: {
    fontSize: 12,
    fontStyle: 'italic',
    },
    modalOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
  modalContent: {
      margin: 20,
    borderRadius: 15,
    padding: 24,
    alignItems: 'center',
      shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 280,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
      fontSize: 16,
      textAlign: 'center',
    marginBottom: 24,
      lineHeight: 22,
    },
    modalButtons: {
      flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    },
    modalButton: {
      flex: 1,
    paddingVertical: 12,
      paddingHorizontal: 20,
    borderRadius: 25,
    marginHorizontal: 6,
      alignItems: 'center',
    },
    cancelButton: {
    // backgroundColor will be set dynamically
    },
    confirmButton: {
    // backgroundColor will be set dynamically
    },
  modalButtonText: {
      fontSize: 16,
    fontWeight: '600',
    },
  });

export default SimpleEpubReader;