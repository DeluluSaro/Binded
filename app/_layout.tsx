import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-get-random-values';
import 'react-native-reanimated';

import AppWrapper from '@/components/app-wrapper';
import { ClerkProviderWrapper } from '@/components/clerk-provider';
import { ThemeProvider as CustomThemeProvider } from '@/contexts/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <CustomThemeProvider>
      <ClerkProviderWrapper>
        <AppWrapper>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false }} />
              <Stack.Screen name="reader/[bookId]" options={{ headerShown: false }} />
              <Stack.Screen name="category/[name]" options={{ headerShown: false }} />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </AppWrapper>
      </ClerkProviderWrapper>
    </CustomThemeProvider>
  );
}
