import { useUser } from '@clerk/clerk-expo';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useThemeColors } from '../hooks/use-theme-color';
import { firestoreService } from '../services/firestoreService';

export const FirebaseCollectionTest: React.FC = () => {
  const { user: clerkUser, isLoaded } = useUser();
  const [testResult, setTestResult] = useState<string>('Not tested yet');
  const colors = useThemeColors();

  const testFirestoreAccess = async () => {
    try {
      setTestResult('Testing Firestore access...');
      
      console.log('🧪 Testing Firestore access...');
      
      // Test 1: Create a simple document
      console.log('📝 Creating test document...');
      const testData = { 
        test: true, 
        timestamp: new Date().toISOString(),
        clerkId: clerkUser?.id || 'no-clerk-user'
      };
      
      const docId = await firestoreService.createDocument('test', testData);
      console.log('✅ Test document created:', docId);
      setTestResult(`✅ Document created: ${docId}`);
      
      // Test 2: Read the document back
      console.log('📖 Reading test document...');
      const doc = await firestoreService.getDocument('test', docId);
      if (doc && doc.exists()) {
        console.log('✅ Document read successfully:', doc.data());
        setTestResult(`✅ Document read: ${JSON.stringify(doc.data())}`);
      } else {
        console.log('❌ Document not found');
        setTestResult('❌ Document not found');
      }
      
      // Test 3: Update the document
      console.log('📝 Updating test document...');
      await firestoreService.updateDocument('test', docId, { 
        updated: true, 
        updateTime: new Date().toISOString() 
      });
      console.log('✅ Document updated successfully');
      setTestResult(`✅ Document updated successfully`);
      
      // Test 4: Clean up
      console.log('🗑️ Cleaning up test document...');
      await firestoreService.deleteDocument('test', docId);
      console.log('✅ Test document cleaned up');
      setTestResult(`✅ All tests passed! Document cleaned up.`);
      
    } catch (error) {
      console.error('❌ Firestore test failed:', error);
      setTestResult(`❌ Error: ${error}`);
      Alert.alert('Firestore Test Failed', `Error: ${error}`);
    }
  };

  const testUserCollection = async () => {
    try {
      setTestResult('Testing users collection...');
      
      if (!clerkUser) {
        setTestResult('❌ No Clerk user found');
        return;
      }

      console.log('🧪 Testing users collection...');
      
      // Create a test user document
      const userData = {
        clerkId: clerkUser.id,
        name: clerkUser.firstName || 'Test User',
        email: clerkUser.emailAddresses?.[0]?.emailAddress || 'test@example.com',
        test: true,
        createdAt: new Date().toISOString()
      };
      
      console.log('📝 Creating user document...');
      const userId = await firestoreService.createDocument('users', userData);
      console.log('✅ User document created:', userId);
      setTestResult(`✅ User document created: ${userId}`);
      
      // Read the user document
      console.log('📖 Reading user document...');
      const userDoc = await firestoreService.getDocument('users', userId);
      if (userDoc && userDoc.exists()) {
        console.log('✅ User document read:', userDoc.data());
        setTestResult(`✅ User document read: ${JSON.stringify(userDoc.data())}`);
      }
      
      // Clean up
      console.log('🗑️ Cleaning up user document...');
      await firestoreService.deleteDocument('users', userId);
      console.log('✅ User document cleaned up');
      setTestResult(`✅ User test passed! Document cleaned up.`);
      
    } catch (error) {
      console.error('❌ User collection test failed:', error);
      setTestResult(`❌ Error: ${error}`);
      Alert.alert('User Collection Test Failed', `Error: ${error}`);
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
        Firebase Collection Test
      </Text>
      
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: colors.tint }]}
        onPress={testFirestoreAccess}
      >
        <Text style={styles.buttonText}>Test Firestore Access</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: colors.tint }]}
        onPress={testUserCollection}
      >
        <Text style={styles.buttonText}>Test Users Collection</Text>
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
    textAlign: 'center',
  },
  button: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    minWidth: 200,
    alignItems: 'center',
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
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
});

export default FirebaseCollectionTest;
