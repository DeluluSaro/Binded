import { useThemeColors } from '@/hooks/use-theme-color';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { WebView } from 'react-native-webview';
import SimpleEpubParser from '../utils/SimpleEpubParser';
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
  const colors = useThemeColors();
  const epubParser = new SimpleEpubParser();
  

  useEffect(() => {
    loadEpub();
    return () => {
      epubParser.cleanup();
    };
  }, []);


  useEffect(() => {
    if (bookData && bookData.chapters.length > 0 && !loading) {
      loadChapterBatch(currentChapter);
    }
  }, [currentChapter, bookData, fontSize, loading]);

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
      await epubParser.loadEpubFromUrl(epubUrl);
      
      // Get book information
      const bookInfo = await epubParser.getBookInfo();
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
      
      const chapterPath = bookData.basePath + bookData.chapters[chapterIndex];
      console.log(`Loading chapter ${chapterIndex}:`, chapterPath);
      
      // Check if EPUB data is still available
      if (!epubParser.isLoaded) {
        console.log('EPUB data lost, reloading...');
        await epubParser.loadEpubFromUrl(epubUrl);
      }
      
      let content = await epubParser.getChapterContent(chapterPath);
      
      // Enhanced HTML wrapper for better display
      content = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta charset="UTF-8">
            <style>
              body {
                font-family: Georgia, 'Times New Roman', serif;
                font-size: ${fontSize}px;
                line-height: 1.6;
                margin: 20px;
                padding: 0;
                color: #2c3e50;
                background-color: #fefefe;
                text-align: justify;
              }
              p { 
                margin-bottom: 1.2em; 
                text-indent: 1.5em;
              }
              h1, h2, h3, h4, h5, h6 { 
                color: #34495e;
                margin-top: 2em;
                margin-bottom: 1em;
                text-align: left;
                line-height: 1.3;
              }
              h1 { font-size: 1.8em; }
              h2 { font-size: 1.5em; }
              h3 { font-size: 1.3em; }
              
              img { 
                max-width: 100%; 
                height: auto; 
                display: block;
                margin: 1em auto;
              }
              
              blockquote {
                border-left: 4px solid #bdc3c7;
                margin: 1.5em 0;
                padding-left: 1em;
                font-style: italic;
                color: #7f8c8d;
              }
              
              .chapter-title {
                font-size: 1.5em;
                font-weight: bold;
                margin-bottom: 1em;
                text-align: center;
                color: #2980b9;
              }
              
              /* Remove default margins from first and last elements */
              body > *:first-child { margin-top: 0; }
              body > *:last-child { margin-bottom: 0; }
            </style>
          </head>
          <body>
            ${content}
          </body>
        </html>
      `;
      
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
          await epubParser.loadEpubFromUrl(epubUrl);
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
  };

  if (loading || contentLoading) {
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
          <ThemedText variant="secondary" style={styles.chapterText}>
            {currentChapter + 1}/{bookData.chapters.length}
          </ThemedText>
        </View>
      </View>

      {/* Font Size Controls */}
      <View style={[styles.fontControls, { backgroundColor: colors.surfaceSecondary, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.fontControlsCenter}>
          <TouchableOpacity 
            style={[styles.fontButton, { backgroundColor: colors.tint }]} 
            onPress={() => adjustFontSize(Math.max(12, fontSize - 2))}
          >
            <Text style={styles.fontButtonText}>A-</Text>
          </TouchableOpacity>
          <ThemedText style={styles.fontSizeText}>{fontSize}px</ThemedText>
          <TouchableOpacity 
            style={[styles.fontButton, { backgroundColor: colors.tint }]} 
            onPress={() => adjustFontSize(Math.min(24, fontSize + 2))}
          >
            <Text style={styles.fontButtonText}>A+</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={[styles.closeButtonText, { color: colors.text }]}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        <WebView
          source={{ html: chapterContent }}
          style={styles.webView}
          showsVerticalScrollIndicator={true}
          bounces={true}
          scalesPageToFit={false}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.webViewLoading}>
              <ThemedText>Loading chapter...</ThemedText>
            </View>
          )}
        />
      </View>

      {/* Navigation */}
      <View style={[styles.navigationContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.navButton, 
            { backgroundColor: colors.tint },
            currentChapter === 0 && styles.navButtonDisabled
          ]}
          onPress={prevChapter}
          disabled={currentChapter === 0}
        >
          <Text style={[
            styles.navButtonText, 
            currentChapter === 0 && styles.navButtonTextDisabled
          ]}>
            ← Previous
          </Text>
        </TouchableOpacity>
        
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: colors.surfaceSecondary }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${((currentChapter + 1) / bookData.chapters.length) * 100}%`,
                  backgroundColor: colors.tint
                }
              ]} 
            />
          </View>
          {isLoadingMore && (
            <View style={styles.loadingMoreIndicator}>
              <ThemedText variant="secondary" style={styles.loadingMoreText}>
                Loading more chapters...
              </ThemedText>
            </View>
          )}
        </View>
        
        <TouchableOpacity
          style={[
            styles.navButton, 
            { backgroundColor: colors.tint },
            currentChapter === bookData.chapters.length - 1 && styles.navButtonDisabled
          ]}
          onPress={nextChapter}
          disabled={currentChapter === bookData.chapters.length - 1}
        >
          <Text style={[
            styles.navButtonText, 
            currentChapter === bookData.chapters.length - 1 && styles.navButtonTextDisabled
          ]}>
            Next →
          </Text>
        </TouchableOpacity>
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
    borderRadius: 5,
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
    borderRadius: 20,
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
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  backButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  fontButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
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
  },
  webView: {
    flex: 1,
    backgroundColor: '#fefefe',
  },
  webViewLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
  },
  navButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  navButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  navButtonTextDisabled: {
    color: '#95a5a6',
  },
  progressContainer: {
    flex: 1,
    marginHorizontal: 20,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  loadingMoreIndicator: {
    marginTop: 8,
    alignItems: 'center',
  },
  loadingMoreText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});

export default SimpleEpubReader;
