import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

interface UseAuthRedirectOptions {
  redirectTo?: string;
  requireEmail?: boolean;
  onRedirect?: () => void;
}

export const useAuthRedirect = (options: UseAuthRedirectOptions = {}) => {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  
  const {
    redirectTo = '/sign-up',
    requireEmail = true,
    onRedirect
  } = options;

  useEffect(() => {
    if (!isLoaded) return;

    // Check if user is not signed in
    if (!isSignedIn) {
      console.log('🔐 User not signed in, redirecting to:', redirectTo);
      onRedirect?.();
      router.replace(redirectTo);
      return;
    }

    // Check if user is signed in but missing email (if required)
    if (requireEmail && isSignedIn) {
      const hasEmail = user?.emailAddresses && user.emailAddresses.length > 0;
      if (!hasEmail) {
        console.log('🔐 User signed in but no email found, redirecting to:', redirectTo);
        onRedirect?.();
        router.replace(redirectTo);
        return;
      }
    }

    console.log('✅ User authentication check passed');
  }, [isLoaded, isSignedIn, user, redirectTo, requireEmail, onRedirect, router]);

  return {
    isAuthenticated: isSignedIn && (!requireEmail || (user?.emailAddresses && user.emailAddresses.length > 0)),
    isLoading: !isLoaded,
    user
  };
};

export default useAuthRedirect;
