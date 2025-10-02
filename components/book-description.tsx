import CustomAlert from '@/components/custom-alert';
import { Fonts } from '@/constants/theme';
import { useCustomAlert } from '@/hooks/use-custom-alert';
import { useThemeColors } from '@/hooks/use-theme-color';
import type { Book } from '@/services/firestoreService';
import { userService } from '@/services/userService';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { height: screenHeight } = Dimensions.get('window');

interface BookDescriptionProps {
  visible: boolean;
  onClose: () => void;
  book: Book;
  onReadNow: (book: Book) => void;
}

// Get book details using actual book data
const getBookDetails = (book: Book) => {
  return {
    title: book.name || 'Unknown Book',
    author: book.author || 'Unknown Author',
    genre: book.genre || 'Fiction',
    cover: book.cover_image_path || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop',
    backgroundCover: book.cover_image_path || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop',
    synopsis: book.short_description || 'A captivating story that will keep you engaged from start to finish. This book offers an immersive reading experience with compelling characters and an intriguing plot.',
    rating: book.rating || 4.2,
    reviewCount: book.reviews?.length || 856,
    ratingDistribution: {
      5: 60,
      4: 25,
      3: 10,
      2: 3,
      1: 2,
    },
  };
};

export default function BookDescription({ visible, onClose, book, onReadNow }: BookDescriptionProps) {
  const colors = useThemeColors();
  const bookDetails = getBookDetails(book);
  const { user } = useUser();
  const { alertConfig, showError, showSuccess, hideAlert } = useCustomAlert();
  
  // State for favorites
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Parallax animation values
  const scrollY = useRef(new Animated.Value(0)).current;

  console.log('📖 BookDescription render:', { 
    visible, 
    bookName: book.name,
    coverImage: book.cover_image_path,
    usingRegularText: true,
    fontNames: ['Outfit_700Bold', 'Outfit_400Regular', 'Silkscreen-Regular']
  });

  // Check if book is in favorites when component mounts
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (user?.id) {
        try {
          // Get Firebase user by Clerk ID first, then try email as fallback
          const clerkId = user.id;
          let firebaseUser = await userService.getUserByClerkId(clerkId);
          
          if (!firebaseUser && user?.emailAddresses?.[0]?.emailAddress) {
            const userEmail = user.emailAddresses[0].emailAddress;
            firebaseUser = await userService.getUserByEmail(userEmail);
          }
          
          if (firebaseUser) {
            const isInFavorites = await userService.isBookInFavorites(firebaseUser.id, book.id);
            setIsFavorite(isInFavorites);
          }
        } catch (error) {
          console.error('Error checking favorites:', error);
        }
      }
    };

    if (visible && user?.id) {
      checkFavoriteStatus();
    }
  }, [visible, user?.id, user?.emailAddresses, book.id]);

  // Handle add to favorites
  const handleAddToFavorites = async () => {
    if (!user?.id) {
      showError('Error', 'Please sign in to add books to favorites');
      return;
    }

    try {
      setIsLoading(true);
      
      // Get Firebase user by Clerk ID first, then try email as fallback
      const clerkId = user.id;
      let firebaseUser = await userService.getUserByClerkId(clerkId);
      
      if (!firebaseUser && user?.emailAddresses?.[0]?.emailAddress) {
        const userEmail = user.emailAddresses[0].emailAddress;
        firebaseUser = await userService.getUserByEmail(userEmail);
      }
      
      if (!firebaseUser) {
        showError('Error', 'User not found. Please try signing in again.');
        return;
      }
      
      if (isFavorite) {
        // Remove from favorites
        await userService.removeFromFavorites(firebaseUser.id, book.id);
        setIsFavorite(false);
        showSuccess('Success', 'Book removed from favorites');
      } else {
        // Add to favorites
        await userService.addToFavorites(firebaseUser.id, {
          id: book.id,
          name: book.name,
          author: book.author,
          genre: book.genre || 'Unknown',
          cover_image_path: book.cover_image_path,
          short_description: book.short_description,
          file_path: book.file_path
        });
        setIsFavorite(true);
        showSuccess('Success', 'Book added to favorites');
      }
    } catch (error) {
      console.error('Error updating favorites:', error);
      showError('Error', 'Failed to update favorites. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={i} name="star" size={16} color={colors.tint} />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={16} color={colors.tint} />
      );
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <Ionicons key={`empty-${i}`} name="star-outline" size={16} color={colors.tint} />
      );
    }

    return stars;
  };

  const renderRatingBar = (starCount: number, percentage: number) => (
    <View key={starCount} style={styles.ratingBarContainer}>
      <Text style={[styles.ratingBarText, { color: colors.text, fontFamily: Fonts.outfitRegular }]}>{starCount}</Text>
      <View style={[styles.ratingBarBackground, { backgroundColor: colors.surfaceSecondary }]}>
        <View 
          style={[
            styles.ratingBarFill, 
            { 
              width: `${percentage}%`, 
              backgroundColor: colors.tint 
            }
          ]} 
        />
      </View>
    </View>
  );

  // Parallax animations
  const backgroundTranslateY = scrollY.interpolate({
    inputRange: [0, screenHeight * 0.4],
    outputRange: [0, -screenHeight * 0.2],
    extrapolate: 'clamp',
  });

  const backgroundScale = scrollY.interpolate({
    inputRange: [0, screenHeight * 0.4],
    outputRange: [1, 1.2],
    extrapolate: 'clamp',
  });

  const bookCoverTranslateY = scrollY.interpolate({
    inputRange: [0, screenHeight * 0.4],
    outputRange: [0, -50],
    extrapolate: 'clamp',
  });

  const bookCoverScale = scrollY.interpolate({
    inputRange: [0, screenHeight * 0.4],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100, 200],
    outputRange: [1, 0.8, 0],
    extrapolate: 'clamp',
  });

  const contentTranslateY = scrollY.interpolate({
    inputRange: [0, screenHeight * 0.4],
    outputRange: [0, -screenHeight * 0.1],
    extrapolate: 'clamp',
  });

  // Remove staggered opacity animations - keep original design

  // Removed floating button - keeping original design

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.container}>
        {/* Solid Background Overlay */}
        <View style={[styles.solidBackground, { backgroundColor: colors.background }]} />
        
        {/* Animated Background Cover */}
        <Animated.View 
          style={[
            styles.backgroundCoverContainer,
            {
              transform: [
                { translateY: backgroundTranslateY },
                { scale: backgroundScale }
              ]
            }
          ]}
        >
          <Image 
            source={{ uri: bookDetails.backgroundCover }} 
            style={styles.backgroundCover}
            contentFit="cover"
          />
          <LinearGradient
            colors={[`${colors.background}00`, `${colors.background}CC`, colors.background]}
            style={styles.backgroundGradient}
          />
        </Animated.View>

        <Animated.ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        >
          {/* Animated Header */}
          <Animated.View 
            style={[
              styles.header,
              {
                opacity: headerOpacity,
                transform: [{ translateY: contentTranslateY }]
              }
            ]}
          >
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text, fontFamily: Fonts.silkscreenRegular }]}>Book Details</Text>
            <View style={styles.headerSpacer} />
          </Animated.View>

          {/* Animated Book Info Section */}
          <Animated.View 
            style={[
              styles.bookInfoSection,
              {
                transform: [
                  { translateY: contentTranslateY }
                ]
              }
            ]}
          >
            <Animated.View
              style={{
                transform: [
                  { translateY: bookCoverTranslateY },
                  { scale: bookCoverScale }
                ]
              }}
            >
              <Image 
                source={{ uri: bookDetails.cover }} 
                style={styles.bookCover}
                contentFit="cover"
              />
            </Animated.View>
            <Text style={[styles.bookTitle, { color: colors.text, fontFamily: Fonts.outfitRegular }]}>{bookDetails.title}</Text>
            <Text style={[styles.bookAuthor, { color: colors.textSecondary, fontFamily: Fonts.silkscreenRegular }]}>by {bookDetails.author}</Text>
            <View style={[styles.genreTag, { backgroundColor: `${colors.tint}20` }]}>
              <Text style={[styles.genreText, { color: colors.tint, fontFamily: Fonts.outfitRegular }]}>{bookDetails.genre}</Text>
            </View>
          </Animated.View>

          {/* Synopsis Section */}
          <View style={styles.synopsisSection}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: Fonts.silkscreenRegular }]}>Synopsis</Text>
            <Text style={[styles.synopsisText, { color: colors.textSecondary, fontFamily: Fonts.outfitRegular }]}>
              {bookDetails.synopsis}
            </Text>
          </View>

          {/* Ratings Section */}
          <View style={[styles.ratingsSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: Fonts.silkscreenRegular }]}>Ratings</Text>
            <View style={styles.ratingsContent}>
              <View style={styles.ratingLeft}>
                <Text style={[styles.ratingNumber, { color: colors.tint, fontFamily: Fonts.outfitRegular }]}>{bookDetails.rating}</Text>
                <View style={styles.starsContainer}>
                  {renderStars(bookDetails.rating)}
                </View>
                <Text style={[styles.reviewCount, { color: colors.textSecondary, fontFamily: Fonts.outfitRegular }]}>
                  {bookDetails.reviewCount.toLocaleString()} reviews
                </Text>
              </View>
              
              <View style={[styles.ratingDivider, { backgroundColor: colors.border }]} />
              
              <View style={styles.ratingBars}>
                {Object.entries(bookDetails.ratingDistribution).map(([stars, percentage]) =>
                  renderRatingBar(parseInt(stars), percentage)
                )}
              </View>
            </View>
          </View>

          {/* User Engagement Section */}
          <View style={[styles.readingProgressSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: Fonts.silkscreenRegular }]}>User Engagement</Text>
            
            {/* Overall Engagement */}
            <View style={styles.overallProgressContainer}>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressLabel, { color: colors.text, fontFamily: Fonts.outfitRegular }]}>Total Readers</Text>
                <Text style={[styles.progressPercentage, { color: colors.tint, fontFamily: Fonts.outfitRegular }]}>
                  {(book.currentlyReading || 0) + (book.completed || 0)}
                </Text>
              </View>
              <View style={[styles.progressBarContainer, { backgroundColor: colors.surfaceSecondary }]}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { 
                      width: `${Math.min(((book.completed || 0) / Math.max((book.currentlyReading || 0) + (book.completed || 0), 1)) * 100, 100)}%`,
                      backgroundColor: colors.success
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.progressStats, { color: colors.textSecondary, fontFamily: Fonts.outfitRegular }]}>
                {Math.round(((book.completed || 0) / Math.max((book.currentlyReading || 0) + (book.completed || 0), 1)) * 100)}% completion rate
              </Text>
            </View>

            {/* User Status Cards */}
            <View style={styles.statusCardsContainer}>
              {/* Currently Reading Card */}
              <View style={[styles.statusCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                <View style={styles.statusCardHeader}>
                  <Ionicons name="people" size={20} color={colors.tint} />
                  <Text style={[styles.statusCardTitle, { color: colors.text, fontFamily: Fonts.outfitRegular }]}>Current Reading</Text>
                </View>
                <Text style={[styles.statusCardValue, { color: colors.tint, fontFamily: Fonts.outfitRegular }]}>
                  {book.currentlyReading || 0} users
                </Text>
                <Text style={[styles.statusCardSubtext, { color: colors.textSecondary, fontFamily: Fonts.outfitRegular }]}>
                  Actively reading
                </Text>
              </View>

              {/* Completed Card */}
              <View style={[styles.statusCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                <View style={styles.statusCardHeader}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <Text style={[styles.statusCardTitle, { color: colors.text, fontFamily: Fonts.outfitRegular }]}>Completes</Text>
                </View>
                <Text style={[styles.statusCardValue, { color: colors.success, fontFamily: Fonts.outfitRegular }]}>
                  {book.completed || 0} users
                </Text>
                <Text style={[styles.statusCardSubtext, { color: colors.textSecondary, fontFamily: Fonts.outfitRegular }]}>
                  Finished reading
                </Text>
              </View>
            </View>

            {/* User Stats */}
            <View style={styles.readingStatsContainer}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text, fontFamily: Fonts.outfitRegular }]}>
                  {book.currentlyReading || 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary, fontFamily: Fonts.outfitRegular }]}>Active Readers</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text, fontFamily: Fonts.outfitRegular }]}>
                  {(book.currentlyReading || 0) + (book.completed || 0)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary, fontFamily: Fonts.outfitRegular }]}>Total Readers</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text, fontFamily: Fonts.outfitRegular }]}>
                  {book.completed || 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary, fontFamily: Fonts.outfitRegular }]}>Completed</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsSection}>
            <TouchableOpacity 
              style={[styles.readNowButton, { backgroundColor: colors.tint }]}
              onPress={() => onReadNow(book)}
            >
              <Text style={[styles.readNowText, { fontFamily: Fonts.outfitRegular }]}>Read Now</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.addToLibraryButton, 
                { 
                  borderColor: colors.tint,
                  backgroundColor: isFavorite ? colors.tint : 'transparent',
                  opacity: isLoading ? 0.6 : 1
                }
              ]}
              onPress={handleAddToFavorites}
              disabled={isLoading}
            >
              <Text style={[
                styles.addToLibraryText, 
                { 
                  color: isFavorite ? 'white' : colors.tint, 
                  fontFamily: Fonts.outfitRegular 
                }
              ]}>
                {isLoading ? 'Loading...' : isFavorite ? 'Remove from Favourites' : 'Add to Favourites'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.ScrollView>
      </View>
      
      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#010101',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  solidBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  backgroundCoverContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: screenHeight * 0.6,
    overflow: 'hidden',
    zIndex: 1,
  },
  backgroundCover: {
    width: '100%',
    height: '100%',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
    zIndex: 2,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
  },
  headerSpacer: {
    width: 40,
  },
  bookInfoSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24,
  },
  bookCover: {
    width: 160,
    height: 224,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  bookTitle: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  genreTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  genreText: {
    fontSize: 12,
  },
  synopsisSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  synopsisText: {
    fontSize: 14,
    lineHeight: 20,
  },
  ratingsSection: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  ratingsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  ratingLeft: {
    alignItems: 'center',
  },
  ratingNumber: {
    fontSize: 36,
    marginBottom: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  reviewCount: {
    fontSize: 12,
  },
  ratingDivider: {
    width: 1,
    height: 60,
  },
  ratingBars: {
    flex: 1,
  },
  ratingBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  ratingBarText: {
    fontSize: 12,
    width: 12,
  },
  ratingBarBackground: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  actionButtonsSection: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    gap: 16,
  },
  readNowButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#eb5838',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  readNowText: {
    color: '#ffffff',
    fontSize: 16,
  },
  addToLibraryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  addToLibraryText: {
    fontSize: 16,
  },

  // --- Reading Progress Styles ---
  readingProgressSection: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  overallProgressContainer: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
  },
  progressPercentage: {
    fontSize: 18,
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressStats: {
    fontSize: 12,
    textAlign: 'center',
  },
  statusCardsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statusCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statusCardTitle: {
    fontSize: 14,
  },
  statusCardValue: {
    fontSize: 20,
    marginBottom: 4,
  },
  statusCardSubtext: {
    fontSize: 12,
  },
  readingStatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
});
