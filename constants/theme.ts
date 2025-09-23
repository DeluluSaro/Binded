/**
 * Premium theme colors with dark (#010101, #eb5838) and light (#b7aa99, #eb5838) modes
 * Designed for a premium, sophisticated feel
 */

import { Platform } from 'react-native';

// Premium color palette
const primaryAccent = '#eb5838'; // Vibrant orange-red accent
const darkBackground = '#010101'; // Deep black
const lightBackground = '#b7aa99'; // Warm beige

export const Colors = {
  light: {
    // Primary colors
    background: lightBackground,
    text: '#2c2c2c', // Dark text on light background
    textSecondary: '#5a5a5a',
    tint: primaryAccent,
    
    // UI elements
    surface: '#f5f3f0', // Slightly lighter than background
    surfaceSecondary: '#e8e2dc', // Even lighter surface
    border: '#d4c9b8', // Subtle border
    borderAccent: primaryAccent,
    
    // Icons and interactive elements
    icon: '#6b6b6b',
    iconAccent: primaryAccent,
    tabIconDefault: '#8a8a8a',
    tabIconSelected: primaryAccent,
    
    // Status colors
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196f3',
    
    // Premium effects
    shadow: 'rgba(0, 0, 0, 0.1)',
    glow: primaryAccent,
    gradient: [lightBackground, '#c4b8a8', '#d4c9b8'],
  },
  dark: {
    // Primary colors
    background: darkBackground,
    text: '#f5f5f5', // Light text on dark background
    textSecondary: '#b8b8b8',
    tint: primaryAccent,
    
    // UI elements
    surface: '#1a1a1a', // Slightly lighter than background
    surfaceSecondary: '#2a2a2a', // Even lighter surface
    border: '#333333', // Subtle border
    borderAccent: primaryAccent,
    
    // Icons and interactive elements
    icon: '#888888',
    iconAccent: primaryAccent,
    tabIconDefault: '#666666',
    tabIconSelected: primaryAccent,
    
    // Status colors
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196f3',
    
    // Premium effects
    shadow: 'rgba(0, 0, 0, 0.3)',
    glow: primaryAccent,
    gradient: [darkBackground, '#1a1a1a', '#2a2a2a'],
  },
};

export const Fonts = Platform.select({
  ios: {
    /** Outfit font family for iOS */
    sans: 'Outfit_400Regular',
    /** Poppins bold for main headings */
    heading: 'Poppins_700Bold',
    /** Outfit bold for subheadings */
    serif: 'Outfit_700Bold',
    /** Outfit medium for rounded style */
    rounded: 'Outfit_500Medium',
    /** Outfit light for monospace alternative */
    mono: 'Outfit_300Light',
  },
  default: {
    /** Outfit font family for Android and other platforms */
    sans: 'Outfit_400Regular',
    /** Poppins bold for main headings */
    heading: 'Poppins_700Bold',
    /** Outfit bold for subheadings */
    serif: 'Outfit_700Bold',
    /** Outfit medium for rounded style */
    rounded: 'Outfit_500Medium',
    /** Outfit light for monospace alternative */
    mono: 'Outfit_300Light',
  },
  web: {
    /** Outfit font family for web */
    sans: "'Outfit', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    /** Poppins for main headings on web */
    heading: "'Poppins', 'Outfit', Georgia, 'Times New Roman', serif",
    serif: "'Outfit', Georgia, 'Times New Roman', serif",
    rounded: "'Outfit', 'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "'Outfit', SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
