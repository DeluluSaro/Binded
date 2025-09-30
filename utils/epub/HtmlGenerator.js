/**
 * HTML generation utilities for EPUB content
 * Handles word wrapping, styling, and HTML structure
 */
export class HtmlGenerator {
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
        // Only wrap words in the text content between tags (including all words regardless of size)
        const wrappedText = textContent.replace(
          /\b([a-zA-Z][a-zA-Z0-9']*)\b/g, 
          '<span class="word">$1</span>'
        );
        return `>${wrappedText}<`;
      }
    );
    
    // Handle text at the beginning and end of content (including all words regardless of size)
    content = content.replace(/^([^<]+)/, (match) => {
      return match.replace(/\b([a-zA-Z][a-zA-Z0-9']*)\b/g, '<span class="word">$1</span>');
    });
    
    content = content.replace(/([^>]+)$/, (match) => {
      return match.replace(/\b([a-zA-Z][a-zA-Z0-9']*)\b/g, '<span class="word">$1</span>');
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
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200;300;400;500;600;700;800&display=swap" rel="stylesheet">
          ${this.generateStyles(fontSize)}
        </head>
        <body>
          ${this.generateNavigation()}
          ${this.generateNotifications()}
          ${this.generateMeaningPopup()}
          
          <div class="content-container">
            <div id="content">${wrappedContent}</div>
          </div>
          
          ${this.generateScripts(bookmarkPosition, chapterIndex)}
        </body>
      </html>
    `;
  }

  // Generate CSS styles
  generateStyles(fontSize) {
    return `
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        :root {
          /* COLOR FIX: Using your requested background color */
          --primary-bg: #b7aa99;
          --secondary-bg: #b7aa99;
          --text-primary: #2A2A2A;
          --text-secondary: #5c554c; /* Darkened for better contrast on new BG */
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
          overflow-x: hidden;
          user-select: text;
          -webkit-user-select: text;
          -webkit-touch-callout: default;
          -webkit-overflow-scrolling: touch;
          touch-action: manipulation;
        }
        
        /* Mobile-first content container */
        .content-container {
          width: 100%;
          margin: 0;
          background: var(--secondary-bg);
          min-height: 100vh;
          position: relative;
        }
        
        /* Mobile-first content area */
        #content {
          padding: 100px 20px 100px 20px;
          text-align: justify;
          text-justify: inter-word;
          position: relative;
          z-index: 1;
          user-select: text;
          -webkit-user-select: text;
          -webkit-touch-callout: default;
        }
        
        /* Make all text content selectable */
        p, div, span, h1, h2, h3, h4, h5, h6, blockquote, li, a, em, strong, i, b, u {
          user-select: text;
          -webkit-user-select: text;
          -webkit-touch-callout: default;
        }
        
        /* Word styling - default state */
        .word {
          display: inline;
          padding: 1px 2px;
          border-radius: 3px;
          transition: all 0.2s ease;
          position: relative;
          user-select: text;
          -webkit-user-select: text;
          -webkit-touch-callout: default;
        }
        
        /* Mobile-first typography */
        h1, h2, h3, h4, h5, h6 {
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: var(--text-primary);
          margin: 24px 0 16px 0;
          font-weight: 700;
          line-height: 1.3;
          letter-spacing: -0.02em;
          user-select: text;
          -webkit-user-select: text;
          -webkit-touch-callout: default;
        }
        
        h1 { 
          font-size: 1.8em; 
          font-weight: 800;
          margin: 32px 0 20px 0;
        }
        h2 { 
          font-size: 1.5em; 
          font-weight: 700;
        }
        h3 { 
          font-size: 1.3em; 
          font-weight: 600;
        }
        
        p {
          margin: 16px 0;
          text-indent: 1.5em;
          line-height: 1.6;
          font-weight: 400;
          color: var(--text-primary);
          user-select: text;
          -webkit-user-select: text;
          -webkit-touch-callout: default;
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
          background: rgba(0,0,0,0.05);
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
      </style>
    `;
  }

  // Generate navigation HTML
  generateNavigation() {
    return `
      <div class="top-nav">
        <div class="nav-section">
          <button class="nav-btn cancel-button" id="cancelButton" onclick="cancelBookmarkMode()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
            </svg>
          </button>
        </div>
        
        <div class="nav-section">
          <button class="nav-btn bookmark-button" id="bookmarkButton" onclick="toggleBookmarkMode()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
            </svg>
          </button>
          <button class="nav-btn robot-button" id="robotButton" onclick="toggleRobotMode()">
            🤖
          </button>
        </div>
      </div>
    `;
  }

  // Generate notification HTML
  generateNotifications() {
    return `
      <div class="bookmark-notification" id="bookmarkNotification">
        Touch any word to bookmark
      </div>
      
      <div class="robot-notification" id="robotNotification">
        Long press text to select • Tap 🤖 button to turn off
      </div>
    `;
  }

  // Generate meaning popup HTML
  generateMeaningPopup() {
    return `
      <div class="meaning-popup" id="meaningPopup">
        <div class="meaning-popup-header">
          <div class="meaning-word" id="meaningWord">Word</div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <button class="meaning-close" id="meaningClose">×</button>
          </div>
        </div>
        <div class="meaning-content" id="meaningContent">
          <div class="meaning-loading">
            <div class="meaning-spinner"></div>
            Getting meaning...
          </div>
        </div>
        <div class="meaning-footer" id="meaningFooter" style="display: none; margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(0,0,0,0.1); text-align: center;">
          <button id="turnOffRobot" style="background: #E74C3C; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500;">
            🤖 Turn Off Robot
          </button>
        </div>
      </div>
    `;
  }

  // Generate JavaScript functionality
  generateScripts(bookmarkPosition, chapterIndex) {
    return `
      <script>
        let currentBookmarkWordIndex = ${bookmarkPosition};
        let currentChapterIndex = ${chapterIndex};
        let words = [];
        let bookmarkSelectionMode = false;
        let robotMode = false;
        let robotSelectionMode = false;
        let isSelectingWords = false;
        let selectedWords = [];
        let selectionStartIndex = -1;
        
        // Initialize word tracking system
        function initializeWordTracking() {
          words = Array.from(document.querySelectorAll('.word'));
          console.log('📚 Total words found:', words.length);
          
          // Add touch listeners to each word (only active in selection mode)
          words.forEach((word, index) => {
            // Single click for bookmark mode only
            word.addEventListener('click', (e) => {
              if (bookmarkSelectionMode) {
                e.preventDefault();
                e.stopPropagation();
                createBookmark(index);
              }
              // In robot mode, do nothing - let native text selection work
            });
          });
          
          // Restore bookmark if exists
          if (currentBookmarkWordIndex >= 0 && currentBookmarkWordIndex < words.length) {
            setBookmark(currentBookmarkWordIndex, false);
          }
        }
        
        // Initialize when DOM is ready
        document.addEventListener('DOMContentLoaded', () => {
          initializeWordTracking();
        });
        
        // Also initialize after a delay to ensure content is loaded
        setTimeout(() => {
          initializeWordTracking();
        }, 300);
      </script>
    `;
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
            background: #b7aa99; /* New BG Color */
            color: #FFFFFF; /* White text for contrast */
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          
          .blank-container {
            max-width: 480px;
            padding: 48px 32px;
            background: rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 24px;
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            box-shadow: 
              0 20px 40px rgba(0, 0, 0, 0.06),
              0 8px 16px rgba(0, 0, 0, 0.04),
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
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
          
          .blank-title {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 12px;
            color: #FFFFFF;
            letter-spacing: -0.02em;
          }
          
          .blank-message {
            font-size: 16px;
            font-weight: 400;
            margin-bottom: 32px;
            color: rgba(255,255,255,0.8);
            line-height: 1.6;
            letter-spacing: -0.01em;
          }
        </style>
      </head>
      <body>
        <div class="blank-container">
          <div class="blank-title">Empty Chapter</div>
          <div class="blank-message">
            This chapter appears to be empty or contains no readable content.
            ${hasNextChapter ? 'Automatically navigating to the next chapter...' : 'You have reached the end of this book.'}
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
