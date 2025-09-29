import { useUser } from '@clerk/clerk-expo';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useThemeColors } from '../hooks/use-theme-color';
import { userService } from '../services/userService';

export const FirebaseTestSimple: React.FC = () => {
  const { user: clerkUser, isLoaded } = useUser();
  const [testResult, setTestResult] = useState<string>('Not tested yet');
  const colors = useThemeColors();

  const runTest = async () => {
    try {
      setTestResult('Testing...');
      
      if (!clerkUser) {
        setTestResult('❌ No Clerk user found');
        return;
      }

      console.log('🧪 Starting Firebase test...');
      console.log('Clerk user:', clerkUser.id);
      
      // Test user service
      const userId = await userService.createOrUpdateUser(clerkUser);
      setTestResult(`✅ Success! User ID: ${userId}`);
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      setTestResult(`❌ Error: ${error}`);
    }
  };

  if (!isLoaded) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.text, { color: colors.text }]}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Firebase Test
      </Text>
      
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: colors.tint }]}
        onPress={runTest}
      >
        <Text style={styles.buttonText}>Test Firebase</Text>
      </TouchableOpacity>

      <Text style={[styles.result, { color: colors.text }]}>
        {testResult}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
  },
  result: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default FirebaseTestSimple;
