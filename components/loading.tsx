import { useFonts } from 'expo-font';
import React from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';

interface LoadingProps {
  message?: string;
}

const { width, height } = Dimensions.get('window');

export default function Loading({ message = 'Opening Book...' }: LoadingProps) {
  // Load Silkscreen-Regular font for entire page
  const [fontsLoaded] = useFonts({
    'Silkscreen-Regular': require('@/assets/fonts/Silkscreen-Regular.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/loading.png')}
        style={styles.loadingImage}
        resizeMode="cover"
      />
      
      {/* Lighter overlay */}
      <View style={styles.gradientOverlay} />
      
      <View style={styles.textOverlay}>
        <View style={styles.textContainer}>
          <ThemedText style={[styles.quoteText, { fontFamily: 'Silkscreen-Regular' }]}>
            &ldquo;Emptiness is the best way to start new life&rdquo;
          </ThemedText>
          <View style={styles.divider} />
          {/* <ThemedText style={[styles.titleText, { fontFamily: 'Silkscreen-Regular' }]}>VINLAND SAGA</ThemedText> */}
          <ThemedText style={[styles.subtitleText, { fontFamily: 'Silkscreen-Regular' }]}>{message}</ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingImage: {
    position: 'absolute',
    width: width,
    height: height,
    top: 0,
    left: 0,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  textOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  textContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 40,
    paddingHorizontal: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 15,
  },
  quoteText: {
    fontSize: 20,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: 'normal',
    lineHeight: 28,
    marginBottom: 20,
    fontStyle: 'normal',
    letterSpacing: 0.5,
    includeFontPadding: false,
    fontFamily: 'Silkscreen-Regular',
  },
  divider: {
    width: 60,
    height: 3,
    backgroundColor: '#ffffff',
    marginBottom: 20,
    borderRadius: 2,
  },
  titleText: {
    fontSize: 28,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 15,
    includeFontPadding: false,
    fontFamily: 'Silkscreen-Regular',
  },
  subtitleText: {
    fontSize: 14,
    color: '#cccccc',
    textAlign: 'center',
    fontWeight: 'normal',
    letterSpacing: 1,
    opacity: 0.8,
    includeFontPadding: false,
    fontFamily: 'Silkscreen-Regular',
  },
});