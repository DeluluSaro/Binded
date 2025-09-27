import {
    CurrentlyReadingBook,
    getAllReadingProgress,
    getCurrentlyReadingBooks,
    getUserReadingStats,
    initializeUserIfNotExists,
    ReadingProgress,
    updateReadingProgress,
    UserProfile,
    UserReadingStats
} from '@/lib/supabase';
import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useState } from 'react';

export const useReadingProgress = () => {
  const { userId, isSignedIn, isLoaded } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentlyReading, setCurrentlyReading] = useState<CurrentlyReadingBook[]>([]);
  const [allProgress, setAllProgress] = useState<ReadingProgress[]>([]);
  const [readingStats, setReadingStats] = useState<UserReadingStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize user profile on first login
  const initializeUserProfile = useCallback(async (clerkUser: any) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Starting comprehensive user profile initialization...', clerkUser);

      // Validate required fields first
      if (!clerkUser || !clerkUser.id || !clerkUser.emailAddresses?.[0]?.emailAddress) {
        const errorMsg = `Missing required user information from Clerk`;
        console.error('❌', errorMsg);
        throw new Error(errorMsg);
      }

      // Use the comprehensive initialization function with Clerk user object
      const profile = await initializeUserIfNotExists(clerkUser);
      
      if (!profile) {
        throw new Error('Failed to initialize or create user profile');
      }
      
      console.log('✅ User profile initialized successfully:', profile);
      setUserProfile(profile);
      return profile;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize user profile';
      console.error('❌ Error initializing user profile:', errorMessage);
      console.error('❌ Full error details:', err);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update reading progress for a book
  const updateBookProgress = useCallback(async (
    bookId: string,
    bookName: string,
    currentPage: number = 0,
    totalPages: number = 0,
    lastReadPosition: string | null = null,
    readingTimeMinutes: number = 0
  ) => {
    if (!userId) {
      console.error('❌ No user ID available for updating reading progress');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const progress = await updateReadingProgress(
        userId,
        bookId,
        bookName,
        currentPage,
        totalPages,
        lastReadPosition,
        readingTimeMinutes
      );

      if (progress) {
        // Refresh the currently reading books and stats
        await Promise.all([
          loadCurrentlyReadingBooks(),
          loadReadingStats(),
          loadAllProgress()
        ]);
        
        console.log('✅ Reading progress updated successfully');
      }

      return progress;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update reading progress';
      console.error('❌ Error updating reading progress:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Load currently reading books (first 3, sorted by last_read_at DESC)
  const loadCurrentlyReadingBooks = useCallback(async () => {
    if (!userId || !userProfile) {
      console.log('🚫 No user ID or profile available for loading currently reading books');
      setCurrentlyReading([]);
      return;
    }

    try {
      console.log('🔄 Loading currently reading books for user:', userId);
      const books = await getCurrentlyReadingBooks(userId, 3);
      setCurrentlyReading(books || []);
      console.log('✅ Currently reading books loaded:', books?.length || 0);
    } catch (err) {
      console.error('❌ Error loading currently reading books:', err);
      // Set empty array on error to prevent crashes
      setCurrentlyReading([]);
    }
  }, [userId, userProfile]);

  // Load all reading progress
  const loadAllProgress = useCallback(async () => {
    if (!userId || !userProfile) {
      console.log('🚫 No user ID or profile available for loading reading progress');
      setAllProgress([]);
      return;
    }

    try {
      console.log('🔄 Loading all reading progress for user:', userId);
      const progress = await getAllReadingProgress(userId);
      setAllProgress(progress || []);
      console.log('✅ All reading progress loaded:', progress?.length || 0);
    } catch (err) {
      console.error('❌ Error loading all reading progress:', err);
      // Set empty array on error to prevent crashes
      setAllProgress([]);
    }
  }, [userId, userProfile]);

  // Load reading statistics
  const loadReadingStats = useCallback(async () => {
    if (!userId || !userProfile) {
      console.log('🚫 No user ID or profile available for loading reading stats');
      setReadingStats(null);
      return;
    }

    try {
      console.log('🔄 Loading reading stats for user:', userId);
      const stats = await getUserReadingStats(userId);
      setReadingStats(stats);
      console.log('✅ Reading stats loaded:', stats);
    } catch (err) {
      console.error('❌ Error loading reading stats:', err);
      // Set null on error to prevent crashes
      setReadingStats(null);
    }
  }, [userId, userProfile]);

  // Load all user data
  const loadUserData = useCallback(async () => {
    if (!userId) {
      console.log('🚫 No user ID available for loading user data');
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Starting to load all user data...');
      
      // Add a small delay to ensure profile is fully created
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await Promise.all([
        loadCurrentlyReadingBooks(),
        loadAllProgress(),
        loadReadingStats()
      ]);
      
      console.log('✅ All user data loaded successfully');
    } catch (err) {
      console.error('❌ Error loading user data:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, loadCurrentlyReadingBooks, loadAllProgress, loadReadingStats]);

  // Auto-load data when user signs in AND profile exists
  useEffect(() => {
    if (isLoaded && isSignedIn && userId && userProfile) {
      // Only load data if user profile exists
      console.log('🔄 User profile exists, loading reading data...');
      loadUserData();
    } else if (isLoaded && !isSignedIn) {
      // Clear data when user signs out
      console.log('🚫 User signed out, clearing data...');
      setUserProfile(null);
      setCurrentlyReading([]);
      setAllProgress([]);
      setReadingStats(null);
      setError(null);
    } else if (isLoaded && isSignedIn && userId && !userProfile) {
      // User is signed in but profile doesn't exist yet - wait for it to be created
      console.log('⏳ User signed in but profile not created yet, waiting...');
    }
  }, [isLoaded, isSignedIn, userId, userProfile, loadUserData]);

  // Get book progress by book ID
  const getBookProgress = useCallback((bookId: string): ReadingProgress | null => {
    return allProgress.find(progress => progress.book_id === bookId) || null;
  }, [allProgress]);

  // Get reading progress percentage for a book
  const getBookProgressPercentage = useCallback((bookId: string): number => {
    const progress = getBookProgress(bookId);
    return progress ? progress.progress_percentage : 0;
  }, [getBookProgress]);

  // Check if a book is currently being read
  const isBookCurrentlyReading = useCallback((bookId: string): boolean => {
    return currentlyReading.some(book => book.book_id === bookId);
  }, [currentlyReading]);

  // Check if a book is completed
  const isBookCompleted = useCallback((bookId: string): boolean => {
    const progress = getBookProgress(bookId);
    return progress ? progress.is_completed : false;
  }, [getBookProgress]);

  return {
    // State
    userProfile,
    currentlyReading,
    allProgress,
    readingStats,
    loading,
    error,

    // Actions
    initializeUserProfile,
    updateBookProgress,
    loadCurrentlyReadingBooks,
    loadAllProgress,
    loadReadingStats,
    loadUserData,

    // Helpers
    getBookProgress,
    getBookProgressPercentage,
    isBookCurrentlyReading,
    isBookCompleted,

    // Computed values
    totalBooksRead: readingStats?.total_books_read || 0,
    totalReadingTime: readingStats?.total_reading_time_minutes || 0,
    currentlyReadingCount: readingStats?.currently_reading_count || 0,
    averageProgress: readingStats?.average_progress || 0,
  };
};
