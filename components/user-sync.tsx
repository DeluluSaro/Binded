import { useUser } from '@clerk/clerk-expo';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '../hooks/use-theme-color';
import { UserData, userService } from '../services/userService';

interface UserSyncProps {
  children: React.ReactNode;
  onUserSynced?: (userData: UserData) => void;
  onSyncError?: (error: Error) => void;
}

export const UserSync: React.FC<UserSyncProps> = ({ 
  children, 
  onUserSynced,
  onSyncError 
}) => {
  const { user: clerkUser, isLoaded } = useUser();
  const [isSyncing, setIsSyncing] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [syncError, setSyncError] = useState<Error | null>(null);
  const colors = useThemeColors();

  useEffect(() => {
    const syncUser = async () => {
      if (!isLoaded || !clerkUser) {
        return;
      }

      try {
        setIsSyncing(true);
        setSyncError(null);

        console.log('🔄 Auto-syncing user with Firebase...', {
          clerkId: clerkUser.id,
          email: clerkUser.emailAddresses?.[0]?.emailAddress,
          name: clerkUser.firstName || clerkUser.fullName
        });

        // Check if user already exists
        const existingUser = await userService.getUserByClerkId(clerkUser.id);
        
        if (existingUser) {
          console.log('✅ User already exists in Firebase:', existingUser.id);
          setUserData(existingUser);
          onUserSynced?.(existingUser);
        } else {
          console.log('🆕 Creating new user in Firebase...');
          const syncedUserData = await userService.syncUserWithClerk(clerkUser);
          
          if (syncedUserData) {
            setUserData(syncedUserData);
            onUserSynced?.(syncedUserData);
            console.log('✅ New user created successfully:', syncedUserData.id);
          }
        }
      } catch (error) {
        console.error('❌ Error auto-syncing user:', error);
        const syncError = error instanceof Error ? error : new Error('Unknown sync error');
        setSyncError(syncError);
        onSyncError?.(syncError);
      } finally {
        setIsSyncing(false);
      }
    };

    syncUser();
  }, [isLoaded, clerkUser, onUserSynced, onSyncError]);

  // Show loading while syncing
  if (isSyncing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Setting up your account...
        </Text>
      </View>
    );
  }

  // Show error if sync failed
  if (syncError) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorTitle, { color: colors.text }]}>
          Sync Error
        </Text>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>
          {syncError.message}
        </Text>
      </View>
    );
  }

  // Render children when user is synced
  return <>{children}</>;
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default UserSync;
