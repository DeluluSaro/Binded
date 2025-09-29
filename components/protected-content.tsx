import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuthRedirect } from '../hooks/use-auth-redirect';
import { useThemeColors } from '../hooks/use-theme-color';
import AuthGuard from './auth-guard';

// Example 1: Using AuthGuard component
export const ProtectedContentWithGuard: React.FC = () => {
  const colors = useThemeColors();

  return (
    <AuthGuard fallbackRoute="/sign-up" requireEmail={true}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          🔒 Protected Content
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          This content is only visible to authenticated users with email addresses.
        </Text>
      </View>
    </AuthGuard>
  );
};

// Example 2: Using the hook for custom logic
export const ProtectedContentWithHook: React.FC = () => {
  const colors = useThemeColors();
  const { isAuthenticated, isLoading, user } = useAuthRedirect({
    redirectTo: '/sign-up',
    requireEmail: true,
    onRedirect: () => {
      console.log('🔄 Redirecting user to sign-up...');
    }
  });

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          Loading authentication...
        </Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect automatically
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        🎉 Welcome, {user?.firstName || 'User'}!
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Email: {user?.emailAddresses?.[0]?.emailAddress || 'No email'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default ProtectedContentWithGuard;
