/**
 * Word tracking and selection functionality
 * Handles word-level interactions, selection, and positioning
 */
export class WordTracker {
  constructor() {
    this.words = [];
    this.currentBookmarkWordIndex = -1;
    this.currentChapterIndex = 0;
    this.bookmarkSelectionMode = false;
    this.robotMode = false;
    this.robotSelectionMode = false;
    this.isSelectingWords = false;
    this.selectedWords = [];
    this.selectionStartIndex = -1;
  }

  // Initialize word tracking system
  initializeWordTracking() {
    this.words = Array.from(document.querySelectorAll('.word'));
    console.log('📚 Total words found:', this.words.length);
    
    // Add touch listeners to each word (only active in selection mode)
    this.words.forEach((word, index) => {
      // Single click for bookmark mode only
      word.addEventListener('click', (e) => {
        if (this.bookmarkSelectionMode) {
          e.preventDefault();
          e.stopPropagation();
          this.createBookmark(index);
        }
        // In robot mode, do nothing - let native text selection work
      });
      
      // Prevent any custom highlighting in robot mode
      word.addEventListener('mousedown', (e) => {
        if (this.robotSelectionMode) {
          // Don't prevent default - let native selection work
          // But ensure no custom classes are applied
          e.stopPropagation();
        }
      });
      
      word.addEventListener('touchstart', (e) => {
        if (this.robotSelectionMode) {
          // Don't prevent default - let native selection work
          // But ensure no custom classes are applied
          e.stopPropagation();
        }
      });
    });
    
    // Restore bookmark if exists
    if (this.currentBookmarkWordIndex >= 0 && this.currentBookmarkWordIndex < this.words.length) {
      this.setBookmark(this.currentBookmarkWordIndex, false);
    }
  }

  // Create bookmark at specific word
  createBookmark(wordIndex) {
    if (wordIndex < 0 || wordIndex >= this.words.length) return;
    
    const targetWord = this.words[wordIndex];
    const wordText = targetWord.textContent.trim();
    
    // Exit selection mode
    this.cancelBookmarkMode();
    
    // Set the bookmark
    this.setBookmark(wordIndex, true);
    
    // Send bookmark data to React Native
    const wordPosition = this.calculateWordPosition(targetWord);
    
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'bookmarkSet',
      data: {
        wordIndex: wordIndex,
        chapterIndex: this.currentChapterIndex,
        wordText: wordText,
        totalWords: this.words.length,
        position: wordPosition,
        timestamp: new Date().toISOString()
      }
    }));
    
    console.log('📖 Bookmark created at:', wordText);
  }

  // Set bookmark at specific word (internal function)
  setBookmark(wordIndex, shouldSave = true) {
    if (wordIndex < 0 || wordIndex >= this.words.length) return;
    
    // Remove previous bookmark styling
    const previousBookmark = document.querySelector('.bookmark-active');
    if (previousBookmark) {
      previousBookmark.classList.remove('bookmark-active');
      const indicator = previousBookmark.querySelector('.bookmark-indicator');
      if (indicator) indicator.remove();
    }
    
    // Apply bookmark to new word
    const targetWord = this.words[wordIndex];
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
    
    this.currentBookmarkWordIndex = wordIndex;
  }

  // Calculate word position relative to chapter
  calculateWordPosition(wordElement) {
    const rect = wordElement.getBoundingClientRect();
    const bodyRect = document.body.getBoundingClientRect();
    
    return {
      x: rect.left - bodyRect.left,
      y: rect.top - bodyRect.top,
      scrollY: window.pageYOffset || document.documentElement.scrollTop
    };
  }

  // Navigation functions
  moveBookmarkNext() {
    if (this.currentBookmarkWordIndex < this.words.length - 1) {
      this.setBookmark(this.currentBookmarkWordIndex + 1);
    } else {
      // Send message to load next chapter
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'requestNextChapter'
      }));
    }
  }

  moveBookmarkPrevious() {
    if (this.currentBookmarkWordIndex > 0) {
      this.setBookmark(this.currentBookmarkWordIndex - 1);
    } else {
      // Send message to load previous chapter
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'requestPreviousChapter'
      }));
    }
  }

  // Jump to specific word by index
  jumpToWord(wordIndex) {
    if (wordIndex >= 0 && wordIndex < this.words.length) {
      this.setBookmark(wordIndex);
    }
  }

  // Toggle bookmark selection mode
  toggleBookmarkMode() {
    this.bookmarkSelectionMode = !this.bookmarkSelectionMode;
    const body = document.body;
    const button = document.getElementById('bookmarkButton');
    const notification = document.getElementById('bookmarkNotification');
    
    if (this.bookmarkSelectionMode) {
      // Enter selection mode
      body.classList.add('bookmark-selection-mode');
      button.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>';
      button.classList.add('active');
      notification.style.display = 'block';
      
      console.log('📖 Bookmark selection mode enabled');
    } else {
      // Exit selection mode
      body.classList.remove('bookmark-selection-mode');
      button.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>';
      button.classList.remove('active');
      notification.style.display = 'none';
      
      console.log('📖 Bookmark selection mode disabled');
    }
  }

  // Cancel bookmark mode
  cancelBookmarkMode() {
    if (!this.bookmarkSelectionMode) return;
    this.bookmarkSelectionMode = false;
    const body = document.body;
    const button = document.getElementById('bookmarkButton');
    const notification = document.getElementById('bookmarkNotification');
    
    body.classList.remove('bookmark-selection-mode');
    button.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>';
    button.classList.remove('active');
    notification.style.display = 'none';
    
    console.log('📖 Bookmark selection mode cancelled');
  }

  // Advanced text selection algorithm for robot button
  improveTextSelection() {
    let selectionTimeout = null;
    let lastSelectionText = '';
    let selectionAttempts = 0;
    const maxSelectionAttempts = 3;
    
    // Enhanced selection detection with multiple methods
    const detectAndHandleSelection = () => {
      if (!this.robotSelectionMode) return;
      
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      const actionButton = document.getElementById('robotActionButton');
      
      console.log('🔍 Selection detection:', {
        selectedText: selectedText,
        textLength: selectedText.length,
        selectionRange: selection.rangeCount,
        attempts: selectionAttempts
      });
      
      if (selectedText && selectedText.length > 0) {
        // Validate selection quality
        if (this.isValidSelection(selectedText)) {
          console.log('✅ Valid selection detected:', selectedText);
          this.showActionButton(actionButton, selectedText);
          selectionAttempts = 0;
          lastSelectionText = selectedText;
        } else {
          console.log('⚠️ Invalid selection, retrying...');
          this.retrySelection();
        }
      } else {
        this.hideActionButton(actionButton);
        selectionAttempts = 0;
      }
    };
    
    // Validate selection quality
    this.isValidSelection = (text) => {
      if (!text || text.length < 1) return false;
      
      // Check for meaningful content
      const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
      const hasLetters = /[a-zA-Z]/.test(text);
      const hasNumbers = /[0-9]/.test(text);
      
      // Must have at least one word with letters or numbers
      return wordCount > 0 && (hasLetters || hasNumbers);
    };
    
    // Retry selection with different methods
    this.retrySelection = () => {
      if (selectionAttempts >= maxSelectionAttempts) {
        console.log('❌ Max selection attempts reached');
        return;
      }
      
      selectionAttempts++;
      console.log('🔄 Retrying selection, attempt:', selectionAttempts);
      
      // Method 1: Force focus and selection
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          if (!range.collapsed) {
            detectAndHandleSelection();
          }
        }
      }, 100 * selectionAttempts);
    };
    
    // Mobile-first button positioning
    this.showActionButton = (button, selectedText) => {
      if (!button) return;
      
      button.style.display = 'block';
      button.style.opacity = '1';
      button.style.pointerEvents = 'auto';
      
      // Mobile-first positioning: always bottom center, but move up if selection is near bottom
      try {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const selectionBottom = rect.bottom;
          
          // If selection is in bottom 40% of screen, move button up
          if (selectionBottom > viewportHeight * 0.6) {
            button.style.bottom = '80px';
            button.classList.add('positioned');
            console.log('🤖 Mobile button positioned above selection');
          } else {
            button.style.bottom = '20px';
            button.classList.remove('positioned');
            console.log('🤖 Mobile button at default bottom position');
          }
          
          // Always center horizontally
          button.style.left = '50%';
          button.style.right = 'auto';
          button.style.top = 'auto';
          button.style.transform = 'translateX(-50%)';
          
          console.log('🤖 Mobile button positioned:', {
            bottom: button.style.bottom,
            selectionBottom: selectionBottom,
            viewportHeight: viewportHeight
          });
        }
      } catch (e) {
        // Fallback to default mobile positioning
        button.style.bottom = '20px';
        button.style.left = '50%';
        button.style.right = 'auto';
        button.style.top = 'auto';
        button.style.transform = 'translateX(-50%)';
        button.classList.remove('positioned');
        
        console.log('🤖 Mobile button using fallback positioning');
      }
    };
    
    // Hide action button with mobile reset
    this.hideActionButton = (button) => {
      if (!button) return;
      
      button.style.display = 'none';
      button.style.opacity = '0';
      button.style.pointerEvents = 'none';
      button.classList.remove('positioned');
      
      // Reset to mobile default positioning
      button.style.bottom = '20px';
      button.style.left = '50%';
      button.style.right = 'auto';
      button.style.top = 'auto';
      button.style.transform = 'translateX(-50%)';
      
      console.log('🤖 Mobile action button hidden and reset');
    };
    
    // Enhanced selection change listener
    document.addEventListener('selectionchange', () => {
      if (!this.robotSelectionMode) return;
      
      // Clear previous timeout
      if (selectionTimeout) {
        clearTimeout(selectionTimeout);
      }
      
      // Debounce selection detection
      selectionTimeout = setTimeout(() => {
        detectAndHandleSelection();
      }, 150);
    });
    
    // Enhanced mouse events for better selection
    document.addEventListener('mouseup', (e) => {
      if (!this.robotSelectionMode) return;
      
      setTimeout(() => {
        detectAndHandleSelection();
      }, 100);
    });
    
    // Mobile-first touch events
    let touchStartTime = 0;
    let touchStartPos = { x: 0, y: 0 };
    let isLongPress = false;
    let touchMoved = false;
    
    document.addEventListener('touchstart', (e) => {
      if (!this.robotSelectionMode) return;
      
      touchStartTime = Date.now();
      touchStartPos = { 
        x: e.touches[0].clientX, 
        y: e.touches[0].clientY 
      };
      isLongPress = false;
      touchMoved = false;
      
      console.log('📱 Mobile touch start');
      
      // Faster long press detection for mobile
      setTimeout(() => {
        if (Date.now() - touchStartTime >= 300 && !touchMoved) {
          isLongPress = true;
          console.log('📱 Mobile long press detected');
        }
      }, 300);
    });
    
    document.addEventListener('touchmove', (e) => {
      if (!this.robotSelectionMode) return;
      
      const touchCurrentPos = { 
        x: e.touches[0].clientX, 
        y: e.touches[0].clientY 
      };
      const distance = Math.sqrt(
        Math.pow(touchCurrentPos.x - touchStartPos.x, 2) + 
        Math.pow(touchCurrentPos.y - touchStartPos.y, 2)
      );
      
      if (distance > 10) {
        touchMoved = true;
        console.log('📱 Mobile touch moved, distance:', distance);
      }
    });
    
    document.addEventListener('touchend', (e) => {
      if (!this.robotSelectionMode) return;
      
      const touchDuration = Date.now() - touchStartTime;
      const touchEndPos = { 
        x: e.changedTouches[0].clientX, 
        y: e.changedTouches[0].clientY 
      };
      const distance = Math.sqrt(
        Math.pow(touchEndPos.x - touchStartPos.x, 2) + 
        Math.pow(touchEndPos.y - touchStartPos.y, 2)
      );
      
      console.log('📱 Mobile touch end:', {
        duration: touchDuration,
        distance: distance,
        isLongPress: isLongPress,
        touchMoved: touchMoved
      });
      
      // Mobile-first selection detection
      if (isLongPress && !touchMoved) {
        // Long press without movement - trigger selection
        setTimeout(() => {
          detectAndHandleSelection();
        }, 200);
      } else if (touchMoved && distance > 15) {
        // Drag selection - immediate detection
        setTimeout(() => {
          detectAndHandleSelection();
        }, 50);
      } else if (touchDuration < 200 && distance < 8) {
        // Quick tap - might be selection
        setTimeout(() => {
          detectAndHandleSelection();
        }, 100);
      }
    });
    
    // Prevent interference with text selection
    document.addEventListener('selectstart', (e) => {
      if (this.robotSelectionMode) {
        // Allow text selection in robot mode
        e.stopPropagation();
      }
    });
    
    // Handle focus events
    document.addEventListener('focusin', (e) => {
      if (this.robotSelectionMode && e.target.tagName !== 'BUTTON') {
        setTimeout(() => {
          detectAndHandleSelection();
        }, 100);
      }
    });
    
    // Handle click events for better selection
    document.addEventListener('click', (e) => {
      if (this.robotSelectionMode && e.target.tagName !== 'BUTTON') {
        setTimeout(() => {
          detectAndHandleSelection();
        }, 150);
      }
    });
  }

  // Get word meaning using Gemini API
  getWordMeaning(wordIndex) {
    if (wordIndex < 0 || wordIndex >= this.words.length) return;
    
    const targetWord = this.words[wordIndex];
    const wordText = targetWord.textContent.trim();
    
    // Exit robot selection mode
    this.robotSelectionMode = false;
    const body = document.body;
    const button = document.getElementById('robotButton');
    const notification = document.getElementById('robotNotification');
    
    body.classList.remove('robot-selection-mode');
    button.classList.remove('active');
    notification.style.display = 'none';
    
    // Show meaning popup
    this.showMeaningPopup(wordText);
    
    console.log('🤖 Getting meaning for:', wordText);
  }

  // Show meaning popup with mobile positioning
  showMeaningPopup(word) {
    console.log('🎯 showMeaningPopup called with word:', word);
    const popup = document.getElementById('meaningPopup');
    const wordElement = document.getElementById('meaningWord');
    const contentElement = document.getElementById('meaningContent');
    
    if (!popup || !wordElement || !contentElement) {
      console.error('❌ Popup elements not found!', { popup, wordElement, contentElement });
      return;
    }
    
    // Set word and show loading
    wordElement.textContent = word;
    contentElement.innerHTML = `
      <div class="meaning-loading">
        <div class="meaning-spinner"></div>
        Getting meaning...
      </div>
    `;
    
    // Ensure popup is perfectly centered and within screen bounds
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.maxWidth = 'calc(100vw - 40px)';
    popup.style.maxHeight = 'calc(100vh - 100px)';
    popup.style.width = '90%';
    popup.style.minWidth = '280px';
    
    popup.classList.add('visible');
    console.log('✅ Popup made visible');
    
    // Force display to ensure it's visible
    popup.style.display = 'block';
    popup.style.zIndex = '2000';
    console.log('📱 Popup styles applied:', {
      display: popup.style.display,
      zIndex: popup.style.zIndex,
      visible: popup.classList.contains('visible')
    });
    
    // Request meaning from React Native
    const message = {
      type: 'getWordMeaning',
      data: {
        word: word,
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('📤 Sending message to React Native:', message);
    window.ReactNativeWebView.postMessage(JSON.stringify(message));
  }

  // Hide meaning popup
  hideMeaningPopup() {
    const popup = document.getElementById('meaningPopup');
    popup.classList.remove('visible');
    popup.style.display = 'none';
    
    // Ensure button is hidden when popup closes
    const actionButton = document.getElementById('robotActionButton');
    if (actionButton) {
      actionButton.style.display = 'none';
      actionButton.style.opacity = '0';
      actionButton.style.pointerEvents = 'none';
      actionButton.style.top = '50%'; // Reset position
    }
    
    console.log('✅ Meaning popup hidden');
  }

  // Set meaning content in popup with smart positioning above selection
  setMeaningContent(meaning, isError = false) {
    console.log('🎯 setMeaningContent called with:', { meaning, isError });
    console.log('🎯 Meaning type:', typeof meaning);
    console.log('🎯 Meaning length:', meaning ? meaning.length : 'null');
    
    const contentElement = document.getElementById('meaningContent');
    const footerElement = document.getElementById('meaningFooter');
    const popup = document.getElementById('meaningPopup');
    
    // Validate elements exist
    if (!contentElement) {
      console.error('❌ meaningContent element not found!');
      return;
    }
    if (!popup) {
      console.error('❌ meaningPopup element not found!');
      return;
    }
    
    // Clear any existing content
    contentElement.innerHTML = '';
    
    // Set content based on error status
    if (isError) {
      console.log('❌ Setting error content:', meaning);
      contentElement.innerHTML = `
        <div class="meaning-error" style="color: #E74C3C; font-style: italic;">
          ❌ ${meaning || 'Failed to get meaning. Please try again.'}
        </div>
      `;
    } else {
      console.log('✅ Setting success content:', meaning);
      // Make sure we have actual content
      const displayMeaning = meaning || 'No meaning available';
      contentElement.innerHTML = `
        <div class="meaning-content" style="font-size: 16px; line-height: 1.6; color: #2A2A2A; font-weight: 500;">
          ${displayMeaning}
        </div>
      `;
    }
    
    // Show footer
    if (footerElement) {
      footerElement.style.display = 'block';
    }
    
    // FORCE popup visibility with smart positioning
    console.log('🔄 Forcing popup visibility with smart positioning...');
    
    // Method 1: Direct style properties with smart positioning
    popup.style.display = 'block';
    popup.style.visibility = 'visible';
    popup.style.opacity = '1';
    popup.style.zIndex = '99999';
    popup.style.position = 'fixed';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    
    // Method 2: CSS class
    popup.classList.add('visible');
    
    // Method 3: Remove any hiding classes
    popup.classList.remove('hidden');
    
    // Method 4: Responsive sizing
    popup.style.maxWidth = 'calc(100vw - 40px)';
    popup.style.maxHeight = 'calc(100vh - 100px)';
    popup.style.width = '90%';
    popup.style.minWidth = '280px';
    
    // Method 5: Disable pointer events during text selection to prevent interference
    popup.style.pointerEvents = 'none';
    
    console.log('✅ Content updated:', contentElement.innerHTML.substring(0, 100));
    console.log('✅ Popup positioned above selection:', {
      display: popup.style.display,
      visibility: popup.style.visibility,
      opacity: popup.style.opacity,
      zIndex: popup.style.zIndex,
      top: popup.style.top,
      left: popup.style.left,
      transform: popup.style.transform,
      pointerEvents: popup.style.pointerEvents
    });
    
    // Method 6: Re-enable pointer events after a delay
    setTimeout(() => {
      popup.style.pointerEvents = 'auto';
      console.log('🔄 Pointer events re-enabled');
    }, 500);
    
    // Method 7: Force with timeout
    setTimeout(() => {
      popup.style.display = 'block';
      popup.style.visibility = 'visible';
      popup.style.opacity = '1';
      popup.classList.add('visible');
      console.log('🔄 Popup visibility reinforced after timeout');
    }, 100);
  }
}
