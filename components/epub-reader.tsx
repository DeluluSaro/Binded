import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EpubParser from '../utils/EpubParser';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { useThemeColors } from '@/hooks/use-theme-color';

const { width, height } = Dimensions.get('window');

interface EpubReaderProps {
  epubPath: string;
  onClose: () => void;
}

const EpubReader: React.FC<EpubReaderProps> = ({ epubPath, onClose }) => {
  const [currentChapter, setCurrentChapter] = useState(0);
  const [chapterContent, setChapterContent] = useState('');
  const [bookData, setBookData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [webViewHeight, setWebViewHeight] = useState(height);
  const colors = useThemeColors();
  const epubParser = new EpubParser();

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
  }, [currentChapter, bookData]);

  const loadEpub = async () => {
    try {
      setLoading(true);
      
      // Extract EPUB
      await epubParser.extractEpub(epubPath);
      
      // Parse container.xml to find OPF file
      const opfPath = await epubParser.parseContainer();
      
      // Parse OPF file to get book structure
      const bookInfo = await epubParser.parseOPF(opfPath);
      
      setBookData(bookInfo);
      
      // Load saved reading position
      const savedPosition = await AsyncStorage.getItem(`reading_position_${epubPath}`);
      if (savedPosition) {
        setCurrentChapter(parseInt(savedPosition));
      }
      
    } catch (error) {
      console.error('Error loading EPUB:', error);
      Alert.alert('Error', 'Failed to load EPUB file');
    } finally {
      setLoading(false);
    }
  };

  const loadChapter = async (chapterIndex: number) => {
    try {
      const chapterPath = bookData.basePath + bookData.chapters[chapterIndex];
      let content = await epubParser.getChapterContent(chapterPath);
      
      // Basic HTML wrapper for better display
      content = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: Georgia, serif;
                font-size: 18px;
                line-height: 1.6;
                margin: 20px;
                color: #333;
                background-color: #fff;
              }
              p { margin-bottom: 1em; }
              h1, h2, h3 { 
                color: #2c3e50;
                margin-top: 1.5em;
              }
              img { max-width: 100%; height: auto; }
            </style>
          </head>
          <body>
            ${content}
            <script>
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'contentHeight',
                height: document.body.scrollHeight
              }));
            </script>
          </body>
        </html>
      `;
      
      setChapterContent(content);
      
      // Save reading position
      await AsyncStorage.setItem(`reading_position_${epubPath}`, chapterIndex.toString());
      
    } catch (error) {
      console.error('Error loading chapter:', error);
      Alert.alert('Error', 'Failed to load chapter');
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

  const onWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'contentHeight') {
        setWebViewHeight(Math.min(data.height, height * 0.8));
      }
    } catch (error) {
      console.log('WebView message error:', error);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Loading EPUB...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={[styles.closeButtonText, { color: colors.text }]}>✕</Text>
        </TouchableOpacity>
        <View style={styles.bookInfo}>
          <ThemedText style={styles.title} numberOfLines={1}>{bookData?.title}</ThemedText>
          <ThemedText variant="secondary" style={styles.author}>{bookData?.author}</ThemedText>
        </View>
        <View style={styles.chapterInfo}>
          <ThemedText variant="secondary" style={styles.chapterText}>
            {currentChapter + 1} / {bookData?.chapters.length}
          </ThemedText>
        </View>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        <WebView
          source={{ html: chapterContent }}
          style={[styles.webView, { height: webViewHeight }]}
          onMessage={onWebViewMessage}
          showsVerticalScrollIndicator={false}
          bounces={false}
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
        
        <TouchableOpacity
          style={[
            styles.navButton, 
            { backgroundColor: colors.tint },
            currentChapter === bookData?.chapters.length - 1 && styles.navButtonDisabled
          ]}
          onPress={nextChapter}
          disabled={currentChapter === bookData?.chapters.length - 1}
        >
          <Text style={[
            styles.navButtonText, 
            currentChapter === bookData?.chapters.length - 1 && styles.navButtonTextDisabled
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
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
    fontSize: 12,
  },
  contentContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
  },
  navButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  navButtonDisabled: {
    backgroundColor: '#ccc',
  },
  navButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  navButtonTextDisabled: {
    color: '#999',
  },
});

export default EpubReader;
