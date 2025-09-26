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
    if (!htmlContent) return '';
    
    // Don't wrap words inside these tags
    const preserveTags = ['script', 'style', 'pre', 'code', 'textarea'];
    let content = htmlContent;
    
    // Temporarily replace preserve tags with placeholders
    const preservedContent = {};
    let placeholderIndex = 0;
    
    preserveTags.forEach(tag => {
      const regex = new RegExp(`<${tag}[^>]*>[\s\S]*?<\/${tag}>`, 'gi');
      content = content.replace(regex, (match) => {
        const placeholder = `__PRESERVE_${placeholderIndex}__`;
        preservedContent[placeholder] = match;
        placeholderIndex++;
        return placeholder;
      });
    });
    
    // Wrap words in text content only (not in HTML tags)
    // This regex matches words that are not inside HTML tag attributes
    content = content.replace(
      />([^<]*)</g, 
      (match, textContent) => {
        // Only wrap words in the text content between tags
        const wrappedText = textContent.replace(
          /\b([a-zA-Z][a-zA-Z0-9']{2,})\b/g, 
          '<span class="word">$1</span>'
        );
        return `>${wrappedText}<`;
      }
    );
    
    // Handle text at the beginning and end of content
    content = content.replace(/^([^<]+)/, (match) => {
      return match.replace(/\b([a-zA-Z][a-zA-Z0-9']{2,})\b/g, '<span class="word">$1</span>');
    });
    
    content = content.replace(/([^>]+)$/, (match) => {
      return match.replace(/\b([a-zA-Z][a-zA-Z0-9']{2,})\b/g, '<span class="word">$1</span>');
    });
    
    // Restore preserved content
    Object.keys(preservedContent).forEach(placeholder => {
      content = content.replace(placeholder, preservedContent[placeholder]);
    });
    
    return content;
  }

  // Enhanced HTML generation with manual bookmark support
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
            
            /* Word styling - default state (no interaction) */
            .word {
              display: inline;
              padding: 1px 2px;
              border-radius: 3px;
              transition: all 0.2s ease;
              position: relative;
            }
            
            /* Only interactive when in bookmark selection mode */
            .bookmark-selection-mode .word {
              cursor: pointer;
            }
            
            .bookmark-selection-mode .word:hover {
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
            
            /* Manual bookmark button */
            .bookmark-button {
              position: fixed;
              bottom: 20px;
              right: 20px;
              width: 60px;
              height: 60px;
              border-radius: 50%;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border: none;
              color: white;
              font-size: 24px;
              cursor: pointer;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
              transition: all 0.3s ease;
              z-index: 1000;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            
            .bookmark-button:hover {
              transform: scale(1.1);
              box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
            }
            
            .bookmark-button.active {
              background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
              color: #2c3e50;
            }
            
            /* Cancel button */
            .cancel-button {
              position: fixed;
              bottom: 20px;
              left: 20px;
              padding: 12px 24px;
              background: rgba(255, 0, 0, 0.8);
              color: white;
              border: none;
              border-radius: 25px;
              font-size: 14px;
              font-weight: bold;
              cursor: pointer;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
              transition: all 0.3s ease;
              z-index: 1000;
              display: none;
            }
            
            .cancel-button:hover {
              background: rgba(255, 0, 0, 1);
              transform: scale(1.05);
            }
            
            .bookmark-selection-mode .cancel-button {
              display: block;
            }
            
            /* Notification system */
            .bookmark-notification {
              position: fixed;
              top: 20px;
              left: 50%;
              transform: translateX(-50%);
              background: rgba(0, 0, 0, 0.9);
              color: white;
              padding: 12px 24px;
              border-radius: 25px;
              font-size: 14px;
              font-weight: bold;
              z-index: 1000;
              display: none;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
              animation: slideDown 0.3s ease;
            }
            
            .bookmark-selection-mode .bookmark-notification {
              display: block;
            }
            
            @keyframes slideDown {
              from {
                opacity: 0;
                transform: translateX(-50%) translateY(-20px);
              }
              to {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
              }
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
          <!-- Manual bookmark button -->
          <button class="bookmark-button" id="bookmarkButton" onclick="toggleBookmarkMode()">
            📖
          </button>
          
          <!-- Cancel button (only visible in selection mode) -->
          <button class="cancel-button" id="cancelButton" onclick="cancelBookmarkMode()">
            Cancel
          </button>
          
          <!-- Notification -->
          <div class="bookmark-notification" id="bookmarkNotification">
            Touch any word to create bookmark
          </div>
          
          <div id="content">${wrappedContent}</div>
          
          <script>
            let currentBookmarkWordIndex = ${bookmarkPosition};
            let currentChapterIndex = ${chapterIndex};
            let words = [];
            let bookmarkSelectionMode = false;
            
            // Initialize word tracking system
            function initializeWordTracking() {
              words = Array.from(document.querySelectorAll('.word'));
              console.log('📚 Total words found:', words.length);
              
              // Add click listeners to each word (only active in selection mode)
              words.forEach((word, index) => {
                word.addEventListener('click', (e) => {
                  e.preventDefault();
                  
                  // Only allow bookmark creation in selection mode
                  if (bookmarkSelectionMode) {
                    createBookmark(index);
                  }
                });
              });
              
              // Restore bookmark if exists
              if (currentBookmarkWordIndex >= 0 && currentBookmarkWordIndex < words.length) {
                setBookmark(currentBookmarkWordIndex, false);
              }
            }
            
            // Toggle bookmark selection mode
            function toggleBookmarkMode() {
              bookmarkSelectionMode = !bookmarkSelectionMode;
              const body = document.body;
              const button = document.getElementById('bookmarkButton');
              const notification = document.getElementById('bookmarkNotification');
              
              if (bookmarkSelectionMode) {
                // Enter selection mode
                body.classList.add('bookmark-selection-mode');
                button.textContent = '⭐';
                button.classList.add('active');
                notification.style.display = 'block';
                
                console.log('📖 Bookmark selection mode enabled');
              } else {
                // Exit selection mode
                body.classList.remove('bookmark-selection-mode');
                button.textContent = '📖';
                button.classList.remove('active');
                notification.style.display = 'none';
                
                console.log('📖 Bookmark selection mode disabled');
              }
            }
            
            // Cancel bookmark mode
            function cancelBookmarkMode() {
              bookmarkSelectionMode = false;
              const body = document.body;
              const button = document.getElementById('bookmarkButton');
              const notification = document.getElementById('bookmarkNotification');
              
              body.classList.remove('bookmark-selection-mode');
              button.textContent = '📖';
              button.classList.remove('active');
              notification.style.display = 'none';
              
              console.log('📖 Bookmark selection mode cancelled');
            }
            
            // Create bookmark at specific word
            function createBookmark(wordIndex) {
              if (wordIndex < 0 || wordIndex >= words.length) return;
              
              const targetWord = words[wordIndex];
              const wordText = targetWord.textContent.trim();
              
              // Exit selection mode
              cancelBookmarkMode();
              
              // Set the bookmark
              setBookmark(wordIndex, true);
              
              // Send bookmark data to React Native
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
              
              console.log('📖 Bookmark created at:', wordText);
            }
            
            // Set bookmark at specific word (internal function)
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
                case 'enableBookmarkMode':
                  if (!bookmarkSelectionMode) {
                    toggleBookmarkMode();
                  }
                  break;
                case 'disableBookmarkMode':
                  if (bookmarkSelectionMode) {
                    cancelBookmarkMode();
                  }
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

      const chapterFile = this.epubData.file(fullChapterPath);
      if (!chapterFile) {
        throw new Error(`Chapter file not found: ${fullChapterPath}`);
      }

      let content = await chapterFile.async('string');
      content = this.extractBodyContent(content);
      
      const wordCount = this.countWords(content);
      if (wordCount < 10) {
        console.log(`⚠️ Chapter ${chapterIndex} has very little content (${wordCount} words), showing blank page...`);
        return this.generateBlankPageHTML(chapterIndex, bookInfo.chapters.length);
      }
      
      // Use the new manual bookmark system
      const processedContent = this.generateEnhancedHTML(content, fontSize, bookmarkPosition, chapterIndex);

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
      console.log('📄 Original content length:', xhtmlContent.length);
      
      let content = xhtmlContent;
      
      // STEP 1: Remove XML declarations and DOCTYPE (these are not content)
      content = content.replace(/<\?xml[^>]*\?>\s*/gi, '');
      content = content.replace(/<!DOCTYPE[^>]*>\s*/gi, '');
      
      // STEP 2: Extract body content with multiple fallback strategies
      let bodyContent = '';
      
      // Strategy 1: Look for <body> tags
      let bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        bodyContent = bodyMatch[1];
        console.log('✅ Found body tag');
      } else {
        // Strategy 2: Look for main content div
        bodyMatch = content.match(/<div[^>]*(?:class|id)="[^"]*(?:body|content|main|text)[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
        if (bodyMatch) {
          bodyContent = bodyMatch[1];
          console.log('✅ Found content div');
        } else {
          // Strategy 3: Remove head and take everything else
          let withoutHead = content.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
          withoutHead = withoutHead.replace(/<html[^>]*>/gi, '').replace(/<\/html>/gi, '');
          bodyContent = withoutHead;
          console.log('✅ Using fallback content extraction');
        }
      }
      
      // STEP 3: Remove unwanted elements (but preserve text content)
      // Remove scripts completely
      bodyContent = bodyContent.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
      
      // Remove style tags completely
      bodyContent = bodyContent.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
      
      // Remove comments
      bodyContent = bodyContent.replace(/<!--[\s\S]*?-->/g, '');
      
      // STEP 4: Clean XML namespaces and attributes (but keep the tags)
      // Remove XML namespace declarations
      bodyContent = bodyContent.replace(/\s*xmlns[^=]*="[^"]*"/gi, '');
      bodyContent = bodyContent.replace(/\s*xml:space="[^"]*"/gi, '');
      bodyContent = bodyContent.replace(/\s*xml:lang="[^"]*"/gi, '');
      
      // STEP 5: Convert common EPUB elements to standard HTML
      bodyContent = bodyContent.replace(/<epub:type="[^"]*"/gi, '');
      bodyContent = bodyContent.replace(/<(\/?)(div|p|span|h[1-6]|br|hr|img|a|em|strong|i|b|u|blockquote|ul|ol|li)[^>]*epub:[^>]*>/gi, '<$1$2>');
      
      // STEP 6: Clean up attributes while preserving essential ones
      // Keep important attributes: href, src, alt, title, class (for our word spans)
      bodyContent = bodyContent.replace(/\s+(id|style|data-[^=]*|role|aria-[^=]*|tabindex)="[^"]*"/gi, '');
      
      // STEP 7: Normalize whitespace but preserve paragraph structure
      // Don't collapse all whitespace - preserve line breaks and paragraph structure
      bodyContent = bodyContent.replace(/[ \t]+/g, ' '); // Only collapse spaces and tabs
      bodyContent = bodyContent.replace(/\n\s*\n/g, '\n'); // Remove extra blank lines
      
      // STEP 8: Remove empty tags but preserve meaningful structure
      bodyContent = bodyContent.replace(/<(p|div|span|h[1-6])\s*>\s*<\/\1>/gi, '');
      
      // STEP 9: Handle CDATA sections properly
      bodyContent = bodyContent.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
      
      // STEP 10: Final cleanup
      bodyContent = bodyContent.trim();
      
      console.log('📄 Cleaned content length:', bodyContent.length);
      console.log('📄 First 200 chars:', bodyContent.substring(0, 200));
      
      return bodyContent;
      
    } catch (error) {
      console.error('❌ Error in content extraction:', error);
      // Return original content if extraction fails
      return xhtmlContent;
    }
  }

  // Count words in content to detect blank pages
  countWords(content) {
    if (!content || typeof content !== 'string') return 0;
    
    // First extract text content using DOM parsing approach
    let textContent = '';
    
    try {
      // Create a temporary div to parse HTML properly
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      
      // Remove script and style elements
      const scripts = tempDiv.querySelectorAll('script, style');
      scripts.forEach(el => el.remove());
      
      // Get only the text content
      textContent = tempDiv.textContent || tempDiv.innerText || '';
    } catch (_e) {
      // Fallback: strip HTML tags manually
      textContent = content.replace(/<[^>]*>/g, ' ');
    }
    
    // Clean the text
    textContent = textContent
      .replace(/&[a-zA-Z0-9#]+;/g, ' ') // Remove HTML entities
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // Count actual words (letters + numbers, minimum 2 characters)
    const words = textContent.match(/\b[a-zA-Z0-9][a-zA-Z0-9']{1,}\b/g);
    const wordCount = words ? words.length : 0;
    
    console.log('📊 Word count analysis:', {
      contentLength: content.length,
      textLength: textContent.length,
      wordCount: wordCount,
      sampleText: textContent.substring(0, 100)
    });
    
    return wordCount;
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
