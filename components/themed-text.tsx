import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor, useThemeColors } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'secondary';
  variant?: 'primary' | 'secondary' | 'accent';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  variant = 'primary',
  ...rest
}: ThemedTextProps) {
  const colors = useThemeColors();
  
  let color;
  if (lightColor || darkColor) {
    color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  } else {
    switch (variant) {
      case 'secondary':
        color = colors.textSecondary;
        break;
      case 'accent':
        color = colors.tint;
        break;
      default:
        color = colors.text;
    }
  }

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        type === 'secondary' ? styles.secondary : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Outfit_400Regular',
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Outfit_600SemiBold',
  },
  title: {
    fontSize: 32,
    fontFamily: 'Outfit_700Bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
  },
  secondary: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Outfit_400Regular',
  },
});
