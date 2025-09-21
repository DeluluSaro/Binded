import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

const { width } = Dimensions.get('window');

interface ConfettiBurstProps {
  onComplete: () => void;
  show: boolean;
}

export default function ConfettiBurst({ onComplete, show }: ConfettiBurstProps) {
  useEffect(() => {
    if (show) {
      // Auto-complete after confetti duration
      const timer = setTimeout(() => {
        onComplete();
      }, 3000); // Show confetti for 3 seconds
      
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <View style={styles.container}>
      {/* Multiple confetti cannons for mobile-optimized effect */}
      <ConfettiCannon 
        count={150} 
        origin={{ x: -10, y: 0 }} 
        fadeOut={true} 
        autoStart={true}
        colors={['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8']}
      />
      <ConfettiCannon 
        count={120} 
        origin={{ x: width + 10, y: 0 }} 
        fadeOut={true} 
        autoStart={true}
        colors={['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8']}
      />
      <ConfettiCannon 
        count={80} 
        origin={{ x: width / 2, y: -50 }} 
        fadeOut={true} 
        autoStart={true}
        colors={['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8']}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    pointerEvents: 'none',
  },
});
