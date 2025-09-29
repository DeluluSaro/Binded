import { ContinueReadingBook, ReadingProgress, userService } from './userService';

class ReadingProgressService {
  private userId: string | null = null;

  // Initialize with user ID
  setUserId(userId: string) {
    this.userId = userId;
  }

  // Get user ID
  private async getUserId(): Promise<string> {
    if (!this.userId) {
      throw new Error('User ID not set. Please call setUserId() first.');
    }
    return this.userId;
  }

  // Start reading a book
  async startReading(bookData: {
    bookId: string;
    title: string;
    author: string;
    cover?: string;
    totalPages: number;
  }): Promise<void> {
    try {
      const userId = await this.getUserId();
      
      // Add to current books and continue reading
      await userService.addToCurrentBooks(userId, bookData.bookId, {
        title: bookData.title,
        author: bookData.author,
        cover: bookData.cover,
        totalPages: bookData.totalPages
      });

      // Initialize reading progress
      await userService.updateReadingProgress(userId, bookData.bookId, {
        currentPage: 1,
        totalPages: bookData.totalPages,
        currentChapter: 'Chapter 1',
        readingTime: 0
      });

      console.log('✅ Started reading book:', bookData.bookId);
    } catch (error) {
      console.error('❌ Error starting to read book:', error);
      throw error;
    }
  }

  // Update reading progress
  async updateProgress(bookId: string, progress: {
    currentPage: number;
    totalPages: number;
    currentChapter: string;
    readingTime?: number;
  }): Promise<void> {
    try {
      const userId = await this.getUserId();
      
      await userService.updateReadingProgress(userId, bookId, progress);
      
      console.log('✅ Reading progress updated for book:', bookId);
    } catch (error) {
      console.error('❌ Error updating reading progress:', error);
      throw error;
    }
  }

  // Get reading progress for a book
  async getProgress(bookId: string): Promise<ReadingProgress | null> {
    try {
      const userId = await this.getUserId();
      const progress = await userService.getReadingProgress(userId, bookId);
      
      console.log('✅ Retrieved reading progress for book:', bookId);
      return progress;
    } catch (error) {
      console.error('❌ Error getting reading progress:', error);
      throw error;
    }
  }

  // Get continue reading books (top 3)
  async getContinueReading(): Promise<ContinueReadingBook[]> {
    try {
      const userId = await this.getUserId();
      const continueReading = await userService.getContinueReading(userId);
      
      console.log(`✅ Retrieved ${continueReading.length} continue reading books`);
      return continueReading;
    } catch (error) {
      console.error('❌ Error getting continue reading books:', error);
      throw error;
    }
  }

  // Finish reading a book
  async finishReading(bookId: string): Promise<void> {
    try {
      const userId = await this.getUserId();
      
      // Update progress to 100%
      const progress = await this.getProgress(bookId);
      if (progress) {
        await this.updateProgress(bookId, {
          currentPage: progress.totalPages,
          totalPages: progress.totalPages,
          currentChapter: progress.currentChapter,
          readingTime: progress.readingTime
        });
      }

      // Remove from current books but keep in continue reading
      await userService.removeFromCurrentBooks(userId, bookId);

      console.log('✅ Finished reading book:', bookId);
    } catch (error) {
      console.error('❌ Error finishing book:', error);
      throw error;
    }
  }

  // Resume reading a book
  async resumeReading(bookId: string): Promise<ReadingProgress | null> {
    try {
      const userId = await this.getUserId();
      
      // Get current progress
      const progress = await this.getProgress(bookId);
      
      if (progress) {
        // Update last read time
        await userService.updateReadingProgress(userId, bookId, {
          currentPage: progress.currentPage,
          totalPages: progress.totalPages,
          currentChapter: progress.currentChapter,
          readingTime: progress.readingTime
        });
      }

      console.log('✅ Resumed reading book:', bookId);
      return progress;
    } catch (error) {
      console.error('❌ Error resuming book:', error);
      throw error;
    }
  }

  // Get reading statistics
  async getReadingStats(): Promise<{
    totalBooksRead: number;
    totalPagesRead: number;
    totalReadingTime: number;
    averageProgress: number;
    currentBooks: number;
  }> {
    try {
      const userId = await this.getUserId();
      const user = await userService.getUser(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      const readingProgress = user.readingProgress;
      const totalBooksRead = Object.keys(readingProgress).length;
      const totalPagesRead = Object.values(readingProgress).reduce(
        (sum, progress) => sum + progress.currentPage, 0
      );
      const totalReadingTime = Object.values(readingProgress).reduce(
        (sum, progress) => sum + progress.readingTime, 0
      );
      const averageProgress = totalBooksRead > 0 
        ? Object.values(readingProgress).reduce(
            (sum, progress) => sum + progress.progressPercentage, 0
          ) / totalBooksRead 
        : 0;
      const currentBooks = user.currentBooks.length;

      const stats = {
        totalBooksRead,
        totalPagesRead,
        totalReadingTime,
        averageProgress,
        currentBooks
      };

      console.log('✅ Retrieved reading statistics:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error getting reading statistics:', error);
      throw error;
    }
  }

  // Get books by progress range
  async getBooksByProgress(minProgress: number, maxProgress: number = 100): Promise<ReadingProgress[]> {
    try {
      const userId = await this.getUserId();
      const user = await userService.getUser(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      const readingProgress = user.readingProgress;
      const filteredBooks = Object.values(readingProgress).filter(
        progress => progress.progressPercentage >= minProgress && progress.progressPercentage <= maxProgress
      );

      console.log(`✅ Found ${filteredBooks.length} books with progress between ${minProgress}% and ${maxProgress}%`);
      return filteredBooks;
    } catch (error) {
      console.error('❌ Error getting books by progress:', error);
      throw error;
    }
  }

  // Get recently read books
  async getRecentlyRead(limit: number = 10): Promise<ReadingProgress[]> {
    try {
      const userId = await this.getUserId();
      const user = await userService.getUser(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      const readingProgress = user.readingProgress;
      const recentlyRead = Object.values(readingProgress)
        .sort((a, b) => b.lastReadAt.toMillis() - a.lastReadAt.toMillis())
        .slice(0, limit);

      console.log(`✅ Retrieved ${recentlyRead.length} recently read books`);
      return recentlyRead;
    } catch (error) {
      console.error('❌ Error getting recently read books:', error);
      throw error;
    }
  }

  // Sync reading progress from cache (for migration)
  async syncProgressFromCache(cachedProgress: any, bookId: string): Promise<void> {
    try {
      const userId = await this.getUserId();
      
      console.log('🔄 Syncing reading progress from cache to Firebase...');
      
      await this.updateProgress(bookId, {
        currentPage: cachedProgress.currentPage || 1,
        totalPages: cachedProgress.totalPages || 1,
        currentChapter: cachedProgress.currentChapter || 'Chapter 1',
        readingTime: cachedProgress.readingTime || 0
      });

      console.log('✅ Reading progress synced from cache to Firebase');
    } catch (error) {
      console.error('❌ Error syncing reading progress from cache:', error);
      throw error;
    }
  }
}

export const readingProgressService = new ReadingProgressService();
export default readingProgressService;
