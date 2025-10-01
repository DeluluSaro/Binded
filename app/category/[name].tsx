import AuthGuard from '@/components/auth-guard';
import BookDescription from '@/components/book-description';
import Loading from '@/components/loading';
import SideNavbar from '@/components/side-navbar';
import SimpleEpubReader from '@/components/simple-epub-reader';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-color';
import type { Book } from '@/services/firestoreService';
import { firestoreService } from '@/services/firestoreService';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  Linking,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function CategoryScreen() {
  const { isLoaded } = useAuth();
  const router = useRouter();
  const { name } = useLocalSearchParams<{ name: string }>();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEpubReader, setShowEpubReader] = useState(false);
  const [selectedEpubUri, setSelectedEpubUri] = useState<string>('');
  const [openingBook, setOpeningBook] = useState(false);
  const [showBookDescription, setShowBookDescription] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const colors = useThemeColors();
  
  console.log('🔤 Category page loaded, fonts should be available');

  // Parallax animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;

  // Fetch books from Firebase
  useEffect(() => {
    const loadBooks = async () => {
      try {
        console.log('🔄 Starting to load books from Firebase...');
        setLoading(true);
        const fetchedBooks = await firestoreService.getAllBooks();
        console.log('📚 Books loaded from Firebase:', fetchedBooks.length, 'books');
        
        // Filter books based on category
        let filtered;
        if (name && name !== 'all') {
          filtered = fetchedBooks.filter(book => 
            book.genre && book.genre.toLowerCase() === name.toLowerCase()
          );
          console.log(`📚 Filtered books for category "${name}":`, filtered.length, 'books');
        } else {
          filtered = fetchedBooks;
          console.log('📚 Showing all books');
        }
        
        // Sort books by completion count (descending) - most completed first
        const sortedBooks = filtered.sort((a, b) => {
          const aCompleted = a.completed || 0;
          const bCompleted = b.completed || 0;
          return bCompleted - aCompleted; // Descending order
        });
        
        setFilteredBooks(sortedBooks);
        console.log('📚 Books sorted by completion count:', sortedBooks.map(book => ({ name: book.name, completed: book.completed || 0 })));
      } catch (error) {
        console.error('💥 Error loading books from Firebase:', error);
        Alert.alert('Error', `Failed to load books: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, [name]);

  // Use AuthGuard for authentication checks
  if (!isLoaded) return (
    <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
      <ThemedText style={{ color: colors.text, fontFamily: Fonts.outfitRegular }}>Loading...</ThemedText>
    </ThemedView>
  );

  // Show loading screen when opening a book
  if (openingBook) {
    return <Loading message="Opening Book..." />;
  }

  // Show EPUB reader if a book is selected
  if (showEpubReader && selectedEpubUri) {
    return (
      <SimpleEpubReader
        epubUrl={selectedEpubUri}
        onClose={() => {
          setShowEpubReader(false);
          setSelectedEpubUri('');
        }}
      />
    );
  }

  // Parallax animation effects
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -50],
    extrapolate: 'clamp',
  });

  const headerScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true }
  );

  const handleBookPress = (book: Book) => {
    console.log('📖 Book pressed:', book.name);
    setSelectedBook(book);
    setShowBookDescription(true);
    console.log('📖 Book description should be visible now');
  };

  const handleReadNow = async (book: Book) => {
    try {
      console.log('📖 Starting to read book:', {
        name: book.name,
        author: book.author,
        file_path: book.file_path,
        hasFile: !!book.file_path
      });
      
      setShowBookDescription(false);
      setOpeningBook(true);
      
      // Show loading for 2 seconds to display the loading screen
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (!book.file_path) {
        Alert.alert('No File Available', 'This book does not have a file to read yet.');
        return;
      }
      
      const bookUrl = firestoreService.getBookUrl(book.file_path);
      console.log('📖 Generated book URL:', bookUrl);
      
      // Check if it's an EPUB file
      if (book.file_path.toLowerCase().endsWith('.epub')) {
        console.log('📖 Opening EPUB file in reader');
        // Directly open EPUB in reader - no prompts, no downloads
        setSelectedEpubUri(bookUrl);
        setShowEpubReader(true);
      } else {
        console.log('📖 Opening non-EPUB file externally');
        // For other file types (PDF, etc.), open with external app
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

  const renderFeaturedBook = ({ item }: { item: Book }) => {
    return (
      <TouchableOpacity 
        style={{
          width: 320,
          height: 400,
          marginRight: 16,
          borderRadius: 20,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.border + '30'
        }}
        onPress={() => handleBookPress(item)}
        activeOpacity={0.9}
      >
        <View style={{ flex: 1, position: 'relative' }}>
          {item.cover_image_path ? (
            <Image 
              source={{ uri: item.cover_image_path }} 
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : (
            <View 
              style={{
                width: '100%',
                height: '100%',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: colors.surfaceSecondary
              }}
            >
              <Ionicons name="book" size={60} color={colors.iconAccent} />
            </View>
          )}
          <View 
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '60%',
              backgroundColor: 'rgba(0,0,0,0.2)'
            }}
          />
        </View>
        
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24 }}>
          <ThemedText 
            style={{ 
              fontSize: 30,
              color: 'white',
              lineHeight: 36,
              marginBottom: 4,
              fontFamily: Fonts.outfitRegular
            }}
            numberOfLines={2}
          >
            {item.name}
          </ThemedText>
          <ThemedText 
            variant="secondary"
            style={{ 
              fontSize: 16,
              color: 'rgba(255, 255, 255, 0.9)',
              fontFamily: Fonts.outfitRegular
            }}
            numberOfLines={1}
          >
            {item.author}
          </ThemedText>
        </View>
        
        <TouchableOpacity 
          style={{
            position: 'absolute',
            bottom: 24,
            right: 24,
            width: 56,
            height: 56,
            borderRadius: 28,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            backgroundColor: colors.tint,
            borderColor: 'rgba(255,255,255,0.3)'
          }}
          onPress={() => handleBookPress(item)}
        >
          <Ionicons name="play" size={28} color="white" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderBookCard = ({ item }: { item: Book }) => {
    const isEpub = item.file_path?.toLowerCase().endsWith('.epub');
    const isPdf = item.file_path?.toLowerCase().endsWith('.pdf');
    
    return (
      <TouchableOpacity 
        style={{ flex: 1, backgroundColor: 'transparent' }}
        onPress={() => handleBookPress(item)}
        activeOpacity={0.9}
      >
        <View 
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: 3/4,
            borderRadius: 16,
            overflow: 'hidden',
            marginBottom: 12,
            borderWidth: 1,
            borderColor: colors.border + '20'
          }}
        >
          {item.cover_image_path ? (
            <Image 
              source={{ uri: item.cover_image_path }} 
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : (
            <View 
              style={{
                width: '100%',
                height: '100%',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: colors.surfaceSecondary
              }}
            >
              <Ionicons 
                name={isEpub ? "book" : isPdf ? "document-text" : "book"} 
                size={40} 
                color={colors.iconAccent} 
              />
            </View>
          )}
          <View 
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '40%',
              backgroundColor: 'rgba(0,0,0,0.1)'
            }}
          />
        </View>
        
        <View style={{ gap: 3 }}>
          <ThemedText 
            style={{ 
              fontSize: 16,
              textAlign: 'left',
              fontFamily: Fonts.outfitRegular
            }}
            numberOfLines={1}
          >
            {item.name}
          </ThemedText>
          <ThemedText 
            variant="secondary"
            style={{ 
              fontSize: 14,
              textAlign: 'left',
              fontFamily: Fonts.outfitRegular
            }}
            numberOfLines={1}
          >
            {item.author}
          </ThemedText>
        </View>
      </TouchableOpacity>
    );
  };

  const getCategoryTitle = () => {
    if (name === 'all') return 'All Books';
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : 'Category';
  };


  return (
    <AuthGuard fallbackRoute="/sign-up" requireEmail={true}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={colors.gradient as [string, string, string]}
        style={{ flex: 1 }}
      >
        <SideNavbar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        <Animated.ScrollView 
          showsVerticalScrollIndicator={false} 
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 50 }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {/* --- Sticky Header --- */}
          <Animated.View 
            style={[
              {
                position: 'sticky',
                top: 0,
                zIndex: 20,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 20,
                paddingVertical: 12,
                marginTop: 50,
                marginBottom: 16,
                minHeight: 50,
                borderRadius: 16,
                marginHorizontal: 16,
                backgroundColor: colors.surface + 'E6',
                borderWidth: 1,
                borderColor: colors.border + '40',
                transform: [
                  { translateY: headerTranslateY },
                  { scale: headerScale }
                ],
                opacity: headerOpacity
              }
            ]}
          >
            <TouchableOpacity 
              style={{
                minWidth: 40,
                justifyContent: 'center',
                alignItems: 'center',
                padding: 8,
                backgroundColor: colors.surfaceSecondary + '60',
                borderRadius: 12
              }}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>
            
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 }}>
              <Text 
                style={{ 
                  fontSize: 20,
                  fontWeight: '600',
                  textAlign: 'center',
                  letterSpacing: 0.5,
                  fontFamily: Fonts.silkscreenRegular,
                  color: colors.text,
                  includeFontPadding: false,
                  textAlignVertical: 'center'
                }}
              >
                {getCategoryTitle()}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={{
                minWidth: 40,
                justifyContent: 'center',
                alignItems: 'center',
                padding: 8,
                backgroundColor: colors.surfaceSecondary + '60',
                borderRadius: 12
              }}
              onPress={() => setIsSidebarOpen(true)}
            >
              <Ionicons name="menu" size={20} color={colors.text} />
            </TouchableOpacity>
          </Animated.View>

          {/* --- Featured Book Section --- */}
          {filteredBooks.length > 0 && (
            <View style={{ paddingVertical: 24, paddingHorizontal: 16, marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 8 }}>
                <Text 
                  style={{ 
                    fontSize: 20,
                    fontFamily: Fonts.silkscreenRegular,
                    color: colors.text,
                    includeFontPadding: false,
                    textAlignVertical: 'center'
                  }}
                >
                  Trending in this topic
                </Text>
                <View 
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: colors.tint
                  }}
                >
                  <Ionicons name="trending-up" size={20} color="white" />
                </View>
              </View>
              
              <View style={{ marginHorizontal: -16, paddingHorizontal: 16 }}>
                <FlatList
                  data={filteredBooks.slice(0, 3)}
                  renderItem={renderFeaturedBook}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 16 }}
                  snapToInterval={320}
                  decelerationRate="fast"
                />
              </View>
            </View>
          )}

          {/* --- More Books Section --- */}
          <View style={{ paddingHorizontal: 16, paddingBottom: 24, paddingTop: 8 }}>
            <ThemedText 
              style={{ 
                fontSize: 22,
                fontWeight: '600',
                marginBottom: 20,
                paddingHorizontal: 8,
                letterSpacing: 0.3,
                fontFamily: Fonts.outfitRegular
              }}
            >
              More {getCategoryTitle()}
            </ThemedText>
            
            {loading ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
                <ThemedText style={{ color: colors.text, fontFamily: Fonts.outfitRegular }}>Loading books...</ThemedText>
              </View>
            ) : filteredBooks.length === 0 ? (
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 24 }}>
                <Ionicons name="book-outline" size={64} color={colors.iconAccent} />
                <ThemedText 
                  style={{ 
                    fontSize: 20,
                    fontWeight: '600',
                    textAlign: 'center',
                    marginTop: 16,
                    fontFamily: Fonts.outfitRegular
                  }}
                >
                  No books found
                </ThemedText>
                <ThemedText 
                  variant="secondary"
                  style={{ 
                    fontSize: 16, 
                    textAlign: 'center', 
                    marginTop: 8, 
                    lineHeight: 22,
                    fontFamily: Fonts.outfitRegular
                  }}
                >
                  {name === 'all' 
                    ? 'No books are available at the moment' 
                    : `No books found in the ${getCategoryTitle()} category`
                  }
                </ThemedText>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                {filteredBooks.map((book, index) => (
                  <View key={book.id} style={{ width: '48%', marginBottom: 24 }}>
                    {renderBookCard({ item: book })}
                  </View>
                ))}
              </View>
            )}
          </View>
        </Animated.ScrollView>
        
        {/* Book Description Modal */}
        {selectedBook && (
          <BookDescription
            visible={showBookDescription}
            onClose={() => {
              setShowBookDescription(false);
              setSelectedBook(null);
            }}
            book={selectedBook}
            onReadNow={handleReadNow}
          />
        )}
      </LinearGradient>
    </AuthGuard>
  );
}

// All styles now use inline styles with proper font families
