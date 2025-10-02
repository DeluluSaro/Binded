import AuthGuard from '@/components/auth-guard';
import CustomAlert from '@/components/custom-alert';
import SideNavbar from '@/components/side-navbar';
import { Fonts } from '@/constants/theme';
import { useCustomAlert } from '@/hooks/use-custom-alert';
import { useThemeColors } from '@/hooks/use-theme-color';
import { userService, type FavoriteBook } from '@/services/userService';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Animated,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function FavoritesScreen() {
  const colors = useThemeColors();
  const { user } = useUser();
  const router = useRouter();
  const { alertConfig, showError, showSuccess, showConfirm, hideAlert } = useCustomAlert();
  
  // State
  const [favorites, setFavorites] = useState<FavoriteBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const [flyingHearts, setFlyingHearts] = useState<{ 
    id: number; 
    x: number; 
    y: number; 
    anim: Animated.Value; 
    rotateAnim: Animated.Value; 
  }[]>([]);

  // Load favorites
  const loadFavorites = useCallback(async () => {
    if (!user?.id) {
      console.log('❌ No user Clerk ID available');
      return;
    }
    
    try {
      const clerkId = user.id;
      console.log('🔄 Loading favorites for Clerk ID:', clerkId);
      setLoading(true);
      
      // Get Firebase user by Clerk ID first, then try email as fallback
      let firebaseUser = await userService.getUserByClerkId(clerkId);
      console.log('🔍 Firebase user found by Clerk ID:', firebaseUser ? 'Yes' : 'No');
      
      if (!firebaseUser && user?.emailAddresses?.[0]?.emailAddress) {
        // Fallback to email lookup
        const userEmail = user.emailAddresses[0].emailAddress;
        console.log('🔄 Trying email fallback for:', userEmail);
        firebaseUser = await userService.getUserByEmail(userEmail);
        console.log('🔍 Firebase user found by email:', firebaseUser ? 'Yes' : 'No');
      }
      
      if (!firebaseUser) {
        console.log('❌ Firebase user not found, creating user...');
        try {
          // Try to create user if they don't exist
          const userId = await userService.createOrUpdateUser(user);
          firebaseUser = await userService.getUser(userId);
          console.log('✅ User created successfully:', firebaseUser ? 'Yes' : 'No');
        } catch (createError) {
          console.error('❌ Error creating user:', createError);
          showError('Error', 'Failed to create user account. Please try signing in again.');
          return;
        }
      }
      
      if (!firebaseUser) {
        console.log('❌ Still no Firebase user after creation attempt');
        showError('Error', 'User not found. Please try signing in again.');
        return;
      }
      
      console.log('📚 Fetching favorites for Firebase user:', firebaseUser.id);
      console.log('📚 Firebase user data:', JSON.stringify(firebaseUser, null, 2));
      
      const userFavorites = await userService.getFavorites(firebaseUser.id);
      console.log('📚 Favorites loaded:', userFavorites.length, 'books');
      console.log('📚 Favorites data:', JSON.stringify(userFavorites, null, 2));
      
      if (userFavorites && Array.isArray(userFavorites)) {
        setFavorites(userFavorites);
        console.log('✅ Favorites set successfully in state');
      } else {
        console.log('❌ Invalid favorites data received:', userFavorites);
        setFavorites([]);
      }
      
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      console.error('❌ Error loading favorites:', error);
      showError('Error', 'Failed to load favorites. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [fadeAnim, slideAnim, user, showError]);

  // Refresh favorites
  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  // Remove from favorites with confirmation
  const removeFromFavorites = async (bookId: string, bookTitle: string) => {
    if (!user?.id) return;
    
    // Show confirmation dialog
    showConfirm(
      'Remove from Favorites',
      `Are you sure you want to remove "${bookTitle}" from your favorites?`,
      async () => {
        try {
          const clerkId = user.id;
          
          // Get Firebase user by Clerk ID first, then try email as fallback
          let firebaseUser = await userService.getUserByClerkId(clerkId);
          
          if (!firebaseUser && user?.emailAddresses?.[0]?.emailAddress) {
            const userEmail = user.emailAddresses[0].emailAddress;
            firebaseUser = await userService.getUserByEmail(userEmail);
          }
          
          if (!firebaseUser) {
            showError('Error', 'User not found. Please try signing in again.');
            return;
          }
          
          console.log('🗑️ Removing book from favorites:', bookId);
          await userService.removeFromFavorites(firebaseUser.id, bookId);
          setFavorites(prev => prev.filter(fav => fav.bookId !== bookId));
          showSuccess('Success', 'Book removed from favorites');
        } catch (error) {
          console.error('Error removing from favorites:', error);
          showError('Error', 'Failed to remove book from favorites');
        }
      }
    );
  };

  // Handle book reading - navigate to reading screen
  const handleReadBook = (favorite: FavoriteBook) => {
    console.log('📖 Navigating to book reader:', {
      name: favorite.bookTitle,
      author: favorite.bookAuthor,
      bookId: favorite.bookId,
      filePath: favorite.bookFilePath
    });
    
    if (!favorite.bookFilePath) {
      showError('Error', 'Book file not found. Please try re-adding this book to favorites.');
      return;
    }
    
    // Navigate to the dedicated reading screen with the book ID
    router.push(`/reader/${favorite.bookId}` as any);
  };

  // Flying hearts animation
  const triggerFlyingHearts = () => {
    const newHearts = Array.from({ length: 8 }, (_, index) => {
      const heartId = Date.now() + index;
      // Start from heart icon position (right side of header)
      const startX = 280 + Math.random() * 40 - 20; // Around heart icon position
      const startY = 120; // Start from header area
      
      // Animate each heart
      const heartAnim = new Animated.Value(0);
      const rotateAnim = new Animated.Value(0);
      
      Animated.parallel([
        Animated.timing(heartAnim, {
          toValue: 1,
          duration: 2000 + Math.random() * 1000, // Random duration
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          })
        ),
      ]).start();
      
      return {
        id: heartId,
        x: startX,
        y: startY,
        anim: heartAnim,
        rotateAnim: rotateAnim,
      };
    });
    
    setFlyingHearts(prev => [...prev, ...newHearts]);
    
    // Remove hearts after animation
    setTimeout(() => {
      setFlyingHearts(prev => prev.filter(heart => !newHearts.some(newHeart => newHeart.id === heart.id)));
    }, 4000);
  };

  // Load favorites on mount
  useEffect(() => {
    if (user?.id) {
      loadFavorites();
    }
  }, [user?.id, loadFavorites]);

  // Render flying hearts
  const renderFlyingHearts = () => (
    <View style={styles.flyingHeartsContainer}>
      {flyingHearts.map((heart) => (
        <Animated.View
          key={heart.id}
          style={[
            styles.flyingHeart,
            {
              left: heart.x,
              top: heart.y,
              transform: [
                {
                  translateY: heart.anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -400], // Fly upward
                  }),
                },
                {
                  translateX: heart.anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, Math.random() * 60 - 30], // Slight horizontal drift around heart icon
                  }),
                },
                {
                  rotate: heart.rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
                {
                  scale: heart.anim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.5, 1, 0.3], // Scale up then fade out
                  }),
                },
              ],
              opacity: heart.anim.interpolate({
                inputRange: [0, 0.7, 1],
                outputRange: [1, 1, 0], // Fade out at the end
              }),
            },
          ]}
        >
          <Ionicons name="heart" size={20} color={colors.tint} />
        </Animated.View>
      ))}
    </View>
  );

  // Render favorite book card
  const renderFavoriteCard = ({ item, index }: { item: FavoriteBook; index: number }) => (
    <Animated.View
      style={[
        styles.bookCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 50],
                outputRange: [0, 50],
                extrapolate: 'clamp',
              }),
            },
          ],
          opacity: fadeAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.bookContent}
        onPress={() => handleReadBook(item)}
      >
        <Image
          source={{ uri: item.bookCover }}
          style={styles.bookCover}
          contentFit="cover"
        />
        
        <View style={styles.bookInfo}>
          <Text style={[styles.bookTitle, { color: colors.text, fontFamily: Fonts.outfitRegular }]} numberOfLines={2}>
            {item.bookTitle}
          </Text>
          <Text style={[styles.bookAuthor, { color: colors.textSecondary, fontFamily: Fonts.silkscreenRegular }]} numberOfLines={1}>
            by {item.bookAuthor}
          </Text>
          <View style={[styles.genreTag, { backgroundColor: `${colors.tint}20` }]}>
            <Text style={[styles.genreText, { color: colors.tint, fontFamily: Fonts.outfitRegular }]}>
              {item.bookGenre}
            </Text>
          </View>
          {item.bookDescription && (
            <Text style={[styles.bookDescription, { color: colors.textSecondary, fontFamily: Fonts.outfitRegular }]} numberOfLines={3}>
              {item.bookDescription}
            </Text>
          )}
        </View>
      </TouchableOpacity>
      
      <View style={styles.bookActions}>
        <TouchableOpacity
          style={[styles.readButton, { backgroundColor: colors.tint }]}
          onPress={() => handleReadBook(item)}
        >
          <Ionicons name="play" size={16} color="white" />
          <Text style={[styles.readButtonText, { fontFamily: Fonts.outfitRegular }]}>Read</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.removeButton, { borderColor: colors.error }]}
          onPress={() => removeFromFavorites(item.bookId, item.bookTitle)}
        >
          <Ionicons name="heart-dislike" size={16} color={colors.error} />
          <Text style={[styles.removeButtonText, { color: colors.error, fontFamily: Fonts.outfitRegular }]}>Remove</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  // Empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Animated.View
        style={[
          styles.emptyContent,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={[styles.emptyIcon, { backgroundColor: colors.surface }]}>
          <Ionicons name="heart-outline" size={48} color={colors.textSecondary} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: Fonts.outfitRegular }]}>
          No Favorites Yet
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary, fontFamily: Fonts.outfitRegular }]}>
          Books you add to favorites will appear here
        </Text>
        <TouchableOpacity
          style={[styles.exploreButton, { backgroundColor: colors.tint }]}
          onPress={() => router.push('/(tabs)')}
        >
          <Text style={[styles.exploreButtonText, { fontFamily: Fonts.outfitRegular }]}>
            Explore Books
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );

  return (
    <AuthGuard>
      <LinearGradient
        colors={[colors.background, colors.surfaceSecondary]}
        style={styles.container}
      >
        {/* Side Navbar */}
        <SideNavbar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.menuButton} 
              onPress={() => setIsSidebarOpen(true)}
            >
              <Ionicons name="menu" size={24} color={colors.text} />
            </TouchableOpacity>
            
            <Text style={[styles.headerTitle, { color: colors.text, fontFamily: Fonts.silkscreenRegular }]}>
              My Favorites
            </Text>
            <TouchableOpacity onPress={triggerFlyingHearts} style={styles.heartButton}>
              <Ionicons name="heart" size={24} color={colors.tint} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.favoritesCount, { color: colors.textSecondary, fontFamily: Fonts.outfitRegular }]}>
            {favorites.length} books
          </Text>
        </View>


        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Animated.View style={{ transform: [{ scale: fadeAnim }] }}>
              <Ionicons name="book" size={48} color={colors.tint} />
            </Animated.View>
            <Text style={[styles.loadingText, { color: colors.text, fontFamily: Fonts.outfitRegular }]}>
              Loading your favorites...
            </Text>
          </View>
        ) : favorites.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={favorites}
            renderItem={renderFavoriteCard}
            keyExtractor={(item) => item.bookId}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.tint}
                colors={[colors.tint]}
              />
            }
          />
        )}
        
        {/* Flying Hearts Animation */}
        {renderFlyingHearts()}
        
        {/* Custom Alert */}
        <CustomAlert
          visible={alertConfig.visible}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          buttons={alertConfig.buttons}
          onClose={hideAlert}
        />
      </LinearGradient>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuButton: {
    padding: 8,
    marginRight: 4,
  },
  headerTitle: {
    fontSize: 24,
  },
  favoritesCount: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  listContainer: {
    padding: 20,
    gap: 16,
  },
  bookCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  bookContent: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  bookCover: {
    width: 80,
    height: 120,
    borderRadius: 8,
  },
  bookInfo: {
    flex: 1,
    gap: 8,
  },
  bookTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  bookAuthor: {
    fontSize: 14,
  },
  genreTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  genreText: {
    fontSize: 12,
  },
  bookDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  bookActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  readButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  readButtonText: {
    color: 'white',
    fontSize: 14,
  },
  removeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  removeButtonText: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyContent: {
    alignItems: 'center',
    gap: 20,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 24,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  exploreButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  exploreButtonText: {
    color: 'white',
    fontSize: 16,
  },
  heartButton: {
    padding: 8,
    borderRadius: 20,
  },
  flyingHeartsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: 1000,
  },
  flyingHeart: {
    position: 'absolute',
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
});
