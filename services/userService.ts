import { Timestamp, where } from 'firebase/firestore';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { firestoreService } from './firestoreService';

// User data structure
export interface UserData {
  id: string;
  clerkId: string; // Clerk user ID
  name: string;
  email: string;
  profileImage?: string | null;
  currentBooks: string[]; // Array of book IDs the user is currently reading
  continueReading: ContinueReadingBook[]; // Top 3 books sorted by last read time
  readingProgress: { [bookId: string]: ReadingProgress }; // JSON object with progress for each book
  bookmarks: { [bookId: string]: Bookmark[] }; // JSON object with bookmarks for each book
  favorites: FavoriteBook[]; // Array of favorite books
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ContinueReadingBook {
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  bookCover?: string;
  lastReadAt: Timestamp;
  progressPercentage: number;
  currentPage: number;
  totalPages: number;
}

export interface ReadingProgress {
  bookId: string;
  currentPage: number;
  totalPages: number;
  progressPercentage: number;
  currentChapter: string;
  lastReadAt: Timestamp;
  readingTime: number; // in minutes
  bookmarks: Bookmark[];
}

export interface Bookmark {
  id: string;
  bookId: string;
  chapter: string;
  page: number;
  word?: string; // The word/phrase that was bookmarked
  note?: string;
  createdAt: Timestamp;
}

export interface FavoriteBook {
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  bookGenre: string;
  bookCover?: string;
  bookDescription?: string;
  bookFilePath?: string;
  addedAt: Timestamp;
}

class UserService {
  // Create or update user data when they sign up
  async createOrUpdateUser(clerkUser: any): Promise<string> {
    try {
      console.log('🔄 Creating/updating user for Clerk ID:', clerkUser.id);
      
      const userData: Omit<UserData, 'id' | 'createdAt' | 'updatedAt'> = {
        clerkId: clerkUser.id,
        name: clerkUser.firstName || clerkUser.fullName || 'User',
        email: clerkUser.emailAddresses?.[0]?.emailAddress || '',
        profileImage: clerkUser.imageUrl || null,
        currentBooks: [],
        continueReading: [],
        readingProgress: {},
        bookmarks: {},
        favorites: []
      };

      // Ensure no undefined values
      const cleanUserData = {
        clerkId: userData.clerkId,
        name: userData.name || 'User',
        email: userData.email || '',
        profileImage: userData.profileImage || null,
        currentBooks: userData.currentBooks || [],
        continueReading: userData.continueReading || [],
        readingProgress: userData.readingProgress || {},
        bookmarks: userData.bookmarks || {},
        favorites: userData.favorites || []
      };

      console.log('📝 User data prepared:', cleanUserData);

      // Check if user already exists
      console.log('🔍 Checking for existing user...');
      const existingUser = await this.getUserByClerkId(clerkUser.id);
      
      if (existingUser) {
        // Update existing user - only update basic profile info, preserve existing data
        await firestoreService.updateDocument('users', existingUser.id, {
          name: cleanUserData.name,
          email: cleanUserData.email,
          profileImage: cleanUserData.profileImage,
          updatedAt: new Date()
        });
        console.log('✅ User profile updated in Firebase (preserving existing data):', existingUser.id);
        return existingUser.id;
      } else {
        // Create new user
        const userId = await firestoreService.createDocument('users', {
          ...cleanUserData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log('✅ New user created in Firebase:', userId);
        return userId;
      }
    } catch (error) {
      console.error('❌ Error creating/updating user:', error);
      throw error;
    }
  }

  // Get user by Clerk ID
  async getUserByClerkId(clerkId: string): Promise<UserData | null> {
    try {
      console.log('🔍 Searching for user with Clerk ID:', clerkId);
      const snapshot = await firestoreService.getCollection('users', [
        where('clerkId', '==', clerkId)
      ]);

      console.log('📊 Query result:', snapshot.docs.length, 'documents found');

      if (snapshot.docs.length > 0) {
        const doc = snapshot.docs[0];
        console.log('✅ Found existing user:', doc.id);
        return { id: doc.id, ...doc.data() } as UserData;
      }
      console.log('ℹ️ No existing user found');
      return null;
    } catch (error) {
      console.error('❌ Error getting user by Clerk ID:', error);
      throw error;
    }
  }

  // Get user by email address
  async getUserByEmail(email: string): Promise<UserData | null> {
    try {
      console.log('🔍 Searching for user with email:', email);
      const snapshot = await firestoreService.getCollection('users', [
        where('email', '==', email)
      ]);

      console.log('📊 Query result:', snapshot.docs.length, 'documents found');

      if (snapshot.docs.length > 0) {
        const doc = snapshot.docs[0];
        console.log('✅ Found existing user by email:', doc.id);
        return { id: doc.id, ...doc.data() } as UserData;
      }
      console.log('ℹ️ No existing user found by email');
      return null;
    } catch (error) {
      console.error('❌ Error getting user by email:', error);
      throw error;
    }
  }

  // Get user by Firebase ID
  async getUser(userId: string): Promise<UserData | null> {
    try {
      const doc = await firestoreService.getDocument('users', userId);
      return doc ? { id: doc.id, ...doc.data() } as UserData : null;
    } catch (error) {
      console.error('❌ Error getting user:', error);
      throw error;
    }
  }

  // Add book to current reading
  async addToCurrentBooks(userId: string, bookId: string, bookData: {
    title: string;
    author: string;
    cover?: string;
    totalPages: number;
  }): Promise<void> {
    try {
      const user = await this.getUser(userId);
      if (!user) throw new Error('User not found');

      // Add to current books if not already there
      if (!user.currentBooks.includes(bookId)) {
        user.currentBooks.push(bookId);
      }

      // Update continue reading (keep only top 3)
      const continueReadingBook: ContinueReadingBook = {
        bookId,
        bookTitle: bookData.title,
        bookAuthor: bookData.author,
        bookCover: bookData.cover,
        lastReadAt: new Date() as any,
        progressPercentage: 0,
        currentPage: 1,
        totalPages: bookData.totalPages
      };

      // Remove if already exists and add to front
      const updatedContinueReading = user.continueReading.filter(book => book.bookId !== bookId);
      updatedContinueReading.unshift(continueReadingBook);
      
      // Keep only top 3
      const top3ContinueReading = updatedContinueReading.slice(0, 3);

      await firestoreService.updateDocument('users', userId, {
        currentBooks: user.currentBooks,
        continueReading: top3ContinueReading,
        updatedAt: new Date()
      });

      console.log('✅ Book added to current reading:', bookId);
    } catch (error) {
      console.error('❌ Error adding book to current reading:', error);
      throw error;
    }
  }

  // Update reading progress
  async updateReadingProgress(
    userId: string, 
    bookId: string, 
    progress: {
      currentPage: number;
      totalPages: number;
      currentChapter: string;
      readingTime?: number;
    }
  ): Promise<void> {
    try {
      const user = await this.getUser(userId);
      if (!user) throw new Error('User not found');

      const progressPercentage = (progress.currentPage / progress.totalPages) * 100;
      
      const readingProgress: ReadingProgress = {
        bookId,
        currentPage: progress.currentPage || 0,
        totalPages: progress.totalPages || 1,
        progressPercentage: progressPercentage || 0,
        currentChapter: progress.currentChapter || '',
        lastReadAt: new Date() as any,
        readingTime: progress.readingTime || 0,
        bookmarks: user.readingProgress[bookId]?.bookmarks || []
      };

      // Update reading progress
      user.readingProgress[bookId] = readingProgress;

      // Update continue reading
      const continueReadingIndex = user.continueReading.findIndex(book => book.bookId === bookId);
      if (continueReadingIndex !== -1) {
        user.continueReading[continueReadingIndex] = {
          ...user.continueReading[continueReadingIndex],
          currentPage: progress.currentPage || 0,
          progressPercentage: progressPercentage || 0,
          lastReadAt: new Date() as any
        };
      }

      await firestoreService.updateDocument('users', userId, {
        readingProgress: user.readingProgress,
        continueReading: user.continueReading,
        updatedAt: new Date()
      });

      console.log('✅ Reading progress updated for book:', bookId);
    } catch (error) {
      console.error('❌ Error updating reading progress:', error);
      throw error;
    }
  }

  // Add bookmark
  async addBookmark(
    userId: string, 
    bookId: string, 
    bookmark: {
      chapter: string;
      page: number;
      word?: string;
      note?: string;
    }
  ): Promise<string> {
    try {
      const user = await this.getUser(userId);
      if (!user) throw new Error('User not found');

      // Generate UUID with fallback
      let bookmarkId: string;
      try {
        bookmarkId = uuidv4();
      } catch (error) {
        console.warn('UUID generation failed, using fallback:', error);
        // Fallback: simple timestamp-based ID
        bookmarkId = `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      
      const newBookmark: Bookmark = {
        id: bookmarkId,
        bookId,
        chapter: bookmark.chapter || '',
        page: bookmark.page || 0,
        word: bookmark.word || '',
        note: bookmark.note || '',
        createdAt: new Date() as any
      };

      // Add to bookmarks
      if (!user.bookmarks[bookId]) {
        user.bookmarks[bookId] = [];
      }
      user.bookmarks[bookId].push(newBookmark);

      // Add to reading progress bookmarks
      if (user.readingProgress[bookId]) {
        user.readingProgress[bookId].bookmarks.push(newBookmark);
      }

      await firestoreService.updateDocument('users', userId, {
        bookmarks: user.bookmarks,
        readingProgress: user.readingProgress,
        updatedAt: new Date()
      });

      console.log('✅ Bookmark added:', bookmarkId);
      return bookmarkId;
    } catch (error) {
      console.error('❌ Error adding bookmark:', error);
      throw error;
    }
  }

  // Remove bookmark
  async removeBookmark(userId: string, bookId: string, bookmarkId: string): Promise<void> {
    try {
      const user = await this.getUser(userId);
      if (!user) throw new Error('User not found');

      // Remove from bookmarks
      if (user.bookmarks[bookId]) {
        user.bookmarks[bookId] = user.bookmarks[bookId].filter(bm => bm.id !== bookmarkId);
      }

      // Remove from reading progress
      if (user.readingProgress[bookId]) {
        user.readingProgress[bookId].bookmarks = user.readingProgress[bookId].bookmarks.filter(
          bm => bm.id !== bookmarkId
        );
      }

      await firestoreService.updateDocument('users', userId, {
        bookmarks: user.bookmarks,
        readingProgress: user.readingProgress,
        updatedAt: new Date()
      });

      console.log('✅ Bookmark removed:', bookmarkId);
    } catch (error) {
      console.error('❌ Error removing bookmark:', error);
      throw error;
    }
  }

  // Get continue reading books (top 3)
  async getContinueReading(userId: string): Promise<ContinueReadingBook[]> {
    try {
      const user = await this.getUser(userId);
      if (!user) return [];

      // Sort by last read time and return top 3
      return user.continueReading
        .sort((a, b) => b.lastReadAt.toMillis() - a.lastReadAt.toMillis())
        .slice(0, 3);
    } catch (error) {
      console.error('❌ Error getting continue reading:', error);
      throw error;
    }
  }

  // Get bookmarks for a specific book
  async getBookmarks(userId: string, bookId: string): Promise<Bookmark[]> {
    try {
      const user = await this.getUser(userId);
      if (!user) return [];

      return user.bookmarks[bookId] || [];
    } catch (error) {
      console.error('❌ Error getting bookmarks:', error);
      throw error;
    }
  }

  // Get reading progress for a specific book
  async getReadingProgress(userId: string, bookId: string): Promise<ReadingProgress | null> {
    try {
      const user = await this.getUser(userId);
      if (!user) return null;

      return user.readingProgress[bookId] || null;
    } catch (error) {
      console.error('❌ Error getting reading progress:', error);
      throw error;
    }
  }

  // Remove book from current reading
  async removeFromCurrentBooks(userId: string, bookId: string): Promise<void> {
    try {
      const user = await this.getUser(userId);
      if (!user) throw new Error('User not found');

      // Remove from current books
      user.currentBooks = user.currentBooks.filter(id => id !== bookId);

      // Remove from continue reading
      user.continueReading = user.continueReading.filter(book => book.bookId !== bookId);

      // Remove from reading progress
      delete user.readingProgress[bookId];

      // Remove bookmarks for this book
      delete user.bookmarks[bookId];

      await firestoreService.updateDocument('users', userId, {
        currentBooks: user.currentBooks,
        continueReading: user.continueReading,
        readingProgress: user.readingProgress,
        bookmarks: user.bookmarks,
        updatedAt: new Date()
      });

      console.log('✅ Book removed from current reading:', bookId);
    } catch (error) {
      console.error('❌ Error removing book from current reading:', error);
      throw error;
    }
  }

  // Add book to favorites
  async addToFavorites(userId: string, book: {
    id: string;
    name: string;
    author: string;
    genre: string;
    cover_image_path?: string;
    short_description?: string;
    file_path?: string;
  }): Promise<void> {
    try {
      const user = await this.getUser(userId);
      if (!user) throw new Error('User not found');

      // Check if book is already in favorites
      const isAlreadyFavorite = user.favorites.some(fav => fav.bookId === book.id);
      if (isAlreadyFavorite) {
        console.log('📚 Book already in favorites:', book.id);
        return;
      }

      const favoriteBook: FavoriteBook = {
        bookId: book.id,
        bookTitle: book.name,
        bookAuthor: book.author,
        bookGenre: book.genre,
        addedAt: new Date() as any
      };

      // Only add optional fields if they have values
      if (book.cover_image_path) {
        favoriteBook.bookCover = book.cover_image_path;
      }
      if (book.short_description) {
        favoriteBook.bookDescription = book.short_description;
      }
      if (book.file_path) {
        favoriteBook.bookFilePath = book.file_path;
      }

      user.favorites.push(favoriteBook);

      await firestoreService.updateDocument('users', userId, {
        favorites: user.favorites,
        updatedAt: new Date()
      });

      console.log('✅ Book added to favorites:', book.id);
    } catch (error) {
      console.error('❌ Error adding book to favorites:', error);
      throw error;
    }
  }

  // Remove book from favorites
  async removeFromFavorites(userId: string, bookId: string): Promise<void> {
    try {
      const user = await this.getUser(userId);
      if (!user) throw new Error('User not found');

      user.favorites = user.favorites.filter(fav => fav.bookId !== bookId);

      await firestoreService.updateDocument('users', userId, {
        favorites: user.favorites,
        updatedAt: new Date()
      });

      console.log('✅ Book removed from favorites:', bookId);
    } catch (error) {
      console.error('❌ Error removing book from favorites:', error);
      throw error;
    }
  }

  // Get user favorites
  async getFavorites(userId: string): Promise<FavoriteBook[]> {
    try {
      console.log('🔍 Getting favorites for user ID:', userId);
      const user = await this.getUser(userId);
      if (!user) {
        console.log('❌ User not found when getting favorites');
        return [];
      }

      console.log('📚 User favorites found:', user.favorites?.length || 0, 'items');
      console.log('📚 Raw favorites data:', JSON.stringify(user.favorites, null, 2));

      if (!user.favorites || !Array.isArray(user.favorites)) {
        console.log('❌ Invalid favorites data structure');
        return [];
      }

      const sortedFavorites = user.favorites.sort((a, b) => b.addedAt.toMillis() - a.addedAt.toMillis());
      console.log('✅ Returning sorted favorites:', sortedFavorites.length, 'items');
      return sortedFavorites;
    } catch (error) {
      console.error('❌ Error getting favorites:', error);
      throw error;
    }
  }

  // Check if book is in favorites
  async isBookInFavorites(userId: string, bookId: string): Promise<boolean> {
    try {
      const user = await this.getUser(userId);
      if (!user) return false;

      return user.favorites.some(fav => fav.bookId === bookId);
    } catch (error) {
      console.error('❌ Error checking if book is in favorites:', error);
      throw error;
    }
  }

  // Sync user data with Clerk (call this when user signs in)
  async syncUserWithClerk(clerkUser: any): Promise<UserData | null> {
    try {
      const userData = await this.createOrUpdateUser(clerkUser);
      return await this.getUser(userData);
    } catch (error) {
      console.error('❌ Error syncing user with Clerk:', error);
      throw error;
    }
  }
}

export const userService = new UserService();
export default userService;
