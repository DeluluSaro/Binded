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
  TouchableOpacity,
  View
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function EnhancedCategoryScreen() {
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
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const cardAnimations = useRef<Animated.Value[]>([]).current;
  const shimmerAnimation = useRef(new Animated.Value(0)).current;
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

  useEffect(() => {
    const loadBooks = async () => {
      try {
        setLoading(true);
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
        
        setFilteredBooks(sortedBooks);
        
        cardAnimations.length = 0;
        sortedBooks.forEach((_, index) => {
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
          contentContainerStyle={{ paddingBottom: 60 }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
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

          {filteredBooks.length > 0 && (
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
                data={filteredBooks.slice(0, 10)}
                renderItem={renderFeaturedBook}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 16 }}
                snapToInterval={340}
                decelerationRate="fast"
              />
            </View>
          )}

          {filteredBooks.length > 0 && (
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
                More {getCategoryTitle()}
              </ThemedText>
              
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 }}>
                {filteredBooks.map((book, index) => (
                  <View key={book.id} style={{ width: '47%' }}>
                    {renderBookCard({ item: book, index })}
                  </View>
                ))}
              </View>
            </View>
          )}

          {loading && (
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
          )}

          {!loading && filteredBooks.length === 0 && (
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
          )}
        </Animated.ScrollView>
        
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