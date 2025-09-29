import { useUser } from '@clerk/clerk-expo';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useThemeColors } from '../hooks/use-theme-color';
import { userService } from '../services/userService';

export const FirestoreUndefinedTest: React.FC = () => {
  const { user: clerkUser } = useUser();
  const [testResult, setTestResult] = useState<string>('Ready to test Firestore undefined field fix');
  const colors = useThemeColors();

  const testUndefinedFields = async () => {
    if (!clerkUser) {
      setTestResult('❌ No user logged in');
      return;
    }

    try {
      setTestResult('🔄 Testing Firestore with undefined field fix...');
      
      // First, ensure user exists in Firebase
      setTestResult('📝 Ensuring user exists in Firebase...');
      const firebaseUserId = await userService.createOrUpdateUser(clerkUser);
      
      // Test adding a bookmark with some undefined values
      const testBookmark = {
        chapter: 'Chapter 1',
        page: 1,
        word: undefined, // This should be handled
        note: undefined  // This should be handled
      };
      
      setTestResult('📝 Adding bookmark with undefined values...');
      const bookmarkId = await userService.addBookmark(
        firebaseUserId, 
        'test-book-123', 
        testBookmark
      );
      
      setTestResult(`✅ Bookmark added successfully!\nID: ${bookmarkId}\nUndefined values were handled properly.`);
      
    } catch (error) {
      console.error('❌ Undefined field test failed:', error);
      setTestResult(`❌ Error: ${error}`);
    }
  };

  const testUserUpdate = async () => {
    if (!clerkUser) {
      setTestResult('❌ No user logged in');
      return;
    }

    try {
      setTestResult('🔄 Testing user update with undefined fields...');
      
      // First, ensure user exists in Firebase
      setTestResult('📝 Ensuring user exists in Firebase...');
      const firebaseUserId = await userService.createOrUpdateUser(clerkUser);
      
      // Test updating reading progress with some undefined values
      const testProgress = {
        currentPage: 5,
        totalPages: 100,
        currentChapter: 'Chapter 1',
        readingTime: undefined // This should be handled
      };
      
      setTestResult('📝 Updating reading progress with undefined values...');
      await userService.updateReadingProgress(
        firebaseUserId,
        'test-book-123',
        testProgress
      );
      
      setTestResult('✅ Reading progress updated successfully!\nUndefined values were handled properly.');
      
    } catch (error) {
      console.error('❌ User update test failed:', error);
      setTestResult(`❌ Error: ${error}`);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Firestore Undefined Field Test
      </Text>
      
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        This tests that undefined values are handled properly in Firestore
      </Text>
      
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: colors.tint }]}
        onPress={testUndefinedFields}
      >
        <Text style={styles.buttonText}>Test Bookmark with Undefined</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: colors.surface }]}
        onPress={testUserUpdate}
      >
        <Text style={[styles.buttonText, { color: colors.text }]}>Test Progress with Undefined</Text>
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
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 18,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  resultContainer: {
    padding: 15,
    borderRadius: 8,
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  result: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default FirestoreUndefinedTest;
