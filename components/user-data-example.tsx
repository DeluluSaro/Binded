import { useUser } from '@clerk/clerk-expo';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useThemeColors } from '../hooks/use-theme-color';
import { bookmarkService } from '../services/bookmarkService';
import { readingProgressService } from '../services/readingProgressService';
import { UserData, userService } from '../services/userService';

export const UserDataExample: React.FC = () => {
  const { user: clerkUser } = useUser();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const colors = useThemeColors();

  useEffect(() => {
    if (clerkUser) {
      loadUserData();
    }
  }, [clerkUser]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      if (!clerkUser) return;

      const user = await userService.getUserByClerkId(clerkUser.id);
      setUserData(user);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const testAddBook = async () => {
    try {
      if (!userData) return;

      const bookData = {
        bookId: 'test-book-' + Date.now(),
        title: 'Test Book',
        author: 'Test Author',
        cover: 'https://example.com/cover.jpg',
        totalPages: 200
      };

      await readingProgressService.setUserId(userData.id);
      await readingProgressService.startReading(bookData);
      
      Alert.alert('Success', 'Book added to reading list!');
      loadUserData(); // Reload data
    } catch (error) {
      console.error('Error adding book:', error);
      Alert.alert('Error', 'Failed to add book');
    }
  };

  const testAddBookmark = async () => {
    try {
      if (!userData) return;

      await bookmarkService.setUserId(userData.id);
      const bookmarkId = await bookmarkService.addBookmark({
        bookId: 'test-book-1',
        chapter: 'Chapter 1',
        page: 25,
        word: 'important concept',
        note: 'This is a test bookmark'
      });

      Alert.alert('Success', `Bookmark added with ID: ${bookmarkId}`);
      loadUserData(); // Reload data
    } catch (error) {
      console.error('Error adding bookmark:', error);
      Alert.alert('Error', 'Failed to add bookmark');
    }
  };

  const testUpdateProgress = async () => {
    try {
      if (!userData) return;

      await readingProgressService.setUserId(userData.id);
      await readingProgressService.updateProgress('test-book-1', {
        currentPage: 50,
        totalPages: 200,
        currentChapter: 'Chapter 3',
        readingTime: 30
      });

      Alert.alert('Success', 'Reading progress updated!');
      loadUserData(); // Reload data
    } catch (error) {
      console.error('Error updating progress:', error);
      Alert.alert('Error', 'Failed to update progress');
    }
  };

  const testGetContinueReading = async () => {
    try {
      if (!userData) return;

      await readingProgressService.setUserId(userData.id);
      const continueReading = await readingProgressService.getContinueReading();
      
      Alert.alert(
        'Continue Reading', 
        `Found ${continueReading.length} books in continue reading`
      );
    } catch (error) {
      console.error('Error getting continue reading:', error);
      Alert.alert('Error', 'Failed to get continue reading');
    }
  };

  const testGetBookmarks = async () => {
    try {
      if (!userData) return;

      await bookmarkService.setUserId(userData.id);
      const bookmarks = await bookmarkService.getBookmarks('test-book-1');
      
      Alert.alert(
        'Bookmarks', 
        `Found ${bookmarks.length} bookmarks for this book`
      );
    } catch (error) {
      console.error('Error getting bookmarks:', error);
      Alert.alert('Error', 'Failed to get bookmarks');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading user data...
        </Text>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          No user data found. Please sign in first.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        User Data Example
      </Text>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          User Info
        </Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Name: {userData.name}
        </Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Email: {userData.email}
        </Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Current Books: {userData.currentBooks.length}
        </Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Continue Reading: {userData.continueReading.length}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Test Actions
        </Text>
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.tint }]}
          onPress={testAddBook}
        >
          <Text style={styles.buttonText}>Add Test Book</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.tint }]}
          onPress={testAddBookmark}
        >
          <Text style={styles.buttonText}>Add Test Bookmark</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.tint }]}
          onPress={testUpdateProgress}
        >
          <Text style={styles.buttonText}>Update Progress</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.tint }]}
          onPress={testGetContinueReading}
        >
          <Text style={styles.buttonText}>Get Continue Reading</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.tint }]}
          onPress={testGetBookmarks}
        >
          <Text style={styles.buttonText}>Get Bookmarks</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Current Books
        </Text>
        {userData.currentBooks.length === 0 ? (
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            No current books
          </Text>
        ) : (
          userData.currentBooks.map((bookId, index) => (
            <Text key={index} style={[styles.infoText, { color: colors.textSecondary }]}>
              {bookId}
            </Text>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Continue Reading
        </Text>
        {userData.continueReading.length === 0 ? (
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            No continue reading books
          </Text>
        ) : (
          userData.continueReading.map((book, index) => (
            <View key={index} style={styles.bookItem}>
              <Text style={[styles.bookTitle, { color: colors.text }]}>
                {book.bookTitle}
              </Text>
              <Text style={[styles.bookAuthor, { color: colors.textSecondary }]}>
                by {book.bookAuthor}
              </Text>
              <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                Progress: {book.progressPercentage.toFixed(1)}%
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 5,
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
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    color: 'red',
  },
  bookItem: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  bookAuthor: {
    fontSize: 14,
    marginTop: 2,
  },
  progressText: {
    fontSize: 12,
    marginTop: 2,
  },
});

export default UserDataExample;
