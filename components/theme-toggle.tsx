import { useTheme } from '@/contexts/ThemeContext';
import { useThemeColors } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface ThemeToggleProps {
  size?: 'small' | 'medium' | 'large';
  style?: any;
  showLabel?: boolean;
}

export default function ThemeToggle({ 
  size = 'medium', 
  style, 
  showLabel = false 
}: ThemeToggleProps) {
  const { theme, toggleTheme, isDark } = useTheme();
  const colors = useThemeColors();
  const translateX = useRef(new Animated.Value(isDark ? 1 : 0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: isDark ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isDark]);

  const handlePress = () => {
    // Scale animation on press
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    toggleTheme();
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { width: 50, height: 30, iconSize: 16 };
      case 'large':
        return { width: 80, height: 45, iconSize: 24 };
      default:
        return { width: 65, height: 35, iconSize: 20 };
    }
  };

  const { width, height, iconSize } = getSizeStyles();

  const buttonTranslateX = translateX.interpolate({
    inputRange: [0, 1],
    outputRange: [2, width - height + 2],
  });

  return (
    <View style={[styles.container, style]}>
      {showLabel && (
        <Text style={[styles.label, { color: colors.text }]}>
          {isDark ? 'Dark' : 'Light'}
        </Text>
      )}
      
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={styles.touchable}
      >
        <Animated.View
          style={[
            styles.toggleContainer,
            {
              width,
              height,
              backgroundColor: colors.background,
              shadowColor: colors.tint,
              transform: [{ scale: scaleValue }],
            },
          ]}
        >
          <LinearGradient
            colors={colors.gradient}
            style={styles.gradientBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          
          <Animated.View
            style={[
              styles.toggleButton,
              {
                width: height - 4,
                height: height - 4,
                transform: [{ translateX: buttonTranslateX }],
              },
            ]}
          >
            <LinearGradient
              colors={[colors.tint, colors.tint]}
              style={styles.buttonGradient}
            />
            
            <View style={styles.iconContainer}>
              <Ionicons
                name={isDark ? 'moon' : 'sunny'}
                size={iconSize * 0.7}
                color={colors.text}
              />
            </View>
          </Animated.View>
          
          {/* Glow effect */}
          <Animated.View
            style={[
              styles.glowEffect,
              {
                opacity: translateX.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 0.6],
                }),
                backgroundColor: colors.tint,
                transform: [{ scale: scaleValue }],
              },
            ]}
          />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  touchable: {
    borderRadius: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Outfit_500Medium',
  },
  toggleContainer: {
    borderRadius: 20,
    justifyContent: 'center',
    position: 'relative',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  toggleButton: {
    position: 'absolute',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 15,
  },
  iconContainer: {
    zIndex: 1,
  },
  glowEffect: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 22,
    zIndex: -1,
  },
});
