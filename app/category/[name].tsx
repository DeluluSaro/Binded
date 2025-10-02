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
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  FlatList,
  Linking,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);
const HEADER_MAX_HEIGHT = 190; // Combined height for nav bar and search
const HEADER_MIN_HEIGHT = 70; // Collapsed nav bar height
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

// Animated wrapper for list items to add a subtle entrance animation
const AnimatedListItem = ({ children, index }: { children: React.ReactNode; index: number }) => {
  const slideAnim = useRef(new Animated.Value(30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay: index * 100, // Staggered animation
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: opacityAnim, transform: [{ translateY: slideAnim }] }}>
      {children}
    </Animated.View>
  );
};


export default function EnhancedCategoryScreen() {
  const { isLoaded } = useAuth();
  const router = useRouter();
  const { name } = useLocalSearchParams<{ name: string }>();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreBooks, setHasMoreBooks] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [showEpubReader, setShowEpubReader] = useState(false);
  const [selectedEpubUri, setSelectedEpubUri] = useState<string>('');
  const [openingBook, setOpeningBook] = useState(false);
  const [showBookDescription, setShowBookDescription] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const colors = useThemeColors();
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const thunderAnimation = useRef(new Animated.Value(0)).current;
  const lightningOpacity = useRef(new Animated.Value(0)).current;
  const lightningRotation = useRef(new Animated.Value(0)).current;

  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    const loadBooks = async () => {
      try {
        setLoading(true);
        setCurrentPage(0);
        setHasMoreBooks(true);
        
        const fetchedBooks = await firestoreService.getAllBooks();
        
        let filtered;
        if (name && name !== 'all') {
          filtered = fetchedBooks.filter(book => 
            book.genre && book.genre.toLowerCase() === name.toLowerCase()
          );
        } else {
          filtered = fetchedBooks;
        }
        
        const sortedBooks = filtered.sort((a, b) => {
          const aCompleted = a.completed || 0;
          const bCompleted = b.completed || 0;
          return bCompleted - aCompleted;
        });
        
        setAllBooks(sortedBooks);
        
        const firstPageBooks = sortedBooks.slice(0, ITEMS_PER_PAGE);
        setFilteredBooks(firstPageBooks);
        
        setHasMoreBooks(sortedBooks.length > ITEMS_PER_PAGE);
      } catch (error) {
        console.error('Error loading books:', error);
        Alert.alert('Error', `Failed to load books: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, [name]);

  const loadMoreBooks = async () => {
    if (loadingMore || !hasMoreBooks) return;
    
    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      const startIndex = nextPage * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      
      const newBooks = allBooks.slice(startIndex, endIndex);
      
      if (newBooks.length > 0) {
        setFilteredBooks(prev => [...prev, ...newBooks]);
        setCurrentPage(nextPage);
        setHasMoreBooks(endIndex < allBooks.length);
      } else {
        setHasMoreBooks(false);
      }
    } catch (error) {
      console.error('Error loading more books:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true }
  );

  const handleBookPress = (book: Book) => {
    setSelectedBook(book);
    setShowBookDescription(true);
  };

  const handleReadNow = async (book: Book) => {
    try {
      setShowBookDescription(false);
      setOpeningBook(true);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (!book.file_path) {
        Alert.alert('No File Available', 'This book does not have a file to read yet.');
        return;
      }
      
      const bookUrl = firestoreService.getBookUrl(book.file_path);
      
      if (book.file_path.toLowerCase().endsWith('.epub')) {
        setSelectedEpubUri(bookUrl);
        setShowEpubReader(true);
      } else {
        const supported = await Linking.canOpenURL(bookUrl);
        if (supported) {
          await Linking.openURL(bookUrl);
        } else {
          Alert.alert('Error', 'Cannot open this book. Please try again later.');
        }
      }
    } catch (error) {
      console.error('Error opening book:', error);
      Alert.alert('Error', 'Failed to open book. Please try again.');
    } finally {
      setOpeningBook(false);
    }
  };

  const renderFeaturedBook = ({ item, index }: { item: Book; index: number }) => (
    <AnimatedListItem index={index}>
        <TouchableOpacity 
        style={styles.featuredBookContainer}
          onPress={() => handleBookPress(item)}
          activeOpacity={0.95}
        >
          <View style={{ flex: 1, position: 'relative' }}>
            {item.cover_image_path ? (
              <Image 
                source={{ uri: item.cover_image_path }} 
              style={styles.imageFill}
                contentFit="cover"
              />
            ) : (
              <LinearGradient
                colors={[colors.surfaceSecondary + 'CC', colors.surfaceSecondary]}
              style={styles.placeholderGradient}
            >
                  <Ionicons name="book" size={80} color={colors.iconAccent} />
              </LinearGradient>
            )}

            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.85)']}
            style={styles.featuredBookGradient}
            />
          </View>
          
        <View style={styles.featuredBookTextContainer}>
          <ThemedText style={styles.featuredBookTitle} numberOfLines={2}>
              {item.name}
            </ThemedText>
          <ThemedText variant="secondary" style={styles.featuredBookAuthor} numberOfLines={1}>
              {item.author}
            </ThemedText>
            
          <View style={styles.readersInfoContainer}>
              <Ionicons name="people" size={14} color="rgba(255, 255, 255, 0.9)" />
            <ThemedText style={styles.readersInfoText}>
                {item.completed || 0} readers
              </ThemedText>
            </View>
          </View>
          
        <View style={styles.playButtonWrapper}>
            <TouchableOpacity 
            style={[styles.playButton, { backgroundColor: colors.tint, shadowColor: colors.tint }]}
              onPress={() => handleBookPress(item)}
            >
              <Ionicons name="play" size={30} color="white" style={{ marginLeft: 3 }} />
            </TouchableOpacity>
        </View>
        </TouchableOpacity>
    </AnimatedListItem>
    );

  const renderBookCard = ({ item, index }: { item: Book; index: number }) => {
    const isEpub = item.file_path?.toLowerCase().endsWith('.epub');
    const isPdf = item.file_path?.toLowerCase().endsWith('.pdf');

    return (
      <AnimatedListItem index={index}>
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'transparent' }}
          onPress={() => handleBookPress(item)}
          activeOpacity={0.95}
        >
          <View style={styles.bookCardImageContainer}>
            {item.cover_image_path ? (
              <Image 
                source={{ uri: item.cover_image_path }} 
                style={styles.imageFill}
                contentFit="cover"
              />
            ) : (
              <LinearGradient
                colors={[colors.surfaceSecondary + 'DD', colors.surfaceSecondary]}
                style={styles.placeholderGradient}
              >
                <Ionicons 
                  name={isEpub ? "book" : isPdf ? "document-text" : "book"} 
                  size={50} 
                  color={colors.iconAccent} 
                />
              </LinearGradient>
            )}
            
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.2)']} style={styles.bookCardGradient} />

            <View style={[styles.bookTypeBadge, { backgroundColor: colors.tint, shadowColor: colors.tint }]}>
              <ThemedText style={styles.bookTypeBadgeText}>
                {isEpub ? 'EPUB' : isPdf ? 'PDF' : 'BOOK'}
              </ThemedText>
            </View>
          </View>
          
          <View style={styles.bookCardTextContainer}>
            <ThemedText style={styles.bookCardTitle} numberOfLines={1}>
              {item.name}
            </ThemedText>
            <ThemedText variant="secondary" style={styles.bookCardAuthor} numberOfLines={1}>
              {item.author}
            </ThemedText>
          </View>
        </TouchableOpacity>
      </AnimatedListItem>
    );
  };

  const getCategoryTitle = () => {
    if (name === 'all') return 'All Books';
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : 'Category';
  };

  const triggerThunderAnimation = () => {
    const config = { easing: Easing.inOut(Easing.ease), useNativeDriver: true };
    const borderConfig = { ...config, useNativeDriver: false };

    lightningRotation.setValue(0);
    lightningOpacity.setValue(0);
    thunderAnimation.setValue(0);

    Animated.parallel([
    Animated.sequence([
        Animated.timing(lightningRotation, { toValue: 1, duration: 150, ...config }),
        Animated.timing(lightningRotation, { toValue: 0, duration: 150, ...config }),
      ]),
    Animated.sequence([
        Animated.timing(lightningOpacity, { toValue: 1, duration: 50, ...config }),
        Animated.timing(lightningOpacity, { toValue: 0.3, duration: 100, ...config }),
        Animated.timing(lightningOpacity, { toValue: 1, duration: 80, ...config }),
        Animated.timing(lightningOpacity, { toValue: 0, duration: 200, ...config }),
      ]),
    Animated.sequence([
        Animated.timing(thunderAnimation, { toValue: 1, duration: 100, ...borderConfig }),
        Animated.timing(thunderAnimation, { toValue: 0.7, duration: 150, ...borderConfig }),
        Animated.timing(thunderAnimation, { toValue: 1, duration: 100, ...borderConfig }),
        Animated.timing(thunderAnimation, { toValue: 0, duration: 400, ...borderConfig }),
      ]),
    ]).start();
  };

  const resetThunderAnimation = () => {
    // No explicit reset needed, animation plays out and stops
  };

  const filterBooks = (books: Book[], query: string) => {
    if (!query.trim()) return books;
    return books.filter(book => 
      book.name.toLowerCase().includes(query.toLowerCase()) ||
      book.author.toLowerCase().includes(query.toLowerCase()) ||
      (book.genre && book.genre.toLowerCase().includes(query.toLowerCase()))
    );
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
      const filtered = filterBooks(allBooks, text);
      setFilteredBooks(filtered);
  };

  // ***** ANIMATION VALUES *****
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -HEADER_SCROLL_DISTANCE],
    extrapolate: 'clamp',
  });

  const searchOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  
  // ***** LOADING & EMPTY STATES *****
  if (!isLoaded) return (
    <ThemedView style={styles.centeredLoader}>
      <ThemedText style={{ color: colors.text, fontFamily: Fonts.outfitRegular }}>Loading...</ThemedText>
    </ThemedView>
  );

  if (openingBook) return <Loading message="Opening Book..." />;

  if (showEpubReader && selectedEpubUri) {
    return (
      <SimpleEpubReader
        epubUrl={selectedEpubUri}
        onClose={() => { setShowEpubReader(false); setSelectedEpubUri(''); }}
      />
    );
  }

  return (
    <AuthGuard fallbackRoute="/sign-up" requireEmail={true}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={colors.gradient as [string, string, string]} style={{ flex: 1 }}>
        <SideNavbar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        <View style={{ flex: 1 }}>
          {/* ***** UNIFIED ANIMATED HEADER ***** */}
          <Animated.View 
            style={[
              styles.header,
              { 
                height: HEADER_MAX_HEIGHT,
                transform: [{ translateY: headerTranslateY }],
              },
            ]}
          >
            {/* Top Navigation Bar */}
            <BlurView
              intensity={Platform.OS === 'ios' ? 80 : 100}
              tint="dark"
              style={[
                styles.headerNavbar,
                {
                borderColor: colors.border + '50',
                backgroundColor: colors.surface + 'DD',
                }
              ]}
            >
              <TouchableOpacity 
                style={[styles.headerButton, { backgroundColor: colors.surfaceSecondary + '80' }]}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
              
              <View style={styles.headerTitleContainer}>
                <ThemedText style={[styles.headerTitle, { color: colors.text }]}>
                  {getCategoryTitle()}
                </ThemedText>
              </View>
              
              <TouchableOpacity 
                style={[styles.headerButton, { backgroundColor: colors.surfaceSecondary + '80' }]}
                onPress={() => setIsSidebarOpen(true)}
              >
                <Ionicons name="menu" size={22} color={colors.text} />
              </TouchableOpacity>
            </BlurView>
            
            {/* Search Box with Thunder Effects */}
            {!loading && allBooks.length > 0 && (
              <Animated.View style={[styles.searchWrapper, { opacity: searchOpacity }]}>
                <View style={{ position: 'relative' }}>
              {/* Electric Lightning Bolts */}
                  <Animated.View style={[styles.lightningContainer, { opacity: lightningOpacity, transform: [{ rotate: lightningRotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg']}) }]}]}>
                    <View style={[styles.lightningBolt, styles.lightning1, { backgroundColor: colors.tint, shadowColor: colors.tint }]} />
                    <View style={[styles.lightningBolt, styles.lightning1inner, { backgroundColor: colors.tint + 'CC' }]} />
                    <View style={[styles.lightningBolt, styles.lightning2, { backgroundColor: colors.tint, shadowColor: colors.tint }]} />
                    <View style={[styles.lightningBolt, styles.lightning2inner, { backgroundColor: colors.tint + 'CC' }]} />
                    <View style={[styles.lightningBolt, styles.lightning3, { backgroundColor: colors.tint, shadowColor: colors.tint }]} />
                    <View style={[styles.lightningBolt, styles.lightning3inner, { backgroundColor: colors.tint + 'CC' }]} />
                    <View style={[styles.lightningBolt, styles.lightning4, { backgroundColor: colors.tint, shadowColor: colors.tint }]} />
                    <View style={[styles.lightningBolt, styles.lightning4inner, { backgroundColor: colors.tint + 'CC' }]} />
              </Animated.View>

                  {/* Thunder Border Effect */}
                  <Animated.View style={[styles.thunderBorder, {
                    borderWidth: thunderAnimation.interpolate({ inputRange: [0, 1], outputRange: [0, 2] }),
                    borderColor: thunderAnimation.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['transparent', colors.tint, colors.tint + 'CC'] }),
                    shadowColor: colors.tint,
                    shadowOpacity: thunderAnimation.interpolate({ inputRange: [0, 1], outputRange: [0, 0.8] }),
                    shadowRadius: thunderAnimation.interpolate({ inputRange: [0, 1], outputRange: [0, 12] }),
                    elevation: thunderAnimation.interpolate({ inputRange: [0, 1], outputRange: [0, 8] }),
                  }]} />
              
              {/* Search Input Container */}
                  <View style={[styles.searchInputContainer, { backgroundColor: colors.surface, borderColor: isSearchFocused ? colors.tint : colors.border }]}>
                    <Ionicons name="search" size={16} color={colors.textSecondary} style={{ marginRight: 10 }} />
                <TextInput
                      style={[styles.searchInput, { color: colors.text }]}
                      placeholder="Search books..."
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={handleSearch}
                      onFocus={() => { setIsSearchFocused(true); triggerThunderAnimation(); }}
                      onBlur={() => { setIsSearchFocused(false); resetThunderAnimation(); }}
                />
                {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => handleSearch('')} style={{ marginLeft: 6 }}>
                        <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
                  </View>
              </View>
            </Animated.View>
            )}
          </Animated.View>

          {/* ***** MAIN CONTENT ***** */}
          {loading ? (
            <View style={styles.centeredLoader}>
                <Ionicons name="book" size={64} color={colors.iconAccent} />
              <ThemedText style={[styles.loadingText, { color: colors.text }]}>
                Loading books...
              </ThemedText>
            </View>
          ) : filteredBooks.length === 0 ? (
            <View style={styles.noBooksContainer}>
                <Ionicons name="book-outline" size={80} color={colors.iconAccent} />
              <ThemedText style={styles.noBooksTitle}>
                No books found
              </ThemedText>
              <ThemedText variant="secondary" style={styles.noBooksSubtitle}>
                {name === 'all' 
                  ? 'No books are available at the moment' 
                  : `No books found in the ${getCategoryTitle()} category`
                }
              </ThemedText>
            </View>
          ) : (
            <AnimatedFlatList
              data={[
                { type: 'trending', data: filteredBooks.slice(0, 10) },
                { type: 'more', data: filteredBooks }
              ] as { type: string; data: Book[] }[]}
              renderItem={({ item, index }) => {
                const typedItem = item as { type: string; data: Book[] };
                if (typedItem.type === 'trending' && typedItem.data.length > 0 && searchQuery.length === 0) {
                  return (
                    <View style={styles.sectionContainer}>
                      <View style={styles.sectionHeader}>
                        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                          Trending Now
                        </ThemedText>
                        <View style={[styles.trendingIconContainer, { backgroundColor: colors.tint, shadowColor: colors.tint }]}>
                          <Ionicons name="trending-up" size={22} color="white" />
                        </View>
                      </View>
                      
                      <FlatList
                        data={typedItem.data}
                        renderItem={renderFeaturedBook}
                        keyExtractor={(book) => book.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingLeft: 16, paddingRight: 4 }}
                        snapToInterval={340}
                        decelerationRate="fast"
                      />
                    </View>
                  );
                } else if (typedItem.type === 'more' && typedItem.data.length > 0) {
                  return (
                    <View style={styles.sectionContainerMore}>
                      <ThemedText style={[styles.sectionTitle, { paddingHorizontal: 8 }]}>
                        {searchQuery.length > 0 ? 'Search Results' : (name === 'all' ? 'All Books' : `More ${getCategoryTitle()}`)}
                      </ThemedText>
                      
                      <View style={styles.booksGridContainer}>
                        {typedItem.data.map((book: Book, bookIndex: number) => (
                          <View key={book.id} style={{ width: '48%' }}>
                            {renderBookCard({ item: book, index: bookIndex })}
                          </View>
                        ))}
                      </View>
                        
                        {loadingMore && (
                        <View style={styles.loaderMoreContainer}>
                              <Ionicons name="book" size={32} color={colors.iconAccent} />
                          <ThemedText style={[styles.loaderMoreText, { color: colors.text }]}>
                              Loading more books...
                            </ThemedText>
                          </View>
                        )}
                        
                      {hasMoreBooks && !loadingMore && searchQuery.length === 0 && (
                        <View style={styles.loadMoreButtonContainer}>
                            <TouchableOpacity 
                            style={[styles.loadMoreButton, { backgroundColor: colors.tint, shadowColor: colors.tint }]}
                              onPress={loadMoreBooks}
                            >
                              <Ionicons name="add" size={18} color="white" />
                            <ThemedText style={styles.loadMoreButtonText}>
                                Load More Books
                              </ThemedText>
                            </TouchableOpacity>
                          </View>
                        )}
                    </View>
                  );
                }
                return null;
              }}
              keyExtractor={(item, index) => `${(item as { type: string; data: Book[] }).type}-${index}`}
              showsVerticalScrollIndicator={false}
               contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT + 40, paddingBottom: 60 }}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              onEndReached={searchQuery.length === 0 ? loadMoreBooks : undefined}
              onEndReachedThreshold={0.5}
            />
          )}
        </View>
        
        {selectedBook && (
          <BookDescription
            visible={showBookDescription}
            onClose={() => { setShowBookDescription(false); setSelectedBook(null); }}
            book={selectedBook}
            onReadNow={handleReadNow}
          />
        )}
      </LinearGradient>
    </AuthGuard>
  );
}

// Stylesheet for better organization and performance
const styles = StyleSheet.create({
  centeredLoader: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, paddingTop: 40, alignItems: 'center' },
  headerNavbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 24, overflow: 'hidden', borderWidth: 1, width: '92%' },
  headerButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
  headerTitleContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  headerTitle: { fontSize: 22, textAlign: 'center', letterSpacing: 0.8, fontFamily: Fonts.silkscreenRegular },
   searchWrapper: { width: '92%', marginTop: 20 },
  lightningContainer: { position: 'absolute', top: -8, left: -8, right: -8, bottom: -8 },
  lightningBolt: { position: 'absolute', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8, elevation: 5 },
  lightning1: { top: -15, left: '30%', width: 3, height: 25, transform: [{ rotate: '15deg' }] },
  lightning1inner: { top: -10, left: '32%', width: 2, height: 15, transform: [{ rotate: '-25deg' }] },
  lightning2: { top: '40%', right: -20, width: 25, height: 3, transform: [{ rotate: '25deg' }] },
  lightning2inner: { top: '42%', right: -15, width: 15, height: 2, transform: [{ rotate: '-35deg' }] },
  lightning3: { bottom: -15, left: '60%', width: 3, height: 25, transform: [{ rotate: '-20deg' }] },
  lightning3inner: { bottom: -10, left: '58%', width: 2, height: 15, transform: [{ rotate: '30deg' }] },
  lightning4: { top: '20%', left: -20, width: 25, height: 3, transform: [{ rotate: '-30deg' }] },
  lightning4inner: { top: '18%', left: -15, width: 15, height: 2, transform: [{ rotate: '40deg' }] },
  thunderBorder: { position: 'absolute', top: -3, left: -3, right: -3, bottom: -3, borderRadius: 18, shadowOffset: { width: 0, height: 0 } },
  searchInputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: Fonts.outfitRegular },
  loadingText: { fontFamily: Fonts.outfitRegular, marginTop: 20, fontSize: 16 },
  noBooksContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 120, paddingHorizontal: 28, minHeight: 500 },
  noBooksTitle: { fontSize: 24, textAlign: 'center', marginTop: 24, fontFamily: Fonts.outfitRegular },
  noBooksSubtitle: { fontSize: 16, textAlign: 'center', marginTop: 12, lineHeight: 24, fontFamily: Fonts.outfitRegular },
  sectionContainer: { marginBottom: 12 },
  sectionContainerMore: { paddingHorizontal: 16, paddingBottom: 28, paddingTop: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingHorizontal: 24 },
  sectionTitle: { fontSize: 26, marginBottom: 24, letterSpacing: 0.5, fontFamily: Fonts.silkscreenRegular },
  trendingIconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12 },
  booksGridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 24 },
  loaderMoreContainer: { width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 20 },
  loaderMoreText: { fontFamily: Fonts.outfitRegular, marginLeft: 12, fontSize: 14 },
  loadMoreButtonContainer: { width: '100%', justifyContent: 'center', alignItems: 'center', paddingVertical: 20 },
  loadMoreButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  loadMoreButtonText: { color: 'white', fontFamily: Fonts.outfitRegular, marginLeft: 8, fontSize: 14, fontWeight: '600' },
  imageFill: { width: '100%', height: '100%' },
  placeholderGradient: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  featuredBookContainer: { width: 320, height: 420, marginRight: 20, borderRadius: 28, overflow: 'hidden' },
  featuredBookGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '65%' },
  featuredBookTextContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 28 },
  featuredBookTitle: { fontSize: 32, color: 'white', lineHeight: 38, marginBottom: 6, fontFamily: Fonts.outfitRegular, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  featuredBookAuthor: { fontSize: 17, color: 'rgba(255, 255, 255, 0.95)', fontFamily: Fonts.outfitRegular, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3, marginBottom: 8 },
  readersInfoContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, alignSelf: 'flex-start', overflow: 'hidden' }, // Added overflow for blur
  readersInfoText: { fontSize: 13, color: 'rgba(255, 255, 255, 0.9)', fontFamily: Fonts.outfitRegular, fontWeight: '600', marginLeft: 6, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  playButtonWrapper: { position: 'absolute', bottom: 28, right: 28 },
  playButton: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 12 },
  bookCardImageContainer: { position: 'relative', width: '100%', aspectRatio: 3 / 4, borderRadius: 20, overflow: 'hidden', marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 10 },
  bookCardGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%' },
  bookTypeBadge: { position: 'absolute', top: 12, right: 12, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
  bookTypeBadgeText: { color: 'white', fontSize: 11, fontFamily: Fonts.outfitRegular, fontWeight: '600' },
  bookCardTextContainer: { gap: 4, paddingHorizontal: 4 },
  bookCardTitle: { fontSize: 17, textAlign: 'left', fontFamily: Fonts.outfitRegular, fontWeight: '600', letterSpacing: 0.2 },
  bookCardAuthor: { fontSize: 14, textAlign: 'left', fontFamily: Fonts.outfitRegular },
});