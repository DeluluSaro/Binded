/**
 * Enhanced theme color hook that works with our custom theme context
 */

import { Colors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const { theme } = useTheme();
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

// Additional hook for getting theme colors directly
export function useThemeColors() {
  const { theme } = useTheme();
  return Colors[theme];
}
