import { useAuth, useUser } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import ConfettiBurst from '@/components/confetti-burst';
import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { SignOutButton } from '@/components/sign-out-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';

export default function HomeScreen() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasShownConfetti, setHasShownConfetti] = useState(false);

  // Show confetti only for new sign-ups, not sign-ins
  useEffect(() => {
    if (isLoaded && isSignedIn && !hasShownConfetti) {
      // Check if this is a new sign-up by checking if user was just created
      const checkIfNewSignUp = async () => {
        try {
          const isNewSignUp = await AsyncStorage.getItem('isNewSignUp');
          
          if (isNewSignUp === 'true') {
            // This is a new sign-up, show confetti
            const timer = setTimeout(() => {
              setShowConfetti(true);
              setHasShownConfetti(true);
            }, 500);
            
            // Clear the flag after showing confetti
            await AsyncStorage.setItem('isNewSignUp', 'false');
            
            return () => clearTimeout(timer);
          } else {
            // This is a sign-in, no confetti
            setHasShownConfetti(true);
          }
        } catch (error) {
          console.log('Error checking sign-up status:', error);
          // If there's an error, don't show confetti
          setHasShownConfetti(true);
        }
      };
      
      checkIfNewSignUp();
    }
  }, [isLoaded, isSignedIn, hasShownConfetti]);

  const handleConfettiComplete = () => {
    setShowConfetti(false);
  };

  // Redirect to auth if not signed in
  if (isLoaded && !isSignedIn) {
    return <Redirect href="/sign-in" />;
  }

  // Show loading while checking auth status
  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ThemedText type="title">🔄 Restoring Session...</ThemedText>
        <ThemedText>Please wait while we restore your login session.</ThemedText>
      </View>
    );
  }

  return (
    <>
      <ConfettiBurst 
        show={showConfetti} 
        onComplete={handleConfettiComplete} 
      />
      <ParallaxScrollView
        headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
        headerImage={
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.reactLogo}
          />
        }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">
          Welcome{user?.firstName ? `, ${user.firstName}` : ''}!
        </ThemedText>
        <HelloWave />
      </ThemedView>
      
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">🔐 Session Management</ThemedText>
        <ThemedText>
          ✅ You are successfully logged in{user?.firstName ? `, ${user.firstName}` : ''}!
        </ThemedText>
        <ThemedText>
          💾 Your session is securely stored and will persist across app restarts.
        </ThemedText>
        <ThemedText>
          🔄 Close and reopen the app to test persistent login.
        </ThemedText>
        {user?.emailAddress && (
          <ThemedText>
            📧 Email: {user.emailAddress}
          </ThemedText>
        )}
        <SignOutButton />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
        <ThemedText>
          Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes.
          Press{' '}
          <ThemedText type="defaultSemiBold">
            {Platform.select({
              ios: 'cmd + d',
              android: 'cmd + m',
              web: 'F12',
            })}
          </ThemedText>{' '}
          to open developer tools.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <Link href="/modal">
          <Link.Trigger>
            <ThemedText type="subtitle">Step 2: Explore</ThemedText>
          </Link.Trigger>
          <Link.Preview />
          <Link.Menu>
            <Link.MenuAction title="Action" icon="cube" onPress={() => alert('Action pressed')} />
            <Link.MenuAction
              title="Share"
              icon="square.and.arrow.up"
              onPress={() => alert('Share pressed')}
            />
            <Link.Menu title="More" icon="ellipsis">
              <Link.MenuAction
                title="Delete"
                icon="trash"
                destructive
                onPress={() => alert('Delete pressed')}
              />
            </Link.Menu>
          </Link.Menu>
        </Link>

        <ThemedText>
          {`Tap the Explore tab to learn more about what's included in this starter app.`}
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
        <ThemedText>
          {`When you're ready, run `}
          <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> directory. This will move the current{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> to{' '}
          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
        </ThemedText>
        </ThemedView>
      </ParallaxScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#fff',
  },
});
