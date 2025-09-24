import { useOAuth, useSignUp, useUser } from '@clerk/clerk-expo'
import { Feather } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ResizeMode, Video } from 'expo-av'
import { BlurView } from 'expo-blur'
import { Image as ExpoImage } from 'expo-image'
import { Link, useRouter } from 'expo-router'
import React from 'react'
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

export default function SignUpPage() {
  const { signUp, setActive, isLoaded } = useSignUp()
  const { user } = useUser()
  const router = useRouter()

  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [code, setCode] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [pendingVerification, setPendingVerification] = React.useState(false)

  // Google OAuth using Clerk's built-in functionality
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' })

  const onGoogleSignUp = async () => {
    if (!isLoaded) return

    setLoading(true)
    try {
      const { createdSessionId, setActive } = await startOAuthFlow()
      
      if (createdSessionId) {
        // Mark as new sign-up for confetti
        await AsyncStorage.setItem('isNewSignUp', 'true')
        setActive({ session: createdSessionId })
        router.replace('/')
      }
    } catch (err: any) {
      console.error('Google sign up error:', err)
      Alert.alert('Error', err.errors?.[0]?.message || 'Google sign-up failed')
    } finally {
      setLoading(false)
    }
  }

  // Handle the submission of the sign-up form
  const onSignUpPress = async () => {
    if (!isLoaded) return

    setLoading(true)
    try {
      // Start the sign-up process using the email and password provided
      await signUp.create({
        emailAddress,
        password,
      })

      // Send the email verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setPendingVerification(true)
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2))
      Alert.alert('Error', err.errors?.[0]?.message || 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  // Handle the submission of the verification code
  const onVerifyEmail = async () => {
    if (!isLoaded || !signUp) return

    setLoading(true)
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      })

      if (completeSignUp.status === 'complete') {
        // Set flag to indicate this is a new sign-up for confetti
        await AsyncStorage.setItem('isNewSignUp', 'true');
        
        await setActive({ session: completeSignUp.createdSessionId })
        router.replace('/')
      } else {
        console.error(JSON.stringify(completeSignUp, null, 2))
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2))
      Alert.alert('Error', err.errors?.[0]?.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      {/* Video Background */}
      <Video
        source={require('@/public/sign_video.mp4')}
        style={styles.backgroundVideo}
        resizeMode={ResizeMode.COVER}
        shouldPlay={true}
        isLooping={true}
        isMuted={true}
      />
      
      {/* Professional Gradient Overlay */}
      <View style={styles.backgroundGradient} />
      
      <KeyboardAvoidingView 
        style={styles.keyboardContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Premium Glass Morphism Card */}
          <BlurView intensity={70} tint="dark" style={styles.glassCard}>
                {/* Header */}
                <View style={styles.header}>
                  <View style={styles.logoContainer}>
                    <ExpoImage 
                      source={require('@/public/logo.svg')}
                      style={styles.logo}
                      contentFit="contain"
                    />
                  </View>
                  <Text style={styles.welcomeText}>
                    Create account{user?.firstName ? `, ` : ''}
                    {user?.firstName && (
                      <Text style={{ fontFamily: 'Silkscreen-Regular', fontSize: 18, color: '#ff69b4', fontWeight: 'normal' }}>{user.firstName}</Text>
                    )}
                  </Text>
                  <Text style={styles.subtitleText}>Join the Binded community</Text>
                </View>

              {/* Form */}
              <View style={styles.formContainer}>
            {!pendingVerification ? (
              <>
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
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.primaryButton, loading && styles.buttonDisabled]}
                  onPress={onSignUpPress}
                  disabled={loading}
                >
                  <Text style={styles.primaryButtonText}>
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Text>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Google Sign Up Button */}
                <TouchableOpacity 
                  style={[styles.googleButton, loading && styles.buttonDisabled]}
                  onPress={onGoogleSignUp}
                  disabled={loading}
                >
                  <Feather name="chrome" size={20} color="#4285F4" style={styles.googleIcon} />
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.verificationContainer}>
                  <Text style={styles.verificationTitle}>Verify your email</Text>
                  <Text style={styles.verificationSubtitle}>
                    We sent a verification code to {emailAddress}
                  </Text>
                </View>

                <View style={styles.inputContainer}>
                  <Feather name="key" size={20} color="rgba(255, 255, 255, 0.7)" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={code}
                    placeholder="Verification Code"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.primaryButton, loading && styles.buttonDisabled]}
                  onPress={onVerifyEmail}
                  disabled={loading}
                >
                  <Text style={styles.primaryButtonText}>
                    {loading ? 'Verifying...' : 'Verify Email'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.secondaryButton}
                  onPress={onSignUpPress}
                  disabled={loading}
                >
                  <Text style={styles.secondaryButtonText}>Resend Code</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.linkButton}
                  onPress={() => setPendingVerification(false)}
                >
                  <Text style={styles.linkButtonText}>Back to Sign Up</Text>
                </TouchableOpacity>
              </>
            )}

                <View style={styles.footer}>
                  <Text style={styles.footerText}>Already have an account? </Text>
                  <Link href="/sign-in" asChild>
                    <TouchableOpacity>
                      <Text style={styles.footerLink}>Sign In</Text>
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
    backgroundColor: '#f8fafc',
  },
  backgroundVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(102, 126, 234, 0.4)',
  },
  premiumGlassCard: {
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 30,
    },
    shadowOpacity: 0.25,
    shadowRadius: 50,
    elevation: 25,
  },
  glassCard: {
    width: '100%',
    borderRadius: 24,
    padding: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
  verificationContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  verificationTitle: {
    fontSize: 24,
    fontFamily: 'Outfit_700Bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  verificationSubtitle: {
    fontSize: 16,
    fontFamily: 'Silkscreen-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#6366f1',
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
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Silkscreen-Regular',
  },
  secondaryButton: {
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: {
    color: '#667eea',
    fontSize: 14,
    fontFamily: 'Silkscreen-Regular',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 8,
  },
  linkButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontFamily: 'Silkscreen-Regular',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontFamily: 'Silkscreen-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
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
    marginBottom: 32,
  },
  googleIcon: {
    marginRight: 12,
  },
  googleButtonText: {
    color: '#1f2937',
    fontSize: 16,
    fontFamily: 'Silkscreen-Regular',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Silkscreen-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  footerLink: {
    fontSize: 14,
    fontFamily: 'Silkscreen-Regular',
    color: '#ff69b4',
  },
  userNameHighlight: {
    fontSize: 18,
    fontFamily: 'Silkscreen-Regular',
    color: '#ff69b4',
    fontWeight: 'bold',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
})
