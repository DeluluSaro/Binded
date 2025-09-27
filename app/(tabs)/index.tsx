import BookDescription from '@/components/book-description';

import Loading from '@/components/loading';
import SideNavbar from '@/components/side-navbar';
import SimpleEpubReader from '@/components/simple-epub-reader';
import AsteroidDodge from '@/components/snake-game';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-color';
import { useLongPressTheme } from '@/hooks/use-triple-tap-theme';
import { Book, fetchBooks, getBookUrl } from '@/lib/supabase';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';


// Add this to any screen

import {
  Alert,
  Animated,
  FlatList,
  Linking,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';

// --- Mock Data for Categories and Authors (keeping these as they're UI elements) ---
const categories = [ { id: '1', name: 'Non-Fiction', icon: 'book' }, { id: '2', name: 'Biographies', icon: 'person' }, { id: '3', name: 'Sci-Fi', icon: 'rocket' }, { id: '4', name: 'Romance', icon: 'heart' }, { id: '5', name: 'Mystery', icon: 'search' }, { id: '6', name: 'Fantasy', icon: 'sparkles' }, ];
const popularAuthors = [ { id: '1', name: 'Sally Rooney', booksCount: 3, image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face', }, { id: '2', name: 'Delia Owens', booksCount: 2, image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face', }, { id: '3', name: 'Matt Haig', booksCount: 4, image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face', }, { id: '4', name: 'Andy Weir', booksCount: 2, image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face', }, ];


// Screen dimensions available if needed
// const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function HomeScreen() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEpubReader, setShowEpubReader] = useState(false);
  const [selectedEpubUri, setSelectedEpubUri] = useState<string>('');
  const [openingBook, setOpeningBook] = useState(false);
  const [showAsteroidDodge, setShowAsteroidDodge] = useState(false);
  
  const [showBookDescription, setShowBookDescription] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const colors = useThemeColors();
  const { handleLongPressStart, handleLongPressEnd } = useLongPressTheme();
  
  // Load Outfit font
  const [fontsLoaded] = useFonts({
    'Outfit-Regular': require('@/assets/fonts/Outfit-Regular.ttf'),
  });
  
  // Asteroid Dodge game long press handlers
  const asteroidLongPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const handleAsteroidLongPressStart = () => {
    // Clear any existing timeout
    if (asteroidLongPressRef.current) {
      clearTimeout(asteroidLongPressRef.current);
    }
    
    // Set timeout for 1.2 seconds
    asteroidLongPressRef.current = setTimeout(() => {
      setShowAsteroidDodge(true);
    }, 1200);
  };

  const handleAsteroidLongPressEnd = () => {
    if (asteroidLongPressRef.current) {
      clearTimeout(asteroidLongPressRef.current);
      asteroidLongPressRef.current = null;
    }
  };

  
  // Parallax animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;

  // Fetch books from Supabase
  useEffect(() => {
    const loadBooks = async () => {
      try {
        console.log('🔄 Starting to load books in component...');
        setLoading(true);
        const fetchedBooks = await fetchBooks();
        console.log('📚 Books loaded in component:', fetchedBooks.length, 'books');
        setBooks(fetchedBooks);
      } catch (error) {
        console.error('💥 Error loading books in component:', error);
        Alert.alert('Error', `Failed to load books: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, []);

  if (isLoaded && !isSignedIn) return <Redirect href="/sign-in" />;
  if (!isLoaded || !fontsLoaded) return (
    <ThemedView style={styles.loadingContainer}>
      <ThemedText style={{ color: colors.text }}>Loading...</ThemedText>
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


  const sectionTranslateY = scrollY.interpolate({
    inputRange: [0, 300],
    outputRange: [0, -50],
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
      
      const bookUrl = getBookUrl(book.file_path);
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

  const renderBookCard = ({ item }: { item: Book }) => {
    const isEpub = item.file_path?.toLowerCase().endsWith('.epub');
    const isPdf = item.file_path?.toLowerCase().endsWith('.pdf');
    
    return (
      <TouchableOpacity 
        style={[styles.bookCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => handleBookPress(item)}
      >
        {item.cover_image_path ? (
          <Image 
            source={{ uri: item.cover_image_path }} 
            style={styles.bookCover}
            contentFit="cover"
          />
        ) : (
        <View style={styles.bookCoverPlaceholder}>
          <Ionicons 
            name={isEpub ? "book" : isPdf ? "document-text" : "book"} 
            size={40} 
            color={colors.iconAccent} 
          />
        </View>
        )}
        <ThemedText style={[styles.bookTitle, { fontFamily: Fonts.outfitRegular }]} numberOfLines={2}>{item.name}</ThemedText>
        <ThemedText variant="secondary" style={[styles.bookAuthor, { fontFamily: Fonts.outfitRegular }]} numberOfLines={1}>
          {item.author}
        </ThemedText>
      </TouchableOpacity>
    );
  };

  const renderCategory = ({ item }: { item: any }) => (
    <TouchableOpacity style={[styles.categoryChip, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
      <Ionicons name={item.icon as any} size={16} color={colors.iconAccent} />
      <ThemedText variant="secondary" style={[styles.chipText, { fontFamily: 'Silkscreen-Regular' }]} numberOfLines={1}>{item.name}</ThemedText>
    </TouchableOpacity>
  );

  const renderAuthor = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.authorCard}>
      <Image source={{ uri: item.image }} style={[styles.authorImage, { borderColor: colors.borderAccent }]} />
      <ThemedText style={[styles.authorName, { fontFamily: 'Silkscreen-Regular' }]}>{item.name}</ThemedText>
      <ThemedText variant="secondary" style={[styles.authorBooksCount, { fontFamily: Fonts.outfitRegular }]}>{item.booksCount} books</ThemedText>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={colors.gradient as [string, string, string]}
      style={styles.container}
    >



      {/* Floating Background Elements */}
      <Animated.View style={[
        styles.floatingElement1,
        {
          transform: [
            { translateY: scrollY.interpolate({
              inputRange: [0, 500],
              outputRange: [0, -200],
              extrapolate: 'clamp',
            })},
            { translateX: scrollY.interpolate({
              inputRange: [0, 500],
              outputRange: [0, 50],
              extrapolate: 'clamp',
            })}
          ],
          opacity: scrollY.interpolate({
            inputRange: [0, 300],
            outputRange: [0.3, 0],
            extrapolate: 'clamp',
          })
        }
      ]} />
      
      <Animated.View style={[
        styles.floatingElement2,
        {
          transform: [
            { translateY: scrollY.interpolate({
              inputRange: [0, 500],
              outputRange: [0, -150],
              extrapolate: 'clamp',
            })},
            { translateX: scrollY.interpolate({
              inputRange: [0, 500],
              outputRange: [0, -30],
              extrapolate: 'clamp',
            })}
          ],
          opacity: scrollY.interpolate({
            inputRange: [0, 400],
            outputRange: [0.2, 0],
            extrapolate: 'clamp',
          })
        }
      ]} />

      <SideNavbar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <Animated.ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
          scrollEnabled={!showAsteroidDodge}
      >
        {/* --- Animated Header --- */}
        <Animated.View style={[
          styles.header,
          {
            transform: [
              { translateY: headerTranslateY },
              { scale: headerScale }
            ],
            opacity: headerOpacity
          }
        ]}>
            <TouchableOpacity style={styles.menuButton} onPress={() => setIsSidebarOpen(true)}>
                <Ionicons name="menu" size={30} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
                <View style={styles.greetingContainer}>
                    <ThemedText style={{ fontSize: 28, fontWeight: 'normal', textAlign: 'center', fontFamily: 'Outfit-Regular', flexShrink: 0 }}>Hello, </ThemedText>
                    <TouchableOpacity 
                        onPressIn={handleLongPressStart} 
                        onPressOut={handleLongPressEnd}
                        activeOpacity={0.7}
                        style={{ flexShrink: 0 }}
                    >
                        <ThemedText style={{ color: colors.tint, fontSize: 32, fontWeight: 'normal', fontFamily: 'Outfit-Regular', flexShrink: 0 }} numberOfLines={1}>{user?.firstName || 'Reader'}</ThemedText>
                    </TouchableOpacity>
                </View>
            </View>
            
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={() => router.push('/profile')} style={styles.profileButton}>
                <Image source={{ uri: user?.imageUrl }} style={[styles.profileImage, { borderColor: colors.borderAccent }]} />
              </TouchableOpacity>
            </View>
        </Animated.View>

        {/* --- Sub Greeting Section --- */}
        <View style={styles.subGreetingSection}>
            <TouchableOpacity
              onPressIn={handleAsteroidLongPressStart}
              onPressOut={handleAsteroidLongPressEnd}
              activeOpacity={0.7}
            >
              <ThemedText variant="secondary" style={[styles.subGreeting, { fontFamily: Fonts.silkscreenRegular }]}>Ready to dive in?</ThemedText>
            </TouchableOpacity>
        </View>


        {/* --- Animated Categories Section --- */}
        <Animated.View style={[
          styles.section,
          {
            transform: [
              { translateY: sectionTranslateY }
            ]
          }
        ]}>
          <View style={styles.sectionHeader}>
            <ThemedText style={[styles.sectionTitle, { fontFamily: Fonts.outfitRegular }]}>Categories</ThemedText>
            <TouchableOpacity>
              <ThemedText variant="accent" style={styles.seeAllText}>See All</ThemedText>
            </TouchableOpacity>
          </View>
          <FlatList
            data={categories}
            renderItem={renderCategory}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalListContainer}
          />
        </Animated.View>

        {/* --- Animated Popular Books Section --- */}
        <Animated.View style={[
          styles.section,
          {
            transform: [
              { translateY: sectionTranslateY }
            ]
          }
        ]}>
          <View style={styles.sectionHeader}>
            <ThemedText style={[styles.sectionTitle, { fontFamily: Fonts.outfitRegular }]}>Popular Books</ThemedText>
            <TouchableOpacity>
              <ThemedText variant="accent" style={styles.seeAllText}>See All</ThemedText>
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ThemedText style={{ color: colors.text }}>Loading books...</ThemedText>
            </View>
          ) : books.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="book-outline" size={48} color={colors.iconAccent} />
              <ThemedText style={[styles.emptyText, { color: colors.text }]}>No books available</ThemedText>
              <ThemedText variant="secondary" style={styles.emptySubtext}>Check Supabase bucket permissions</ThemedText>
              <ThemedText variant="secondary" style={[styles.emptySubtext, { fontSize: 12, marginTop: 8 }]}>
                Make sure the Books bucket has public access enabled
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={books}
              renderItem={renderBookCard}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalListContainer}
            />
          )}
        </Animated.View>
        
        {/* --- Animated Popular Authors Section --- */}
        <Animated.View style={[
          styles.section,
          {
            transform: [
              { translateY: sectionTranslateY }
            ]
          }
        ]}>
          <View style={styles.sectionHeader}>
            <ThemedText style={[styles.sectionTitle, { fontFamily: Fonts.outfitRegular }]}>Popular Authors</ThemedText>
            <TouchableOpacity>
              <ThemedText variant="accent" style={styles.seeAllText}>See All</ThemedText>
            </TouchableOpacity>
          </View>
          <FlatList
            data={popularAuthors}
            renderItem={renderAuthor}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalListContainer}
          />
        </Animated.View>
      </Animated.ScrollView>
      
      {/* Asteroid Dodge Game Modal */}
      <AsteroidDodge 
        visible={showAsteroidDodge} 
        onClose={() => setShowAsteroidDodge(false)}
      />
      
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { 
    paddingTop: Platform.OS === 'ios' ? 70 : 50, 
    paddingBottom: 50, 
  },
  
  // Floating background elements
  floatingElement1: {
    position: 'absolute',
    top: 100,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 0,
  },
  floatingElement2: {
    position: 'absolute',
    top: 300,
    left: -80,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 0,
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  
  // --- Header ---
  header: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 32,
    minHeight: 50,
    zIndex: 10,
  },
  // Left header element container
  menuButton: {
    minWidth: 60,
    justifyContent: 'flex-start',
  },
  // Center header element container
  headerCenter: {
    flex: 1, // Allows the center to take up remaining space
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    minWidth: 0, // Allows flex shrinking
  },
  // Right header element container
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 60,
    justifyContent: 'flex-end',
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexWrap: 'wrap',
    maxWidth: '100%',
  },
  greeting: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    textAlign: 'center',
    paddingTop:20
  },
  subGreetingSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  subGreeting: { 
    fontSize: 24, 
    textAlign: 'center',
  },
  profileButton: {
    borderRadius: 24,
  },
  profileImage: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    borderWidth: 2 
  },

  // --- General Section Styling ---
  section: { 
    marginBottom: 40,
    zIndex: 5,
  },
  // Container for section titles and the "See All" button
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    marginBottom: 30,
    paddingBottom: 10,
    minHeight: 30,
  },
  // The title text itself, now without horizontal padding
  sectionTitle: { 
    fontSize: 22, 
    fontWeight: 'normal', 
    textAlign: 'left',
    flexShrink: 0,
    flex: 1,
    fontFamily: 'Outfit-Regular',
  },
  seeAllText: { 
    fontSize: 16, 
    fontWeight: '600', 
    textAlign: 'right',
  },
  // Styling for the content area of horizontal lists
  horizontalListContainer: { 
    paddingHorizontal: 24, 
    gap: 15,
    paddingTop: 10,
    paddingRight: 40,
  },

  
  // --- Category Chip ---
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    minWidth: 120,
    flexShrink: 0,
  },
  chipText: { 
    fontSize: 15, 
    fontWeight: '500', 
    textAlign: 'center',
    flexShrink: 0,
    fontFamily: 'Silkscreen-Regular',
  },

  // --- Popular Book Card ---
  bookCard: {
    borderRadius: 16,
    width: 150,
    padding: 12,
    borderWidth: 1,
  },
  bookCover: { 
    width: '100%', 
    height: 180, 
    borderRadius: 12, 
    marginBottom: 12 
  },
  bookTitle: { 
    fontSize: 15, 
    fontWeight: 'normal', 
    marginBottom: 4,
    textAlign: 'left',
  },
  bookAuthor: { 
    fontSize: 13, 
    textAlign: 'left',
  },
  
  // --- Popular Author Card ---
  authorCard: { 
    alignItems: 'center', // Center content horizontally
    gap: 8,
    width: 110,
  },
  authorImage: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    borderWidth: 2 
  },
  authorName: { 
    fontSize: 15, 
    fontWeight: '600', 
    textAlign: 'center',
    fontFamily: 'Silkscreen-Regular',
  },
  authorBooksCount: { 
    fontSize: 13, 
    textAlign: 'center',
  },

  // --- Book Cover Placeholder ---
  bookCoverPlaceholder: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  // --- Empty State ---
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
});