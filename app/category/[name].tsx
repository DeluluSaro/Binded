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
    Dimensions,
    FlatList,
    Linking,
    Platform,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const cardAnimations = useRef<Animated.Value[]>([]).current;
  const shimmerAnimation = useRef(new Animated.Value(0)).current;
  const thunderAnimation = useRef(new Animated.Value(0)).current;
  const searchScaleAnimation = useRef(new Animated.Value(1)).current;
  const lightningOpacity = useRef(new Animated.Value(0)).current;
  const lightningRotation = useRef(new Animated.Value(0)).current;
  const searchPaddingAnimation = useRef(new Animated.Value(0)).current;
  const floatingAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnimation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatingAnimation, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

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
        
        // Load first page
        const firstPageBooks = sortedBooks.slice(0, ITEMS_PER_PAGE);
        setFilteredBooks(firstPageBooks);
        
        // Check if there are more books
        setHasMoreBooks(sortedBooks.length > ITEMS_PER_PAGE);
        
        cardAnimations.length = 0;
        firstPageBooks.forEach((_, index) => {
          const anim = new Animated.Value(0);
          cardAnimations.push(anim);
          
          Animated.spring(anim, {
            toValue: 1,
            delay: index * 100,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }).start();
        });
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
        
        // Add animations for new books
        newBooks.forEach((_, index) => {
          const anim = new Animated.Value(0);
          cardAnimations.push(anim);
          
          Animated.spring(anim, {
            toValue: 1,
            delay: index * 50,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }).start();
        });
        
        // Check if there are more books to load
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

  if (!isLoaded) return (
    <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
      <ThemedText style={{ color: colors.text, fontFamily: Fonts.outfitRegular }}>Loading...</ThemedText>
    </ThemedView>
  );

  if (openingBook) {
    return <Loading message="Opening Book..." />;
  }

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

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [0, -75],
    extrapolate: 'clamp',
  });

  const headerScale = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [1, 0.92],
    extrapolate: 'clamp',
  });

  const headerBlur = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 10],
    extrapolate: 'clamp',
  });

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

  const renderFeaturedBook = ({ item, index }: { item: Book; index: number }) => {
    const animatedValue = cardAnimations[index] || new Animated.Value(1);
    
    const scale = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1],
    });

    const opacity = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    const translateY = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [50, 0],
    });

    const shimmerTranslate = shimmerAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
    });

    return (
      <Animated.View
        style={{
          transform: [{ scale }, { translateY }],
          opacity,
        }}
      >
        <TouchableOpacity 
          style={{
            width: 320,
            height: 420,
            marginRight: 20,
            borderRadius: 28,
            overflow: 'hidden',
          }}
          onPress={() => handleBookPress(item)}
          activeOpacity={0.95}
        >
          <View style={{ flex: 1, position: 'relative' }}>
            {item.cover_image_path ? (
              <Image 
                source={{ uri: item.cover_image_path }} 
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
            ) : (
              <LinearGradient
                colors={[colors.surfaceSecondary + 'CC', colors.surfaceSecondary]}
                style={{
                  width: '100%',
                  height: '100%',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Animated.View style={{ transform: [{ scale: pulseAnimation }] }}>
                  <Ionicons name="book" size={80} color={colors.iconAccent} />
                </Animated.View>
              </LinearGradient>
            )}
            
            <Animated.View 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                transform: [{ translateX: shimmerTranslate }],
              }}
            >
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.15)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flex: 1, width: SCREEN_WIDTH }}
              />
            </Animated.View>

            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.85)']}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '65%',
              }}
            />
          </View>
          
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 28 }}>
            <ThemedText 
              style={{ 
                fontSize: 32,
                color: 'white',
                lineHeight: 38,
                marginBottom: 6,
                fontFamily: Fonts.outfitRegular,
                fontWeight: '700',
                textShadowColor: 'rgba(0,0,0,0.5)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 4,
              }}
              numberOfLines={2}
            >
              {item.name}
            </ThemedText>
            <ThemedText 
              variant="secondary"
              style={{ 
                fontSize: 17,
                color: 'rgba(255, 255, 255, 0.95)',
                fontFamily: Fonts.outfitRegular,
                textShadowColor: 'rgba(0,0,0,0.3)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 3,
                marginBottom: 8,
              }}
              numberOfLines={1}
            >
              {item.author}
            </ThemedText>
            
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              backgroundColor: 'rgba(255, 255, 255, 0.15)', 
              paddingHorizontal: 12, 
              paddingVertical: 6, 
              borderRadius: 12,
              alignSelf: 'flex-start',
              backdropFilter: 'blur(10px)',
            }}>
              <Ionicons name="people" size={14} color="rgba(255, 255, 255, 0.9)" />
              <ThemedText 
                style={{ 
                  fontSize: 13,
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontFamily: Fonts.outfitRegular,
                  fontWeight: '600',
                  marginLeft: 6,
                  textShadowColor: 'rgba(0,0,0,0.3)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 2,
                }}
              >
                {item.completed || 0} readers
              </ThemedText>
            </View>
          </View>
          
          <Animated.View
            style={{
              position: 'absolute',
              bottom: 28,
              right: 28,
              transform: [{ scale: pulseAnimation }],
            }}
          >
            <TouchableOpacity 
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: colors.tint,
                shadowColor: colors.tint,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.5,
                shadowRadius: 16,
                elevation: 12,
              }}
              onPress={() => handleBookPress(item)}
            >
              <Ionicons name="play" size={30} color="white" style={{ marginLeft: 3 }} />
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderBookCard = ({ item, index }: { item: Book; index: number }) => {
    const isEpub = item.file_path?.toLowerCase().endsWith('.epub');
    const isPdf = item.file_path?.toLowerCase().endsWith('.pdf');
    const animatedValue = cardAnimations[index + 3] || new Animated.Value(1);
    
    const scale = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.85, 1],
    });

    const opacity = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    const rotateY = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['15deg', '0deg'],
    });

    const floatingTranslate = floatingAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -8],
    });

    return (
      <Animated.View
        style={{
          flex: 1,
          transform: [{ scale }, { perspective: 1000 }, { rotateY }],
          opacity,
        }}
      >
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'transparent' }}
          onPress={() => handleBookPress(item)}
          activeOpacity={0.95}
        >
          <Animated.View 
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: 3/4,
              borderRadius: 20,
              overflow: 'hidden',
              marginBottom: 14,
              transform: [{ translateY: floatingTranslate }],
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 10,
            }}
          >
            {item.cover_image_path ? (
              <Image 
                source={{ uri: item.cover_image_path }} 
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
            ) : (
              <LinearGradient
                colors={[colors.surfaceSecondary + 'DD', colors.surfaceSecondary]}
                style={{
                  width: '100%',
                  height: '100%',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons 
                  name={isEpub ? "book" : isPdf ? "document-text" : "book"} 
                  size={50} 
                  color={colors.iconAccent} 
                />
              </LinearGradient>
            )}
            
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.2)']}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '45%',
              }}
            />

            <View style={{
              position: 'absolute',
              top: 12,
              right: 12,
              backgroundColor: colors.tint,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 12,
              shadowColor: colors.tint,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
            }}>
              <ThemedText style={{ 
                color: 'white', 
                fontSize: 11, 
                fontFamily: Fonts.outfitRegular,
                fontWeight: '600'
              }}>
                {isEpub ? 'EPUB' : isPdf ? 'PDF' : 'BOOK'}
              </ThemedText>
            </View>
          </Animated.View>
          
          <View style={{ gap: 4, paddingHorizontal: 4 }}>
            <ThemedText 
              style={{ 
                fontSize: 17,
                textAlign: 'left',
                fontFamily: Fonts.outfitRegular,
                fontWeight: '600',
                letterSpacing: 0.2,
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
                fontFamily: Fonts.outfitRegular,
              }}
              numberOfLines={1}
            >
              {item.author}
            </ThemedText>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const getCategoryTitle = () => {
    if (name === 'all') return 'All Books';
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : 'Category';
  };

  // Enhanced Thunder animation function with electric effects
  const triggerThunderAnimation = () => {
    // Move search box down to avoid navbar overlay
    Animated.timing(searchPaddingAnimation, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();

    // Scale animation with more dramatic effect
    Animated.sequence([
      Animated.timing(searchScaleAnimation, {
        toValue: 0.92,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(searchScaleAnimation, {
        toValue: 1.02,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(searchScaleAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Lightning rotation animation for electric effect
    Animated.sequence([
      Animated.timing(lightningRotation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(lightningRotation, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    // Lightning opacity flicker effect
    Animated.sequence([
      Animated.timing(lightningOpacity, {
        toValue: 1,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(lightningOpacity, {
        toValue: 0.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(lightningOpacity, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(lightningOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Main thunder border animation
    Animated.sequence([
      Animated.timing(thunderAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(thunderAnimation, {
        toValue: 0.7,
        duration: 150,
        useNativeDriver: false,
      }),
      Animated.timing(thunderAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(thunderAnimation, {
        toValue: 0,
        duration: 400,
        useNativeDriver: false,
      }),
    ]).start();
  };

  // Reset animations when search loses focus
  const resetThunderAnimation = () => {
    Animated.timing(searchPaddingAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // Filter books based on search query
  const filterBooks = (books: Book[], query: string) => {
    if (!query.trim()) return books;
    
    return books.filter(book => 
      book.name.toLowerCase().includes(query.toLowerCase()) ||
      book.author.toLowerCase().includes(query.toLowerCase()) ||
      (book.genre && book.genre.toLowerCase().includes(query.toLowerCase()))
    );
  };

  // Handle search
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (allBooks.length > 0) {
      const filtered = filterBooks(allBooks, text);
      setFilteredBooks(filtered);
    }
  };

  return (
    <AuthGuard fallbackRoute="/sign-up" requireEmail={true}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={colors.gradient as [string, string, string]}
        style={{ flex: 1 }}
      >
        <SideNavbar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        <View style={{ flex: 1 }}>
          <Animated.View 
            style={{
              position: 'absolute',
              top: 50,
              left: 16,
              right: 16,
              zIndex: 20,
              transform: [
                { translateY: headerTranslateY },
                { scale: headerScale }
              ],
              opacity: headerOpacity,
            }}
          >
            <BlurView
              intensity={Platform.OS === 'ios' ? 80 : 100}
              tint="dark"
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 20,
                paddingVertical: 14,
                borderRadius: 24,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: colors.border + '50',
                backgroundColor: colors.surface + 'DD',
              }}
            >
              <TouchableOpacity 
                style={{
                  width: 44,
                  height: 44,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: colors.surfaceSecondary + '80',
                  borderRadius: 14,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 4,
                }}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
              
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 }}>
                <ThemedText 
                  style={{ 
                    fontSize: 22,
                    textAlign: 'center',
                    letterSpacing: 0.8,
                    fontFamily: Fonts.silkscreenRegular,
                    color: colors.text,
                  }}
                >
                  {getCategoryTitle()}
                </ThemedText>
              </View>
              
              <TouchableOpacity 
                style={{
                  width: 44,
                  height: 44,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: colors.surfaceSecondary + '80',
                  borderRadius: 14,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 4,
                }}
                onPress={() => setIsSidebarOpen(true)}
              >
                <Ionicons name="menu" size={22} color={colors.text} />
              </TouchableOpacity>
            </BlurView>
          </Animated.View>

          <View style={{ height: 120 }} />

          {/* Search Box with Enhanced Thunder Effects */}
          <Animated.View 
            style={{ 
              paddingHorizontal: 16, 
              marginBottom: 20,
              paddingTop: searchPaddingAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 40],
              }),
            }}
          >
            <Animated.View
              style={{
                transform: [{ scale: searchScaleAnimation }],
                position: 'relative',
              }}
            >
              {/* Electric Lightning Bolts */}
              <Animated.View
                style={{
                  position: 'absolute',
                  top: -8,
                  left: -8,
                  right: -8,
                  bottom: -8,
                  opacity: lightningOpacity,
                  transform: [
                    {
                      rotate: lightningRotation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                }}
              >
                {/* Lightning Bolt 1 - Top */}
                <View
                  style={{
                    position: 'absolute',
                    top: -15,
                    left: '30%',
                    width: 3,
                    height: 25,
                    backgroundColor: '#FF8C00',
                    transform: [{ rotate: '15deg' }],
                    shadowColor: '#FF8C00',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 8,
                    elevation: 5,
                  }}
                />
                <View
                  style={{
                    position: 'absolute',
                    top: -10,
                    left: '32%',
                    width: 2,
                    height: 15,
                    backgroundColor: '#FFA500',
                    transform: [{ rotate: '-25deg' }],
                  }}
                />
                
                {/* Lightning Bolt 2 - Right */}
                <View
                  style={{
                    position: 'absolute',
                    top: '40%',
                    right: -20,
                    width: 25,
                    height: 3,
                    backgroundColor: '#FF8C00',
                    transform: [{ rotate: '25deg' }],
                    shadowColor: '#FF8C00',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 8,
                    elevation: 5,
                  }}
                />
                <View
                  style={{
                    position: 'absolute',
                    top: '42%',
                    right: -15,
                    width: 15,
                    height: 2,
                    backgroundColor: '#FFA500',
                    transform: [{ rotate: '-35deg' }],
                  }}
                />

                {/* Lightning Bolt 3 - Bottom */}
                <View
                  style={{
                    position: 'absolute',
                    bottom: -15,
                    left: '60%',
                    width: 3,
                    height: 25,
                    backgroundColor: '#FF8C00',
                    transform: [{ rotate: '-20deg' }],
                    shadowColor: '#FF8C00',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 8,
                    elevation: 5,
                  }}
                />
                <View
                  style={{
                    position: 'absolute',
                    bottom: -10,
                    left: '58%',
                    width: 2,
                    height: 15,
                    backgroundColor: '#FFA500',
                    transform: [{ rotate: '30deg' }],
                  }}
                />

                {/* Lightning Bolt 4 - Left */}
                <View
                  style={{
                    position: 'absolute',
                    top: '20%',
                    left: -20,
                    width: 25,
                    height: 3,
                    backgroundColor: '#FF8C00',
                    transform: [{ rotate: '-30deg' }],
                    shadowColor: '#FF8C00',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 8,
                    elevation: 5,
                  }}
                />
                <View
                  style={{
                    position: 'absolute',
                    top: '18%',
                    left: -15,
                    width: 15,
                    height: 2,
                    backgroundColor: '#FFA500',
                    transform: [{ rotate: '40deg' }],
                  }}
                />
              </Animated.View>

              {/* Enhanced Thunder Border Effect */}
              <Animated.View
                style={{
                  position: 'absolute',
                  top: -6,
                  left: -6,
                  right: -6,
                  bottom: -6,
                  borderRadius: 30,
                  borderWidth: thunderAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 3],
                  }),
                  borderColor: thunderAnimation.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: ['transparent', '#FF8C00', '#FFA500'],
                  }),
                  shadowColor: '#FF8C00',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: thunderAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                  }),
                  shadowRadius: thunderAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 20],
                  }),
                  elevation: thunderAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 15],
                  }),
                }}
              />
              
              {/* Search Input Container */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.surface,
                  borderRadius: 24,
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                  borderWidth: 1,
                  borderColor: isSearchFocused ? colors.tint : colors.border,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Ionicons 
                  name="search" 
                  size={20} 
                  color={colors.textSecondary} 
                  style={{ marginRight: 12 }}
                />
                <TextInput
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: colors.text,
                    fontFamily: 'Outfit_400Regular',
                  }}
                  placeholder="Search books, authors, genres..."
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={handleSearch}
                  onFocus={() => {
                    setIsSearchFocused(true);
                    triggerThunderAnimation();
                  }}
                  onBlur={() => {
                    setIsSearchFocused(false);
                    resetThunderAnimation();
                  }}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setSearchQuery('');
                      handleSearch('');
                    }}
                    style={{ marginLeft: 8 }}
                  >
                    <Ionicons 
                      name="close-circle" 
                      size={20} 
                      color={colors.textSecondary} 
                    />
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          </Animated.View>

          {loading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 }}>
              <Animated.View style={{ transform: [{ scale: pulseAnimation }] }}>
                <Ionicons name="book" size={64} color={colors.iconAccent} />
              </Animated.View>
              <ThemedText style={{ 
                color: colors.text, 
                fontFamily: Fonts.outfitRegular,
                marginTop: 20,
                fontSize: 16,
              }}>
                Loading books...
              </ThemedText>
            </View>
          ) : filteredBooks.length === 0 ? (
            <View style={{ 
              flex: 1, 
              alignItems: 'center', 
              justifyContent: 'center', 
              paddingVertical: 120, 
              paddingHorizontal: 28,
              minHeight: 500
            }}>
              <Animated.View style={{ transform: [{ scale: pulseAnimation }] }}>
                <Ionicons name="book-outline" size={80} color={colors.iconAccent} />
              </Animated.View>
              <ThemedText 
                style={{ 
                  fontSize: 24,
                  textAlign: 'center',
                  marginTop: 24,
                  fontFamily: Fonts.outfitRegular,
                }}
              >
                No books found
              </ThemedText>
              <ThemedText 
                variant="secondary"
                style={{ 
                  fontSize: 16, 
                  textAlign: 'center', 
                  marginTop: 12, 
                  lineHeight: 24,
                  fontFamily: Fonts.outfitRegular,
                }}
              >
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
              ]}
              renderItem={({ item, index }) => {
                if (item.type === 'trending' && item.data.length > 0) {
                  return (
                    <View style={{ paddingVertical: 28, paddingHorizontal: 16, marginBottom: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingHorizontal: 8 }}>
                        <ThemedText 
                          style={{ 
                            fontSize: 24,
                            fontFamily: Fonts.silkscreenRegular,
                            color: colors.text,
                            letterSpacing: 0.5,
                          }}
                        >
                          Trending Now
                        </ThemedText>
                        <Animated.View 
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: colors.tint,
                            transform: [{ scale: pulseAnimation }],
                            shadowColor: colors.tint,
                            shadowOffset: { width: 0, height: 6 },
                            shadowOpacity: 0.4,
                            shadowRadius: 12,
                          }}
                        >
                          <Ionicons name="trending-up" size={22} color="white" />
                        </Animated.View>
                      </View>
                      
                      <FlatList
                        data={item.data}
                        renderItem={renderFeaturedBook}
                        keyExtractor={(book) => book.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingRight: 16 }}
                        snapToInterval={340}
                        decelerationRate="fast"
                      />
                    </View>
                  );
                } else if (item.type === 'more') {
                  return (
                    <View style={{ paddingHorizontal: 16, paddingBottom: 28, paddingTop: 12 }}>
                      <ThemedText 
                        style={{ 
                          fontSize: 26,
                          marginBottom: 24,
                          paddingHorizontal: 8,
                          letterSpacing: 0.5,
                          fontFamily: Fonts.silkscreenRegular,
                        }}
                      >
                        {name === 'all' ? 'All Books' : `More ${getCategoryTitle()}`}
                      </ThemedText>
                      
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 }}>
                        {item.data.map((book, bookIndex) => (
                          <View key={book.id} style={{ width: '47%' }}>
                            {renderBookCard({ item: book, index: bookIndex })}
                          </View>
                        ))}
                        
                        {loadingMore && (
                          <View style={{ 
                            width: '100%',
                            flexDirection: 'row', 
                            justifyContent: 'center', 
                            alignItems: 'center', 
                            paddingVertical: 20 
                          }}>
                            <Animated.View style={{ transform: [{ scale: pulseAnimation }] }}>
                              <Ionicons name="book" size={32} color={colors.iconAccent} />
                            </Animated.View>
                            <ThemedText style={{ 
                              color: colors.text, 
                              fontFamily: Fonts.outfitRegular,
                              marginLeft: 12,
                              fontSize: 14,
                            }}>
                              Loading more books...
                            </ThemedText>
                          </View>
                        )}
                        
                        {hasMoreBooks && !loadingMore && (
                          <View style={{ 
                            width: '100%',
                            flexDirection: 'row', 
                            justifyContent: 'center', 
                            alignItems: 'center', 
                            paddingVertical: 20 
                          }}>
                            <TouchableOpacity 
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: colors.tint,
                                paddingHorizontal: 20,
                                paddingVertical: 12,
                                borderRadius: 20,
                                shadowColor: colors.tint,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                              }}
                              onPress={loadMoreBooks}
                            >
                              <Ionicons name="add" size={18} color="white" />
                              <ThemedText style={{ 
                                color: 'white', 
                                fontFamily: Fonts.outfitRegular,
                                marginLeft: 8,
                                fontSize: 14,
                                fontWeight: '600',
                              }}>
                                Load More Books
                              </ThemedText>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                }
                return null;
              }}
              keyExtractor={(item, index) => `${item.type}-${index}`}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 60 }}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              onEndReached={loadMoreBooks}
              onEndReachedThreshold={0.5}
            />
          )}
        </View>
        
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