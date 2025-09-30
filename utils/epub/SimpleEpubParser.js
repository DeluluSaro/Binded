import { BookmarkSystem } from './BookmarkSystem.js';
import { CoreEpubParser } from './CoreEpubParser.js';
import { HtmlGenerator } from './HtmlGenerator.js';
import { RobotFeatures } from './RobotFeatures.js';
import { WordTracker } from './WordTracker.js';

/**
 * Main SimpleEpubParser class that combines all modules
 * This is the main entry point for EPUB parsing functionality
 */
export class SimpleEpubParser {
  constructor() {
    // Initialize all modules
    this.coreParser = new CoreEpubParser();
    this.htmlGenerator = new HtmlGenerator();
    this.wordTracker = new WordTracker();
    this.bookmarkSystem = new BookmarkSystem();
    this.robotFeatures = new RobotFeatures();
    
    // Expose core functionality
    this.epubData = null;
    this.chapterCache = new Map();
  }

  // Getter for epubData to check if it's loaded
  get isLoaded() {
    return this.coreParser.isLoaded;
  }

  // Download and parse EPUB directly from URL
  async loadEpubFromUrl(epubUrl) {
    return this.coreParser.loadEpubFromUrl(epubUrl);
  }

  // Alias for loadEpubFromUrl for compatibility
  async loadEpub(epubUrl) {
    return this.coreParser.loadEpub(epubUrl);
  }

  // Get book metadata
  async getBookMetadata() {
    return this.coreParser.getBookMetadata();
  }

  // Parse container.xml to get OPF path
  async getOPFPath() {
    return this.coreParser.getOPFPath();
  }

  // Parse OPF file to get book metadata and chapters
  async getBookInfo() {
    return this.coreParser.getBookInfo();
  }

  // Get chapter content directly from ZIP
  async getChapterContent(chapterIndex, fontSize = 18, bookmarkPosition = -1) {
    try {
      // Get the raw content from core parser
      const content = await this.coreParser.getChapterContent(chapterIndex, fontSize, bookmarkPosition);
      
      // If it's already processed HTML, return it
      if (typeof content === 'string' && content.includes('<!DOCTYPE html>')) {
        return content;
      }
      
      // Otherwise, process it through HTML generator
      const bookInfo = await this.coreParser.getBookInfo();
      const wordCount = this.coreParser.countWords(content);
      
      if (wordCount < 10) {
        console.log(`⚠️ Chapter ${chapterIndex} has very little content (${wordCount} words), showing blank page...`);
        return this.htmlGenerator.generateBlankPageHTML(chapterIndex, bookInfo.chapters.length);
      }
      
      // Use the enhanced HTML generation
      return this.htmlGenerator.generateEnhancedHTML(content, fontSize, bookmarkPosition, chapterIndex);
    } catch (error) {
      console.error('Error getting chapter content:', error);
      throw error;
    }
  }

  // Word wrapping function for HTML content
  wrapWordsInSpans(htmlContent) {
    return this.htmlGenerator.wrapWordsInSpans(htmlContent);
  }

  // Enhanced HTML generation with premium design
  generateEnhancedHTML(content, fontSize, bookmarkPosition = -1, chapterIndex = 0) {
    return this.htmlGenerator.generateEnhancedHTML(content, fontSize, bookmarkPosition, chapterIndex);
  }

  // Extract body content from XHTML
  extractBodyContent(xhtmlContent) {
    return this.coreParser.extractBodyContent(xhtmlContent);
  }

  // Count words in content to detect blank pages
  countWords(content) {
    return this.coreParser.countWords(content);
  }

  // Generate HTML for blank pages with premium design and theme colors
  generateBlankPageHTML(chapterIndex, totalChapters) {
    return this.htmlGenerator.generateBlankPageHTML(chapterIndex, totalChapters);
  }

  // Word tracking methods
  initializeWordTracking() {
    return this.wordTracker.initializeWordTracking();
  }

  createBookmark(wordIndex) {
    return this.wordTracker.createBookmark(wordIndex);
  }

  setBookmark(wordIndex, shouldSave = true) {
    return this.wordTracker.setBookmark(wordIndex, shouldSave);
  }

  calculateWordPosition(wordElement) {
    return this.wordTracker.calculateWordPosition(wordElement);
  }

  moveBookmarkNext() {
    return this.wordTracker.moveBookmarkNext();
  }

  moveBookmarkPrevious() {
    return this.wordTracker.moveBookmarkPrevious();
  }

  jumpToWord(wordIndex) {
    return this.wordTracker.jumpToWord(wordIndex);
  }

  toggleBookmarkMode() {
    return this.wordTracker.toggleBookmarkMode();
  }

  cancelBookmarkMode() {
    return this.wordTracker.cancelBookmarkMode();
  }

  improveTextSelection() {
    return this.wordTracker.improveTextSelection();
  }

  getWordMeaning(wordIndex) {
    return this.wordTracker.getWordMeaning(wordIndex);
  }

  showMeaningPopup(word) {
    return this.wordTracker.showMeaningPopup(word);
  }

  hideMeaningPopup() {
    return this.wordTracker.hideMeaningPopup();
  }

  setMeaningContent(meaning, isError = false) {
    return this.wordTracker.setMeaningContent(meaning, isError);
  }

  // Bookmark system methods
  createBookmark(wordIndex, words) {
    return this.bookmarkSystem.createBookmark(wordIndex, words);
  }

  setBookmark(wordIndex, words, shouldSave = true) {
    return this.bookmarkSystem.setBookmark(wordIndex, words, shouldSave);
  }

  moveBookmarkNext(words) {
    return this.bookmarkSystem.moveBookmarkNext(words);
  }

  moveBookmarkPrevious(words) {
    return this.bookmarkSystem.moveBookmarkPrevious(words);
  }

  jumpToWord(wordIndex, words) {
    return this.bookmarkSystem.jumpToWord(wordIndex, words);
  }

  removeBookmark() {
    return this.bookmarkSystem.removeBookmark();
  }

  getBookmarkPosition(words) {
    return this.bookmarkSystem.getBookmarkPosition(words);
  }

  handleBookmarkMessage(data, words) {
    return this.bookmarkSystem.handleMessage(data, words);
  }

  initializeBookmarkSystem(words) {
    return this.bookmarkSystem.initialize(words);
  }

  setChapterIndex(chapterIndex) {
    return this.bookmarkSystem.setChapterIndex(chapterIndex);
  }

  setBookmarkPosition(wordIndex) {
    return this.bookmarkSystem.setBookmarkPosition(wordIndex);
  }

  // Robot/AI features methods
  toggleRobotMode() {
    return this.robotFeatures.toggleRobotMode();
  }

  showRobotPopup() {
    return this.robotFeatures.showRobotPopup();
  }

  hideRobotPopup() {
    return this.robotFeatures.hideRobotPopup();
  }

  updateRobotPopupWithSelection(selectedText) {
    return this.robotFeatures.updateRobotPopupWithSelection(selectedText);
  }

  handleTextSelection() {
    return this.robotFeatures.handleTextSelection();
  }

  getSelectedTextMeaning() {
    return this.robotFeatures.getSelectedTextMeaning();
  }

  isValidSelection(text) {
    return this.robotFeatures.isValidSelection(text);
  }

  addRobotActionButton() {
    return this.robotFeatures.addRobotActionButton();
  }

  improveRobotTextSelection() {
    return this.robotFeatures.improveTextSelection();
  }

  handleRobotMessage(data) {
    return this.robotFeatures.handleMessage(data);
  }

  setRobotMeaningContent(meaning, isError = false) {
    return this.robotFeatures.setMeaningContent(meaning, isError);
  }

  // Cleanup
  cleanup() {
    this.coreParser.cleanup();
    this.epubData = null;
    this.chapterCache = null;
  }
}

// Export default for backward compatibility
export default SimpleEpubParser;
