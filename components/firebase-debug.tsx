import { useUser } from '@clerk/clerk-expo';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useThemeColors } from '../hooks/use-theme-color';
import { firestoreService } from '../services/firestoreService';
import { userService } from '../services/userService';

export const FirebaseDebug: React.FC = () => {
  const { user: clerkUser, isLoaded } = useUser();
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const colors = useThemeColors();

  const addDebugInfo = (info: string) => {
    console.log('🔍 Debug:', info);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  const testFirebaseConnection = async () => {
    try {
      addDebugInfo('Testing Firebase connection...');
      
      // Test basic Firestore connection
      const testData = { test: true, timestamp: new Date() };
      const docId = await firestoreService.createDocument('test', testData);
      addDebugInfo(`✅ Created test document: ${docId}`);
      
      // Test reading the document
      const doc = await firestoreService.getDocument('test', docId);
      if (doc) {
        addDebugInfo('✅ Successfully read test document');
      } else {
        addDebugInfo('❌ Failed to read test document');
      }
      
      // Clean up test document
      await firestoreService.deleteDocument('test', docId);
      addDebugInfo('✅ Cleaned up test document');
      
    } catch (error) {
      addDebugInfo(`❌ Firebase connection error: ${error}`);
      console.error('Firebase connection error:', error);
    }
  };

  const testUserService = async () => {
    try {
      if (!clerkUser) {
        addDebugInfo('❌ No Clerk user found');
        return;
      }

      addDebugInfo('Testing UserService...');
      addDebugInfo(`Clerk user ID: ${clerkUser.id}`);
      addDebugInfo(`Clerk user email: ${clerkUser.emailAddresses?.[0]?.emailAddress}`);
      
      // Test getting user by Clerk ID
      const existingUser = await userService.getUserByClerkId(clerkUser.id);
      if (existingUser) {
        addDebugInfo(`✅ Found existing user: ${existingUser.id}`);
      } else {
        addDebugInfo('ℹ️ No existing user found, will create new one');
      }
      
      // Test creating/updating user
      const userId = await userService.createOrUpdateUser(clerkUser);
      addDebugInfo(`✅ User created/updated: ${userId}`);
      
    } catch (error) {
      addDebugInfo(`❌ UserService error: ${error}`);
      console.error('UserService error:', error);
    }
  };

  const clearDebugInfo = () => {
    setDebugInfo([]);
  };

  if (!isLoaded) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Firebase Debug
      </Text>
      
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: colors.tint }]}
        onPress={testFirebaseConnection}
      >
        <Text style={styles.buttonText}>Test Firebase Connection</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: colors.tint }]}
        onPress={testUserService}
      >
        <Text style={styles.buttonText}>Test User Service</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: colors.surface }]}
        onPress={clearDebugInfo}
      >
        <Text style={[styles.buttonText, { color: colors.text }]}>Clear Debug Info</Text>
      </TouchableOpacity>

      <View style={styles.debugContainer}>
        <Text style={[styles.debugTitle, { color: colors.text }]}>
          Debug Log:
        </Text>
        {debugInfo.map((info, index) => (
          <Text key={index} style={[styles.debugText, { color: colors.textSecondary }]}>
            {info}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  debugContainer: {
    flex: 1,
    marginTop: 20,
  },
  debugTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  debugText: {
    fontSize: 12,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});

export default FirebaseDebug;
