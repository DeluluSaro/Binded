import { Bookmark, userService } from './userService';

export interface BookmarkData {
  id: string;
  bookId: string;
  chapter: string;
  page: number;
  word?: string;
  note?: string;
  createdAt: Date;
}

class BookmarkService {
  private userId: string | null = null;

  // Initialize with user ID
  setUserId(userId: string) {
    this.userId = userId;
  }

  // Get user ID from Clerk (you'll need to pass this from your components)
  private async getUserId(): Promise<string> {
    if (!this.userId) {
      throw new Error('User ID not set. Please call setUserId() first.');
    }
    return this.userId;
  }

  // Add bookmark to Firebase
  async addBookmark(bookmarkData: {
    bookId: string;
    chapter: string;
    page: number;
    word?: string;
    note?: string;
  }): Promise<string> {
    try {
      const userId = await this.getUserId();
      const bookmarkId = await userService.addBookmark(userId, bookmarkData.bookId, {
        chapter: bookmarkData.chapter,
        page: bookmarkData.page,
        word: bookmarkData.word,
        note: bookmarkData.note
      });

      console.log('✅ Bookmark added to Firebase:', bookmarkId);
      return bookmarkId;
    } catch (error) {
      console.error('❌ Error adding bookmark to Firebase:', error);
      throw error;
    }
  }

  // Get all bookmarks for a book
  async getBookmarks(bookId: string): Promise<Bookmark[]> {
    try {
      const userId = await this.getUserId();
      const bookmarks = await userService.getBookmarks(userId, bookId);
      
      console.log(`✅ Retrieved ${bookmarks.length} bookmarks for book:`, bookId);
      return bookmarks;
    } catch (error) {
      console.error('❌ Error getting bookmarks from Firebase:', error);
      throw error;
    }
  }

  // Remove bookmark
  async removeBookmark(bookId: string, bookmarkId: string): Promise<void> {
    try {
      const userId = await this.getUserId();
      await userService.removeBookmark(userId, bookId, bookmarkId);
      
      console.log('✅ Bookmark removed from Firebase:', bookmarkId);
    } catch (error) {
      console.error('❌ Error removing bookmark from Firebase:', error);
      throw error;
    }
  }

  // Update bookmark
  async updateBookmark(
    bookId: string, 
    bookmarkId: string, 
    updates: {
      chapter?: string;
      page?: number;
      word?: string;
      note?: string;
    }
  ): Promise<void> {
    try {
      const userId = await this.getUserId();
      
      // Get current bookmarks
      const bookmarks = await this.getBookmarks(bookId);
      const bookmarkIndex = bookmarks.findIndex(bm => bm.id === bookmarkId);
      
      if (bookmarkIndex === -1) {
        throw new Error('Bookmark not found');
      }

      // Remove old bookmark and add updated one
      await this.removeBookmark(bookId, bookmarkId);
      await this.addBookmark({
        bookId,
        chapter: updates.chapter || bookmarks[bookmarkIndex].chapter,
        page: updates.page || bookmarks[bookmarkIndex].page,
        word: updates.word || bookmarks[bookmarkIndex].word,
        note: updates.note || bookmarks[bookmarkIndex].note
      });

      console.log('✅ Bookmark updated in Firebase:', bookmarkId);
    } catch (error) {
      console.error('❌ Error updating bookmark in Firebase:', error);
      throw error;
    }
  }

  // Sync bookmarks from cache to Firebase (for migration)
  async syncBookmarksFromCache(cachedBookmarks: BookmarkData[], bookId: string): Promise<void> {
    try {
      const userId = await this.getUserId();
      
      console.log(`🔄 Syncing ${cachedBookmarks.length} bookmarks from cache to Firebase...`);
      
      for (const bookmark of cachedBookmarks) {
        await this.addBookmark({
          bookId,
          chapter: bookmark.chapter,
          page: bookmark.page,
          word: bookmark.word,
          note: bookmark.note
        });
      }

      console.log('✅ Bookmarks synced from cache to Firebase');
    } catch (error) {
      console.error('❌ Error syncing bookmarks from cache:', error);
      throw error;
    }
  }

  // Get all bookmarks for user (across all books)
  async getAllUserBookmarks(): Promise<{ [bookId: string]: Bookmark[] }> {
    try {
      const userId = await this.getUserId();
      const user = await userService.getUser(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      console.log('✅ Retrieved all user bookmarks');
      return user.bookmarks;
    } catch (error) {
      console.error('❌ Error getting all user bookmarks:', error);
      throw error;
    }
  }

  // Search bookmarks
  async searchBookmarks(query: string, bookId?: string): Promise<Bookmark[]> {
    try {
      let allBookmarks: Bookmark[] = [];

      if (bookId) {
        // Search in specific book
        allBookmarks = await this.getBookmarks(bookId);
      } else {
        // Search across all books
        const userBookmarks = await this.getAllUserBookmarks();
        allBookmarks = Object.values(userBookmarks).flat();
      }

      // Filter by query
      const filteredBookmarks = allBookmarks.filter(bookmark => 
        bookmark.chapter.toLowerCase().includes(query.toLowerCase()) ||
        bookmark.note?.toLowerCase().includes(query.toLowerCase()) ||
        bookmark.word?.toLowerCase().includes(query.toLowerCase())
      );

      console.log(`✅ Found ${filteredBookmarks.length} bookmarks matching query:`, query);
      return filteredBookmarks;
    } catch (error) {
      console.error('❌ Error searching bookmarks:', error);
      throw error;
    }
  }

  // Export bookmarks (for backup)
  async exportBookmarks(): Promise<{ [bookId: string]: Bookmark[] }> {
    try {
      const bookmarks = await this.getAllUserBookmarks();
      
      console.log('✅ Bookmarks exported');
      return bookmarks;
    } catch (error) {
      console.error('❌ Error exporting bookmarks:', error);
      throw error;
    }
  }

  // Import bookmarks (for restore)
  async importBookmarks(bookmarks: { [bookId: string]: Bookmark[] }): Promise<void> {
    try {
      const userId = await this.getUserId();
      
      // Clear existing bookmarks
      const user = await userService.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Update with imported bookmarks
      await userService.updateDocument('users', userId, {
        bookmarks: bookmarks,
        updatedAt: new Date()
      });

      console.log('✅ Bookmarks imported');
    } catch (error) {
      console.error('❌ Error importing bookmarks:', error);
      throw error;
    }
  }
}

export const bookmarkService = new BookmarkService();
export default bookmarkService;
