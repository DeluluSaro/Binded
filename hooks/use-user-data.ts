import { useUser } from '@clerk/clerk-expo';
import { useEffect, useState } from 'react';
import { bookmarkService } from '../services/bookmarkService';
import { readingProgressService } from '../services/readingProgressService';
import { UserData, userService } from '../services/userService';

export const useUserData = () => {
  const { user: clerkUser, isLoaded } = useUser();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (isLoaded && clerkUser) {
      loadUserData();
    }
  }, [isLoaded, clerkUser]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const user = await userService.getUserByClerkId(clerkUser!.id);
      setUserData(user);
      
      // Initialize services with user ID
      if (user) {
        bookmarkService.setUserId(user.id);
        readingProgressService.setUserId(user.id);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshUserData = () => {
    loadUserData();
  };

  return {
    userData,
    loading,
    error,
    refreshUserData,
    isAuthenticated: !!userData,
    clerkUser
  };
};

export default useUserData;
