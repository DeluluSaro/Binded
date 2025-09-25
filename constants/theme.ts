/**
 * Premium theme colors with dark (#010101, #eb5838) and light (#b7aa99, #eb5838) modes
 * Designed for a premium, sophisticated feel
 */


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
    gradient: [lightBackground, '#c4b8a8', '#f44336'],
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
    gradient: [darkBackground, '#1a1a1a', '#f44336'],
  },
};

// Font names only - use inline styling for fontFamily
export const Fonts = {
  silkscreenRegular: 'Silkscreen-Regular',
  silkscreenBold: 'Silkscreen-Bold',
  outfitRegular: 'Outfit-Regular',
  outfitBold: 'Outfit-Bold',
  pacificoRegular: 'Pacifico-Regular',
  badeenDisplayRegular: 'BadeenDisplay-Regular',
};
