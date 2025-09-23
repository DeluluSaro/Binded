import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/hooks/use-theme-color';

interface PremiumGlassContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  variant?: 'card' | 'modal' | 'floating';
  showBorder?: boolean;
}

export default function PremiumGlassContainer({
  children,
  style,
  intensity = 20,
  variant = 'card',
  showBorder = true,
}: PremiumGlassContainerProps) {
  const colors = useThemeColors();

  const getVariantStyles = () => {
    switch (variant) {
      case 'modal':
        return {
          borderRadius: 24,
          padding: 24,
          margin: 20,
        };
      case 'floating':
        return {
          borderRadius: 16,
          padding: 16,
          margin: 8,
        };
      default: // card
        return {
          borderRadius: 20,
          padding: 20,
          margin: 0,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <View style={[styles.container, variantStyles, style]}>
      <BlurView
        intensity={intensity}
        tint={colors.background === '#010101' ? 'dark' : 'light'}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={[
          `${colors.surface}80`,
          `${colors.surfaceSecondary}60`,
          `${colors.surface}40`,
        ]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {showBorder && (
        <View
          style={[
            styles.border,
            {
              borderColor: colors.borderAccent,
            },
          ]}
        />
      )}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  border: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    borderWidth: 1,
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});
