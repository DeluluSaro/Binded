import { useFonts } from 'expo-font';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import IntroScreen from './intro-screen';
import QuotePopup from './quote-popup';

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const [showIntro, setShowIntro] = useState(true);
  const [showQuotePopup, setShowQuotePopup] = useState(true);
  const [fontsLoaded] = useFonts({
    'Pacifico-Regular': require('@/assets/fonts/Pacifico-Regular.ttf'),
    'Silkscreen-Regular': require('@/assets/fonts/Silkscreen-Regular.ttf'),
  });

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
