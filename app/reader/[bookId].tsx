import AuthGuard from '@/components/auth-guard';
import Loading from '@/components/loading';
import SimpleEpubReader from '@/components/simple-epub-reader';
import { useThemeColors } from '@/hooks/use-theme-color';
import { firestoreService } from '@/services/firestoreService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function BookReaderScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  
  // State
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openingBook, setOpeningBook] = useState(false);
  const [selectedEpubUri, setSelectedEpubUri] = useState<string | null>(null);
  const [showEpubReader, setShowEpubReader] = useState(false);

  // Load book data
  useEffect(() => {
    const loadBook = async () => {
      if (!bookId) {
        Alert.alert('Error', 'Book ID not provided');
        router.back();
        return;
      }

      try {
        setLoading(true);
        const books = await firestoreService.getAllBooks();
        const foundBook = books.find(b => b.id === bookId);
        
        if (!foundBook) {
          Alert.alert('Book Not Found', 'This book is no longer available.');
          router.back();
          return;
        }
        
        setBook(foundBook);
        
        // Auto-open the book
        await openBook(foundBook);
      } catch (error) {
        console.error('Error loading book:', error);
        Alert.alert('Error', 'Failed to load book. Please try again.');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    loadBook();
  }, [bookId]);

  // Open book for reading
  const openBook = async (bookData: any) => {
    try {
      setOpeningBook(true);
      
      // Show loading for 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (!bookData.file_path) {
        Alert.alert('No File Available', 'This book does not have a file to read yet.');
        return;
      }
      
      const bookUrl = firestoreService.getBookUrl(bookData.file_path);
      console.log('📖 Generated book URL:', bookUrl);
      
      // Check if it's an EPUB file
      if (bookData.file_path.toLowerCase().endsWith('.epub')) {
        console.log('📖 Opening EPUB file in reader');
        setSelectedEpubUri(bookUrl);
        setShowEpubReader(true);
      } else {
        console.log('📖 Opening non-EPUB file externally');
        const supported = await Linking.canOpenURL(bookUrl);
        
        if (supported) {
          await Linking.openURL(bookUrl);
        } else {
          Alert.alert('Error', 'Cannot open this book. Please try again later.');
        }
      }
    } catch (error) {
      console.error('💥 Error opening book:', error);
      Alert.alert('Error', 'Failed to open book. Please try again.');
    } finally {
      setOpeningBook(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <LinearGradient
          colors={[colors.background, colors.surfaceSecondary]}
          style={styles.container}
        >
          <Loading message="Loading book..." />
        </LinearGradient>
      </AuthGuard>
    );
  }

  if (!book) {
    return (
      <AuthGuard>
        <LinearGradient
          colors={[colors.background, colors.surfaceSecondary]}
          style={styles.container}
        >
          <View style={styles.errorContainer}>
            <Ionicons name="book" size={48} color={colors.textSecondary} />
            <Text style={[styles.errorText, { color: colors.text }]}>
              Book not found
            </Text>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: colors.tint }]}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <LinearGradient
        colors={[colors.background, colors.surfaceSecondary]}
        style={styles.container}
      >

        {/* Loading Screen */}
        {openingBook && (
          <Loading message="Opening book..." />
        )}
        
        {/* EPUB Reader */}
        {showEpubReader && selectedEpubUri && (
          <SimpleEpubReader
            epubUrl={selectedEpubUri}
            onClose={() => {
              setShowEpubReader(false);
              setSelectedEpubUri(null);
              router.back();
            }}
          />
        )}
      </LinearGradient>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
  },
});

