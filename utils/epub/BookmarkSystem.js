/**
 * Bookmark system functionality
 * Handles bookmark creation, management, and navigation
 */
export class BookmarkSystem {
  constructor() {
    this.currentBookmarkWordIndex = -1;
    this.currentChapterIndex = 0;
    this.bookmarkSelectionMode = false;
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

  // Create bookmark at specific word
  createBookmark(wordIndex, words) {
    if (wordIndex < 0 || wordIndex >= words.length) return;
    
    const targetWord = words[wordIndex];
    const wordText = targetWord.textContent.trim();
    
    // Exit selection mode
    this.cancelBookmarkMode();
    
    // Set the bookmark
    this.setBookmark(wordIndex, words, true);
    
    // Send bookmark data to React Native
    const wordPosition = this.calculateWordPosition(targetWord);
    
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'bookmarkSet',
      data: {
        wordIndex: wordIndex,
        chapterIndex: this.currentChapterIndex,
        wordText: wordText,
        totalWords: words.length,
        position: wordPosition,
        timestamp: new Date().toISOString()
      }
    }));
    
    console.log('📖 Bookmark created at:', wordText);
  }

  // Set bookmark at specific word (internal function)
  setBookmark(wordIndex, words, shouldSave = true) {
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
  moveBookmarkNext(words) {
    if (this.currentBookmarkWordIndex < words.length - 1) {
      this.setBookmark(this.currentBookmarkWordIndex + 1, words);
    } else {
      // Send message to load next chapter
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'requestNextChapter'
      }));
    }
  }

  moveBookmarkPrevious(words) {
    if (this.currentBookmarkWordIndex > 0) {
      this.setBookmark(this.currentBookmarkWordIndex - 1, words);
    } else {
      // Send message to load previous chapter
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'requestPreviousChapter'
      }));
    }
  }

  // Jump to specific word by index
  jumpToWord(wordIndex, words) {
    if (wordIndex >= 0 && wordIndex < words.length) {
      this.setBookmark(wordIndex, words);
    }
  }

  // Remove bookmark
  removeBookmark() {
    const currentBookmark = document.querySelector('.bookmark-active');
    if (currentBookmark) {
      currentBookmark.classList.remove('bookmark-active');
      const indicator = currentBookmark.querySelector('.bookmark-indicator');
      if (indicator) indicator.remove();
    }
    this.currentBookmarkWordIndex = -1;
  }

  // Get current bookmark position
  getBookmarkPosition(words) {
    return {
      wordIndex: this.currentBookmarkWordIndex,
      chapterIndex: this.currentChapterIndex,
      totalWords: words.length
    };
  }

  // Handle messages from React Native
  handleMessage(data, words) {
    switch(data.type) {
      case 'setBookmark':
        if (data.wordIndex >= 0 && data.wordIndex < words.length) {
          this.setBookmark(data.wordIndex, words);
        }
        break;
      case 'moveBookmarkNext':
        this.moveBookmarkNext(words);
        break;
      case 'moveBookmarkPrevious':
        this.moveBookmarkPrevious(words);
        break;
      case 'jumpToWord':
        this.jumpToWord(data.wordIndex, words);
        break;
      case 'getBookmarkPosition':
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'bookmarkPosition',
          data: this.getBookmarkPosition(words)
        }));
        break;
      case 'removeBookmark':
        this.removeBookmark();
        break;
      case 'enableBookmarkMode':
        if (!this.bookmarkSelectionMode) {
          this.toggleBookmarkMode();
        }
        break;
      case 'disableBookmarkMode':
        if (this.bookmarkSelectionMode) {
          this.cancelBookmarkMode();
        }
        break;
    }
  }

  // Initialize bookmark system
  initialize(words) {
    // Restore bookmark if exists
    if (this.currentBookmarkWordIndex >= 0 && this.currentBookmarkWordIndex < words.length) {
      this.setBookmark(this.currentBookmarkWordIndex, words, false);
    }
  }

  // Set chapter index
  setChapterIndex(chapterIndex) {
    this.currentChapterIndex = chapterIndex;
  }

  // Set bookmark position
  setBookmarkPosition(wordIndex) {
    this.currentBookmarkWordIndex = wordIndex;
  }
}
