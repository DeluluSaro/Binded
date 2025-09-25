// utils/BookmarkManager.js
import AsyncStorage from '@react-native-async-storage/async-storage';

export class BookmarkManager {
  static STORAGE_PREFIX = 'epub_bookmark_';
  static BOOK_LIST_KEY = 'epub_bookmark_books';

  // Save bookmark for specific chapter
  static async saveBookmark(bookTitle, chapterIndex, bookmarkData) {
    try {
      const bookKey = this.generateBookKey(bookTitle);
      const chapterKey = `${bookKey}_ch${chapterIndex}`;
      
      const bookmark = {
        bookTitle: bookTitle,
        chapterIndex: chapterIndex,
        wordIndex: bookmarkData.wordIndex,
        wordText: bookmarkData.wordText,
        totalWords: bookmarkData.totalWords,
        position: bookmarkData.position,
        timestamp: bookmarkData.timestamp || new Date().toISOString(),
        lastAccessed: new Date().toISOString()
      };

      // Save individual bookmark
      await AsyncStorage.setItem(chapterKey, JSON.stringify(bookmark));
      
      // Update book bookmark list
      await this.updateBookmarkList(bookKey, chapterIndex, bookmark);
      
      console.log('✅ Bookmark saved:', bookmark);
      return true;
    } catch (error) {
      console.error('❌ Error saving bookmark:', error);
      return false;
    }
  }

  // Load bookmark for specific chapter
  static async loadBookmark(bookTitle, chapterIndex) {
    try {
      const bookKey = this.generateBookKey(bookTitle);
      const chapterKey = `${bookKey}_ch${chapterIndex}`;
      
      const savedBookmark = await AsyncStorage.getItem(chapterKey);
      
      if (savedBookmark) {
        const bookmark = JSON.parse(savedBookmark);
        
        // Update last accessed
        bookmark.lastAccessed = new Date().toISOString();
        await AsyncStorage.setItem(chapterKey, JSON.stringify(bookmark));
        
        console.log('📖 Bookmark loaded:', bookmark);
        return bookmark;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error loading bookmark:', error);
      return null;
    }
  }

  // Get all bookmarks for a book
  static async getBookBookmarks(bookTitle) {
    try {
      const bookKey = this.generateBookKey(bookTitle);
      const bookmarksKey = `${bookKey}_list`;
      
      const savedBookmarks = await AsyncStorage.getItem(bookmarksKey);
      return savedBookmarks ? JSON.parse(savedBookmarks) : [];
    } catch (error) {
      console.error('❌ Error getting book bookmarks:', error);
      return [];
    }
  }

  // Update bookmark list for a book
  static async updateBookmarkList(bookKey, chapterIndex, bookmarkData) {
    try {
      const bookmarksKey = `${bookKey}_list`;
      let bookmarks = await this.getBookBookmarks(bookKey.replace(this.STORAGE_PREFIX, ''));
      
      // Remove existing bookmark for same chapter
      bookmarks = bookmarks.filter(b => b.chapterIndex !== chapterIndex);
      
      // Add new bookmark
      bookmarks.push({
        chapterIndex: chapterIndex,
        wordIndex: bookmarkData.wordIndex,
        wordText: bookmarkData.wordText,
        timestamp: bookmarkData.timestamp,
        lastAccessed: bookmarkData.lastAccessed
      });

      // Sort by chapter index
      bookmarks.sort((a, b) => a.chapterIndex - b.chapterIndex);
      
      await AsyncStorage.setItem(bookmarksKey, JSON.stringify(bookmarks));
      
      // Update global book list
      await this.updateGlobalBookList(bookKey, bookmarkData.bookTitle);
      
    } catch (error) {
      console.error('❌ Error updating bookmark list:', error);
    }
  }

  // Update global list of books with bookmarks
  static async updateGlobalBookList(bookKey, bookTitle) {
    try {
      let bookList = await this.getAllBookmarkedBooks();
      
      // Remove existing entry
      bookList = bookList.filter(book => book.bookKey !== bookKey);
      
      // Add updated entry
      bookList.push({
        bookKey: bookKey,
        bookTitle: bookTitle,
        lastAccessed: new Date().toISOString()
      });

      // Sort by last accessed
      bookList.sort((a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed));
      
      await AsyncStorage.setItem(this.BOOK_LIST_KEY, JSON.stringify(bookList));
      
    } catch (error) {
      console.error('❌ Error updating global book list:', error);
    }
  }

  // Get all books with bookmarks
  static async getAllBookmarkedBooks() {
    try {
      const savedBooks = await AsyncStorage.getItem(this.BOOK_LIST_KEY);
      return savedBooks ? JSON.parse(savedBooks) : [];
    } catch (error) {
      console.error('❌ Error getting bookmarked books:', error);
      return [];
    }
  }

  // Remove bookmark
  static async removeBookmark(bookTitle, chapterIndex) {
    try {
      const bookKey = this.generateBookKey(bookTitle);
      const chapterKey = `${bookKey}_ch${chapterIndex}`;
      
      // Remove individual bookmark
      await AsyncStorage.removeItem(chapterKey);
      
      // Update bookmark list
      const bookmarksKey = `${bookKey}_list`;
      let bookmarks = await this.getBookBookmarks(bookTitle);
      bookmarks = bookmarks.filter(b => b.chapterIndex !== chapterIndex);
      
      if (bookmarks.length > 0) {
        await AsyncStorage.setItem(bookmarksKey, JSON.stringify(bookmarks));
      } else {
        // Remove empty bookmark list and book from global list
        await AsyncStorage.removeItem(bookmarksKey);
        await this.removeFromGlobalBookList(bookKey);
      }
      
      console.log('🗑️ Bookmark removed');
      return true;
    } catch (error) {
      console.error('❌ Error removing bookmark:', error);
      return false;
    }
  }

  // Remove book from global list
  static async removeFromGlobalBookList(bookKey) {
    try {
      let bookList = await this.getAllBookmarkedBooks();
      bookList = bookList.filter(book => book.bookKey !== bookKey);
      await AsyncStorage.setItem(this.BOOK_LIST_KEY, JSON.stringify(bookList));
    } catch (error) {
      console.error('❌ Error removing from global book list:', error);
    }
  }

  // Generate consistent book key
  static generateBookKey(bookTitle) {
    const sanitized = bookTitle
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    return `${this.STORAGE_PREFIX}${sanitized}`;
  }

  // Clear all bookmarks (for debugging)
  static async clearAllBookmarks() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const bookmarkKeys = keys.filter(key => key.startsWith(this.STORAGE_PREFIX) || key === this.BOOK_LIST_KEY);
      
      if (bookmarkKeys.length > 0) {
        await AsyncStorage.multiRemove(bookmarkKeys);
        console.log('🗑️ All bookmarks cleared');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error clearing bookmarks:', error);
      return false;
    }
  }

  // Get bookmark statistics
  static async getBookmarkStats(bookTitle) {
    try {
      const bookmarks = await this.getBookBookmarks(bookTitle);
      return {
        totalBookmarks: bookmarks.length,
        chapters: bookmarks.map(b => b.chapterIndex),
        lastBookmark: bookmarks.length > 0 ? bookmarks[bookmarks.length - 1] : null,
        firstBookmark: bookmarks.length > 0 ? bookmarks[0] : null
      };
    } catch (error) {
      console.error('❌ Error getting bookmark stats:', error);
      return { totalBookmarks: 0, chapters: [], lastBookmark: null, firstBookmark: null };
    }
  }
}
