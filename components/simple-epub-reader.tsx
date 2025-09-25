import { useThemeColors } from '@/hooks/use-theme-color';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { WebView } from 'react-native-webview';
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
  
  const colors = useThemeColors();
  const epubParser = new SimpleEpubParser();
  const webViewRef = useRef<WebView>(null);
  const progressBarRef = useRef<View>(null);

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
      
      // Enhanced HTML wrapper for better display with custom long press
      content = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
            <meta charset="UTF-8">
            <style>
              html {
                height: 100%;
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
              }
              body {
                font-family: Georgia, 'Times New Roman', serif;
                font-size: ${fontSize}px;
                line-height: 1.6;
                margin: 20px;
                padding: 20px;
                color: #2c3e50;
                background-color: #fefefe;
                text-align: justify;
                user-select: none;
                -webkit-user-select: none;
                -webkit-touch-callout: none;
                min-height: 100vh;
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
              
              /* Word highlighting */
              .word-highlight {
                background-color: #ff9800;
                color: #000000;
                padding: 2px 4px;
                border-radius: 3px;
                font-weight: bold;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              }
            </style>
            <script>
              let longPressTimer;
              let isLongPress = false;
              let touchStartTime = 0;
              let touchStartX = 0;
              let touchStartY = 0;
              const LONG_PRESS_DURATION = 500; // milliseconds
              const TOUCH_MOVE_THRESHOLD = 10; // pixels
              
              function handleTouchStart(e) {
                // Don't prevent default - allow scrolling
                isLongPress = false;
                touchStartTime = Date.now();
                
                const touch = e.touches[0];
                touchStartX = touch.clientX;
                touchStartY = touch.clientY;
                
                // Clear any existing highlights
                removeHighlights();
                
                longPressTimer = setTimeout(() => {
                  isLongPress = true;
                  const word = getWordAtPosition(touchStartX, touchStartY);
                  if (word && word.length > 2) { // Only process words longer than 2 characters
                    highlightWord(word);
                    
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'wordLongPress',
                      word: word.toLowerCase().replace(/[^a-zA-Z0-9]/g, ''), // Clean the word
                      x: touchStartX,
                      y: touchStartY
                    }));
                  }
                }, LONG_PRESS_DURATION);
              }
              
              function handleTouchMove(e) {
                if (!longPressTimer) return;
                
                const touch = e.touches[0];
                const moveX = Math.abs(touch.clientX - touchStartX);
                const moveY = Math.abs(touch.clientY - touchStartY);
                
                // Cancel long press if user moves finger too much
                if (moveX > TOUCH_MOVE_THRESHOLD || moveY > TOUCH_MOVE_THRESHOLD) {
                  clearTimeout(longPressTimer);
                  longPressTimer = null;
                }
              }
              
              function handleTouchEnd(e) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
                
                if (isLongPress) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }
              
              function getWordAtPosition(x, y) {
                // Method 1: Use caretRangeFromPoint (most accurate)
                let range = null;
                
                try {
                  if (document.caretRangeFromPoint) {
                    range = document.caretRangeFromPoint(x, y);
                  } else if (document.caretPositionFromPoint) {
                    const position = document.caretPositionFromPoint(x, y);
                    if (position) {
                      range = document.createRange();
                      range.setStart(position.offsetNode, position.offset);
                      range.setEnd(position.offsetNode, position.offset);
                    }
                  }
                  
                  if (range && range.startContainer && range.startContainer.nodeType === Node.TEXT_NODE) {
                    const textNode = range.startContainer;
                    const offset = range.startOffset;
                    const text = textNode.textContent;
                    
                    // Find word boundaries around the offset
                    const word = extractWordAtOffset(text, offset);
                    if (word && word.length > 0) {
                      return word;
                    }
                  }
                } catch (error) {
                  console.log('caretRangeFromPoint failed:', error);
                }
                
                // Method 2: Fallback using elementFromPoint with improved logic
                return getWordFromElementAtPoint(x, y);
              }
              
              function extractWordAtOffset(text, offset) {
                // Handle edge cases
                if (!text || offset < 0 || offset > text.length) {
                  return '';
                }
                
                // Define word boundaries (letters, numbers, apostrophes for contractions)
                const wordPattern = /[a-zA-Z0-9']+/g;
                let match;
                
                // Find all words and their positions
                while ((match = wordPattern.exec(text)) !== null) {
                  const wordStart = match.index;
                  const wordEnd = match.index + match[0].length;
                  
                  // Check if offset falls within this word
                  if (offset >= wordStart && offset <= wordEnd) {
                    return match[0];
                  }
                }
                
                // If no word found at exact offset, find the closest word
                const words = text.split(/\\s+/);
                let currentPos = 0;
                
                for (let word of words) {
                  const wordStart = currentPos;
                  const wordEnd = currentPos + word.length;
                  
                  // If offset is close to this word, return it
                  if (Math.abs(offset - wordStart) <= 3 || Math.abs(offset - wordEnd) <= 3) {
                    return word.replace(/[^a-zA-Z0-9']/g, ''); // Clean punctuation
                  }
                  
                  currentPos = wordEnd + 1; // +1 for space
                }
                
                return '';
              }
              
              function getWordFromElementAtPoint(x, y) {
                const element = document.elementFromPoint(x, y);
                if (!element) return '';
                
                // Get all text nodes within the element
                const textNodes = getTextNodesIn(element);
                
                let closestWord = '';
                let minDistance = Infinity;
                
                for (let textNode of textNodes) {
                  const range = document.createRange();
                  range.selectNode(textNode);
                  const rect = range.getBoundingClientRect();
                  
                  // Check if the touch point is within this text node's area
                  if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                    const text = textNode.textContent;
                    const words = text.match(/[a-zA-Z0-9']+/g) || [];
                    
                    // Find the closest word based on horizontal position
                    const relativeX = x - rect.left;
                    const charWidth = rect.width / text.length;
                    const estimatedCharIndex = Math.floor(relativeX / charWidth);
                    
                    const word = extractWordAtOffset(text, estimatedCharIndex);
                    if (word) {
                      return word;
                    }
                  }
                  
                  // Calculate distance to this text node as fallback
                  const centerX = (rect.left + rect.right) / 2;
                  const centerY = (rect.top + rect.bottom) / 2;
                  const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
                  
                  if (distance < minDistance) {
                    minDistance = distance;
                    const words = textNode.textContent.match(/[a-zA-Z0-9']+/g) || [];
                    if (words.length > 0) {
                      closestWord = words[0]; // Take the first word as fallback
                    }
                  }
                }
                
                return closestWord;
              }
              
              function getTextNodesIn(element) {
                const textNodes = [];
                const walker = document.createTreeWalker(
                  element,
                  NodeFilter.SHOW_TEXT,
                  {
                    acceptNode: function(node) {
                      // Only accept text nodes with actual content
                      if (node.textContent.trim().length > 0) {
                        return NodeFilter.FILTER_ACCEPT;
                      }
                      return NodeFilter.FILTER_REJECT;
                    }
                  },
                  false
                );
                
                let node;
                while (node = walker.nextNode()) {
                  textNodes.push(node);
                }
                
                return textNodes;
              }
              
              function highlightWord(word) {
                if (!word || word.length === 0) return;
                
                removeHighlights();
                
                // Find the specific word at the touch position
                const range = document.createRange();
                let textNode = null;
                let offset = 0;
                
                try {
                  if (document.caretRangeFromPoint) {
                    range.setStart(document.caretRangeFromPoint(touchStartX, touchStartY).startContainer, document.caretRangeFromPoint(touchStartX, touchStartY).startOffset);
                    range.setEnd(document.caretRangeFromPoint(touchStartX, touchStartY).startContainer, document.caretRangeFromPoint(touchStartX, touchStartY).startOffset);
                  } else if (document.caretPositionFromPoint) {
                    const position = document.caretPositionFromPoint(touchStartX, touchStartY);
                    if (position) {
                      range.setStart(position.offsetNode, position.offset);
                      range.setEnd(position.offsetNode, position.offset);
                    }
                  }
                  
                  if (range.startContainer && range.startContainer.nodeType === Node.TEXT_NODE) {
                    textNode = range.startContainer;
                    offset = range.startOffset;
                  }
                } catch (error) {
                  console.log('Error getting range:', error);
                }
                
                if (textNode) {
                  const text = textNode.textContent;
                  const wordRegex = new RegExp(word, 'gi');
                  let match;
                  
                  // Find all occurrences of the word in this text node
                  while ((match = wordRegex.exec(text)) !== null) {
                    const wordStart = match.index;
                    const wordEnd = match.index + match[0].length;
                    
                    // Check if the touch offset falls within this word
                    if (offset >= wordStart && offset <= wordEnd) {
                      // Highlight only this specific occurrence
                      const beforeWord = text.substring(0, wordStart);
                      const wordText = text.substring(wordStart, wordEnd);
                      const afterWord = text.substring(wordEnd);
                      
                      const highlightedText = beforeWord + '<span class="word-highlight">' + wordText + '</span>' + afterWord;
                      
                      if (highlightedText !== text) {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = highlightedText;
                        
                        const fragment = document.createDocumentFragment();
                        while (tempDiv.firstChild) {
                          fragment.appendChild(tempDiv.firstChild);
                        }
                        
                        textNode.parentNode.replaceChild(fragment, textNode);
                      }
                      break; // Only highlight the first matching word at this position
                    }
                  }
                }
              }
              
              function removeHighlights() {
                const highlights = document.querySelectorAll('.word-highlight');
                highlights.forEach(highlight => {
                  const parent = highlight.parentNode;
                  parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
                  parent.normalize();
                });
              }
              
              // Listen for messages from React Native
              window.addEventListener('message', function(event) {
                try {
                  const data = JSON.parse(event.data);
                  if (data.type === 'removeHighlights') {
                    removeHighlights();
                  }
                } catch (error) {
                  console.log('Error parsing message:', error);
                }
              });
              
              // Attach event listeners - use passive for scrolling
              document.addEventListener('touchstart', handleTouchStart, { passive: true });
              document.addEventListener('touchmove', handleTouchMove, { passive: true });
              document.addEventListener('touchend', handleTouchEnd, { passive: true });
              
              // Prevent context menu on long press
              document.addEventListener('contextmenu', function(e) {
                e.preventDefault();
              });
              
            </script>
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

  // Progress bar swipe functionality
  const goToChapter = async (targetChapter: number) => {
    if (targetChapter >= 0 && targetChapter < bookData.chapters.length && targetChapter !== currentChapter) {
      setCurrentChapter(targetChapter);
      await loadSingleChapter(targetChapter);
      AsyncStorage.setItem(`reading_position_${epubUrl}`, targetChapter.toString());
    }
  };

  const calculateChapterFromSwipe = (translationX: number) => {
    if (progressBarWidth === 0) return currentChapter;
    
    // Calculate progress based on where the user is swiping on the progress bar
    // translationX is the distance from the start of the swipe
    const progress = Math.max(0, Math.min(1, translationX / progressBarWidth));
    const targetChapter = Math.round(progress * (bookData.chapters.length - 1));
    return Math.max(0, Math.min(bookData.chapters.length - 1, targetChapter));
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
            <ThemedText variant="secondary" style={styles.chapterText}>
              {currentChapter + 1}/{bookData.chapters.length}
            </ThemedText>
          </View>
        </View>

        {/* Progress Bar at Top */}
        <View style={[styles.progressSection, { backgroundColor: colors.surfaceSecondary, borderBottomColor: colors.border }]}>
          <View style={styles.progressContainer}>
            {/* Swipeable Progress Bar */}
            <View 
              ref={progressBarRef}
              style={[styles.progressBar, { backgroundColor: colors.surfaceSecondary }]}
            onLayout={(event) => {
              const { width } = event.nativeEvent.layout;
              setProgressBarWidth(width);
              console.log('Progress bar width set to:', width);
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
                  <ThemedText style={[styles.progressIndicatorText, { color: '#fff' }]}>
                    {displayChapter + 1}
                  </ThemedText>
                </View>
              )}
            </View>
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
            renderLoading={() => (
              <View style={styles.webViewLoading}>
                <ThemedText>Loading chapter...</ThemedText>
              </View>
            )}
          />
          
          {/* In-page loader for content loading */}
          {contentLoading && (
            <InPageLoader message="Loading page..." />
          )}
        </View>

         {/* Navigation - Larger Bottom Bar */}
         <View style={[styles.navigationContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          {/* Page Number at Top */}
          <View style={[styles.pageIndicator, { backgroundColor: colors.surfaceSecondary, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16 }]}>
            <ThemedText style={[styles.pageIndicatorText, { color: colors.text }]}>
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
          
          {isLoadingMore && (
            <View style={styles.loadingMoreIndicator}>
              <ThemedText variant="secondary" style={styles.loadingMoreText}>
                Loading more chapters...
              </ThemedText>
            </View>
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
  contentContainer: {
    flex: 1,
    position: 'relative',
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    minHeight: 75,
  },
  progressSection: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  navButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  navButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    minWidth: 100,
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
  },
  pageIndicator: {
    alignItems: 'center',
    marginBottom: 8,
    alignSelf: 'center',
  },
  pageIndicatorText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
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
