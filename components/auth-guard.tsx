import { useThemeColors } from '@/hooks/use-theme-color';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import AutoUserSetup from './auto-user-setup';

interface AuthGuardProps {
  children: React.ReactNode;
  fallbackRoute?: string;
  requireEmail?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  fallbackRoute = '/sign-up',
  requireEmail = true 
}) => {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const colors = useThemeColors();

  useEffect(() => {
    const checkAuth = async () => {
      if (!isLoaded) {
        return;
      }

      // If not signed in, redirect immediately
      if (!isSignedIn) {
        setIsCheckingAuth(false);
        return;
      }

      // If signed in but requireEmail is true, check for email
      if (requireEmail && isSignedIn) {
        const hasEmail = user?.emailAddresses && user.emailAddresses.length > 0;
        if (!hasEmail) {
          console.log('🔐 User signed in but no email found, redirecting to sign-up');
          setIsCheckingAuth(false);
          return;
        }
      }

      // All checks passed
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, [isLoaded, isSignedIn, user, requireEmail]);

  // Show loading while checking authentication
  if (!isLoaded || isCheckingAuth) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Checking authentication...
        </Text>
      </View>
    );
  }

  // Redirect if not authenticated or missing required data
  if (!isSignedIn || (requireEmail && (!user?.emailAddresses || user.emailAddresses.length === 0))) {
    return <Redirect href={fallbackRoute} />;
  }

  // User is properly authenticated, render children with automatic user setup
  return (
    <AutoUserSetup>
      {children}
    </AutoUserSetup>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default AuthGuard;
