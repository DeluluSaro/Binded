import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import IntroScreen from './intro-screen';

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const [showIntro, setShowIntro] = useState(true);
  const router = useRouter();

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  if (showIntro) {
    return <IntroScreen onComplete={handleIntroComplete} />;
  }

  return <>{children}</>;
}
