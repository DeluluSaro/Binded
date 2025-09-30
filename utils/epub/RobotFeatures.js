/**
 * Robot/AI features functionality
 * Handles AI-powered text selection, meaning lookup, and robot mode
 */
export class RobotFeatures {
  constructor() {
    this.robotMode = false;
    this.robotSelectionMode = false;
    this.selectedWords = [];
    this.selectionStartIndex = -1;
  }

  // Toggle robot mode
  toggleRobotMode() {
    this.robotMode = !this.robotMode;
    this.robotSelectionMode = this.robotMode;
    const body = document.body;
    const button = document.getElementById('robotButton');
    const notification = document.getElementById('robotNotification');
    
    if (this.robotMode) {
      // Enter robot selection mode
      body.classList.add('robot-selection-mode');
      button.classList.add('active');
      notification.style.display = 'block';
      console.log('🤖 Robot selection mode enabled - use native text selection');
      
      // Show popup immediately with loading state
      this.showRobotPopup();
      
      // Send message to React Native
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'robotModeEnabled',
        data: {
          enabled: true,
          timestamp: new Date().toISOString()
        }
      }));
    } else {
      // Exit robot selection mode
      body.classList.remove('robot-selection-mode');
      button.classList.remove('active');
      notification.style.display = 'none';
      
      // Hide popup
      this.hideRobotPopup();
      
      console.log('🤖 Robot selection mode disabled');
      
      // Send message to React Native
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'robotModeDisabled',
        data: {
          enabled: false,
          timestamp: new Date().toISOString()
        }
      }));
    }
  }

  // Show robot popup immediately when robot mode is enabled
  showRobotPopup() {
    console.log('🤖 Showing robot popup');
    const popup = document.getElementById('meaningPopup');
    const wordElement = document.getElementById('meaningWord');
    const contentElement = document.getElementById('meaningContent');
    
    if (!popup || !wordElement || !contentElement) {
      console.error('❌ Popup elements not found!');
      return;
    }
    
    // Set word and show loading
    wordElement.textContent = '🤖 AI Assistant';
    contentElement.innerHTML = `
      <div class="meaning-loading">
        <div class="meaning-spinner"></div>
        Select text to get meaning...
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
    popup.style.display = 'block';
    popup.style.zIndex = '2000';
    
    console.log('✅ Robot popup shown');
  }

  // Hide robot popup
  hideRobotPopup() {
    const popup = document.getElementById('meaningPopup');
    if (popup) {
      popup.classList.remove('visible');
      popup.style.display = 'none';
      console.log('✅ Robot popup hidden');
    }
  }

  // Update robot popup with selected text and loading state
  updateRobotPopupWithSelection(selectedText) {
    console.log('🤖 Updating robot popup with selection:', selectedText);
    const popup = document.getElementById('meaningPopup');
    const wordElement = document.getElementById('meaningWord');
    const contentElement = document.getElementById('meaningContent');
    
    if (!popup || !wordElement || !contentElement) {
      console.error('❌ Popup elements not found!');
      return;
    }
    
    // Update word and show loading
    wordElement.textContent = selectedText;
    contentElement.innerHTML = `
      <div class="meaning-loading">
        <div class="meaning-spinner"></div>
        Getting meaning...
      </div>
    `;
    
    // Ensure popup stays visible
    popup.style.display = 'block';
    popup.style.zIndex = '2000';
    popup.classList.add('visible');
    
    // Request meaning from React Native
    const message = {
      type: 'getWordMeaning',
      data: {
        word: selectedText,
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('📤 Sending message to React Native:', message);
    window.ReactNativeWebView.postMessage(JSON.stringify(message));
  }

  // Handle native text selection
  handleTextSelection() {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText && this.robotSelectionMode) {
      console.log('🤖 Native text selected:', selectedText);
      
      // Don't show popup automatically - let user click button
      // Just show the action button
    }
  }

  // Enhanced function to get selected text meaning with validation
  getSelectedTextMeaning() {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    console.log('🤖 Getting meaning for selected text:', {
      text: selectedText,
      length: selectedText.length,
      robotMode: this.robotSelectionMode,
      selectionRange: selection.rangeCount
    });
    
    if (selectedText && this.robotSelectionMode) {
      // Validate selection before proceeding
      if (!this.isValidSelection(selectedText)) {
        console.log('❌ Invalid selection, cannot get meaning');
        return;
      }
      
      console.log('✅ Valid selection confirmed, getting meaning...');
      
      // Hide the action button immediately
      const actionButton = document.getElementById('robotActionButton');
      if (actionButton) {
        actionButton.style.display = 'none';
        actionButton.style.opacity = '0';
        actionButton.style.pointerEvents = 'none';
        actionButton.classList.remove('positioned');
      }
      
      // Clear the selection to prevent interference
      selection.removeAllRanges();
      
      // Update existing popup with selected text and loading
      this.updateRobotPopupWithSelection(selectedText);
      
      // Don't exit robot mode here - let user decide when to exit
      console.log('🤖 Meaning requested, staying in robot mode');
    } else {
      console.log('❌ No valid selection or not in robot mode');
    }
  }

  // Helper function to validate selection
  isValidSelection(text) {
    if (!text || text.length < 1) return false;
    
    // Check for meaningful content
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    const hasLetters = /[a-zA-Z]/.test(text);
    const hasNumbers = /[0-9]/.test(text);
    
    // Must have at least one word with letters or numbers
    return wordCount > 0 && (hasLetters || hasNumbers);
  }

  // Mobile-first robot action button creation
  addRobotActionButton() {
    // Create a mobile-optimized floating action button
    const actionButton = document.createElement('button');
    actionButton.id = 'robotActionButton';
    actionButton.innerHTML = '🤖 Get Meaning';
    actionButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 25px;
      padding: 0 20px;
      font-size: 16px;
      font-weight: 600;
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
      z-index: 10000;
      display: none;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      opacity: 0;
      width: 200px;
      height: 50px;
      text-align: center;
      font-family: 'Plus Jakarta Sans', sans-serif;
      pointer-events: none;
      user-select: none;
      -webkit-user-select: none;
      -webkit-touch-callout: none;
      will-change: transform, opacity;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    `;
    
    // Mobile-optimized click handling
    actionButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('🤖 Mobile action button clicked');
      this.getSelectedTextMeaning();
    });
    
    // Mobile-first touch events with proper feedback
    let touchStartTime = 0;
    let touchMoved = false;
    
    actionButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      touchStartTime = Date.now();
      touchMoved = false;
      actionButton.style.transform = 'translateX(-50%) scale(0.95)';
      actionButton.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.6)';
      console.log('🤖 Mobile touch start');
    });
    
    actionButton.addEventListener('touchmove', (e) => {
      touchMoved = true;
    });
    
    actionButton.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const touchDuration = Date.now() - touchStartTime;
      
      // Reset visual state
      actionButton.style.transform = 'translateX(-50%) scale(1)';
      actionButton.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.4)';
      
      // Only trigger if it was a quick tap without movement
      if (touchDuration < 300 && !touchMoved) {
        console.log('🤖 Mobile touch end - quick tap');
        this.getSelectedTextMeaning();
      } else {
        console.log('🤖 Mobile touch end - long press or moved, ignoring');
      }
    });
    
    // Prevent context menu on long press
    actionButton.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    
    document.body.appendChild(actionButton);
    console.log('🤖 Mobile robot action button created and added to DOM');
    return actionButton;
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

  // Handle messages from React Native
  handleMessage(data) {
    switch(data.type) {
      case 'enableRobotMode':
        if (!this.robotMode) {
          this.toggleRobotMode();
        }
        break;
      case 'disableRobotMode':
        if (this.robotMode) {
          this.toggleRobotMode();
        }
        break;
      case 'wordMeaningResponse':
        console.log('📨 Processing wordMeaningResponse:', data);
        
        // CRITICAL: Check what we actually received
        if (data.meaning) {
          console.log('✅ Meaning found:', data.meaning);
          console.log('✅ Meaning type:', typeof data.meaning);
          console.log('✅ Meaning length:', data.meaning.length);
          
          // Call the display function
          this.setMeaningContent(data.meaning, false);
          
          // FORCE popup visibility (add this as backup)
          const popup = document.getElementById('meaningPopup');
          if (popup) {
            popup.style.display = 'block';
            popup.style.visibility = 'visible';
            popup.style.opacity = '1';
            popup.classList.add('visible');
          }
          
        } else if (data.error) {
          console.log('❌ Error received:', data.error);
          this.setMeaningContent(data.error, true);
        } else {
          console.log('❌ No meaning or error in response');
          console.log('❌ Full data object:', JSON.stringify(data, null, 2));
          this.setMeaningContent('No meaning available', true);
        }
        break;
    }
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
