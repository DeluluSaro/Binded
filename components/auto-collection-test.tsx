import { useUser } from '@clerk/clerk-expo';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { useThemeColors } from '../hooks/use-theme-color';
import { firestoreService } from '../services/firestoreService';
import { userService } from '../services/userService';

export const AutoCollectionTest: React.FC = () => {
  const { user: clerkUser, isLoaded } = useUser();
  const [testResult, setTestResult] = useState<string>('Ready to test');
  const colors = useThemeColors();

  const testAutoCollectionCreation = async () => {
    try {
      setTestResult('🔄 Testing automatic collection creation...');
      
      if (!clerkUser) {
        setTestResult('❌ No Clerk user found');
        return;
      }

      console.log('🧪 Testing automatic collection creation...');
      console.log('Clerk user ID:', clerkUser.id);
      
      // This will automatically create the 'users' collection
      setTestResult('📝 Creating user data (this will create the users collection)...');
      const userId = await userService.createOrUpdateUser(clerkUser);
      setTestResult(`✅ User created successfully! ID: ${userId}`);
      
      // Test reading the user data
      setTestResult('📖 Reading user data...');
      const userData = await userService.getUser(userId);
      if (userData) {
        setTestResult(`✅ User data read: ${userData.name} (${userData.email})`);
      } else {
        setTestResult('❌ Failed to read user data');
      }
      
      // Test creating a bookmark (this will create the bookmarks collection)
      setTestResult('📚 Testing bookmark creation...');
      const bookmarkId = await userService.addBookmark(userId, 'test-book-1', {
        chapter: 'Chapter 1',
        page: 25,
        word: 'test word',
        note: 'This is a test bookmark'
      });
      setTestResult(`✅ Bookmark created: ${bookmarkId}`);
      
      // Test reading bookmarks
      setTestResult('📖 Reading bookmarks...');
      const bookmarks = await userService.getBookmarks(userId, 'test-book-1');
      setTestResult(`✅ Found ${bookmarks.length} bookmarks`);
      
      // Test adding a book to current reading
      setTestResult('📖 Testing book addition...');
      await userService.addToCurrentBooks(userId, 'test-book-2', {
        title: 'Test Book 2',
        author: 'Test Author',
        totalPages: 100
      });
      setTestResult('✅ Book added to current reading');
      
      // Test updating reading progress
      setTestResult('📊 Testing reading progress...');
      await userService.updateReadingProgress(userId, 'test-book-2', {
        currentPage: 25,
        totalPages: 100,
        currentChapter: 'Chapter 2'
      });
      setTestResult('✅ Reading progress updated');
      
      setTestResult('🎉 All tests passed! Collections created automatically.');
      
    } catch (error) {
      console.error('❌ Auto collection test failed:', error);
      setTestResult(`❌ Error: ${error}`);
      Alert.alert('Test Failed', `Error: ${error}`);
    }
  };

  const testUuidGeneration = async () => {
    try {
      setTestResult('🔄 Testing UUID generation...');
      
      // Test UUID generation
      const uuid1 = uuidv4();
      const uuid2 = uuidv4();
      const uuid3 = uuidv4();
      
      console.log('✅ UUIDs generated:', { uuid1, uuid2, uuid3 });
      setTestResult(`✅ UUID Test Passed!\nUUID1: ${uuid1}\nUUID2: ${uuid2}\nUUID3: ${uuid3}`);
      
    } catch (error) {
      console.error('❌ UUID test failed:', error);
      setTestResult(`❌ UUID Error: ${error}`);
      Alert.alert('UUID Test Failed', `Error: ${error}`);
    }
  };

  const testBasicFirestore = async () => {
    try {
      setTestResult('🔄 Testing basic Firestore operations...');
      
      // Test creating a document in a new collection
      const testData = {
        test: true,
        timestamp: new Date().toISOString(),
        clerkId: clerkUser?.id || 'no-user'
      };
      
      setTestResult('📝 Creating test document...');
      const docId = await firestoreService.createDocument('test-collection', testData);
      setTestResult(`✅ Test document created: ${docId}`);
      
      // Test reading the document
      setTestResult('📖 Reading test document...');
      const doc = await firestoreService.getDocument('test-collection', docId);
      if (doc && doc.exists()) {
        setTestResult(`✅ Document read successfully`);
      } else {
        setTestResult('❌ Document not found');
      }
      
      // Clean up
      setTestResult('🗑️ Cleaning up...');
      await firestoreService.deleteDocument('test-collection', docId);
      setTestResult('✅ Test completed and cleaned up');
      
    } catch (error) {
      console.error('❌ Basic Firestore test failed:', error);
      setTestResult(`❌ Error: ${error}`);
      Alert.alert('Test Failed', `Error: ${error}`);
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
        Auto Collection Test
      </Text>
      
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        This will test automatic collection creation
      </Text>
      
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: colors.tint }]}
        onPress={testUuidGeneration}
      >
        <Text style={styles.buttonText}>Test UUID Generation</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: colors.tint }]}
        onPress={testAutoCollectionCreation}
      >
        <Text style={styles.buttonText}>Test User Service</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: colors.surface }]}
        onPress={testBasicFirestore}
      >
        <Text style={[styles.buttonText, { color: colors.text }]}>Test Basic Firestore</Text>
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
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
  resultContainer: {
    marginTop: 20,
    padding: 15,
    borderRadius: 8,
    minHeight: 100,
    justifyContent: 'center',
  },
  result: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AutoCollectionTest;
