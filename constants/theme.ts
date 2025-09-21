/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** Outfit font family for iOS */
    sans: 'Outfit_400Regular',
    /** Outfit bold for headings */
    serif: 'Outfit_700Bold',
    /** Outfit medium for rounded style */
    rounded: 'Outfit_500Medium',
    /** Outfit light for monospace alternative */
    mono: 'Outfit_300Light',
  },
  default: {
    /** Outfit font family for Android and other platforms */
    sans: 'Outfit_400Regular',
    serif: 'Outfit_700Bold',
    rounded: 'Outfit_500Medium',
    mono: 'Outfit_300Light',
  },
  web: {
    /** Outfit font family for web */
    sans: "'Outfit', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "'Outfit', Georgia, 'Times New Roman', serif",
    rounded: "'Outfit', 'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "'Outfit', SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
