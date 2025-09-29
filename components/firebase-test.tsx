import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { firestoreService } from '../services/firestoreService';

export const FirebaseTest: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testFirestore = async () => {
    try {
      setLoading(true);
      setTestResult('Testing Firestore connection...');
      
      // Test creating a document
      const docId = await firestoreService.createDocument('test', {
        message: 'Hello Firestore!',
        timestamp: new Date().toISOString(),
        testData: {
          platform: 'React Native',
          framework: 'Expo'
        }
      });
      
      setTestResult(`✅ Success! Document created with ID: ${docId}`);
      
      // Test reading the document
      const doc = await firestoreService.getDocument('test', docId);
      if (doc) {
        setTestResult(prev => prev + `\n✅ Document read successfully: ${JSON.stringify(doc.data(), null, 2)}`);
      }
      
      // Clean up - delete the test document
      await firestoreService.deleteDocument('test', docId);
      setTestResult(prev => prev + `\n✅ Test document cleaned up`);
      
    } catch (error) {
      console.error('Firestore test error:', error);
      setTestResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      Alert.alert('Firestore Test Failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testBookOperations = async () => {
    try {
      setLoading(true);
      setTestResult('Testing book operations...');
      
      // Test creating a book
      const bookId = await firestoreService.createBook({
        title: 'Test Book',
        author: 'Test Author',
        description: 'This is a test book for Firebase integration',
        userId: 'test-user-id',
        coverImage: ''
      });
      
      setTestResult(prev => prev + `\n✅ Book created with ID: ${bookId}`);
      
      // Test reading the book
      const book = await firestoreService.getBook(bookId);
      if (book) {
        setTestResult(prev => prev + `\n✅ Book read: ${book.title} by ${book.author}`);
      }
      
      // Test updating the book
      await firestoreService.updateBook(bookId, {
        description: 'Updated description for test book'
      });
      setTestResult(prev => prev + `\n✅ Book updated successfully`);
      
      // Clean up
      await firestoreService.deleteBook(bookId);
      setTestResult(prev => prev + `\n✅ Test book cleaned up`);
      
    } catch (error) {
      console.error('Book operations test error:', error);
      setTestResult(prev => prev + `\n❌ Book operations error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Firestore Test</Text>
      <Text style={styles.subtitle}>Test your Firebase connection and basic operations</Text>
      
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={testFirestore}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Testing...' : 'Test Basic Firestore'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.button, styles.secondaryButton, loading && styles.buttonDisabled]}
        onPress={testBookOperations}
        disabled={loading}
      >
        <Text style={[styles.buttonText, styles.secondaryButtonText]}>
          {loading ? 'Testing...' : 'Test Book Operations'}
        </Text>
      </TouchableOpacity>
      
      {testResult ? (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Test Results:</Text>
          <Text style={styles.resultText}>{testResult}</Text>
        </View>
      ) : null}
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Setup Checklist:</Text>
        <Text style={styles.infoText}>✅ Firebase SDK installed</Text>
        <Text style={styles.infoText}>✅ Configuration files created</Text>
        <Text style={styles.infoText}>✅ Security rules defined</Text>
        <Text style={styles.infoText}>⚠️  Firebase project setup required</Text>
        <Text style={styles.infoText}>⚠️  Configuration values need to be updated</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: 'white',
  },
  resultContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 14,
    color: '#555',
    fontFamily: 'monospace',
  },
  infoContainer: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    marginBottom: 4,
  },
});
