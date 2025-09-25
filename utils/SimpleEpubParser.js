import JSZip from 'jszip';

class SimpleEpubParser {
  constructor() {
    this.epubData = null;
    this.chapterCache = new Map();
  }

  // Getter for epubData to check if it's loaded
  get isLoaded() {
    return this.epubData !== null;
  }

  // Download and parse EPUB directly from URL
  async loadEpubFromUrl(epubUrl) {
    try {
      console.log('Loading EPUB directly from URL:', epubUrl);
      
      // Fetch the EPUB file
      const response = await fetch(epubUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch EPUB: ${response.status}`);
      }
      
      // Get the file as array buffer
      const arrayBuffer = await response.arrayBuffer();
      
      // Load with JSZip
      const zip = new JSZip();
      this.epubData = await zip.loadAsync(arrayBuffer);
      
      console.log('EPUB loaded successfully');
      return true;
    } catch (error) {
      console.error('Error loading EPUB from URL:', error);
      throw error;
    }
  }

  // Alias for loadEpubFromUrl for compatibility
  async loadEpub(epubUrl) {
    return this.loadEpubFromUrl(epubUrl);
  }

  // Get book metadata
  async getBookMetadata() {
    return this.getBookInfo();
  }

  // Parse container.xml to get OPF path
  async getOPFPath() {
    try {
      if (!this.epubData) {
        throw new Error('EPUB data not loaded. Please load the EPUB first.');
      }
      
      const containerFile = this.epubData.file('META-INF/container.xml');
      if (!containerFile) {
        throw new Error('container.xml not found');
      }
      
      const containerContent = await containerFile.async('string');
      
      // Simple regex to extract OPF path
      const opfMatch = containerContent.match(/<rootfile[^>]*full-path="([^"]*)"[^>]*>/);
      if (!opfMatch) {
        throw new Error('OPF path not found in container.xml');
      }
      
      return opfMatch[1];
    } catch (error) {
      console.error('Error parsing container.xml:', error);
      throw error;
    }
  }

  // Parse OPF file to get book metadata and chapters
  async getBookInfo() {
    try {
      if (!this.epubData) {
        throw new Error('EPUB data not loaded. Please load the EPUB first.');
      }
      
      const opfPath = await this.getOPFPath();
      const opfFile = this.epubData.file(opfPath);
      
      if (!opfFile) {
        throw new Error('OPF file not found');
      }
      
      const opfContent = await opfFile.async('string');
      
      // Extract title
      const titleMatch = opfContent.match(/<dc:title[^>]*>([^<]*)<\/dc:title>/);
      const title = titleMatch ? titleMatch[1] : 'Unknown Title';
      
      // Extract author
      const authorMatch = opfContent.match(/<dc:creator[^>]*>([^<]*)<\/dc:creator>/);
      const author = authorMatch ? authorMatch[1] : 'Unknown Author';
      
      // Extract manifest items
      const manifestItems = {};
      const manifestRegex = /<item[^>]*id="([^"]*)"[^>]*href="([^"]*)"[^>]*\/>/g;
      let manifestMatch;
      while ((manifestMatch = manifestRegex.exec(opfContent)) !== null) {
        manifestItems[manifestMatch[1]] = manifestMatch[2];
      }
      
      // Extract spine (chapter order)
      const chapters = [];
      const spineRegex = /<itemref[^>]*idref="([^"]*)"[^>]*\/>/g;
      let spineMatch;
      while ((spineMatch = spineRegex.exec(opfContent)) !== null) {
        const idref = spineMatch[1];
        const href = manifestItems[idref];
        if (href) {
          chapters.push(href);
        }
      }
      
      // Get base path (directory of OPF file)
      const basePath = opfPath.substring(0, opfPath.lastIndexOf('/') + 1);
      
      return {
        title,
        author,
        chapters,
        basePath
      };
    } catch (error) {
      console.error('Error parsing OPF:', error);
      throw error;
    }
  }

  // Word wrapping function for HTML content
  wrapWordsInSpans(htmlContent) {
    // Remove any existing word spans
    htmlContent = htmlContent.replace(/<span class="word"[^>]*>(.*?)<\/span>/g, '$1');
    
    // First, clean up the content to ensure we only wrap actual text
    let cleanContent = htmlContent;
    
    // Remove empty tags and normalize whitespace
    cleanContent = cleanContent.replace(/<[^>]*>\s*<\/[^>]*>/g, '');
    cleanContent = cleanContent.replace(/\s+/g, ' ');
    
    // Wrap individual words in spans, but only for actual text content
    // This regex matches words that are at least 3 characters and contain letters
    return cleanContent.replace(
      /\b([a-zA-Z][a-zA-Z0-9']{2,})\b/g, 
      '<span class="word">$1</span>'
    );
  }

  // Enhanced HTML generation with bookmark support
  generateEnhancedHTML(content, fontSize, bookmarkPosition = -1, chapterIndex = 0) {
    // First, wrap words in spans for individual targeting
    const wrappedContent = this.wrapWordsInSpans(content);
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Outfit-Regular', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              font-size: ${fontSize}px;
              line-height: 1.7;
              margin: 20px;
              padding: 0;
              color: #2c3e50;
              background-color: #fefefe;
              text-align: justify;
              position: relative;
              user-select: none;
              -webkit-user-select: none;
              -webkit-touch-callout: none;
            }
            
            /* Word styling */
            .word-wrapper {
              display: inline;
              position: relative;
            }
            
            .word {
              display: inline;
              padding: 1px 2px;
              border-radius: 3px;
              cursor: pointer;
              transition: all 0.2s ease;
              position: relative;
            }
            
            .word:hover {
              background-color: rgba(255, 165, 0, 0.1);
              transform: scale(1.02);
            }
            
            /* Bookmark highlight */
            .bookmark-active {
              background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%) !important;
              color: #2c3e50 !important;
              font-weight: bold;
              box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
              border: 2px solid #FF8C00;
              padding: 3px 6px !important;
              margin: 0 2px;
              border-radius: 8px;
              transform: scale(1.05);
              z-index: 10;
              position: relative;
            }
            
            /* Floating bookmark indicator */
            .bookmark-indicator {
              position: absolute;
              top: -15px;
              left: 50%;
              transform: translateX(-50%);
              width: 0;
              height: 0;
              border-left: 6px solid transparent;
              border-right: 6px solid transparent;
              border-bottom: 10px solid #FFD700;
              z-index: 20;
              animation: bookmarkPulse 2s infinite;
            }
            
            @keyframes bookmarkPulse {
              0%, 100% { opacity: 1; transform: translateX(-50%) scale(1); }
              50% { opacity: 0.7; transform: translateX(-50%) scale(1.1); }
            }
            
            /* Drag indicator */
            .drag-indicator {
              position: fixed;
              top: 10px;
              left: 50%;
              transform: translateX(-50%);
              background: rgba(0, 0, 0, 0.8);
              color: white;
              padding: 8px 16px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: bold;
              z-index: 1000;
              display: none;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            }
            
            /* Enhanced typography */
            h1, h2, h3, h4, h5, h6 {
              font-family: 'Outfit-Bold', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              color: #2c3e50;
              margin: 24px 0 16px 0;
              font-weight: bold;
              line-height: 1.3;
            }
            
            h1 { font-size: 1.8em; }
            h2 { font-size: 1.5em; }
            h3 { font-size: 1.3em; }
            
            p {
              margin: 16px 0;
              text-indent: 1.5em;
              line-height: 1.7;
            }
            
            img {
              max-width: 100%;
              height: auto;
              display: block;
              margin: 16px auto;
              border-radius: 8px;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            
            /* Smooth scrolling */
            html {
              scroll-behavior: smooth;
            }
          </style>
        </head>
        <body>
          <div class="drag-indicator" id="dragIndicator">
            📖 Drag to move bookmark
          </div>
          
          <div id="content">${wrappedContent}</div>
          
          <script>
            let currentBookmarkWordIndex = ${bookmarkPosition};
            let currentChapterIndex = ${chapterIndex};
            let isDragging = false;
            let words = [];
            let dragStarted = false;
            
            // Initialize word tracking system
            function initializeWordTracking() {
              words = Array.from(document.querySelectorAll('.word'));
              console.log('📚 Total words found:', words.length);
              
              // Add interaction listeners to each word
              words.forEach((word, index) => {
                // Click to set bookmark
                word.addEventListener('click', (e) => {
                  e.preventDefault();
                  setBookmark(index);
                });
                
                // Touch events for mobile
                word.addEventListener('touchstart', handleTouchStart, { passive: false });
                word.addEventListener('touchmove', handleTouchMove, { passive: false });
                word.addEventListener('touchend', handleTouchEnd, { passive: false });
                
                // Mouse events for desktop
                word.addEventListener('mousedown', handleMouseDown);
                word.addEventListener('mouseover', handleMouseOver);
              });
              
              // Global touch/mouse end events
              document.addEventListener('touchend', handleGlobalTouchEnd);
              document.addEventListener('mouseup', handleGlobalMouseUp);
              document.addEventListener('mousemove', handleGlobalMouseMove);
              
              // Restore bookmark if exists
              if (currentBookmarkWordIndex >= 0 && currentBookmarkWordIndex < words.length) {
                setBookmark(currentBookmarkWordIndex, false);
              }
            }
            
            // Touch event handlers
            function handleTouchStart(e) {
              const wordIndex = words.indexOf(e.target);
              if (wordIndex === currentBookmarkWordIndex) {
                isDragging = true;
                dragStarted = true;
                showDragIndicator();
                e.preventDefault();
              }
            }
            
            function handleTouchMove(e) {
              if (!isDragging) return;
              e.preventDefault();
              
              const touch = e.touches[0];
              const elementAtPoint = document.elementFromPoint(touch.clientX, touch.clientY);
              
              if (elementAtPoint && elementAtPoint.classList.contains('word')) {
                const newWordIndex = words.indexOf(elementAtPoint);
                if (newWordIndex !== -1 && newWordIndex !== currentBookmarkWordIndex) {
                  setBookmark(newWordIndex, false);
                }
              }
            }
            
            function handleTouchEnd(e) {
              if (isDragging && dragStarted) {
                finalizeDrag();
              }
            }
            
            // Mouse event handlers
            function handleMouseDown(e) {
              const wordIndex = words.indexOf(e.target);
              if (wordIndex === currentBookmarkWordIndex) {
                isDragging = true;
                dragStarted = true;
                showDragIndicator();
                e.preventDefault();
              }
            }
            
            function handleMouseOver(e) {
              if (isDragging && dragStarted) {
                const wordIndex = words.indexOf(e.target);
                if (wordIndex !== -1 && wordIndex !== currentBookmarkWordIndex) {
                  setBookmark(wordIndex, false);
                }
              }
            }
            
            function handleGlobalTouchEnd(e) {
              if (isDragging && dragStarted) {
                finalizeDrag();
              }
            }
            
            function handleGlobalMouseUp(e) {
              if (isDragging && dragStarted) {
                finalizeDrag();
              }
            }
            
            function handleGlobalMouseMove(e) {
              if (isDragging && dragStarted) {
                const elementAtPoint = document.elementFromPoint(e.clientX, e.clientY);
                if (elementAtPoint && elementAtPoint.classList.contains('word')) {
                  const wordIndex = words.indexOf(elementAtPoint);
                  if (wordIndex !== -1 && wordIndex !== currentBookmarkWordIndex) {
                    setBookmark(wordIndex, false);
                  }
                }
              }
            }
            
            // Set bookmark at specific word
            function setBookmark(wordIndex, shouldSave = true) {
              if (wordIndex < 0 || wordIndex >= words.length) return;
              
              // Remove previous bookmark styling
              const previousBookmark = document.querySelector('.bookmark-active');
              if (previousBookmark) {
                previousBookmark.classList.remove('bookmark-active');
                const indicator = previousBookmark.querySelector('.bookmark-indicator');
                if (indicator) indicator.remove();
              }
              
              // Apply bookmark to new word
              const targetWord = words[wordIndex];
              targetWord.classList.add('bookmark-active');
              
              // Add floating indicator
              const indicator = document.createElement('div');
              indicator.className = 'bookmark-indicator';
              targetWord.appendChild(indicator);
              
              // Scroll word into view smoothly
              targetWord.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'center'
              });
              
              currentBookmarkWordIndex = wordIndex;
              
              if (shouldSave) {
                // Send data to React Native for saving
                const wordText = targetWord.textContent.trim();
                const wordPosition = calculateWordPosition(targetWord);
                
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'bookmarkSet',
                  data: {
                    wordIndex: wordIndex,
                    chapterIndex: currentChapterIndex,
                    wordText: wordText,
                    totalWords: words.length,
                    position: wordPosition,
                    timestamp: new Date().toISOString()
                  }
                }));
              }
            }
            
            // Calculate word position relative to chapter
            function calculateWordPosition(wordElement) {
              const rect = wordElement.getBoundingClientRect();
              const bodyRect = document.body.getBoundingClientRect();
              
              return {
                x: rect.left - bodyRect.left,
                y: rect.top - bodyRect.top,
                scrollY: window.pageYOffset || document.documentElement.scrollTop
              };
            }
            
            // Navigation functions
            function moveBookmarkNext() {
              if (currentBookmarkWordIndex < words.length - 1) {
                setBookmark(currentBookmarkWordIndex + 1);
              } else {
                // Send message to load next chapter
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'requestNextChapter'
                }));
              }
            }
            
            function moveBookmarkPrevious() {
              if (currentBookmarkWordIndex > 0) {
                setBookmark(currentBookmarkWordIndex - 1);
              } else {
                // Send message to load previous chapter
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'requestPreviousChapter'
                }));
              }
            }
            
            // Jump to specific word by index
            function jumpToWord(wordIndex) {
              if (wordIndex >= 0 && wordIndex < words.length) {
                setBookmark(wordIndex);
              }
            }
            
            // Show/hide drag indicator
            function showDragIndicator() {
              const indicator = document.getElementById('dragIndicator');
              indicator.style.display = 'block';
            }
            
            function hideDragIndicator() {
              const indicator = document.getElementById('dragIndicator');
              indicator.style.display = 'none';
            }
            
            function finalizeDrag() {
              isDragging = false;
              dragStarted = false;
              hideDragIndicator();
              
              // Send final position to React Native
              if (currentBookmarkWordIndex >= 0) {
                setBookmark(currentBookmarkWordIndex, true);
              }
            }
            
            // Handle messages from React Native
            window.addEventListener('message', (event) => {
              let data;
              try {
                data = JSON.parse(event.data);
              } catch (e) {
                return;
              }
              
              switch(data.type) {
                case 'setBookmark':
                  if (data.wordIndex >= 0 && data.wordIndex < words.length) {
                    setBookmark(data.wordIndex);
                  }
                  break;
                case 'moveBookmarkNext':
                  moveBookmarkNext();
                  break;
                case 'moveBookmarkPrevious':
                  moveBookmarkPrevious();
                  break;
                case 'jumpToWord':
                  jumpToWord(data.wordIndex);
                  break;
                case 'getBookmarkPosition':
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'bookmarkPosition',
                    data: {
                      wordIndex: currentBookmarkWordIndex,
                      chapterIndex: currentChapterIndex,
                      totalWords: words.length
                    }
                  }));
                  break;
                case 'removeBookmark':
                  const currentBookmark = document.querySelector('.bookmark-active');
                  if (currentBookmark) {
                    currentBookmark.classList.remove('bookmark-active');
                    const indicator = currentBookmark.querySelector('.bookmark-indicator');
                    if (indicator) indicator.remove();
                  }
                  currentBookmarkWordIndex = -1;
                  break;
              }
            });
            
            // Initialize when DOM is ready
            document.addEventListener('DOMContentLoaded', () => {
              initializeWordTracking();
            });
            
            // Also initialize after a delay to ensure content is loaded
            setTimeout(() => {
              initializeWordTracking();
            }, 300);
            
            // Prevent context menu on long press
            document.addEventListener('contextmenu', (e) => {
              if (isDragging) {
                e.preventDefault();
              }
            });
          </script>
        </body>
      </html>
    `;
  }

  // Get chapter content directly from ZIP
  async getChapterContent(chapterIndex, fontSize = 18, bookmarkPosition = -1) {
    try {
      if (!this.epubData) {
        throw new Error('EPUB data not loaded. Please load the EPUB first.');
      }
      
      // Get book info to access chapters
      const bookInfo = await this.getBookInfo();
      
      if (!bookInfo || !bookInfo.chapters || !Array.isArray(bookInfo.chapters)) {
        throw new Error('Invalid book data: chapters not found');
      }
      
      if (chapterIndex < 0 || chapterIndex >= bookInfo.chapters.length) {
        throw new Error(`Chapter index ${chapterIndex} out of range (0-${bookInfo.chapters.length - 1})`);
      }

      const chapterPath = bookInfo.chapters[chapterIndex];
      const fullChapterPath = bookInfo.basePath + chapterPath;

      // Check cache first
      const cacheKey = `${fullChapterPath}_${fontSize}_${bookmarkPosition}`;
      if (this.chapterCache && this.chapterCache.has(cacheKey)) {
        return this.chapterCache.get(cacheKey);
      }

      // Get raw chapter content
      const chapterFile = this.epubData.file(fullChapterPath);
      if (!chapterFile) {
        throw new Error(`Chapter file not found: ${fullChapterPath}`);
      }

      let content = await chapterFile.async('string');
      
      // Extract only the body content from XHTML
      content = this.extractBodyContent(content);
      
      // Check if page is blank or has no meaningful content
      const wordCount = this.countWords(content);
      if (wordCount < 10) { // Increased threshold to 10 words for better filtering
        console.log(`⚠️ Chapter ${chapterIndex} has very little content (${wordCount} words), showing blank page...`);
        // Return a special indicator for blank pages
        return this.generateBlankPageHTML(chapterIndex, bookInfo.chapters.length);
      }
      
      // Process and enhance the content with bookmark support
      const processedContent = this.generateEnhancedHTML(content, fontSize, bookmarkPosition, chapterIndex);

      // Cache the processed content
      if (!this.chapterCache) {
        this.chapterCache = new Map();
      }
      this.chapterCache.set(cacheKey, processedContent);

      return processedContent;
    } catch (error) {
      console.error('Error getting chapter content:', error);
      throw error;
    }
  }

  // Extract body content from XHTML
  extractBodyContent(xhtmlContent) {
    try {
      console.log('Raw content preview:', xhtmlContent.substring(0, 200));
      
      // Remove XML declaration and DOCTYPE
      let content = xhtmlContent.replace(/<\?xml[^>]*\?>/g, '');
      content = content.replace(/<!DOCTYPE[^>]*>/g, '');
      
      // Extract body content - try different patterns
      let bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (!bodyMatch) {
        // Try without body tags - some EPUBs have content directly
        bodyMatch = content.match(/<div[^>]*class="[^"]*body[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      }
      if (!bodyMatch) {
        // Try to find any content between HTML tags
        bodyMatch = content.match(/<html[^>]*>([\s\S]*?)<\/html>/i);
      }
      
      if (bodyMatch) {
        content = bodyMatch[1];
      }
      
      // Remove head section completely
      content = content.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
      
      // Remove any remaining XML namespaces and attributes
      content = content.replace(/xmlns[^=]*="[^"]*"/g, '');
      content = content.replace(/xml:space[^=]*="[^"]*"/g, '');
      content = content.replace(/xml:lang[^=]*="[^"]*"/g, '');
      
      // Remove any remaining XML processing instructions
      content = content.replace(/<\?[^>]*\?>/g, '');
      
      // Remove script and style tags completely
      content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
      content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
      
      // Remove comments
      content = content.replace(/<!--[\s\S]*?-->/g, '');
      
      console.log('Processed content preview:', content.substring(0, 200));
      
      return content;
    } catch (error) {
      console.error('Error extracting body content:', error);
      return xhtmlContent; // Return original if extraction fails
    }
  }

  // Count words in content to detect blank pages
  countWords(content) {
    if (!content || typeof content !== 'string') return 0;
    
    // First, extract only the body content from XHTML
    let bodyContent = this.extractBodyContent(content);
    
    // Remove all HTML tags completely
    let cleanText = bodyContent.replace(/<[^>]*>/g, ' ');
    
    // Decode HTML entities
    cleanText = cleanText
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');
    
    // Remove all non-alphanumeric characters except spaces
    cleanText = cleanText.replace(/[^\w\s]/g, ' ');
    
    // Normalize whitespace
    cleanText = cleanText.replace(/\s+/g, ' ').trim();
    
    // Remove common EPUB metadata and navigation text
    const metadataPatterns = [
      /page\s+\d+/gi,
      /chapter\s+\d+/gi,
      /table\s+of\s+contents/gi,
      /contents/gi,
      /index/gi,
      /copyright/gi,
      /all\s+rights\s+reserved/gi,
      /published\s+by/gi,
      /isbn/gi,
      /ebook/gi,
      /digital\s+edition/gi,
      /converted\s+ebook/gi,
      /pdf\s+reflow\s+conversion/gi,
      /calibre/gi,
      /id\s*=\s*"[^"]*"/gi,
      /class\s*=\s*"[^"]*"/gi,
      /xmlns[^=]*="[^"]*"/gi,
      /xml:space[^=]*="[^"]*"/gi
    ];
    
    metadataPatterns.forEach(pattern => {
      cleanText = cleanText.replace(pattern, '');
    });
    
    // Remove single characters and very short words
    cleanText = cleanText.replace(/\b\w{1,2}\b/g, ' ');
    
    // Normalize whitespace again
    cleanText = cleanText.replace(/\s+/g, ' ').trim();
    
    // Split by whitespace and filter out empty strings
    const words = cleanText.split(/\s+/).filter(word => 
      word.length > 2 && 
      !/^\d+$/.test(word) && // Not just numbers
      /^[a-zA-Z]/.test(word) // Must start with a letter
    );
    
    console.log('Word count debug:', {
      originalLength: content.length,
      bodyLength: bodyContent.length,
      cleanTextLength: cleanText.length,
      wordCount: words.length,
      sampleWords: words.slice(0, 10)
    });
    
    return words.length;
  }
  
  // Generate HTML for blank pages with auto-navigation
  generateBlankPageHTML(chapterIndex, totalChapters) {
    const nextChapter = chapterIndex + 1;
    const hasNextChapter = nextChapter < totalChapters;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Blank Page</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 40px 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
          }
          .blank-container {
            max-width: 400px;
            padding: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          }
          .blank-icon {
            font-size: 64px;
            margin-bottom: 20px;
            opacity: 0.8;
          }
          .blank-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .blank-message {
            font-size: 16px;
            margin-bottom: 30px;
            opacity: 0.9;
            line-height: 1.5;
          }
          .auto-navigate {
            font-size: 14px;
            opacity: 0.7;
            margin-top: 20px;
          }
          .countdown {
            font-weight: bold;
            color: #FFD700;
          }
        </style>
      </head>
      <body>
        <div class="blank-container">
          <div class="blank-icon">📄</div>
          <div class="blank-title">Blank Page</div>
          <div class="blank-message">
            This page appears to be empty or contains no readable content.
            ${hasNextChapter ? 'Automatically navigating to the next chapter...' : 'This is the last chapter.'}
          </div>
          ${hasNextChapter ? `
            <div class="auto-navigate">
              Going to Chapter <span class="countdown">${nextChapter + 1}</span> in <span class="countdown" id="countdown">3</span> seconds...
            </div>
          ` : ''}
        </div>
        
        <script>
          ${hasNextChapter ? `
            let countdown = 3;
            const countdownElement = document.getElementById('countdown');
            
            const timer = setInterval(() => {
              countdown--;
              if (countdownElement) {
                countdownElement.textContent = countdown;
              }
              
              if (countdown <= 0) {
                clearInterval(timer);
                // Notify React Native to go to next chapter
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'requestNextChapter'
                }));
              }
            }, 1000);
          ` : ''}
        </script>
      </body>
      </html>
    `;
  }

  // Cleanup
  cleanup() {
    this.epubData = null;
    this.chapterCache = null;
  }
}

export default SimpleEpubParser;
