import { useThemeColors } from '@/hooks/use-theme-color';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { WebView } from 'react-native-webview';
import ExpoEpubParser from '../utils/ExpoEpubParser';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

const { width, height } = Dimensions.get('window');

interface ExpoEpubReaderProps {
  epubUri: string; // This can be a local file URI or a URL
  onClose: () => void;
}

const ExpoEpubReader: React.FC<ExpoEpubReaderProps> = ({ epubUri, onClose }) => {
  const [currentChapter, setCurrentChapter] = useState(0);
  const [chapterContent, setChapterContent] = useState('');
  const [bookData, setBookData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState(18);
  const colors = useThemeColors();
  const epubParser = new ExpoEpubParser();

  useEffect(() => {
    loadEpub();
    return () => {
      epubParser.cleanup();
    };
  }, []);

  useEffect(() => {
    if (bookData && bookData.chapters.length > 0) {
      loadChapter(currentChapter);
    }
  }, [currentChapter, bookData, fontSize]);

  const loadEpub = async () => {
    try {
      setLoading(true);
      
      // Check if book is cached first
      const isCached = await epubParser.isBookCached(epubUri);
      
      if (isCached) {
        console.log('Loading cached EPUB...');
        
        // Try to get cached metadata first
        const cachedMetadata = await epubParser.getCachedBookMetadata(epubUri);
        if (cachedMetadata) {
          setBookData(cachedMetadata);
          
          // Load saved reading position
          const savedPosition = await AsyncStorage.getItem(`reading_position_${epubUri}`);
          if (savedPosition) {
            setCurrentChapter(parseInt(savedPosition));
          }
          
          // Load saved font size
          const savedFontSize = await AsyncStorage.getItem('epub_font_size');
          if (savedFontSize) {
            setFontSize(parseInt(savedFontSize));
          }
          
          // Still need to extract files for reading
          await epubParser.extractEpub(epubUri);
          return;
        }
      } else {
        console.log('Downloading EPUB for the first time...');
      }
      
      // Extract EPUB (will use cache if available)
      await epubParser.extractEpub(epubUri);
      
      // Parse container.xml to find OPF file
      const opfPath = await epubParser.parseContainer();
      
      // Parse OPF file to get book structure (with caching)
      const bookInfo = await epubParser.parseOPF(opfPath, epubUri);
      
      setBookData(bookInfo);
      
      // Load saved reading position
      const savedPosition = await AsyncStorage.getItem(`reading_position_${epubUri}`);
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
      Alert.alert('Error', 'Failed to load EPUB file: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadChapter = async (chapterIndex: number) => {
    try {
      const chapterPath = bookData.basePath + bookData.chapters[chapterIndex];
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
      
      setChapterContent(content);
      
      // Save reading position
      await AsyncStorage.setItem(`reading_position_${epubUri}`, chapterIndex.toString());
      
    } catch (error) {
      console.error('Error loading chapter:', error);
      Alert.alert('Error', 'Failed to load chapter: ' + error.message);
    }
  };

  const nextChapter = () => {
    if (currentChapter < bookData.chapters.length - 1) {
      setCurrentChapter(currentChapter + 1);
    }
  };

  const prevChapter = () => {
    if (currentChapter > 0) {
      setCurrentChapter(currentChapter - 1);
    }
  };

  const adjustFontSize = async (newSize: number) => {
    setFontSize(newSize);
    await AsyncStorage.setItem('epub_font_size', newSize.toString());
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText style={styles.loadingText}>Opening Book...</ThemedText>
        <ThemedText variant="secondary" style={styles.loadingSubText}>Getting your book ready to read</ThemedText>
      </ThemedView>
    );
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
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={[styles.closeButtonText, { color: colors.text }]}>✕</Text>
        </TouchableOpacity>
        <View style={styles.bookInfo}>
          <ThemedText style={styles.title} numberOfLines={1}>{bookData.title}</ThemedText>
          <ThemedText variant="secondary" style={styles.author}>{bookData.author}</ThemedText>
        </View>
        <View style={styles.chapterInfo}>
          <ThemedText variant="secondary" style={styles.chapterText}>
            {currentChapter + 1}/{bookData.chapters.length}
          </ThemedText>
        </View>
      </View>

      {/* Font Size Controls */}
      <View style={[styles.fontControls, { backgroundColor: colors.surfaceSecondary, borderBottomColor: colors.border }]}>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  loadingSubText: {
    fontSize: 16,
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
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  bookInfo: {
    flex: 1,
    marginLeft: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  author: {
    fontSize: 14,
    marginTop: 2,
  },
  chapterInfo: {
    alignItems: 'flex-end',
  },
  chapterText: {
    fontSize: 13,
    fontWeight: '500',
  },
  fontControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
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
});

export default ExpoEpubReader;
