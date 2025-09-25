import { useThemeColors } from '@/hooks/use-theme-color';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';

interface InPageLoaderProps {
  message?: string;
}

export default function InPageLoader({ message = 'Loading...' }: InPageLoaderProps) {
  const colors = useThemeColors();
  
  return (
    <View style={styles.overlay}>
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <View style={styles.rocketContainer}>
          <ActivityIndicator 
            size="large" 
            color={colors.tint} 
            style={styles.spinner}
          />
          <View style={[styles.rocket, { borderColor: colors.tint }]}>
            <ThemedText style={styles.rocketText}>🚀</ThemedText>
          </View>
        </View>
        <ThemedText style={[styles.message, { color: colors.text }]}>{message}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  rocketContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  spinner: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
  },
  rocket: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 30,
    borderWidth: 2,
  },
  rocketText: {
    fontSize: 32,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
  },
});
