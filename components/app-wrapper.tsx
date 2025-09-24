import { useFonts } from 'expo-font';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import IntroScreen from './intro-screen';
import QuotePopup from './quote-popup';

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const [showIntro, setShowIntro] = useState(true);
  const [showQuotePopup, setShowQuotePopup] = useState(true);
  const [fontsLoaded] = useFonts({
    'Pacifico-Regular': require('@/assets/fonts/Pacifico-Regular.ttf'),
    'Silkscreen': require('@/assets/fonts/Silkscreen-Regular.ttf'),
    'Outfit_400Regular': require('@/assets/fonts/Outfit-Regular.ttf'),
    'Outfit_700Bold': require('@/assets/fonts/Outfit-Bold.ttf'),
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

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading fonts...</Text>
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
