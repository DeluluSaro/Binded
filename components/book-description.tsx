import { useThemeColors } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
// import { useRouter } from 'expo-router';
import React, { useRef } from 'react';
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
  book: {
    id: string;
    name: string;
    file_path: string;
    created_at: string;
    updated_at: string;
  };
  onReadNow: (book: any) => void;
}

// Mock book details data
const getBookDetails = (bookName: string) => {
  const mockBooks = {
    'The Silent Observer': {
      title: 'The Silent Observer',
      author: 'Amelia Stone',
      genre: 'Mystery & Thriller',
      cover: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDhrPd0PR2LZ34oDq2xTARTEU8Yly2U3JkfJ-ITwnkpcrfOMQS5KvbBMAicb1rC4O4fZO1dtLVAGHELrI9QmsD8zaaXw0uySunmR0Q2tWgHil4PaIIl2uw0Gcfk4ceBnQoJK8V9D5DaI1UOtkdAfqzf67v9-4ruKTldIogvJsYsV29a02wwSUbsROdREAndRqbf7GHVdCULqQ0mLNOK9CH9U-zO0rHWbSAduQlf4WoEauHjp7HRY2_7KGY7vZcqmwb5lb_EKLqNTK2c',
      backgroundCover: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDhrPd0PR2LZ34oDq2xTARTEU8Yly2U3JkfJ-ITwnkpcrfOMQS5KvbBMAicb1rC4O4fZO1dtLVAGHELrI9QmsD8zaaXw0uySunmR0Q2tWgHil4PaIIl2uw0Gcfk4ceBnQoJK8V9D5DaI1UOtkdAfqzf67v9-4ruKTldIogvJsYsV29a02wwSUbsROdREAndRqbf7GHVdCULqQ0mLNOK9CH9U-zO0rHWbSAduQlf4WoEauHjp7HRY2_7KGY7vZcqmwb5lb_EKLqNTK2c',
      synopsis: 'In the quaint town of Willow Creek, a series of mysterious events unfolds... As she delves deeper, she uncovers a web of secrets and hidden agendas, where nothing is as it seems. With each clue, Isabella gets closer to the truth, but also puts herself in the path of danger.',
      rating: 4.6,
      reviewCount: 1234,
      ratingDistribution: {
        5: 75,
        4: 15,
        3: 5,
        2: 3,
        1: 2,
      },
    },
    'default': {
      title: bookName || 'Unknown Book',
      author: 'Unknown Author',
      genre: 'Fiction',
      cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop',
      backgroundCover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop',
      synopsis: 'A captivating story that will keep you engaged from start to finish. This book offers an immersive reading experience with compelling characters and an intriguing plot.',
      rating: 4.2,
      reviewCount: 856,
      ratingDistribution: {
        5: 60,
        4: 25,
        3: 10,
        2: 3,
        1: 2,
      },
    },
  };

  return mockBooks[bookName as keyof typeof mockBooks] || mockBooks.default;
};

export default function BookDescription({ visible, onClose, book, onReadNow }: BookDescriptionProps) {
  const colors = useThemeColors();
  const bookDetails = getBookDetails(book.name);
  
  // Parallax animation values
  const scrollY = useRef(new Animated.Value(0)).current;

  console.log('📖 BookDescription render:', { 
    visible, 
    bookName: book.name,
    usingRegularText: true,
    fontNames: ['Outfit_700Bold', 'Outfit_400Regular', 'Silkscreen-Regular'],
    testFont: 'Testing font application...'
  });

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
      <Text style={[styles.ratingBarText, { color: colors.text, fontFamily: 'Outfit_400Regular' }]}>{starCount}</Text>
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
            <Text style={[styles.headerTitle, { color: colors.text, fontFamily: 'Outfit_700Bold' }]}>Book Details</Text>
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
            <Text style={[styles.bookTitle, { color: colors.text, fontFamily: 'Outfit_700Bold' }]}>{bookDetails.title}</Text>
            <Text style={[styles.bookAuthor, { color: colors.textSecondary, fontFamily: 'Silkscreen-Regular' }]}>by {bookDetails.author}</Text>
            <View style={[styles.genreTag, { backgroundColor: `${colors.tint}20` }]}>
              <Text style={[styles.genreText, { color: colors.tint, fontFamily: 'Outfit_400Regular' }]}>{bookDetails.genre}</Text>
            </View>
          </Animated.View>

          {/* Synopsis Section */}
          <View style={styles.synopsisSection}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Outfit_700Bold' }]}>Synopsis</Text>
            <Text style={[styles.synopsisText, { color: colors.textSecondary, fontFamily: 'Outfit_400Regular' }]}>
              {bookDetails.synopsis}
            </Text>
          </View>

          {/* Ratings Section */}
          <View style={[styles.ratingsSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Outfit_700Bold' }]}>Ratings</Text>
            <View style={styles.ratingsContent}>
              <View style={styles.ratingLeft}>
                <Text style={[styles.ratingNumber, { color: colors.tint, fontFamily: 'Outfit_700Bold' }]}>{bookDetails.rating}</Text>
                <View style={styles.starsContainer}>
                  {renderStars(bookDetails.rating)}
                </View>
                <Text style={[styles.reviewCount, { color: colors.textSecondary, fontFamily: 'Outfit_400Regular' }]}>
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

          {/* Action Buttons */}
          <View style={styles.actionButtonsSection}>
            <TouchableOpacity 
              style={[styles.readNowButton, { backgroundColor: colors.tint }]}
              onPress={() => onReadNow(book)}
            >
              <Text style={[styles.readNowText, { fontFamily: 'Outfit_700Bold' }]}>Read Now</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.addToLibraryButton, { borderColor: colors.tint }]}
            >
              <Text style={[styles.addToLibraryText, { color: colors.tint, fontFamily: 'Outfit_700Bold' }]}>Add to Library</Text>
            </TouchableOpacity>
          </View>
        </Animated.ScrollView>
      </View>
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
});
