import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, PanResponder } from 'react-native';
import { BookmarkManager } from '../utils/BookmarkManager';
import SimpleEpubParser from '../utils/SimpleEpubParser';

export const useEpubReader = (epubUrl: string) => {
  // State
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
  const [isLoadingEpub, setIsLoadingEpub] = useState(false);

  const epubParser = useRef(new SimpleEpubParser());

  // Load a single chapter and cache it
  const loadSingleChapter = useCallback(async (chapterIndex: number) => {
    if (loadedChapters.has(chapterIndex) || chapterCache.has(chapterIndex)) {
      const cachedContent = chapterCache.get(chapterIndex);
      if (cachedContent) {
        setChapterContent(cachedContent);
      }
      return;
    }

    try {
      setContentLoading(true);
      if (!bookData || !bookData.chapters || bookData.chapters.length === 0) {
        console.log('⚠️ No book data available, skipping chapter load');
        return;
      }
      
      // Check if parser is ready
      if (!epubParser.current || !epubParser.current.isLoaded) {
        console.log('⚠️ EPUB parser not ready, waiting...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Try to reload if still not ready
        if (!epubParser.current.isLoaded) {
          console.log('🔄 Retrying EPUB load...');
          await epubParser.current.loadEpubFromUrl(epubUrl);
        }
      }
      
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
      
      console.log(`📖 Loading chapter ${chapterIndex} with fontSize: ${fontSize}px...`);
      let content = await epubParser.current.getChapterContent(
        chapterIndex, 
        fontSize, 
        bookmarkWordIndex
      );
      console.log(`📖 Chapter ${chapterIndex} loaded with fontSize: ${fontSize}px`);
      
      // Enhanced HTML wrapper for better display
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
                background-color: #fff8f0;
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
              
              body > *:first-child { margin-top: 0; }
              body > *:last-child { margin-bottom: 0; }
              
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
              const LONG_PRESS_DURATION = 500;
              const TOUCH_MOVE_THRESHOLD = 10;
              
              function handleTouchStart(e) {
                isLongPress = false;
                touchStartTime = Date.now();
                
                const touch = e.touches[0];
                touchStartX = touch.clientX;
                touchStartY = touch.clientY;
                
                removeHighlights();
                
                longPressTimer = setTimeout(() => {
                  isLongPress = true;
                  const word = getWordAtPosition(touchStartX, touchStartY);
                  if (word && word.length > 2) {
                    highlightWord(word);
                    
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'wordLongPress',
                      word: word.toLowerCase().replace(/[^a-zA-Z0-9]/g, ''),
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
                    
                    const word = extractWordAtOffset(text, offset);
                    if (word && word.length > 0) {
                      return word;
                    }
                  }
                } catch (error) {
                  console.log('caretRangeFromPoint failed:', error);
                }
                
                return getWordFromElementAtPoint(x, y);
              }
              
              function extractWordAtOffset(text, offset) {
                if (!text || offset < 0 || offset > text.length) {
                  return '';
                }
                
                const wordPattern = /[a-zA-Z0-9']+/g;
                let match;
                
                while ((match = wordPattern.exec(text)) !== null) {
                  const wordStart = match.index;
                  const wordEnd = match.index + match[0].length;
                  
                  if (offset >= wordStart && offset <= wordEnd) {
                    return match[0];
                  }
                }
                
                const words = text.split(/\\s+/);
                let currentPos = 0;
                
                for (let word of words) {
                  const wordStart = currentPos;
                  const wordEnd = currentPos + word.length;
                  
                  if (Math.abs(offset - wordStart) <= 3 || Math.abs(offset - wordEnd) <= 3) {
                    return word.replace(/[^a-zA-Z0-9']/g, '');
                  }
                  
                  currentPos = wordEnd + 1;
                }
                
                return '';
              }
              
              function getWordFromElementAtPoint(x, y) {
                const element = document.elementFromPoint(x, y);
                if (!element) return '';
                
                const textNodes = getTextNodesIn(element);
                
                let closestWord = '';
                let minDistance = Infinity;
                
                for (let textNode of textNodes) {
                  const range = document.createRange();
                  range.selectNode(textNode);
                  const rect = range.getBoundingClientRect();
                  
                  if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                    const text = textNode.textContent;
                    const words = text.match(/[a-zA-Z0-9']+/g) || [];
                    
                    const relativeX = x - rect.left;
                    const charWidth = rect.width / text.length;
                    const estimatedCharIndex = Math.floor(relativeX / charWidth);
                    
                    const word = extractWordAtOffset(text, estimatedCharIndex);
                    if (word) {
                      return word;
                    }
                  }
                  
                  const centerX = (rect.left + rect.right) / 2;
                  const centerY = (rect.top + rect.bottom) / 2;
                  const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
                  
                  if (distance < minDistance) {
                    minDistance = distance;
                    const words = textNode.textContent.match(/[a-zA-Z0-9']+/g) || [];
                    if (words.length > 0) {
                      closestWord = words[0];
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
                  
                  while ((match = wordRegex.exec(text)) !== null) {
                    const wordStart = match.index;
                    const wordEnd = match.index + match[0].length;
                    
                    if (offset >= wordStart && offset <= wordEnd) {
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
                      break;
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
              
              document.addEventListener('touchstart', handleTouchStart, { passive: true });
              document.addEventListener('touchmove', handleTouchMove, { passive: true });
              document.addEventListener('touchend', handleTouchEnd, { passive: true });
              
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
      
      setChapterCache(prev => new Map(prev).set(chapterIndex, content));
      setLoadedChapters(prev => new Set(prev).add(chapterIndex));
      
      if (chapterIndex === currentChapter) {
        setChapterContent(content);
      }
      
    } catch (error) {
      console.error(`Error loading chapter ${chapterIndex}:`, error);
      if ((error as Error).message.includes('EPUB data not loaded')) {
        console.log('🔄 EPUB data not loaded, attempting to reload...');
        try {
          await epubParser.current.loadEpubFromUrl(epubUrl);
          console.log('✅ EPUB reloaded successfully, retrying chapter load...');
          // Wait a bit and retry
          setTimeout(() => loadSingleChapter(chapterIndex), 1000);
        } catch (reloadError) {
          console.error('❌ Failed to reload EPUB:', reloadError);
          Alert.alert('Error', 'Failed to load EPUB data. Please try again.');
        }
      } else {
        console.error('❌ Chapter load failed:', error);
        Alert.alert('Error', `Failed to load chapter ${chapterIndex + 1}. Please try again.`);
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
    
    if (chapterCache.has(chapterIndex)) {
      setChapterContent(chapterCache.get(chapterIndex)!);
      return;
    }
    
    await loadSingleChapter(chapterIndex);
    
    if (loadedChapters.size > 0) {
      const maxLoadedChapter = Math.max(...Array.from(loadedChapters));
      if (chapterIndex >= maxLoadedChapter - 3) {
        await loadNextBatch();
      }
    }
  }, [bookData, chapterCache, loadedChapters, loadSingleChapter, loadNextBatch]);

  // Load initial batch of 10 chapters
  const loadInitialBatch = useCallback(async () => {
    if (!bookData || !bookData.chapters) return;
    
    const batchSize = 10;
    const chaptersToLoad = Math.min(batchSize, bookData.chapters.length);
    
    console.log(`Loading initial batch of ${chaptersToLoad} chapters...`);
    
    for (let i = 0; i < chaptersToLoad; i++) {
      await loadSingleChapter(i);
    }
    
    if (chapterCache.has(currentChapter)) {
      setChapterContent(chapterCache.get(currentChapter)!);
    }
  }, [bookData, currentChapter, chapterCache, loadSingleChapter]);

  const loadEpub = useCallback(async () => {
    if (isLoadingEpub || bookData) return; // Prevent multiple loads and reload if already loaded
    
    try {
      setIsLoadingEpub(true);
      setLoading(true);
      setContentLoading(true);
      console.log('Loading EPUB directly from URL...');
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await epubParser.current.loadEpubFromUrl(epubUrl);
      
      const bookInfo = await epubParser.current.getBookInfo();
      console.log('Book info loaded:', {
        title: bookInfo.title,
        author: bookInfo.author,
        totalChapters: bookInfo.chapters.length,
        firstChapter: bookInfo.chapters[0],
        chapters: bookInfo.chapters.slice(0, 5)
      });
      setBookData(bookInfo);
      
      setCurrentChapter(0);
      console.log('Starting from chapter 0 for consistent reading experience');
      
      const savedFontSize = await AsyncStorage.getItem('epub_font_size');
      if (savedFontSize) {
        setFontSize(parseInt(savedFontSize));
      }
      
      // Wait a bit for the parser to be fully ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (bookInfo && bookInfo.chapters.length > 0) {
        await loadSingleChapter(0);
      }
      
    } catch (error) {
      console.error('Error loading EPUB:', error);
      Alert.alert('Error', 'Failed to load EPUB file: ' + (error as Error).message);
    } finally {
      setIsLoadingEpub(false);
      setLoading(false);
      setContentLoading(false);
    }
  }, [epubUrl, isLoadingEpub, bookData]);

  // Navigation functions
  const nextChapter = async () => {
    if (currentChapter < bookData.chapters.length - 1) {
      const nextChapterIndex = currentChapter + 1;
      setCurrentChapter(nextChapterIndex);
      await loadSingleChapter(nextChapterIndex);
    }
  };

  const prevChapter = async () => {
    if (currentChapter > 0) {
      const prevChapterIndex = currentChapter - 1;
      setCurrentChapter(prevChapterIndex);
      await loadSingleChapter(prevChapterIndex);
    }
  };

  const adjustFontSize = async (newSize: number) => {
    console.log(`📝 adjustFontSize called: ${fontSize}px → ${newSize}px`);
    console.log(`📝 Current state - bookData: ${!!bookData}, loading: ${loading}, contentLoading: ${contentLoading}`);
    
    setFontSize(newSize);
    await AsyncStorage.setItem('epub_font_size', newSize.toString());
    
    console.log(`📝 Font size state updated to: ${newSize}px`);
    
    // Directly reload the current chapter with new font size
    if (bookData && bookData.chapters.length > 0 && !loading && !contentLoading) {
      console.log(`🔄 Directly reloading chapter ${currentChapter} with new font size ${newSize}px`);
      
      // Clear cache first
      setLoadedChapters(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentChapter);
        console.log(`🗑️ Cleared chapter ${currentChapter} from loaded chapters`);
        return newSet;
      });
      
      setChapterCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(currentChapter);
        console.log(`🗑️ Cleared chapter ${currentChapter} from cache`);
        return newCache;
      });
      
      // Wait a bit for state to update, then reload with new font size
      setTimeout(async () => {
        console.log(`🔄 Reloading chapter ${currentChapter} after state update with fontSize: ${newSize}px`);
        await loadSingleChapter(currentChapter);
      }, 100);
    }
  };

  const resetToBeginning = async () => {
    console.log('Resetting to beginning of book');
    setCurrentChapter(0);
    await AsyncStorage.removeItem(`reading_position_${epubUrl}`);
    if (bookData && bookData.chapters.length > 0) {
      await loadSingleChapter(0);
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'bookmarkSet':
          handleBookmarkSet(data.data);
          break;
        case 'requestNextChapter':
          if (currentChapter < bookData.chapters.length - 1) {
            loadSingleChapter(currentChapter + 1);
          }
          break;
        case 'requestPreviousChapter':
          if (currentChapter > 0) {
            loadSingleChapter(currentChapter - 1);
          }
          break;
        case 'bookmarkPosition':
          console.log('Current bookmark position:', data.data);
          break;
        case 'wordLongPress':
          console.log('Word long pressed:', data.word);
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.log('Error parsing WebView message:', error);
    }
  };

  const handleBookmarkSet = async (data: any) => {
    try {
      setBookmarkPosition(data.wordIndex);
      setBookmarkData(data);
      setHasBookmark(true);
      
      const success = await BookmarkManager.saveBookmark(
        bookData?.title || 'Unknown Book',
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

  const moveBookmarkNext = () => {
    // Implementation for moving bookmark to next word
  };

  const moveBookmarkPrevious = () => {
    // Implementation for moving bookmark to previous word
  };

  const removeCurrentBookmark = async () => {
    try {
      const success = await BookmarkManager.removeBookmark(
        bookData?.title || 'Unknown Book',
        currentChapter
      );
      
      if (success) {
        setBookmarkPosition(-1);
        setBookmarkData(null);
        setHasBookmark(false);
        console.log('🗑️ Bookmark removed');
      }
    } catch (error) {
      console.error('Error removing bookmark:', error);
    }
  };

  const goToChapter = async (targetChapter: number) => {
    if (targetChapter >= 0 && targetChapter < bookData.chapters.length && targetChapter !== currentChapter) {
      setCurrentChapter(targetChapter);
      await loadSingleChapter(targetChapter);
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
        const touchX = evt.nativeEvent.locationX;
        const progress = Math.max(0, Math.min(1, touchX / progressBarWidth));
        const targetChapter = Math.round(progress * (bookData.chapters.length - 1));
        
        console.log('Swipe - touchX:', touchX, 'progressBarWidth:', progressBarWidth, 'progress:', progress, 'targetChapter:', targetChapter, 'totalChapters:', bookData.chapters.length);
        
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
      setLastSwipeChapter(-1);
      
      if (pendingChapter !== -1 && pendingChapter !== currentChapter) {
        console.log('Loading chapter after swipe:', pendingChapter);
        setCurrentChapter(pendingChapter);
        goToChapter(pendingChapter);
      }
      setPendingChapter(-1);
      console.log('Progress bar released');
    },
  });

  // Cleanup function
  const cleanup = useCallback(() => {
    epubParser.current.cleanup();
  }, []);

  // Effect to reload current chapter when font size changes
  useEffect(() => {
    console.log(`🔍 Font size useEffect triggered with fontSize: ${fontSize}, bookData: ${!!bookData}, loading: ${loading}, contentLoading: ${contentLoading}`);
    
    if (bookData && bookData.chapters.length > 0 && !loading && !contentLoading && fontSize > 0) {
      console.log(`🔄 Font size changed to ${fontSize}px, reloading current chapter...`);
      
      // Clear cache first
      setLoadedChapters(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentChapter);
        console.log(`🗑️ Cleared chapter ${currentChapter} from loaded chapters`);
        return newSet;
      });
      
      setChapterCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(currentChapter);
        console.log(`🗑️ Cleared chapter ${currentChapter} from cache`);
        return newCache;
      });
      
      // Then reload
      console.log(`🔄 Calling loadSingleChapter(${currentChapter}) with fontSize: ${fontSize}`);
      loadSingleChapter(currentChapter);
    } else {
      console.log(`❌ Font size useEffect conditions not met`);
    }
  }, [fontSize]); // Only depend on fontSize

  return {
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
    isLoadingEpub,
    setIsLoadingEpub,
    
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
  };
};
