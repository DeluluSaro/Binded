import { useUser } from '@clerk/clerk-expo';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useThemeColors } from '../hooks/use-theme-color';
import { userService } from '../services/userService';

export const AutoUserTest: React.FC = () => {
  const { user: clerkUser } = useUser();
  const [testResult, setTestResult] = useState<string>('Ready to test automatic user creation');
  const colors = useThemeColors();

  const testAutoUserCreation = async () => {
    if (!clerkUser) {
      setTestResult('❌ No user logged in');
      return;
    }

    try {
      setTestResult('🔄 Testing automatic user creation...');
      
      // First, ensure user exists in Firebase
      setTestResult('📝 Ensuring user exists in Firebase...');
      const firebaseUserId = await userService.createOrUpdateUser(clerkUser);
      
      // Now get the user data
      const userData = await userService.getUser(firebaseUserId);
      
      if (userData) {
        setTestResult(`✅ User exists in Firebase!\nID: ${userData.id}\nName: ${userData.name}\nEmail: ${userData.email}\nClerk ID: ${userData.clerkId}`);
      } else {
        setTestResult('❌ User not found in Firebase after creation.');
      }
      
    } catch (error) {
      console.error('❌ Auto user test failed:', error);
      setTestResult(`❌ Error: ${error}`);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Auto User Creation Test
      </Text>
      
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        This tests if user data was created automatically when you logged in
      </Text>
      
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: colors.tint }]}
        onPress={testAutoUserCreation}
      >
        <Text style={styles.buttonText}>Check User Data</Text>
      </TouchableOpacity>

      <View style={[styles.resultContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.result, { color: colors.text }]}>
          {testResult}
        </Text>
      </View>
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultContainer: {
    padding: 15,
    borderRadius: 8,
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  result: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default AutoUserTest;
