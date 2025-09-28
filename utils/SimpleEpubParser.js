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
            
            /* Only interactive when in bookmark selection mode */
            .bookmark-selection-mode .word {
              cursor: pointer;
            }
            
            /* Robot selection mode styling */
            .robot-selection-mode {
              /* Text is already selectable by default */
            }
            
            /* Global override to prevent ANY orange highlighting in robot mode */
            .robot-selection-mode * {
              background: transparent !important;
              background-color: transparent !important;
              border: none !important;
              box-shadow: none !important;
              transform: none !important;
            }
            
            /* Exception: Keep bookmark styling visible */
            .robot-selection-mode .bookmark-active,
            .robot-selection-mode .bookmark-indicator {
              background: linear-gradient(135deg, #E74C3C 0%, #FF6B5B 100%) !important;
              color: #FFFFFF !important;
              font-weight: 600 !important;
              box-shadow: 0 2px 12px rgba(231, 76, 60, 0.4) !important;
              border: 2px solid #E74C3C !important;
              padding: 4px 8px !important;
              margin: 0 2px !important;
              border-radius: var(--border-radius-small) !important;
              transform: scale(1.02) !important;
              z-index: 10 !important;
              position: relative !important;
            }
            
            /* Allow native text selection in robot mode */
            .robot-selection-mode .word {
              /* Let native selection work naturally */
              user-select: text;
              -webkit-user-select: text;
              -webkit-touch-callout: default;
            }
            
            /* Remove only custom hover effects in robot mode */
            .robot-selection-mode .word:hover {
              background-color: transparent;
            }
            
            /* Mobile-first robot action button */
            #robotActionButton {
              position: fixed !important;
              bottom: 20px !important;
              left: 50% !important;
              transform: translateX(-50%) !important;
              z-index: 10000 !important;
              pointer-events: auto !important;
              user-select: none !important;
              -webkit-user-select: none !important;
              -webkit-touch-callout: none !important;
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
              will-change: transform, opacity !important;
              width: 200px !important;
              height: 50px !important;
              border-radius: 25px !important;
              font-size: 16px !important;
              font-weight: 600 !important;
              box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4) !important;
              backdrop-filter: blur(10px) !important;
              -webkit-backdrop-filter: blur(10px) !important;
            }
            
            /* Mobile positioning when near selection */
            #robotActionButton.positioned {
              bottom: 80px !important;
              left: 50% !important;
              transform: translateX(-50%) !important;
              transition: all 0.2s ease !important;
            }
            
            /* Mobile touch feedback */
            #robotActionButton:active {
              transform: translateX(-50%) scale(0.95) !important;
              box-shadow: 0 4px 12px rgba(102, 126, 234, 0.6) !important;
            }
            
            /* Mobile-specific button states */
            #robotActionButton:hover {
              transform: translateX(-50%) scale(1.02) !important;
              box-shadow: 0 12px 32px rgba(102, 126, 234, 0.6) !important;
            }
            
            /* Word selection highlighting - only in bookmark mode */
            .bookmark-selection-mode .word-selected {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
              color: #FFFFFF !important;
              font-weight: 600;
              box-shadow: 0 2px 12px rgba(102, 126, 234, 0.4);
              border: 2px solid #667eea;
              padding: 4px 8px !important;
              margin: 0 2px;
              border-radius: var(--border-radius-small);
              transform: scale(1.02);
              z-index: 10;
              position: relative;
              display: inline-block;
            }
            
            /* Remove word selection highlighting in robot mode */
            .robot-selection-mode .word-selected {
              background: transparent !important;
              color: inherit !important;
              font-weight: normal;
              box-shadow: none !important;
              border: none !important;
              padding: inherit !important;
              margin: inherit;
              border-radius: inherit;
              transform: none;
              z-index: auto;
              position: static;
              display: inline;
            }
            
            /* Connected selection styling - only in bookmark mode */
            .bookmark-selection-mode .word-selected:not(:first-child) {
              margin-left: -2px;
            }
            
            .bookmark-selection-mode .word-selected:not(:last-child) {
              margin-right: -2px;
            }
            
            /* First word in selection - only in bookmark mode */
            .bookmark-selection-mode .word-selected:first-child {
              border-top-left-radius: var(--border-radius-small);
              border-bottom-left-radius: var(--border-radius-small);
            }
            
            /* Last word in selection - only in bookmark mode */
            .bookmark-selection-mode .word-selected:last-child {
              border-top-right-radius: var(--border-radius-small);
              border-bottom-right-radius: var(--border-radius-small);
            }
            
            /* Middle words in selection - only in bookmark mode */
            .bookmark-selection-mode .word-selected:not(:first-child):not(:last-child) {
              border-radius: 0;
            }
            
            /* Selection connection styling - only in bookmark mode */
            .bookmark-selection-mode .selection-start {
              border-top-left-radius: var(--border-radius-small) !important;
              border-bottom-left-radius: var(--border-radius-small) !important;
              border-top-right-radius: 0 !important;
              border-bottom-right-radius: 0 !important;
            }
            
            .bookmark-selection-mode .selection-middle {
              border-radius: 0 !important;
              margin-left: -2px !important;
              margin-right: -2px !important;
            }
            
            .bookmark-selection-mode .selection-end {
              border-top-right-radius: var(--border-radius-small) !important;
              border-bottom-right-radius: var(--border-radius-small) !important;
              border-top-left-radius: 0 !important;
              border-bottom-left-radius: 0 !important;
            }
            
            /* Single word selection - only in bookmark mode */
            .bookmark-selection-mode .word-selected.selection-start.selection-end {
              border-radius: var(--border-radius-small) !important;
            }
            
            /* Remove all connected selection styling in robot mode */
            .robot-selection-mode .word-selected:not(:first-child),
            .robot-selection-mode .word-selected:not(:last-child),
            .robot-selection-mode .word-selected:first-child,
            .robot-selection-mode .word-selected:last-child,
            .robot-selection-mode .word-selected:not(:first-child):not(:last-child),
            .robot-selection-mode .selection-start,
            .robot-selection-mode .selection-middle,
            .robot-selection-mode .selection-end,
            .robot-selection-mode .word-selected.selection-start.selection-end {
              margin: inherit !important;
              border-radius: inherit !important;
              border: none !important;
            }
            
            /* Word selecting highlight - only in bookmark mode */
            .bookmark-selection-mode .word-selecting {
              background-color: rgba(102, 126, 234, 0.3);
              border-radius: 4px;
              transition: all 0.1s ease;
            }
            
            /* Remove word selecting highlight in robot mode */
            .robot-selection-mode .word-selecting {
              background-color: transparent !important;
              border-radius: inherit !important;
              transition: none !important;
            }
            
            /* Remove ALL custom highlighting in robot mode - allow native selection only */
            .robot-selection-mode .word-selected,
            .robot-selection-mode .word-selecting,
            .robot-selection-mode .word:hover,
            .robot-selection-mode .word:active,
            .robot-selection-mode .word:focus {
              background: transparent !important;
              background-color: transparent !important;
              border: none !important;
              box-shadow: none !important;
              transform: none !important;
              color: inherit !important;
              font-weight: normal !important;
              padding: inherit !important;
              margin: inherit !important;
              border-radius: inherit !important;
              z-index: auto !important;
              position: static !important;
              display: inline !important;
            }
            
            /* Bookmark highlight - permanent orange for bookmarked words */
            .bookmark-active {
              background: linear-gradient(135deg, #E74C3C 0%, #FF6B5B 100%) !important;
              color: #FFFFFF !important;
              font-weight: 600;
              box-shadow: 0 2px 12px rgba(231, 76, 60, 0.4);
              border: 2px solid #E74C3C;
              padding: 4px 8px !important;
              margin: 0 2px;
              border-radius: var(--border-radius-small);
              transform: scale(1.02);
              z-index: 10;
              position: relative;
            }
            
            /* Keep bookmark highlighting visible in robot mode */
            .robot-selection-mode .bookmark-active {
              /* Keep the orange bookmark styling even in robot mode */
            }
            
            /* Completely disable any orange highlighting in robot mode */
            .robot-selection-mode .word {
              background: transparent !important;
              background-color: transparent !important;
              border: none !important;
              box-shadow: none !important;
              transform: none !important;
              color: inherit !important;
              font-weight: normal !important;
              padding: 1px 2px !important;
              margin: inherit !important;
              border-radius: 3px !important;
              z-index: auto !important;
              position: relative !important;
              display: inline !important;
            }
            
            /* Disable any hover effects in robot mode */
            .robot-selection-mode .word:hover,
            .robot-selection-mode .word:active,
            .robot-selection-mode .word:focus,
            .robot-selection-mode .word:visited {
              background: transparent !important;
              background-color: transparent !important;
              border: none !important;
              box-shadow: none !important;
              transform: none !important;
              color: inherit !important;
              font-weight: normal !important;
            }
            
            /* Floating bookmark indicator - permanent for bookmarked words */
            .bookmark-indicator {
              position: absolute;
              top: -18px;
              left: 50%;
              transform: translateX(-50%);
              width: 0;
              height: 0;
              border-left: 8px solid transparent;
              border-right: 8px solid transparent;
              border-bottom: 12px solid #E74C3C;
              z-index: 20;
              animation: bookmarkPulse 2s infinite;
            }
            
            /* Keep bookmark indicators visible in robot mode */
            .robot-selection-mode .bookmark-indicator {
              display: block;
            }
            
            .bookmark-indicator {
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
              background: rgba(183, 170, 153, 0.85); /* Adjusted for new BG */
              backdrop-filter: blur(20px);
              -webkit-backdrop-filter: blur(20px);
              border-bottom: 1px solid rgba(0,0,0,0.1);
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
              background: rgba(255, 255, 255, 0.1);
              border: 1px solid rgba(255, 255, 255, 0.2);
              color: #FFFFFF;
              font-size: 18px;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.2s ease;
              box-shadow: 0 2px 8px var(--shadow-light);
              cursor: pointer;
            }
            
            .nav-btn:hover {
              background: rgba(255, 255, 255, 0.2);
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
              background: var(--accent-color);
              border: 2px solid var(--accent-color);
              color: white;
              font-size: 18px;
              font-weight: 600;
              transition: all 0.3s ease;
            }
            
            .bookmark-button:hover {
              background: var(--accent-light);
              border-color: var(--accent-light);
              transform: translateY(-1px);
              box-shadow: 0 4px 12px rgba(231, 76, 60, 0.4);
            }
            
            .bookmark-button.active {
              background: linear-gradient(135deg, #E74C3C 0%, #FF6B5B 100%);
              border-color: #E74C3C;
              color: white;
              box-shadow: 0 4px 16px rgba(231, 76, 60, 0.5);
            }
            
            /* Robot button styling */
            .robot-button {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border: 2px solid #667eea;
              color: white;
              font-size: 20px;
              font-weight: 600;
              transition: all 0.3s ease;
            }
            
            .robot-button:hover {
              background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
              border-color: #764ba2;
              transform: translateY(-1px);
              box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            }
            
            .robot-button.active {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-color: #667eea;
              color: white;
              box-shadow: 0 4px 16px rgba(102, 126, 234, 0.5);
              animation: robotPulse 2s infinite;
            }
            
            @keyframes robotPulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.05); }
            }
            
            /* Cancel button */
            .cancel-button {
              width: 44px;
              height: 44px;
              padding: 0;
              background: rgba(255, 255, 255, 0.15);
              color: #FFFFFF;
              border: 2px solid rgba(255, 255, 255, 0.3);
              border-radius: 50%;
              font-size: 18px;
              font-weight: 600;
              font-family: 'Plus Jakarta Sans', sans-serif;
              box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
              transition: all 0.3s ease;
              z-index: 1000;
              display: none;
              cursor: pointer;
              backdrop-filter: blur(10px);
              -webkit-backdrop-filter: blur(10px);
              align-items: center;
              justify-content: center;
            }
            
            .cancel-button:hover {
              background: rgba(255, 255, 255, 0.25);
              border-color: rgba(255, 255, 255, 0.5);
              transform: translateY(-2px);
              box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
            }
            
            .cancel-button:active {
              transform: translateY(0);
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            
            .bookmark-selection-mode .cancel-button {
              display: flex;
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
            
            /* Robot notification */
            .robot-notification {
              position: fixed;
              top: 100px;
              left: 50%;
              transform: translateX(-50%);
              background: rgba(102, 126, 234, 0.95);
              color: white;
              padding: 20px 40px;
              border-radius: 28px;
              font-size: 16px;
              font-weight: 500;
              font-family: 'Plus Jakarta Sans', sans-serif;
              z-index: 1000;
              display: none;
              box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
              backdrop-filter: blur(20px);
              animation: slideDown 0.3s ease;
              pointer-events: none;
              min-width: 300px;
              text-align: center;
              max-width: 90%;
            }
            
            .robot-selection-mode .robot-notification {
              display: block;
            }
            
            /* Meaning popup */
            .meaning-popup {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background: rgba(255, 255, 255, 0.98);
              border-radius: 16px;
              padding: 24px;
              max-width: 400px;
              width: 90%;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
              backdrop-filter: blur(20px);
              z-index: 2000;
              display: none;
              border: 1px solid rgba(102, 126, 234, 0.2);
            }
            
            .meaning-popup.visible {
              display: block;
              animation: popupSlideIn 0.3s ease;
            }
            
            @keyframes popupSlideIn {
              from {
                opacity: 0;
                transform: translate(-50%, -50%) scale(0.9);
              }
              to {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
              }
            }
            
            .meaning-popup-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 16px;
              padding-bottom: 12px;
              border-bottom: 1px solid rgba(0, 0, 0, 0.1);
            }
            
            .meaning-word {
              font-size: 20px;
              font-weight: 700;
              color: #667eea;
            }
            
            .meaning-close {
              background: none;
              border: none;
              font-size: 24px;
              cursor: pointer;
              color: #999;
              padding: 4px;
              border-radius: 50%;
              transition: all 0.2s ease;
            }
            
            .meaning-close:hover {
              background: rgba(0, 0, 0, 0.1);
              color: #333;
            }
            
            .meaning-content {
              font-size: 16px;
              line-height: 1.6;
              color: #333;
            }
            
            .meaning-loading {
              display: flex;
              align-items: center;
              gap: 12px;
              color: #667eea;
              font-style: italic;
            }
            
            .meaning-spinner {
              width: 20px;
              height: 20px;
              border: 2px solid #667eea;
              border-top: 2px solid transparent;
              border-radius: 50%;
              animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            
            .meaning-error {
              color: #E74C3C;
              font-style: italic;
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
              user-select: text;
              -webkit-user-select: text;
              -webkit-touch-callout: default;
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
            
            /* Mobile-first responsiveness */
            @media (max-width: 768px) {
              .content-container {
                margin: 0;
                box-shadow: none;
                border-radius: 0;
              }
              
              #content {
                padding: 100px 20px 100px 20px; /* Extra bottom padding for mobile button */
              }
              
              .top-nav {
                padding: 0 16px;
                height: 70px;
              }
              
              .nav-btn {
                width: 44px;
                height: 44px;
                font-size: 18px;
                min-width: 44px;
                min-height: 44px;
              }
              
              /* Mobile robot button - bottom center */
              #robotActionButton {
                bottom: 20px !important;
                left: 50% !important;
                right: auto !important;
                top: auto !important;
                transform: translateX(-50%) !important;
                width: 180px !important;
                height: 48px !important;
                font-size: 15px !important;
                padding: 0 20px !important;
                border-radius: 24px !important;
              }
              
              /* Mobile positioned button */
              #robotActionButton.positioned {
                bottom: 80px !important;
                left: 50% !important;
                transform: translateX(-50%) !important;
              }
            }
            
            @media (max-width: 480px) {
              #content {
                padding: 90px 16px 100px 16px; /* Extra bottom padding for mobile button */
              }
              
              .top-nav {
                padding: 0 12px;
                gap: 8px;
                height: 65px;
              }
              
              .nav-section {
                gap: 8px;
              }
              
              .nav-btn {
                width: 40px;
                height: 40px;
                font-size: 16px;
                min-width: 40px;
                min-height: 40px;
              }
              
              p {
                text-indent: 1.5em;
              }
              
              /* Small mobile robot button */
              #robotActionButton {
                bottom: 15px !important;
                width: 160px !important;
                height: 44px !important;
                font-size: 14px !important;
                padding: 0 16px !important;
                border-radius: 22px !important;
              }
              
              #robotActionButton.positioned {
                bottom: 70px !important;
              }
            }
          </style>
        </head>
        <body>
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
          
          <div class="bookmark-notification" id="bookmarkNotification">
            Touch any word to create bookmark
          </div>
          
          <div class="robot-notification" id="robotNotification">
            Long press text to select, then get meaning automatically
          </div>
          
          <div class="meaning-popup" id="meaningPopup">
            <div class="meaning-popup-header">
              <div class="meaning-word" id="meaningWord">Word</div>
              <button class="meaning-close" id="meaningClose">×</button>
            </div>
            <div class="meaning-content" id="meaningContent">
              <div class="meaning-loading">
                <div class="meaning-spinner"></div>
                Getting meaning...
              </div>
            </div>
          </div>
          
          <div class="content-container">
            <div id="content">${wrappedContent}</div>
          </div>
          
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
                
                // Prevent any custom highlighting in robot mode
                word.addEventListener('mousedown', (e) => {
                  if (robotSelectionMode) {
                    // Don't prevent default - let native selection work
                    // But ensure no custom classes are applied
                    e.stopPropagation();
                  }
                });
                
                word.addEventListener('touchstart', (e) => {
                  if (robotSelectionMode) {
                    // Don't prevent default - let native selection work
                    // But ensure no custom classes are applied
                    e.stopPropagation();
                  }
                });
                
                // No custom touch events needed - using native text selection
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
            function cancelBookmarkMode() {
              if (!bookmarkSelectionMode) return;
              bookmarkSelectionMode = false;
              const body = document.body;
              const button = document.getElementById('bookmarkButton');
              const notification = document.getElementById('bookmarkNotification');
              
              body.classList.remove('bookmark-selection-mode');
              button.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>';
              button.classList.remove('active');
              notification.style.display = 'none';
              
              console.log('📖 Bookmark selection mode cancelled');
            }
            
            // Toggle robot mode
            function toggleRobotMode() {
              robotMode = !robotMode;
              robotSelectionMode = robotMode;
              const body = document.body;
              const button = document.getElementById('robotButton');
              const notification = document.getElementById('robotNotification');
              
              if (robotMode) {
                // Enter robot selection mode
                body.classList.add('robot-selection-mode');
                button.classList.add('active');
                notification.style.display = 'block';
                console.log('🤖 Robot selection mode enabled - use native text selection');
                
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
            
            // Handle native text selection
            function handleTextSelection() {
              const selection = window.getSelection();
              const selectedText = selection.toString().trim();
              
              if (selectedText && robotSelectionMode) {
                console.log('🤖 Native text selected:', selectedText);
                
                // Don't show popup automatically - let user click button
                // Just show the action button
              }
            }
            
            // Enhanced function to get selected text meaning with validation
            function getSelectedTextMeaning() {
              const selection = window.getSelection();
              const selectedText = selection.toString().trim();
              
              console.log('🤖 Getting meaning for selected text:', {
                text: selectedText,
                length: selectedText.length,
                robotMode: robotSelectionMode,
                selectionRange: selection.rangeCount
              });
              
              if (selectedText && robotSelectionMode) {
                // Validate selection before proceeding
                if (!isValidSelection(selectedText)) {
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
                
                // Show meaning popup
                showMeaningPopup(selectedText);
                
                // Don't exit robot mode here - let user decide when to exit
                console.log('🤖 Meaning requested, staying in robot mode');
              } else {
                console.log('❌ No valid selection or not in robot mode');
              }
            }
            
            // Helper function to validate selection (reused from improveTextSelection)
            function isValidSelection(text) {
              if (!text || text.length < 1) return false;
              
              // Check for meaningful content
              const wordCount = text.split(/\\s+/).filter(word => word.length > 0).length;
              const hasLetters = /[a-zA-Z]/.test(text);
              const hasNumbers = /[0-9]/.test(text);
              
              // Must have at least one word with letters or numbers
              return wordCount > 0 && (hasLetters || hasNumbers);
            }
            
            // Mobile-first robot action button creation
            function addRobotActionButton() {
              // Create a mobile-optimized floating action button
              const actionButton = document.createElement('button');
              actionButton.id = 'robotActionButton';
              actionButton.innerHTML = '🤖 Get Meaning';
              actionButton.style.cssText = \`
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
              \`;
              
              // Mobile-optimized click handling
              actionButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🤖 Mobile action button clicked');
                getSelectedTextMeaning();
              });
              
              // Mobile touch events with proper feedback
              let touchStartTime = 0;
              
              actionButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                touchStartTime = Date.now();
                actionButton.style.transform = 'translateX(-50%) scale(0.95)';
                actionButton.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.6)';
                console.log('🤖 Mobile touch start');
              });
              
              actionButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const touchDuration = Date.now() - touchStartTime;
                
                // Reset visual state
                actionButton.style.transform = 'translateX(-50%) scale(1)';
                actionButton.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.4)';
                
                // Only trigger if it was a quick tap (not a long press)
                if (touchDuration < 500) {
                  console.log('🤖 Mobile touch end - quick tap');
                  getSelectedTextMeaning();
                } else {
                  console.log('🤖 Mobile touch end - long press, ignoring');
                }
              });
              
              // Prevent context menu on long press
              actionButton.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
              });
              
              // Mobile hover effects (for devices that support hover)
              actionButton.addEventListener('mouseenter', () => {
                if (actionButton.style.display !== 'none') {
                  actionButton.style.transform = 'translateX(-50%) scale(1.02)';
                  actionButton.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.6)';
                }
              });
              
              actionButton.addEventListener('mouseleave', () => {
                if (actionButton.style.display !== 'none') {
                  actionButton.style.transform = 'translateX(-50%) scale(1)';
                  actionButton.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.4)';
                }
              });
              
              document.body.appendChild(actionButton);
              console.log('🤖 Mobile robot action button created and added to DOM');
              return actionButton;
            }
            
            
            // Get word meaning using Gemini API
            function getWordMeaning(wordIndex) {
              if (wordIndex < 0 || wordIndex >= words.length) return;
              
              const targetWord = words[wordIndex];
              const wordText = targetWord.textContent.trim();
              
              // Exit robot selection mode
              robotSelectionMode = false;
              const body = document.body;
              const button = document.getElementById('robotButton');
              const notification = document.getElementById('robotNotification');
              
              body.classList.remove('robot-selection-mode');
              button.classList.remove('active');
              notification.style.display = 'none';
              
              // Show meaning popup
              showMeaningPopup(wordText);
              
              console.log('🤖 Getting meaning for:', wordText);
            }
            
            // Show meaning popup
            function showMeaningPopup(word) {
              const popup = document.getElementById('meaningPopup');
              const wordElement = document.getElementById('meaningWord');
              const contentElement = document.getElementById('meaningContent');
              
              // Set word and show loading
              wordElement.textContent = word;
              contentElement.innerHTML = \`
                <div class="meaning-loading">
                  <div class="meaning-spinner"></div>
                  Getting meaning...
                </div>
              \`;
              
              popup.classList.add('visible');
              
              // Request meaning from React Native
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'getWordMeaning',
                data: {
                  word: word,
                  timestamp: new Date().toISOString()
                }
              }));
            }
            
            // Hide meaning popup
            function hideMeaningPopup() {
              const popup = document.getElementById('meaningPopup');
              popup.classList.remove('visible');
              
              // Ensure button is hidden when popup closes
              const actionButton = document.getElementById('robotActionButton');
              if (actionButton) {
                actionButton.style.display = 'none';
                actionButton.style.opacity = '0';
                actionButton.style.pointerEvents = 'none';
                actionButton.style.top = '50%'; // Reset position
              }
            }
            
            // Set meaning content in popup
            function setMeaningContent(meaning, isError = false) {
              const contentElement = document.getElementById('meaningContent');
              
              if (isError) {
                contentElement.innerHTML = \`
                  <div class="meaning-error">
                    ❌ Failed to get meaning. Please try again.
                  </div>
                \`;
              } else {
                contentElement.innerHTML = \`
                  <div class="meaning-content">
                    \${meaning}
                  </div>
                \`;
              }
            }
            
            // Advanced text selection algorithm for robot button
            function improveTextSelection() {
              let selectionTimeout = null;
              let lastSelectionText = '';
              let selectionAttempts = 0;
              const maxSelectionAttempts = 3;
              
              // Enhanced selection detection with multiple methods
              function detectAndHandleSelection() {
                if (!robotSelectionMode) return;
                
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
                  if (isValidSelection(selectedText)) {
                    console.log('✅ Valid selection detected:', selectedText);
                    showActionButton(actionButton, selectedText);
                    selectionAttempts = 0;
                    lastSelectionText = selectedText;
                  } else {
                    console.log('⚠️ Invalid selection, retrying...');
                    retrySelection();
                  }
                } else {
                  hideActionButton(actionButton);
                  selectionAttempts = 0;
                }
              }
              
              // Validate selection quality
              function isValidSelection(text) {
                if (!text || text.length < 1) return false;
                
                // Check for meaningful content
                const wordCount = text.split(/\\s+/).filter(word => word.length > 0).length;
                const hasLetters = /[a-zA-Z]/.test(text);
                const hasNumbers = /[0-9]/.test(text);
                
                // Must have at least one word with letters or numbers
                return wordCount > 0 && (hasLetters || hasNumbers);
              }
              
              // Retry selection with different methods
              function retrySelection() {
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
              }
              
              // Mobile-optimized button positioning
              function showActionButton(button, selectedText) {
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
                    
                    // If selection is in bottom 30% of screen, move button up
                    if (selectionBottom > viewportHeight * 0.7) {
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
              }
              
              // Hide action button with mobile reset
              function hideActionButton(button) {
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
              }
              
              // Enhanced selection change listener
              document.addEventListener('selectionchange', () => {
                if (!robotSelectionMode) return;
                
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
                if (!robotSelectionMode) return;
                
                setTimeout(() => {
                  detectAndHandleSelection();
                }, 100);
              });
              
              // Mobile-optimized touch events
              let touchStartTime = 0;
              let touchStartPos = { x: 0, y: 0 };
              let isLongPress = false;
              let touchMoved = false;
              
              document.addEventListener('touchstart', (e) => {
                if (!robotSelectionMode) return;
                
                touchStartTime = Date.now();
                touchStartPos = { 
                  x: e.touches[0].clientX, 
                  y: e.touches[0].clientY 
                };
                isLongPress = false;
                touchMoved = false;
                
                console.log('📱 Mobile touch start');
                
                // Long press detection for mobile
                setTimeout(() => {
                  if (Date.now() - touchStartTime >= 500 && !touchMoved) {
                    isLongPress = true;
                    console.log('📱 Mobile long press detected');
                  }
                }, 500);
              });
              
              document.addEventListener('touchmove', (e) => {
                if (!robotSelectionMode) return;
                
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
                if (!robotSelectionMode) return;
                
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
                
                // Mobile-optimized selection detection
                if (isLongPress && !touchMoved) {
                  // Long press without movement - trigger selection
                  setTimeout(() => {
                    detectAndHandleSelection();
                  }, 300);
                } else if (touchMoved && distance > 20) {
                  // Drag selection - immediate detection
                  setTimeout(() => {
                    detectAndHandleSelection();
                  }, 100);
                } else if (touchDuration < 300 && distance < 10) {
                  // Quick tap - might be selection
                  setTimeout(() => {
                    detectAndHandleSelection();
                  }, 150);
                }
              });
              
              // Prevent interference with text selection
              document.addEventListener('selectstart', (e) => {
                if (robotSelectionMode) {
                  // Allow text selection in robot mode
                  e.stopPropagation();
                }
              });
              
              // Handle focus events
              document.addEventListener('focusin', (e) => {
                if (robotSelectionMode && e.target.tagName !== 'BUTTON') {
                  setTimeout(() => {
                    detectAndHandleSelection();
                  }, 100);
                }
              });
              
              // Handle click events for better selection
              document.addEventListener('click', (e) => {
                if (robotSelectionMode && e.target.tagName !== 'BUTTON') {
                  setTimeout(() => {
                    detectAndHandleSelection();
                  }, 150);
                }
              });
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
                case 'enableRobotMode':
                  if (!robotMode) {
                    toggleRobotMode();
                  }
                  break;
                case 'disableRobotMode':
                  if (robotMode) {
                    toggleRobotMode();
                  }
                  break;
                case 'wordMeaningResponse':
                  if (data.meaning) {
                    setMeaningContent(data.meaning, false);
                  } else if (data.error) {
                    setMeaningContent(data.error, true);
                  }
                  break;
              }
            });
            
            // Initialize when DOM is ready
            document.addEventListener('DOMContentLoaded', () => {
              initializeWordTracking();
              
              // Add meaning popup event listeners
              const meaningClose = document.getElementById('meaningClose');
              const meaningPopup = document.getElementById('meaningPopup');
              
              if (meaningClose) {
                meaningClose.addEventListener('click', hideMeaningPopup);
              }
              
              // Close popup when clicking outside
              if (meaningPopup) {
                meaningPopup.addEventListener('click', (e) => {
                  if (e.target === meaningPopup) {
                    hideMeaningPopup();
                  }
                });
              }
              
              // Add robot action button
              addRobotActionButton();
              
              // Improve text selection handling
              improveTextSelection();
              
              // Listen for native text selection changes with improved detection
              document.addEventListener('selectionchange', () => {
                if (robotSelectionMode) {
                  // Use setTimeout to ensure selection is stable
                  setTimeout(() => {
                    const selection = window.getSelection();
                    const selectedText = selection.toString().trim();
                    const actionButton = document.getElementById('robotActionButton');
                    
                    if (selectedText && selectedText.length > 1 && actionButton) {
                      // Only show if we have meaningful text selected
                      const range = selection.getRangeAt ? selection.getRangeAt(0) : null;
                      if (range && !range.collapsed) {
                        actionButton.style.display = 'block';
                        actionButton.style.opacity = '1';
                        actionButton.style.pointerEvents = 'auto';
                        
                        // Position button near selection if possible
                        try {
                          const rect = range.getBoundingClientRect();
                          if (rect.top > 0 && rect.left > 0) {
                            const buttonTop = Math.min(rect.bottom + 10, window.innerHeight - 100);
                            actionButton.style.top = buttonTop + 'px';
                          }
                        } catch (e) {
                          // Fallback to center positioning
                          actionButton.style.top = '50%';
                        }
                      }
                    } else if (actionButton) {
                      actionButton.style.display = 'none';
                      actionButton.style.opacity = '0';
                      actionButton.style.pointerEvents = 'none';
                      // Reset position
                      actionButton.style.top = '50%';
                    }
                  }, 100); // Small delay to ensure selection is complete
                }
              });
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
          
          .blank-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 24px auto;
            background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 36px;
            color: #FFFFFF;
            box-shadow: 
              0 8px 16px rgba(0, 0, 0, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.3);
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
          
          .auto-navigate {
            font-size: 14px;
            font-weight: 500;
            color: rgba(255,255,255,0.9);
            margin-top: 24px;
            padding: 16px 20px;
            background: rgba(0,0,0,0.2);
            border-radius: 16px;
            border: 1px solid rgba(255,255,255,0.2);
          }
          
          .countdown {
            font-weight: 700;
            color: #FFFFFF;
            font-size: 16px;
          }
          
          .progress-ring {
            width: 48px;
            height: 48px;
            margin: 16px auto 0 auto;
            position: relative;
          }
          
          .progress-ring-circle {
            stroke: #FFFFFF;
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
            stroke: rgba(255,255,255,0.3);
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
            
            console.log('🔄 Blank page auto-navigation initialized');
            console.log('🔄 Next chapter available:', ${hasNextChapter});
            console.log('🔄 WebView available:', typeof window.ReactNativeWebView !== 'undefined');
            
            const timer = setInterval(() => {
              countdown--;
              if (countdownElement) {
                countdownElement.textContent = countdown;
              }
              
              console.log('⏰ Countdown:', countdown);
              
              if (countdown <= 0) {
                clearInterval(timer);
                console.log('🚀 Attempting to navigate to next chapter...');
                
                // Notify React Native to go to next chapter
                if (window.ReactNativeWebView) {
                  console.log('📤 Sending requestNextChapter message...');
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'requestNextChapter'
                  }));
                } else {
                  console.error('❌ ReactNativeWebView not available');
                }
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

