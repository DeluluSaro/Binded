import { useUser } from '@clerk/clerk-expo';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '../hooks/use-theme-color';
import { UserData, userService } from '../services/userService';

interface AutoUserSetupProps {
  children: React.ReactNode;
  onUserReady?: (userData: UserData) => void;
}

export const AutoUserSetup: React.FC<AutoUserSetupProps> = ({ 
  children, 
  onUserReady 
}) => {
  const { user: clerkUser, isLoaded } = useUser();
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [setupMessage, setSetupMessage] = useState('Preparing your account...');
  const colors = useThemeColors();

  useEffect(() => {
    const setupUser = async () => {
      if (!isLoaded || !clerkUser) {
        return;
      }

      try {
        setIsSettingUp(true);
        setSetupMessage('Checking your account...');

        // Check if user already exists
        const existingUser = await userService.getUserByClerkId(clerkUser.id);
        
        if (existingUser) {
          console.log('✅ User already exists:', existingUser.id);
          setUserData(existingUser);
          onUserReady?.(existingUser);
          setIsSettingUp(false);
        } else {
          setSetupMessage('Creating your profile...');
          console.log('🆕 Creating new user automatically...');
          
          const newUserData = await userService.syncUserWithClerk(clerkUser);
          
          if (newUserData) {
            setUserData(newUserData);
            onUserReady?.(newUserData);
            console.log('✅ New user created automatically:', newUserData.id);
            setIsSettingUp(false);
          }
        }
      } catch (error) {
        console.error('❌ Error in auto user setup:', error);
        setSetupMessage('Setup failed. Please try again.');
        // Still render children even if setup fails
        setIsSettingUp(false);
      }
    };

    setupUser();
  }, [isLoaded, clerkUser, onUserReady]);

  // Show setup screen while creating user data
  if (isSettingUp) {
    return (
      <View style={[styles.setupContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.setupText, { color: colors.text }]}>
          {setupMessage}
        </Text>
        <Text style={[styles.subText, { color: colors.textSecondary }]}>
          This only happens once for new users
        </Text>
      </View>
    );
  }

  // Render children when user is ready
  return <>{children}</>;
};

const styles = StyleSheet.create({
  setupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  setupText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  subText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default AutoUserSetup;
