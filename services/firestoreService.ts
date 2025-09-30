import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    DocumentData,
    DocumentSnapshot,
    getDoc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    QuerySnapshot,
    serverTimestamp,
    Timestamp,
    Unsubscribe,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Types for common data structures
export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Book {
  id: string;
  name: string;
  author: string;
  genre?: string;
  file_path?: string;
  short_description?: string;
  cover_image_path?: string;
  total_pages?: number;
  rating?: number;
  reviews?: any[];
  currentlyReading?: number;
  completed?: number;
  userId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Bookmark {
  id: string;
  bookId: string;
  userId: string;
  chapter: string;
  page: number;
  note?: string;
  createdAt: Timestamp;
}

export interface ReadingProgress {
  id: string;
  bookId: string;
  userId: string;
  currentChapter: string;
  currentPage: number;
  totalPages: number;
  progressPercentage: number;
  lastReadAt: Timestamp;
  updatedAt: Timestamp;
}

class FirestoreService {
  // Generic CRUD operations
  async createDocument(collectionName: string, data: any): Promise<string> {
    try {
      console.log('📝 Creating document in collection:', collectionName, 'with data:', data);
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log('✅ Document created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating document:', error);
      throw error;
    }
  }

  async getDocument(collectionName: string, docId: string): Promise<DocumentSnapshot<DocumentData> | null> {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap : null;
    } catch (error) {
      console.error('Error getting document:', error);
      throw error;
    }
  }

  async updateDocument(collectionName: string, docId: string, data: any): Promise<void> {
    try {
      console.log('📝 Updating document:', docId, 'in collection:', collectionName, 'with data:', data);
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
      console.log('✅ Document updated successfully');
    } catch (error) {
      console.error('❌ Error updating document:', error);
      throw error;
    }
  }

  async deleteDocument(collectionName: string, docId: string): Promise<void> {
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  async getCollection(collectionName: string, constraints?: any[]): Promise<QuerySnapshot<DocumentData>> {
    try {
      console.log('🔍 Getting collection:', collectionName, 'with constraints:', constraints);
      let q = collection(db, collectionName);
      
      if (constraints && constraints.length > 0) {
        q = query(q, ...constraints);
      }
      
      const snapshot = await getDocs(q);
      console.log('✅ Collection query successful:', snapshot.docs.length, 'documents');
      return snapshot;
    } catch (error) {
      console.error('❌ Error getting collection:', error);
      throw error;
    }
  }

  // Real-time listeners
  subscribeToCollection(
    collectionName: string,
    callback: (snapshot: QuerySnapshot<DocumentData>) => void,
    constraints?: any[]
  ): Unsubscribe {
    let q = collection(db, collectionName);
    
    if (constraints && constraints.length > 0) {
      q = query(q, ...constraints);
    }
    
    return onSnapshot(q, callback);
  }

  subscribeToDocument(
    collectionName: string,
    docId: string,
    callback: (snapshot: DocumentSnapshot<DocumentData>) => void
  ): Unsubscribe {
    const docRef = doc(db, collectionName, docId);
    return onSnapshot(docRef, callback);
  }

  // User-specific operations
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return this.createDocument('users', userData);
  }

  async getUser(userId: string): Promise<User | null> {
    const doc = await this.getDocument('users', userId);
    return doc ? { id: doc.id, ...doc.data() } as User : null;
  }

  async updateUser(userId: string, userData: Partial<User>): Promise<void> {
    return this.updateDocument('users', userId, userData);
  }

  // Book operations
  async createBook(bookData: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return this.createDocument('books', bookData);
  }

  async getBook(bookId: string): Promise<Book | null> {
    const doc = await this.getDocument('books', bookId);
    return doc ? { id: doc.id, ...doc.data() } as Book : null;
  }

  async getAllBooks(): Promise<Book[]> {
    const snapshot = await this.getCollection('books', [
      orderBy('createdAt', 'desc')
    ]);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Book[];
  }

  async getUserBooks(userId: string): Promise<Book[]> {
    const snapshot = await this.getCollection('books', [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    ]);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Book[];
  }

  async updateBook(bookId: string, bookData: Partial<Book>): Promise<void> {
    return this.updateDocument('books', bookId, bookData);
  }

  async deleteBook(bookId: string): Promise<void> {
    return this.deleteDocument('books', bookId);
  }

  // Helper function to get book URL from Firebase Storage
  getBookUrl(filePath: string): string {
    // If filePath is a full URL, return it directly
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }
    
    // For Firebase Storage, you would typically construct the URL like this:
    // return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(filePath)}?alt=media`;
    // But since you mentioned you have the links already uploaded, we'll return the filePath as-is
    // You may need to adjust this based on your Firebase Storage setup
    return filePath;
  }

  // Update reading progress for a book
  async updateReadingProgress(bookId: string, currentlyReading: number, completed: number): Promise<void> {
    try {
      console.log('📖 Updating reading progress for book:', bookId, 'currentlyReading:', currentlyReading, 'completed:', completed);
      await this.updateDocument('books', bookId, {
        currentlyReading,
        completed,
        updatedAt: serverTimestamp()
      });
      console.log('✅ Reading progress updated successfully');
    } catch (error) {
      console.error('❌ Error updating reading progress:', error);
      throw error;
    }
  }

  // Bookmark operations
  async createBookmark(bookmarkData: Omit<Bookmark, 'id' | 'createdAt'>): Promise<string> {
    return this.createDocument('bookmarks', bookmarkData);
  }

  async getBookmarks(bookId: string, userId: string): Promise<Bookmark[]> {
    const snapshot = await this.getCollection('bookmarks', [
      where('bookId', '==', bookId),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    ]);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Bookmark[];
  }

  async deleteBookmark(bookmarkId: string): Promise<void> {
    return this.deleteDocument('bookmarks', bookmarkId);
  }

  // Reading progress operations
  async updateReadingProgress(progressData: Omit<ReadingProgress, 'id' | 'updatedAt'>): Promise<string> {
    const existingProgress = await this.getCollection('readingProgress', [
      where('bookId', '==', progressData.bookId),
      where('userId', '==', progressData.userId)
    ]);

    if (existingProgress.docs.length > 0) {
      const docId = existingProgress.docs[0].id;
      await this.updateDocument('readingProgress', docId, progressData);
      return docId;
    } else {
      return this.createDocument('readingProgress', progressData);
    }
  }

  async getReadingProgress(bookId: string, userId: string): Promise<ReadingProgress | null> {
    const snapshot = await this.getCollection('readingProgress', [
      where('bookId', '==', bookId),
      where('userId', '==', userId)
    ]);

    if (snapshot.docs.length > 0) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as ReadingProgress;
    }
    
    return null;
  }

  // Search operations
  async searchBooks(searchTerm: string, userId: string): Promise<Book[]> {
    // Note: For more complex search, consider using Algolia or similar
    const snapshot = await this.getCollection('books', [
      where('userId', '==', userId),
      orderBy('title')
    ]);
    
    const books = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Book[];
    
    return books.filter(book => 
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Real-time subscriptions for specific use cases
  subscribeToUserBooks(userId: string, callback: (books: Book[]) => void): Unsubscribe {
    return this.subscribeToCollection(
      'books',
      (snapshot) => {
        const books = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Book[];
        callback(books);
      },
      [
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      ]
    );
  }

  subscribeToBookmarks(bookId: string, userId: string, callback: (bookmarks: Bookmark[]) => void): Unsubscribe {
    return this.subscribeToCollection(
      'bookmarks',
      (snapshot) => {
        const bookmarks = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Bookmark[];
        callback(bookmarks);
      },
      [
        where('bookId', '==', bookId),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      ]
    );
  }
}

export const firestoreService = new FirestoreService();
export default firestoreService;
