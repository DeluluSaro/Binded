import { useFonts } from 'expo-font';
import { useEffect, useState } from 'react';

export function useSilkscreenFont() {
  const [fontLoaded, setFontLoaded] = useState(false);
  
  const [fontsLoaded] = useFonts({
    'Silkscreen-Bold': require('@/assets/fonts/Silkscreen-Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      setFontLoaded(true);
    }
  }, [fontsLoaded]);

  return fontLoaded;
}
