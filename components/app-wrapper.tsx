import { useReadingProgress } from '@/hooks/use-reading-progress';
import { useAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const [quoteShownToday, setQuoteShownToday] = useState(false);
  const { isSignedIn, isLoaded, userId } = useAuth();
  const pathname = usePathname();
  const { initializeUserProfile, userProfile, loading: profileLoading } = useReadingProgress();
  const [fontsLoaded] = useFonts({
    'Outfit-Regular': require('@/assets/fonts/Outfit-Regular.ttf'),
    'Outfit-Bold': require('@/assets/fonts/Outfit-Bold.ttf'),
    'Silkscreen-Regular': require('@/assets/fonts/Silkscreen-Regular.ttf'),
    'Silkscreen-Bold': require('@/assets/fonts/Silkscreen-Bold.ttf'),
  });

  // Debug font loading
  useEffect(() => {
    if (fontsLoaded) {
      console.log('🔤 All fonts loaded successfully');
    } else {
      console.log('🔤 Fonts still loading...');
    }
  }, [fontsLoaded]);

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

  const handleQuoteClose = async () => {
    setShowQuotePopup(false);
    try {
      const today = new Date().toDateString(); // Gets date like "Mon Jan 01 2024"
      await AsyncStorage.setItem('quoteShownDate', today);
      setQuoteShownToday(true);
      console.log('📖 Quote marked as shown for today:', today);
    } catch (error) {
      console.error('Error saving quote shown status:', error);
    }
  };


  // Check if quote has been shown today
  useEffect(() => {
    const checkQuoteShownToday = async () => {
      try {
        const today = new Date().toDateString();
        const lastShownDate = await AsyncStorage.getItem('quoteShownDate');
        const wasShownToday = lastShownDate === today;
        setQuoteShownToday(wasShownToday);
        console.log('📖 Quote check:', { today, lastShownDate, wasShownToday });
      } catch (error) {
        console.error('Error checking quote shown status:', error);
      }
    };
    
    checkQuoteShownToday();
  }, []);

  // Initialize user profile on first login - CHECK AND CREATE PROFILE
  useEffect(() => {
    if (isLoaded && isSignedIn && userId) {

      // ALWAYS check if profile exists and create if not
      if (!userProfile && !profileLoading) {
        
        // Create minimal user object
        const minimalUser = {
          id: userId,
          emailAddresses: [{ emailAddress: 'user@example.com' }],
          fullName: 'User',
          firstName: 'User'
        };
        
        // Add a small delay to ensure Clerk is fully ready
        setTimeout(() => {
          initializeUserProfile(minimalUser);
        }, 1000);
      } else if (userProfile) {
      } else if (profileLoading) {
      }
    }
  }, [isLoaded, isSignedIn, userId, userProfile, profileLoading, initializeUserProfile]);

  // Backup effect to ensure profile creation happens - FORCE CREATE PROFILE
  useEffect(() => {
    if (isLoaded && isSignedIn && userId && !userProfile && !profileLoading) {
      
      const minimalUser = {
        id: userId,
        emailAddresses: [{ emailAddress: 'user@example.com' }],
        fullName: 'User',
        firstName: 'User'
      };
      
      const timer = setTimeout(async () => {
        
        try {
          await initializeUserProfile(minimalUser);
        } catch (error) {
          console.error('Backup profile creation failed:', error);
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isLoaded, isSignedIn, userId, userProfile, profileLoading, initializeUserProfile]);

  // Show quote popup only when user is authenticated and on the main app screen (once per day)
  useEffect(() => {
    // Check if user is authenticated and on the main app screen (not on auth pages)
    const isOnMainApp = pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/';
    const isOnAuthPage = pathname?.includes('/sign-in') || pathname?.includes('/sign-up');
    
    
    if (isLoaded && isSignedIn && isOnMainApp && !isOnAuthPage && !quoteShownToday) {
      // Small delay to ensure the main screen is fully loaded
      const timer = setTimeout(() => {
        setShowQuotePopup(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      setShowQuotePopup(false);
    }
  }, [isLoaded, isSignedIn, pathname, quoteShownToday]);

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
  if (isLoaded && isSignedIn && userId && !userProfile && profileLoading) {
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
        onClose={handleQuoteClose}
      />
    </>
  );
}
