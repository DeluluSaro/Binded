import JSZip from 'jszip';

/**
 * Core EPUB parsing functionality
 * Handles basic EPUB loading, metadata extraction, and chapter content
 */
export class CoreEpubParser {
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

  // Cleanup
  cleanup() {
    this.epubData = null;
    this.chapterCache = null;
  }
}
