export interface HTMLGenerationOptions {
  fontSize: number;
  theme: 'light' | 'dark';
  fontFamily: string;
  lineHeight: number;
  enableBookmarks: boolean;
  enableWordHighlighting: boolean;
}

export class HTMLGenerator {
  private static defaultOptions: HTMLGenerationOptions = {
    fontSize: 18,
    theme: 'light',
    fontFamily: "Georgia, 'Times New Roman', serif",
    lineHeight: 1.6,
    enableBookmarks: true,
    enableWordHighlighting: true,
  };

  static generateEpubHTML(
    content: string, 
    options: Partial<HTMLGenerationOptions> = {}
  ): string {
    const opts = { ...this.defaultOptions, ...options };
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
          <meta charset="UTF-8">
          <style>
            ${this.generateCSS(opts)}
          </style>
          <script>
            ${this.generateJavaScript(opts)}
          </script>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `;
  }

  private static generateCSS(options: HTMLGenerationOptions): string {
    const themeColors = this.getThemeColors(options.theme);
    
    return `
      html {
        height: 100%;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      }
      
      body {
        font-family: ${options.fontFamily};
        font-size: ${options.fontSize}px;
        line-height: ${options.lineHeight};
        margin: 20px;
        padding: 20px;
        color: ${themeColors.text};
        background-color: ${themeColors.background};
        text-align: justify;
        user-select: none;
        -webkit-user-select: none;
        -webkit-touch-callout: none;
        min-height: 100vh;
        transition: all 0.3s ease;
      }
      
      p { 
        margin-bottom: 1.2em; 
        text-indent: 1.5em;
      }
      
      h1, h2, h3, h4, h5, h6 { 
        color: ${themeColors.heading};
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
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }
      
      blockquote {
        border-left: 4px solid ${themeColors.accent};
        margin: 1.5em 0;
        padding-left: 1em;
        font-style: italic;
        color: ${themeColors.secondary};
        background-color: ${themeColors.surface};
        padding: 1em;
        border-radius: 8px;
      }
      
      .chapter-title {
        font-size: 1.5em;
        font-weight: bold;
        margin-bottom: 1em;
        text-align: center;
        color: ${themeColors.primary};
      }
      
      body > *:first-child { margin-top: 0; }
      body > *:last-child { margin-bottom: 0; }
      
      ${options.enableWordHighlighting ? this.getWordHighlightingCSS() : ''}
      ${options.enableBookmarks ? this.getBookmarkCSS() : ''}
    `;
  }

  private static generateJavaScript(options: HTMLGenerationOptions): string {
    if (!options.enableWordHighlighting && !options.enableBookmarks) {
      return '';
    }

    return `
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
    `;
  }

  private static getThemeColors(theme: 'light' | 'dark') {
    if (theme === 'dark') {
      return {
        background: '#1a1a1a',
        text: '#ffffff',
        heading: '#e0e0e0',
        secondary: '#b0b0b0',
        primary: '#4a9eff',
        accent: '#ff6b6b',
        surface: '#2a2a2a',
      };
    }
    
    return {
      background: '#fff8f0',
      text: '#2c3e50',
      heading: '#34495e',
      secondary: '#7f8c8d',
      primary: '#2980b9',
      accent: '#bdc3c7',
      surface: '#f8f9fa',
    };
  }

  private static getWordHighlightingCSS(): string {
    return `
      .word-highlight {
        background-color: #ff9800;
        color: #000000;
        padding: 2px 4px;
        border-radius: 3px;
        font-weight: bold;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        transition: all 0.2s ease;
      }
    `;
  }

  private static getBookmarkCSS(): string {
    return `
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
    `;
  }
}
