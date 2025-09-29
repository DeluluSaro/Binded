import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useThemeColors } from '../hooks/use-theme-color';
import { useUserData } from '../hooks/use-user-data';
import { bookmarkService } from '../services/bookmarkService';
import { readingProgressService } from '../services/readingProgressService';

interface EnhancedEpubReaderProps {
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  totalPages: number;
  onClose: () => void;
}

export const EnhancedEpubReader: React.FC<EnhancedEpubReaderProps> = ({
  bookId,
  bookTitle,
  bookAuthor,
  totalPages,
  onClose
}) => {
  const { userData, loading } = useUserData();
  const [currentPage, setCurrentPage] = useState(1);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [readingProgress, setReadingProgress] = useState<any>(null);
  const colors = useThemeColors();

  useEffect(() => {
    if (userData) {
      loadBookData();
    }
  }, [userData, bookId]);

  const loadBookData = async () => {
    try {
      // Load bookmarks
      const bookmarksData = await bookmarkService.getBookmarks(bookId);
      setBookmarks(bookmarksData);

      // Load reading progress
      const progress = await readingProgressService.getProgress(bookId);
      if (progress) {
        setCurrentPage(progress.currentPage);
        setReadingProgress(progress);
      }
    } catch (error) {
      console.error('Error loading book data:', error);
    }
  };

  const handlePageChange = async (newPage: number) => {
    try {
      setCurrentPage(newPage);
      
      if (userData) {
        await readingProgressService.updateProgress(bookId, {
          currentPage: newPage,
          totalPages: totalPages,
          currentChapter: `Chapter ${Math.ceil(newPage / 20)}`, // Example calculation
          readingTime: readingProgress?.readingTime || 0
        });
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const addBookmark = async () => {
    try {
      if (!userData) {
        Alert.alert('Error', 'Please sign in to add bookmarks');
        return;
      }

      const bookmarkId = await bookmarkService.addBookmark({
        bookId,
        chapter: `Chapter ${Math.ceil(currentPage / 20)}`,
        page: currentPage,
        word: 'Selected word', // You would get this from your reader
        note: 'User note' // You would get this from user input
      });

      Alert.alert('Success', 'Bookmark added!');
      loadBookData(); // Reload bookmarks
    } catch (error) {
      console.error('Error adding bookmark:', error);
      Alert.alert('Error', 'Failed to add bookmark');
    }
  };

  const startReading = async () => {
    try {
      if (!userData) {
        Alert.alert('Error', 'Please sign in to track reading progress');
        return;
      }

      await readingProgressService.startReading({
        bookId,
        title: bookTitle,
        author: bookAuthor,
        totalPages: totalPages
      });

      Alert.alert('Success', 'Started reading!');
    } catch (error) {
      console.error('Error starting reading:', error);
      Alert.alert('Error', 'Failed to start reading');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading book data...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        {bookTitle}
      </Text>
      <Text style={[styles.author, { color: colors.textSecondary }]}>
        by {bookAuthor}
      </Text>

      <View style={styles.progressContainer}>
        <Text style={[styles.progressText, { color: colors.text }]}>
          Page {currentPage} of {totalPages}
        </Text>
        <Text style={[styles.progressText, { color: colors.textSecondary }]}>
          Progress: {((currentPage / totalPages) * 100).toFixed(1)}%
        </Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.tint }]}
          onPress={() => handlePageChange(Math.max(1, currentPage - 1))}
        >
          <Text style={styles.buttonText}>Previous Page</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.tint }]}
          onPress={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
        >
          <Text style={styles.buttonText}>Next Page</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.surface }]}
          onPress={addBookmark}
        >
          <Text style={[styles.actionButtonText, { color: colors.text }]}>
            Add Bookmark
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.surface }]}
          onPress={startReading}
        >
          <Text style={[styles.actionButtonText, { color: colors.text }]}>
            Start Reading
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bookmarksContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Bookmarks ({bookmarks.length})
        </Text>
        {bookmarks.map((bookmark, index) => (
          <View key={index} style={[styles.bookmarkItem, { backgroundColor: colors.surface }]}>
            <Text style={[styles.bookmarkText, { color: colors.text }]}>
              {bookmark.chapter} - Page {bookmark.page}
            </Text>
            {bookmark.note && (
              <Text style={[styles.bookmarkNote, { color: colors.textSecondary }]}>
                {bookmark.note}
              </Text>
            )}
          </View>
        ))}
      </View>

      <TouchableOpacity 
        style={[styles.closeButton, { backgroundColor: colors.tint }]}
        onPress={onClose}
      >
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
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
    marginBottom: 8,
    textAlign: 'center',
  },
  author: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  progressContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 16,
    marginBottom: 4,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  actionButton: {
    padding: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  bookmarksContainer: {
    flex: 1,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  bookmarkItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  bookmarkText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  bookmarkNote: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  closeButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default EnhancedEpubReader;
