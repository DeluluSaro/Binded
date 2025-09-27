import { useAuth } from '@clerk/clerk-expo';
import { useFonts } from 'expo-font';
import { usePathname } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import IntroScreen from './intro-screen';
import QuotePopup from './quote-popup';

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const [showIntro, setShowIntro] = useState(true);
  const [showQuotePopup, setShowQuotePopup] = useState(false);
  const { isSignedIn, isLoaded } = useAuth();
  const pathname = usePathname();
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

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <Text style={{ color: '#fff', fontSize: 18, fontFamily: 'System' }}>Loading fonts...</Text>
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
