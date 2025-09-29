import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Book, Bookmark, firestoreService } from '../services/firestoreService';

// Example component for managing books
export const BookManager: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    description: '',
  });

  // Load books on component mount
  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      setLoading(true);
      // Replace 'currentUserId' with actual user ID from your auth system
      const userBooks = await firestoreService.getUserBooks('currentUserId');
      setBooks(userBooks);
    } catch (error) {
      console.error('Error loading books:', error);
      Alert.alert('Error', 'Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const addBook = async () => {
    if (!newBook.title || !newBook.author) {
      Alert.alert('Error', 'Please fill in title and author');
      return;
    }

    try {
      setLoading(true);
      await firestoreService.createBook({
        ...newBook,
        userId: 'currentUserId', // Replace with actual user ID
        coverImage: '', // Add cover image logic
      });
      
      setNewBook({ title: '', author: '', description: '' });
      loadBooks(); // Reload books
      Alert.alert('Success', 'Book added successfully');
    } catch (error) {
      console.error('Error adding book:', error);
      Alert.alert('Error', 'Failed to add book');
    } finally {
      setLoading(false);
    }
  };

  const deleteBook = async (bookId: string) => {
    try {
      await firestoreService.deleteBook(bookId);
      loadBooks(); // Reload books
      Alert.alert('Success', 'Book deleted successfully');
    } catch (error) {
      console.error('Error deleting book:', error);
      Alert.alert('Error', 'Failed to delete book');
    }
  };

  const renderBook = ({ item }: { item: Book }) => (
    <View style={styles.bookItem}>
      <Text style={styles.bookTitle}>{item.title}</Text>
      <Text style={styles.bookAuthor}>by {item.author}</Text>
      {item.description && (
        <Text style={styles.bookDescription}>{item.description}</Text>
      )}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteBook(item.id)}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Books</Text>
      
      {/* Add new book form */}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Book Title"
          value={newBook.title}
          onChangeText={(text) => setNewBook({ ...newBook, title: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Author"
          value={newBook.author}
          onChangeText={(text) => setNewBook({ ...newBook, author: text })}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description (optional)"
          value={newBook.description}
          onChangeText={(text) => setNewBook({ ...newBook, description: text })}
          multiline
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={addBook}
          disabled={loading}
        >
          <Text style={styles.addButtonText}>
            {loading ? 'Adding...' : 'Add Book'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Books list */}
      <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        renderItem={renderBook}
        style={styles.booksList}
      />
    </View>
  );
};

// Example component for managing bookmarks
export const BookmarkManager: React.FC<{ bookId: string }> = ({ bookId }) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(false);
  const [newBookmark, setNewBookmark] = useState({
    chapter: '',
    page: '',
    note: '',
  });

  useEffect(() => {
    loadBookmarks();
  }, [bookId]);

  const loadBookmarks = async () => {
    try {
      setLoading(true);
      const userBookmarks = await firestoreService.getBookmarks(bookId, 'currentUserId');
      setBookmarks(userBookmarks);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const addBookmark = async () => {
    if (!newBookmark.chapter || !newBookmark.page) {
      Alert.alert('Error', 'Please fill in chapter and page');
      return;
    }

    try {
      setLoading(true);
      await firestoreService.createBookmark({
        ...newBookmark,
        bookId,
        userId: 'currentUserId',
        page: parseInt(newBookmark.page),
      });
      
      setNewBookmark({ chapter: '', page: '', note: '' });
      loadBookmarks();
      Alert.alert('Success', 'Bookmark added successfully');
    } catch (error) {
      console.error('Error adding bookmark:', error);
      Alert.alert('Error', 'Failed to add bookmark');
    } finally {
      setLoading(false);
    }
  };

  const deleteBookmark = async (bookmarkId: string) => {
    try {
      await firestoreService.deleteBookmark(bookmarkId);
      loadBookmarks();
    } catch (error) {
      console.error('Error deleting bookmark:', error);
    }
  };

  const renderBookmark = ({ item }: { item: Bookmark }) => (
    <View style={styles.bookmarkItem}>
      <Text style={styles.bookmarkChapter}>Chapter: {item.chapter}</Text>
      <Text style={styles.bookmarkPage}>Page: {item.page}</Text>
      {item.note && (
        <Text style={styles.bookmarkNote}>{item.note}</Text>
      )}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteBookmark(item.id)}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bookmarks</Text>
      
      {/* Add new bookmark form */}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Chapter"
          value={newBookmark.chapter}
          onChangeText={(text) => setNewBookmark({ ...newBookmark, chapter: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Page Number"
          value={newBookmark.page}
          onChangeText={(text) => setNewBookmark({ ...newBookmark, page: text })}
          keyboardType="numeric"
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Note (optional)"
          value={newBookmark.note}
          onChangeText={(text) => setNewBookmark({ ...newBookmark, note: text })}
          multiline
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={addBookmark}
          disabled={loading}
        >
          <Text style={styles.addButtonText}>
            {loading ? 'Adding...' : 'Add Bookmark'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bookmarks list */}
      <FlatList
        data={bookmarks}
        keyExtractor={(item) => item.id}
        renderItem={renderBookmark}
        style={styles.bookmarksList}
      />
    </View>
  );
};

// Example component for real-time updates
export const RealTimeBooks: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribe = firestoreService.subscribeToUserBooks(
      'currentUserId', // Replace with actual user ID
      (updatedBooks) => {
        setBooks(updatedBooks);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Real-time Books (Live Updates)</Text>
      <Text style={styles.subtitle}>This list updates automatically when books are added/removed</Text>
      
      <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.bookItem}>
            <Text style={styles.bookTitle}>{item.title}</Text>
            <Text style={styles.bookAuthor}>by {item.author}</Text>
          </View>
        )}
        style={styles.booksList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  form: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  booksList: {
    flex: 1,
  },
  bookmarksList: {
    flex: 1,
  },
  bookItem: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  bookDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  bookmarkItem: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bookmarkChapter: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  bookmarkPage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  bookmarkNote: {
    fontSize: 14,
    color: '#555',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    padding: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
