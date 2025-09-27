import { useReadingProgress } from '@/hooks/use-reading-progress';
import { useAuth } from '@clerk/clerk-expo';
import { useFonts } from 'expo-font';
import { Redirect, usePathname } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import IntroScreen from './intro-screen';
import QuotePopup from './quote-popup';

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const [showIntro, setShowIntro] = useState(true);
  const [showQuotePopup, setShowQuotePopup] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const { isSignedIn, isLoaded, userId, user } = useAuth();
  const pathname = usePathname();
  const { initializeUserProfile, userProfile, loading: profileLoading } = useReadingProgress();
  const [fontsLoaded] = useFonts({
    'Pacifico-Regular': require('@/assets/fonts/Pacifico-Regular.ttf'),
    'Silkscreen-Regular': require('@/assets/fonts/Silkscreen-Regular.ttf'),
    'Silkscreen-Bold': require('@/assets/fonts/Silkscreen-Bold.ttf'),
    'Outfit_400Regular': require('@/assets/fonts/Outfit-Regular.ttf'),
    'Outfit_700Bold': require('@/assets/fonts/Outfit-Bold.ttf'),
    'BadeenDisplay-Regular': require('@/assets/fonts/BadeenDisplay-Regular.ttf'),
  });

  // Suppress Clerk telemetry errors
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args: any[]) => {
      const message = args.join(' ');
      if (message.includes('clerk/telemetry') || 
          message.includes('Value is a number, expected an Object')) {
        // Suppress these specific errors
        return;
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  // Initialize user profile on first login - CHECK AND CREATE PROFILE
  useEffect(() => {
    if (isLoaded && isSignedIn && userId && user) {
      console.log('🔍 User authentication state:', {
        isLoaded,
        isSignedIn,
        userId,
        userEmail: user.emailAddresses?.[0]?.emailAddress,
        userName: user.fullName || user.firstName,
        userProfile,
        profileLoading
      });

      // ALWAYS check if profile exists and create if not
      if (!userProfile && !profileLoading) {
        console.log('🔄 ===== NO PROFILE FOUND =====');
        console.log('🔄 Checking if Clerk user exists in user_profiles table...');
        console.log('👤 Using Clerk user object directly:', JSON.stringify(user, null, 2));
        
        // Add a small delay to ensure Clerk is fully ready
        setTimeout(() => {
          console.log('⏰ ===== STARTING PROFILE CHECK/CREATION =====');
          console.log('⏰ Starting profile check/creation after delay...');
          initializeUserProfile(user);
        }, 1000);
      } else if (userProfile) {
        console.log('✅ ===== USER PROFILE ALREADY LOADED =====');
        console.log('✅ User profile already loaded:', userProfile);
      } else if (profileLoading) {
        console.log('⏳ ===== PROFILE CREATION IN PROGRESS =====');
        console.log('⏳ Profile check/creation in progress...');
      }
    }
  }, [isLoaded, isSignedIn, userId, user, userProfile, profileLoading, initializeUserProfile]);

  // Backup effect to ensure profile creation happens - FORCE CREATE PROFILE
  useEffect(() => {
    if (isLoaded && isSignedIn && userId && user && !userProfile && !profileLoading) {
      console.log('🚨 ===== BACKUP PROFILE CREATION =====');
      console.log('🚨 FORCE CREATING PROFILE');
      console.log('🚨 User data:', JSON.stringify(user, null, 2));
      
      const timer = setTimeout(async () => {
        console.log('🚨 ===== FORCE CREATING PROFILE AFTER 3 SECONDS =====');
        console.log('🚨 FORCE CREATING PROFILE AFTER 3 SECONDS...');
        
        try {
          await initializeUserProfile(user);
        } catch (error) {
          console.error('🚨 ===== BACKUP PROFILE CREATION FAILED =====');
          console.error('🚨 Backup profile creation failed:', error);
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isLoaded, isSignedIn, userId, user, userProfile, profileLoading, initializeUserProfile]);

  // Show quote popup only when user is authenticated and on the main app screen
  useEffect(() => {
    // Check if user is authenticated and on the main app screen (not on auth pages)
    const isOnMainApp = pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/';
    const isOnAuthPage = pathname?.includes('/sign-in') || pathname?.includes('/sign-up');
    
    console.log('🔍 Quote Popup Debug:', {
      isLoaded,
      isSignedIn,
      pathname,
      isOnMainApp,
      isOnAuthPage,
      shouldShow: isLoaded && isSignedIn && isOnMainApp && !isOnAuthPage
    });
    
    if (isLoaded && isSignedIn && isOnMainApp && !isOnAuthPage) {
      // Small delay to ensure the main screen is fully loaded
      const timer = setTimeout(() => {
        console.log('📖 Showing quote popup');
        setShowQuotePopup(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      console.log('🚫 Hiding quote popup');
      setShowQuotePopup(false);
    }
  }, [isLoaded, isSignedIn, pathname]);

  // Authentication check - redirect to login if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      // Check if we're already on an auth page to avoid redirect loops
      const isOnAuthPage = pathname?.includes('/sign-in') || pathname?.includes('/sign-up') || pathname?.includes('/(auth)');
      if (!isOnAuthPage) {
        console.log('🚫 User not authenticated, setting redirect flag');
        setShouldRedirect(true);
      }
    } else if (isLoaded && isSignedIn) {
      setShouldRedirect(false);
    }
  }, [isLoaded, isSignedIn, pathname]);

  // Handle redirect
  if (shouldRedirect) {
    console.log('🚫 Redirecting to sign-in');
    return <Redirect href="/sign-in" />;
  }

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <Text style={{ color: '#fff', fontSize: 18, fontFamily: 'System' }}>Loading fonts...</Text>
      </View>
    );
  }

  // Show loading while profile is being initialized for new users
  if (isLoaded && isSignedIn && userId && user && !userProfile && profileLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <Text style={{ color: '#fff', fontSize: 18, fontFamily: 'System' }}>Setting up your profile...</Text>
      </View>
    );
  }

  if (showIntro) {
    return <IntroScreen onComplete={handleIntroComplete} />;
  }

  return (
    <>
      {children}
      <QuotePopup 
        visible={showQuotePopup} 
        onClose={() => setShowQuotePopup(false)} 
      />
    </>
  );
}
