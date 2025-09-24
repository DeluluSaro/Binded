import PremiumButton from '@/components/premium-button';
import PremiumGlassContainer from '@/components/premium-glass-container';
import SideNavbar from '@/components/side-navbar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-color';
import { useLongPressTheme } from '@/hooks/use-triple-tap-theme';
import { Book, fetchBooks, getBookUrl } from '@/lib/supabase';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
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

// --- Mock Data (Unchanged) ---
const mockBooks = [
  { id: '1', title: 'Normal People', author: 'Sally Rooney', cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop', progress: 0.6 },
  { id: '2', title: 'Small Pleasures', author: 'Clare Chambers', cover: 'https://images.unsplash.com/photo-1592453729249-0524673549a1?w=300&h=400&fit=crop', progress: 0.3 },
  { id: '3', title: 'Where the Crawdads Sing', author: 'Delia Owens', cover: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop', progress: 0.8 },
  { id: '4', title: 'The Midnight Library', author: 'Matt Haig', cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop', progress: 0.4 },
  { id: '5', title: 'Landline', author: 'Rainbow Rowell', cover: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=400&fit=crop', progress: 0.2 },
  { id: '6', title: 'Project Hail Mary', author: 'Andy Weir', cover: 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=300&h=400&fit=crop', progress: 0.7 },
];
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
  const colors = useThemeColors();
  const { handleLongPressStart, handleLongPressEnd } = useLongPressTheme();
  
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
  if (!isLoaded) return (
    <ThemedView style={styles.loadingContainer}>
      <ThemedText style={{ color: colors.text }}>Loading...</ThemedText>
    </ThemedView>
  );

  const lastReadBook = mockBooks[0]; // For the hero component

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

  const heroTranslateY = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, -100],
    extrapolate: 'clamp',
  });

  const heroOpacity = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [1, 0.8],
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

  const handleBookPress = async (book: Book) => {
    try {
      const bookUrl = getBookUrl(book.file_path);
      const supported = await Linking.canOpenURL(bookUrl);
      
      if (supported) {
        await Linking.openURL(bookUrl);
      } else {
        Alert.alert('Error', 'Cannot open this book. Please try again later.');
      }
    } catch (error) {
      console.error('Error opening book:', error);
      Alert.alert('Error', 'Failed to open book. Please try again.');
    }
  };

  const renderBookCard = ({ item }: { item: Book }) => (
    <TouchableOpacity 
      style={[styles.bookCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => handleBookPress(item)}
    >
      <View style={styles.bookCoverPlaceholder}>
        <Ionicons name="book" size={40} color={colors.iconAccent} />
      </View>
      <ThemedText style={styles.bookTitle} numberOfLines={2}>{item.name}</ThemedText>
      <ThemedText variant="secondary" style={styles.bookAuthor} numberOfLines={1}>Tap to open</ThemedText>
    </TouchableOpacity>
  );

  const renderCategory = ({ item }: { item: any }) => (
    <TouchableOpacity style={[styles.categoryChip, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
      <Ionicons name={item.icon as any} size={16} color={colors.iconAccent} />
      <ThemedText variant="secondary" style={styles.chipText}>{item.name}</ThemedText>
    </TouchableOpacity>
  );

  const renderAuthor = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.authorCard}>
      <Image source={{ uri: item.image }} style={[styles.authorImage, { borderColor: colors.borderAccent }]} />
      <ThemedText style={styles.authorName}>{item.name}</ThemedText>
      <ThemedText variant="secondary" style={styles.authorBooksCount}>{item.booksCount} books</ThemedText>
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
                    <ThemedText style={{ fontFamily: 'Pacifico-Regular', fontSize: 24, fontWeight: 'normal', textAlign: 'center' }}>Hello, </ThemedText>
                    <TouchableOpacity 
                        onPressIn={handleLongPressStart} 
                        onPressOut={handleLongPressEnd}
                        activeOpacity={0.7}
                    >
                        <ThemedText style={{ color: colors.tint, fontFamily: 'Pacifico-Regular', fontSize: 28, fontWeight: 'normal' }}>{user?.firstName || 'Reader'}</ThemedText>
                    </TouchableOpacity>
                </View>
                <ThemedText variant="secondary" style={styles.subGreeting}>Ready to dive in?</ThemedText>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={() => router.push('/profile')} style={styles.profileButton}>
                <Image source={{ uri: user?.imageUrl }} style={[styles.profileImage, { borderColor: colors.borderAccent }]} />
              </TouchableOpacity>
            </View>
        </Animated.View>

        {/* --- Animated Spotlight Hero Section --- */}
        <Animated.View style={[
          styles.section,
          {
            transform: [
              { translateY: heroTranslateY }
            ],
            opacity: heroOpacity
          }
        ]}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Continue Reading</ThemedText>
            </View>
            <PremiumGlassContainer variant="card" style={styles.spotlightCard}>
                <TouchableOpacity style={styles.spotlightContent}>
                    <Image source={{ uri: lastReadBook.cover }} style={styles.spotlightCover} />
                    <View style={styles.spotlightInfo}>
                        <ThemedText style={styles.spotlightTitle} numberOfLines={2}>{lastReadBook.title}</ThemedText>
                        <ThemedText variant="secondary" style={styles.spotlightAuthor} numberOfLines={1}>{lastReadBook.author}</ThemedText>
                        <View>
                            <View style={[styles.progressBarContainer, { backgroundColor: colors.surfaceSecondary }]}>
                                <View style={[styles.progressBarFill, { width: `${lastReadBook.progress * 100}%`, backgroundColor: colors.tint }]} />
                            </View>
                            <ThemedText variant="secondary" style={styles.progressText}>{Math.round(lastReadBook.progress * 100)}%</ThemedText>
                        </View>
                        <PremiumButton
                            title="Continue"
                            onPress={() => {}}
                            size="small"
                            icon="play"
                            style={styles.continueButton}
                        />
                    </View>
                </TouchableOpacity>
            </PremiumGlassContainer>
        </Animated.View>

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
            <ThemedText style={styles.sectionTitle}>Categories</ThemedText>
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
            <ThemedText style={styles.sectionTitle}>Popular Books</ThemedText>
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
            <ThemedText style={styles.sectionTitle}>Popular Authors</ThemedText>
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
    minWidth: 100,
    justifyContent: 'flex-start',
  },
  // Center header element container
  headerCenter: {
    flex: 1, // Allows the center to take up remaining space
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  // Right header element container
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 100,
    justifyContent: 'flex-end',
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    
  },
  greeting: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    fontFamily: 'Pacifico-Regular',
    textAlign: 'center',
    paddingTop:10
  },
  subGreeting: { 
    fontSize: 16, 
    fontFamily: Fonts.rounded,
    textAlign: 'left',
    marginTop: 2,
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
    paddingBottom: 10
  },
  // The title text itself, now without horizontal padding
  sectionTitle: { 
    fontSize: 24, 
    fontWeight: 'normal', 
    fontFamily: 'Outfit_700Bold', 
    textAlign: 'left',
  },
  seeAllText: { 
    fontSize: 16, 
    fontWeight: '600', 
    fontFamily: Fonts.rounded,
    textAlign: 'right',
  },
  // Styling for the content area of horizontal lists
  horizontalListContainer: { 
    paddingHorizontal: 24, 
    gap: 20,
    paddingTop: 10
  },

  // --- Spotlight Hero Card ---
  spotlightCard: {
    marginHorizontal: 24,
  },
  spotlightContent: {
    flexDirection: 'row',
    alignItems: 'center', // Vertically align image and info
    padding: 20,
    gap: 16,
  },
  spotlightCover: { 
    width: 100, 
    height: 150, 
    borderRadius: 16, 
  },
  spotlightInfo: { 
    flex: 1, 
    height: 150, 
    justifyContent: 'space-between', // Distribute elements vertically
  },
  spotlightTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    fontFamily: Fonts.heading, 
    textAlign: 'left',
  },
  spotlightAuthor: { 
    fontSize: 16, 
    fontFamily: Fonts.rounded,
    textAlign: 'left',
  },
  progressBarContainer: { 
    height: 8, 
    borderRadius: 4, 
    overflow: 'hidden',
  },
  progressBarFill: { 
    height: '100%' 
  },
  progressText: { 
    fontSize: 12, 
    fontFamily: Fonts.rounded, 
    fontWeight: '600', 
    textAlign: 'right',
    marginTop: 4,
  },
  continueButton: {
    alignSelf: 'flex-start', // Keep button left-aligned
    marginTop: 8,
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
    minWidth: 100,
  },
  chipText: { 
    fontSize: 15, 
    fontWeight: '500', 
    fontFamily: Fonts.rounded,
    textAlign: 'center',
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
    fontWeight: '600', 
    fontFamily: Fonts.heading, 
    marginBottom: 4,
    textAlign: 'left',
  },
  bookAuthor: { 
    fontSize: 13, 
    fontFamily: Fonts.rounded,
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
    fontFamily: Fonts.heading, 
    textAlign: 'center',
  },
  authorBooksCount: { 
    fontSize: 13, 
    fontFamily: Fonts.rounded,
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
    fontFamily: Fonts.heading,
    textAlign: 'center',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: Fonts.rounded,
    textAlign: 'center',
    marginTop: 8,
  },
});