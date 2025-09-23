import { View, type ViewProps } from 'react-native';

import { useThemeColor, useThemeColors } from '@/hooks/use-theme-color';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: 'background' | 'surface' | 'surfaceSecondary';
};

export function ThemedView({ 
  style, 
  lightColor, 
  darkColor, 
  variant = 'background',
  ...otherProps 
}: ThemedViewProps) {
  const colors = useThemeColors();
  
  let backgroundColor;
  if (lightColor || darkColor) {
    backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  } else {
    switch (variant) {
      case 'surface':
        backgroundColor = colors.surface;
        break;
      case 'surfaceSecondary':
        backgroundColor = colors.surfaceSecondary;
        break;
      default:
        backgroundColor = colors.background;
    }
  }

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
