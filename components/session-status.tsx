import { useAuth } from '@clerk/clerk-expo';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function SessionStatus() {
  const { isSignedIn, isLoaded } = useAuth();
  const [sessionStatus, setSessionStatus] = useState('Loading...');

  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn) {
        setSessionStatus('✅ Session Restored - You are logged in!');
      } else {
        setSessionStatus('❌ No active session - Please sign in');
      }
    }
  }, [isLoaded, isSignedIn]);

  return (
    <View style={styles.container}>
      <Text style={styles.statusText}>{sessionStatus}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    marginVertical: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Silkscreen-Regular',
    color: '#1e40af',
    textAlign: 'center',
  },
});
