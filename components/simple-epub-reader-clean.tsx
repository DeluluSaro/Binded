import { useThemeColors } from '@/hooks/use-theme-color';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
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
  const [contentLoading, setContentLoading] = useState(true);
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
  
  const colors = useThemeColors();
  const epubParser = useRef(new SimpleEpubParser());
  const webViewRef = useRef<WebView>(null);
  const progressBarRef = useRef<View>(null);

  // Load a single chapter and cache it
  const loadSingleChapter = useCallback(async (chapterIndex: number) => {
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
        bookData?.title || 'Unknown Book', 
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
      
      // Generate enhanced chapter content with bookmark
      let content = await epubParser.current.getChapterContent(
        chapterIndex, 
        fontSize, 
        bookmarkWordIndex
      );
      
      // Cache the content
      setChapterCache(prev => new Map(prev.set(chapterIndex, content)));
      setLoadedChapters(prev => new Set(prev.add(chapterIndex)));
      
      // Set content if this is the current chapter
      if (chapterIndex === currentChapter) {
        setChapterContent(content);
      }
      
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
  }, [bookData, chapterCache, loadedChapters, currentChapter, fontSize, epubUrl]);

  // Load next batch of chapters
  const loadNextBatch = useCallback(async () => {
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
  }, [isLoadingMore, loadedChapters, bookData, loadSingleChapter]);

  // Load batch of chapters around current chapter
  const loadChapterBatch = useCallback(async (chapterIndex: number) => {
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
  }, [bookData, chapterCache, loadedChapters, isLoadingMore, loadSingleChapter, loadNextBatch]);

  // Load initial batch of 10 chapters
  const loadInitialBatch = useCallback(async () => {
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
  }, [bookData, currentChapter, chapterCache, loadSingleChapter]);

  const loadEpub = useCallback(async () => {
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
      console.log('Book info loaded:', {
        title: bookInfo.title,
        author: bookInfo.author,
        totalChapters: bookInfo.chapters.length,
        firstChapter: bookInfo.chapters[0],
        chapters: bookInfo.chapters.slice(0, 5) // Show first 5 chapters
      });
      setBookData(bookInfo);
      
      // Always start from chapter 0 for consistency
      setCurrentChapter(0);
      console.log('Starting from chapter 0 for consistent reading experience');
      
      // Load saved font size
      const savedFontSize = await AsyncStorage.getItem('epub_font_size');
      if (savedFontSize) {
        setFontSize(parseInt(savedFontSize));
      }
      
      // Load the first chapter content immediately
      if (bookInfo && bookInfo.chapters.length > 0) {
        await loadSingleChapter(0);
      }
      
    } catch (error) {
      console.error('Error loading EPUB:', error);
      Alert.alert('Error', 'Failed to load EPUB file: ' + (error as Error).message);
    } finally {
      setLoading(false);
      setContentLoading(false);
    }
  }, [epubUrl, loadSingleChapter]);

  useEffect(() => {
    const parser = epubParser.current;
    loadEpub();
    return () => {
      parser.cleanup();
    };
  }, [loadEpub]);

  useEffect(() => {
    if (bookData && bookData.chapters.length > 0 && !loading) {
      loadChapterBatch(currentChapter);
    }
  }, [currentChapter, bookData, fontSize, loading, loadChapterBatch]);

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
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.chapterInfo}>
          <ThemedText style={[styles.chapterText, { color: colors.text }]}>
            Chapter {displayChapter + 1}
          </ThemedText>
        </View>
        
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={[styles.closeButtonText, { color: colors.text }]}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Font Controls */}
      <View style={[styles.fontControls, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.fontControlsCenter}>
          <TouchableOpacity 
            style={[styles.fontButton, { backgroundColor: colors.tint }]} 
            onPress={() => setFontSize(Math.max(12, fontSize - 2))}
          >
            <Text style={styles.fontButtonText}>A-</Text>
          </TouchableOpacity>
          
          <ThemedText style={[styles.fontSizeText, { color: colors.text }]}>
            {fontSize}px
          </ThemedText>
          
          <TouchableOpacity 
            style={[styles.fontButton, { backgroundColor: colors.tint }]} 
            onPress={() => setFontSize(Math.min(32, fontSize + 2))}
          >
            <Text style={styles.fontButtonText}>A+</Text>
          </TouchableOpacity>
          
          {/* Go to Beginning Button */}
          <TouchableOpacity 
            style={[styles.fontButton, { 
              backgroundColor: colors.tint,
              marginLeft: 10
            }]} 
            onPress={() => setCurrentChapter(0)}
          >
            <Text style={styles.fontButtonText}>🏠</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {contentLoading ? (
          <View style={styles.webViewLoading}>
            <InPageLoader />
          </View>
        ) : (
          <WebView
            ref={webViewRef}
            source={{ html: chapterContent }}
            style={styles.webView}
            onMessage={(event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);
                console.log('WebView message:', data);
                
                switch (data.type) {
                  case 'bookmarkSet':
                    // Handle bookmark setting
                    console.log('Bookmark set:', data.data);
                    break;
                  case 'requestNextChapter':
                    if (currentChapter < bookData.chapters.length - 1) {
                      setCurrentChapter(currentChapter + 1);
                    }
                    break;
                  case 'requestPreviousChapter':
                    if (currentChapter > 0) {
                      setCurrentChapter(currentChapter - 1);
                    }
                    break;
                }
              } catch (error) {
                console.error('Error parsing WebView message:', error);
              }
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            scalesPageToFit={true}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
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
  contentContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: '#fff8f0',
  },
  webViewLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SimpleEpubReader;
