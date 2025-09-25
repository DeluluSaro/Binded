import { useOAuth, useSignIn, useUser } from '@clerk/clerk-expo';
import { Feather } from '@expo/vector-icons'; // Import an icon library
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ResizeMode, Video } from 'expo-av';
import { BlurView } from 'expo-blur';
import { Image as ExpoImage } from 'expo-image';
import { Link, useRouter } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator, // For loading state
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

// It's best practice to place assets in an assets folder.
const BACKGROUND_VIDEO = require('@/public/sign_video.mp4')
const LOGO_IMAGE = require('@/public/logo.svg')

export default function SignInPage() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const { user } = useUser()
  const router = useRouter()

  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' })

  const onGoogleSignIn = async () => {
    if (!isLoaded) return

    setLoading(true)
    try {
      const { createdSessionId, setActive } = await startOAuthFlow()

      if (createdSessionId) {
        await AsyncStorage.setItem('isNewSignUp', 'false')
        setActive({ session: createdSessionId })
        router.replace('/')
      }
    } catch (err: any) {
      console.error('Google sign in error:', err)
      Alert.alert('Error', err.errors?.[0]?.message || 'Google sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  const onSignInPress = async () => {
    if (!isLoaded) return

    setLoading(true)
    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      })

      if (signInAttempt.status === 'complete') {
        await AsyncStorage.setItem('isNewSignUp', 'false')
        await setActive({ session: signInAttempt.createdSessionId })
        router.replace('/')
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2))
      }
    } catch (err: any) {
      Alert.alert('Error', err.errors?.[0]?.message || 'Sign-in failed')
      console.error(JSON.stringify(err, null, 2))
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      {/* Video Background */}
      <Video
        source={BACKGROUND_VIDEO}
        style={styles.backgroundVideo}
        resizeMode={ResizeMode.COVER}
        shouldPlay={true}
        isLooping={true}
        isMuted={false}
      />

      {/* Professional Gradient Overlay */}
      <View style={styles.backgroundGradient} />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Premium Glass Morphism Card */}
          <BlurView intensity={70} tint="dark" style={styles.glassCard}>
            {/* Header */}
            <View style={styles.header}>
              <ExpoImage source={LOGO_IMAGE} style={styles.logo} contentFit="contain" />
              <Text style={styles.welcomeText}>Welcome Back</Text>
              <Text style={styles.subtitleText}>Sign in to continue your journey</Text>
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Feather name="mail" size={20} color="rgba(255, 255, 255, 0.7)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={emailAddress}
                  placeholder="Email Address"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  onChangeText={setEmailAddress}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Feather name="lock" size={20} color="rgba(255, 255, 255, 0.7)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={password}
                  placeholder="Password"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  secureTextEntry
                  onChangeText={setPassword}
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={onSignInPress}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading && !emailAddress ? null : loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

               {/* Google Sign In Button */}
               <TouchableOpacity
                 style={[styles.googleButton, loading && styles.buttonDisabled]}
                 onPress={onGoogleSignIn}
                 disabled={loading}
                 activeOpacity={0.8}
               >
                 <Feather name="chrome" size={20} color="#4285F4" style={styles.googleIcon} />
                 <Text style={styles.googleButtonText}>Continue with Google</Text>
               </TouchableOpacity>

              {/* Footer Link */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <Link href="/sign-up" asChild>
                  <TouchableOpacity>
                    <Text style={styles.footerLink}>Sign Up</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </BlurView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(25, 28, 50, 0.6)', // Richer, darker overlay for better contrast
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  glassCard: {
    width: '100%',
    borderRadius: 24,
    padding: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontFamily: 'Silkscreen-Regular',
    color: '#ffffff',
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 16,
    fontFamily: 'Silkscreen-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 8,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  inputIcon: {
    marginLeft: 15,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    fontSize: 16,
    fontFamily: 'Silkscreen-Regular',
    color: '#ffffff',
  },
  primaryButton: {
    backgroundColor: '#6366f1', // A modern indigo
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Silkscreen-Regular',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
    fontFamily: 'Silkscreen-Regular',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
   googleIcon: {
     marginRight: 12,
   },
  googleButtonText: {
    color: '#1f2937', // Dark text for contrast on the white button
    fontSize: 16,
    fontFamily: 'Silkscreen-Regular',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Silkscreen-Regular',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  footerLink: {
    fontSize: 14,
    fontFamily: 'Silkscreen-Regular',
    color: '#a78bfa', // A more harmonious, vibrant highlight color
  },
})