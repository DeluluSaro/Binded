import { useTheme } from '@/contexts/ThemeContext';
import { useRef } from 'react';

export function useLongPressTheme() {
  const { toggleTheme } = useTheme();
  const longPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLongPressStart = () => {
    // Clear any existing timeout
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }
    
    // Set timeout for 1.5 seconds
    longPressTimeoutRef.current = setTimeout(() => {
      toggleTheme();
    }, 1500);
  };

  const handleLongPressEnd = () => {
    // Clear timeout if user releases before 1.5 seconds
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };

  return { handleLongPressStart, handleLongPressEnd };
}
