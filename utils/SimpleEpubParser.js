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
      const regex = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi');
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

  // Enhanced HTML generation with premium design
  generateEnhancedHTML(content, fontSize, bookmarkPosition = -1, chapterIndex = 0) {
    // First, wrap words in spans for individual targeting
    const wrappedContent = this.wrapWordsInSpans(content);
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200;300;400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            :root {
              /* COLOR FIX: Changed to a classic beige color */
              --primary-bg: #F5F5DC;
              --secondary-bg: #F5F5DC;
              --text-primary: #2A2A2A;
              --text-secondary: #666666;
              --accent-color: #E74C3C;
              --accent-light: #FF6B5B;
              --border-color: #E8E6E3;
              --shadow-light: rgba(0, 0, 0, 0.05);
              --shadow-medium: rgba(0, 0, 0, 0.1);
              --shadow-heavy: rgba(0, 0, 0, 0.15);
              --border-radius: 16px;
              --border-radius-small: 8px;
            }
            
            body {
              font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              font-size: ${fontSize}px;
              font-weight: 400;
              line-height: 1.75;
              color: var(--text-primary);
              background: var(--primary-bg);
              padding: 0;
              margin: 0;
              min-height: 100vh;
              position: relative;
              user-select: none;
              -webkit-user-select: none;
              -webkit-touch-callout: none;
              overflow-x: hidden;
            }
            
            /* Main content container */
            .content-container {
              max-width: 680px;
              margin: 0 auto;
              background: var(--secondary-bg);
              min-height: 100vh;
              box-shadow: 
                0 0 0 1px rgba(0,0,0,0.03),
                0 8px 32px var(--shadow-light);
              position: relative;
            }
            
            /* Content area */
            #content {
              padding: 120px 40px 80px 40px;
              text-align: justify;
              text-justify: inter-word;
              position: relative;
              z-index: 1;
            }
            
            /* Word styling - default state */
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
            
            /* Bookmark highlight */
            .bookmark-active {
              background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%) !important;
              color: var(--text-primary) !important;
              font-weight: 600;
              box-shadow: 0 2px 12px rgba(255, 215, 0, 0.4);
              border: 2px solid #FF8C00;
              padding: 4px 8px !important;
              margin: 0 2px;
              border-radius: var(--border-radius-small);
              transform: scale(1.02);
              z-index: 10;
              position: relative;
            }
            
            /* Floating bookmark indicator */
            .bookmark-indicator {
              position: absolute;
              top: -18px;
              left: 50%;
              transform: translateX(-50%);
              width: 0;
              height: 0;
              border-left: 8px solid transparent;
              border-right: 8px solid transparent;
              border-bottom: 12px solid #FFD700;
              z-index: 20;
              animation: bookmarkPulse 2s infinite;
            }
            
            @keyframes bookmarkPulse {
              0%, 100% { opacity: 1; transform: translateX(-50%) scale(1); }
              50% { opacity: 0.7; transform: translateX(-50%) scale(1.1); }
            }
            
            /* Top navigation bar */
            .top-nav {
              position: fixed;
              top: 0;
              left: 50%;
              transform: translateX(-50%);
              width: 100%;
              max-width: 680px;
              height: 80px;
              background: rgba(245, 245, 220, 0.85); /* Adjusted for new beige background */
              backdrop-filter: blur(20px);
              -webkit-backdrop-filter: blur(20px);
              border-bottom: 1px solid var(--border-color);
              z-index: 1000;
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 0 24px;
            }
            
            .nav-section {
              display: flex;
              align-items: center;
              gap: 12px;
            }
            
            /* Navigation buttons */
            .nav-btn {
              width: 44px;
              height: 44px;
              border-radius: 50%;
              background: var(--secondary-bg);
              border: 1px solid var(--border-color);
              color: var(--text-secondary);
              font-size: 18px;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.2s ease;
              box-shadow: 0 2px 8px var(--shadow-light);
              cursor: pointer;
            }
            
            .nav-btn:hover {
              background: #fff;
              border-color: var(--text-secondary);
              color: var(--text-primary);
              transform: translateY(-1px);
              box-shadow: 0 4px 12px var(--shadow-medium);
            }
            
            .nav-btn.active {
              background: var(--accent-color);
              border-color: var(--accent-color);
              color: white;
            }
            
            /* Manual bookmark button */
            .bookmark-button {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border: none;
              color: white;
              font-size: 20px;
            }
            
            .bookmark-button:hover {
              background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
            }
            
            .bookmark-button.active {
              background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
              color: var(--text-primary);
            }
            
            /* Cancel button */
            .cancel-button {
              padding: 8px 20px;
              background: var(--accent-color);
              color: white;
              border: none;
              border-radius: 22px;
              font-size: 14px;
              font-weight: 600;
              font-family: 'Plus Jakarta Sans', sans-serif;
              box-shadow: 0 2px 8px rgba(231, 76, 60, 0.3);
              transition: all 0.3s ease;
              z-index: 1000;
              display: none;
              cursor: pointer;
            }
            
            .cancel-button:hover {
              background: var(--accent-light);
              transform: translateY(-1px);
              box-shadow: 0 4px 12px rgba(231, 76, 60, 0.4);
            }
            
            .bookmark-selection-mode .cancel-button {
              display: block;
            }
            
            /* Notification system */
            .bookmark-notification {
              position: fixed;
              top: 100px;
              left: 50%;
              transform: translateX(-50%);
              background: rgba(42, 42, 42, 0.95);
              color: white;
              padding: 16px 28px;
              border-radius: 28px;
              font-size: 14px;
              font-weight: 500;
              font-family: 'Plus Jakarta Sans', sans-serif;
              z-index: 1000;
              display: none;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
              backdrop-filter: blur(20px);
              animation: slideDown 0.3s ease;
              pointer-events: none;
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
              font-family: 'Plus Jakarta Sans', sans-serif;
              color: var(--text-primary);
              margin: 32px 0 20px 0;
              font-weight: 700;
              line-height: 1.3;
              letter-spacing: -0.02em;
            }
            
            h1 { 
              font-size: 2.2em; 
              font-weight: 800;
              margin: 40px 0 24px 0;
            }
            h2 { 
              font-size: 1.8em; 
              font-weight: 700;
            }
            h3 { 
              font-size: 1.4em; 
              font-weight: 600;
            }
            
            p {
              margin: 20px 0;
              text-indent: 2em;
              line-height: 1.75;
              font-weight: 400;
              color: var(--text-primary);
            }
            
            p:first-of-type {
              text-indent: 0;
              margin-top: 0;
            }
            
            p:last-of-type {
              margin-bottom: 0;
            }
            
            /* Quote styling */
            blockquote {
              margin: 32px 0;
              padding: 24px 28px;
              background: #fff;
              border-left: 4px solid var(--accent-color);
              border-radius: 0 var(--border-radius-small) var(--border-radius-small) 0;
              font-style: italic;
              color: var(--text-secondary);
            }
            
            /* Image styling */
            img {
              max-width: 100%;
              height: auto;
              display: block;
              margin: 32px auto;
              border-radius: var(--border-radius);
              box-shadow: 0 8px 32px var(--shadow-medium);
            }
            
            /* Emphasis styling */
            em, i {
              font-style: italic;
              color: var(--text-secondary);
            }
            
            strong, b {
              font-weight: 600;
              color: var(--text-primary);
            }
            
            /* Link styling */
            a {
              color: var(--accent-color);
              text-decoration: none;
              font-weight: 500;
              transition: all 0.2s ease;
            }
            
            a:hover {
              color: var(--accent-light);
            }
            
            /* List styling */
            ul, ol {
              margin: 20px 0;
              padding-left: 24px;
            }
            
            li {
              margin: 8px 0;
              line-height: 1.6;
            }
            
            /* Smooth scrolling */
            html {
              scroll-behavior: smooth;
            }
            
            /* Mobile responsiveness */
            @media (max-width: 768px) {
              .content-container {
                margin: 0;
                box-shadow: none;
                border-radius: 0;
              }
              
              #content {
                padding: 100px 24px 60px 24px;
              }
              
              .top-nav {
                padding: 0 20px;
              }
              
              .nav-btn {
                width: 40px;
                height: 40px;
                font-size: 16px;
              }
            }
            
            @media (max-width: 480px) {
              #content {
                padding: 90px 20px 50px 20px;
              }
              
              .top-nav {
                padding: 0 16px;
                gap: 8px;
              }
              
              .nav-section {
                gap: 8px;
              }
              
              p {
                text-indent: 1.5em;
              }
            }
          </style>
        </head>
        <body>
          <div class="top-nav">
            <div class="nav-section">
              <button class="nav-btn cancel-button" id="cancelButton" onclick="cancelBookmarkMode()">
                Cancel
              </button>
            </div>
            
            <div class="nav-section">
              <button class="nav-btn bookmark-button" id="bookmarkButton" onclick="toggleBookmarkMode()">
                📖
              </button>
            </div>
          </div>
          
          <div class="bookmark-notification" id="bookmarkNotification">
            Touch any word to create bookmark
          </div>
          
          <div class="content-container">
            <div id="content">${wrappedContent}</div>
          </div>
          
          <script>
            let currentBookmarkWordIndex = ${bookmarkPosition};
            let currentChapterIndex = ${chapterIndex};
            let words = [];
            let bookmarkSelectionMode = false;
            
            // Initialize word tracking system
            function initializeWordTracking() {
              words = Array.from(document.querySelectorAll('.word'));
              console.log('📚 Total words found:', words.length);
              
              // Add touch listeners to each word (only active in selection mode)
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
              if (!bookmarkSelectionMode) return;
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
      
      // Use the enhanced HTML generation
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
      bodyContent = bodyContent.replace(/\s*xmlns.*?=".*?"/gi, '');
      bodyContent = bodyContent.replace(/\s*xml:space=".*?"/gi, '');
      bodyContent = bodyContent.replace(/\s*xml:lang=".*?"/gi, '');
      
      // STEP 5: Convert common EPUB elements to standard HTML
      bodyContent = bodyContent.replace(/<epub:type=".*?"/gi, '');
      bodyContent = bodyContent.replace(/<(\/?)(div|p|span|h[1-6]|br|hr|img|a|em|strong|i|b|u|blockquote|ul|ol|li)[^>]*epub:[^>]*>/gi, '<$1$2>');
      
      // STEP 6: Clean up attributes while preserving essential ones
      // Keep important attributes: href, src, alt, title, class (for our word spans)
      bodyContent = bodyContent.replace(/\s+(id|style|data-.*?|role|aria-.*?|tabindex)=".*?"/gi, '');
      
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
  
  // Generate HTML for blank pages with premium design and theme colors
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
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background: #F5F5DC; /* Beige background */
            color: #2A2A2A;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          
          /* Background decoration */
          .background-decoration {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            opacity: 0.03;
            background-image: 
              radial-gradient(circle at 20% 20%, #E74C3C 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, #667eea 0%, transparent 50%),
              radial-gradient(circle at 40% 60%, #764ba2 0%, transparent 50%);
            animation: floatBackground 20s ease-in-out infinite alternate;
          }
          
          @keyframes floatBackground {
            0% { transform: translateY(0) rotate(0deg); }
            100% { transform: translateY(-20px) rotate(2deg); }
          }
          
          .blank-container {
            max-width: 480px;
            padding: 48px 32px;
            background: rgba(255, 255, 255, 0.6);
            border: 1px solid rgba(232, 230, 227, 0.8);
            border-radius: 24px;
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            box-shadow: 
              0 20px 40px rgba(0, 0, 0, 0.06),
              0 8px 16px rgba(0, 0, 0, 0.04),
              inset 0 1px 0 rgba(255, 255, 255, 0.8);
            position: relative;
            z-index: 2;
            animation: slideUp 0.6s ease-out;
          }
          
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(40px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .blank-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 24px auto;
            background: linear-gradient(135deg, #F7F5F3 0%, #E8E6E3 100%);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 36px;
            box-shadow: 
              0 8px 16px rgba(0, 0, 0, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.9);
            animation: iconFloat 3s ease-in-out infinite alternate;
          }
          
          @keyframes iconFloat {
            0% { transform: translateY(0); }
            100% { transform: translateY(-8px); }
          }
          
          .blank-title {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 12px;
            color: #2A2A2A;
            letter-spacing: -0.02em;
          }
          
          .blank-message {
            font-size: 16px;
            font-weight: 400;
            margin-bottom: 32px;
            color: #666666;
            line-height: 1.6;
            letter-spacing: -0.01em;
          }
          
          .auto-navigate {
            font-size: 14px;
            font-weight: 500;
            color: #666666;
            margin-top: 24px;
            padding: 16px 20px;
            background: #b7aa99;
            border-radius: 16px;
            border: 1px solid #E8E6E3;
          }
          
          .countdown {
            font-weight: 700;
            color: #E74C3C;
            font-size: 16px;
          }
          
          .progress-ring {
            width: 48px;
            height: 48px;
            margin: 16px auto 0 auto;
            position: relative;
          }
          
          .progress-ring-circle {
            stroke: #E74C3C;
            stroke-width: 3;
            fill: transparent;
            stroke-dasharray: 144;
            stroke-dashoffset: 144;
            animation: countdown-progress 3s linear;
            transform-origin: center;
            transform: rotate(-90deg);
          }
          
          @keyframes countdown-progress {
            to { stroke-dashoffset: 0; }
          }
          
          .progress-ring-bg {
            stroke: #b7aa99;
            stroke-width: 3;
            fill: transparent;
          }
          
          /* Mobile responsiveness */
          @media (max-width: 480px) {
            .blank-container {
              margin: 20px;
              padding: 40px 24px;
            }
            
            .blank-title {
              font-size: 24px;
            }
            
            .blank-message {
              font-size: 15px;
            }
          }
        </style>
      </head>
      <body>
        <div class="background-decoration"></div>
        
        <div class="blank-container">
          <div class="blank-icon">📄</div>
          <div class="blank-title">Empty Chapter</div>
          <div class="blank-message">
            This chapter appears to be empty or contains no readable content.
            ${hasNextChapter ? 'Automatically navigating to the next chapter...' : 'You have reached the end of this book.'}
          </div>
          
          ${hasNextChapter ? `
            <div class="auto-navigate">
              Going to Chapter <span class="countdown">${nextChapter + 1}</span> in <span class="countdown" id="countdown">3</span> seconds
              
              <div class="progress-ring">
                <svg class="progress-ring" viewBox="0 0 48 48">
                  <circle class="progress-ring-bg" cx="24" cy="24" r="22"></circle>
                  <circle class="progress-ring-circle" cx="24" cy="24" r="22"></circle>
                </svg>
              </div>
            </div>
          ` : `
            <div class="auto-navigate">
              You have finished reading this book. Thank you for reading!
            </div>
          `}
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