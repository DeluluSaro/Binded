import PremiumButton from '@/components/premium-button';
import PremiumGlassContainer from '@/components/premium-glass-container';
import SideNavbar from '@/components/side-navbar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-color';
import { useLongPressTheme } from '@/hooks/use-triple-tap-theme';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, useRouter } from 'expo-router';
import React from 'react';
import {
  FlatList,
  Platform,
  ScrollView,
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


export default function HomeScreen() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const colors = useThemeColors();
  const { handleLongPressStart, handleLongPressEnd } = useLongPressTheme();

  if (isLoaded && !isSignedIn) return <Redirect href="/sign-in" />;
  if (!isLoaded) return (
    <ThemedView style={styles.loadingContainer}>
      <ThemedText style={{ color: colors.text }}>Loading...</ThemedText>
    </ThemedView>
  );

  const lastReadBook = mockBooks[0]; // For the hero component

  const renderBookCard = ({ item }: { item: any }) => (
    <TouchableOpacity style={[styles.bookCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Image source={{ uri: item.cover }} style={styles.bookCover} contentFit="cover" />
      <ThemedText style={styles.bookTitle} numberOfLines={2}>{item.title}</ThemedText>
      <ThemedText variant="secondary" style={styles.bookAuthor} numberOfLines={1}>{item.author}</ThemedText>
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
      <SideNavbar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* --- Header --- */}
        <View style={styles.header}>
            <TouchableOpacity style={styles.menuButton} onPress={() => setIsSidebarOpen(true)}>
                <Ionicons name="menu" size={30} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
                <View style={styles.greetingContainer}>
                    <ThemedText style={styles.greeting}>Hello </ThemedText>
                    <TouchableOpacity 
                        onPressIn={handleLongPressStart} 
                        onPressOut={handleLongPressEnd}
                        activeOpacity={0.7}
                    >
                        <ThemedText style={[styles.greeting, { color: colors.tint }]}>{user?.firstName || 'Reader'}</ThemedText>
                    </TouchableOpacity>
                </View>
                <ThemedText variant="secondary" style={styles.subGreeting}>Ready to dive in?</ThemedText>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={() => router.push('/profile')} style={styles.profileButton}>
                <Image source={{ uri: user?.imageUrl }} style={[styles.profileImage, { borderColor: colors.borderAccent }]} />
              </TouchableOpacity>
            </View>
        </View>

        {/* --- Spotlight Hero Section --- */}
        <View style={styles.section}>
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
        </View>

        {/* --- Categories Section --- */}
        <View style={styles.section}>
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
        </View>

        {/* --- Popular Books Section --- */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Popular Books</ThemedText>
            <TouchableOpacity>
              <ThemedText variant="accent" style={styles.seeAllText}>See All</ThemedText>
            </TouchableOpacity>
          </View>
          <FlatList
            data={mockBooks.slice(1)}
            renderItem={renderBookCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalListContainer}
          />
        </View>
        
        {/* --- Popular Authors Section --- */}
        <View style={styles.section}>
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
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { 
    paddingTop: Platform.OS === 'ios' ? 70 : 50, 
    paddingBottom: 50 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  
  // --- Header ---
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 32,
    minHeight: 50,
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
    fontSize: 28, 
    fontWeight: 'bold', 
    fontFamily: Fonts.heading,
    textAlign: 'center',
  },
  subGreeting: { 
    fontSize: 16, 
    fontFamily: Fonts.rounded,
    textAlign: 'center',
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
    marginBottom: 32 
  },
  // Container for section titles and the "See All" button
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    marginBottom: 20 
  },
  // The title text itself, now without horizontal padding
  sectionTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    fontFamily: Fonts.heading, 
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
    gap: 20 
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
});