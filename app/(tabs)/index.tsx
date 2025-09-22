import SideNavbar from '@/components/side-navbar';
import { Fonts } from '@/constants/theme';
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
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// --- Mock Data (Unchanged) ---
const mockBooks = [
  { id: '1', title: 'Normal People', author: 'Sally Rooney', cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop', progress: 0.6 },
  { id: '2', title: 'Small Pleasures', author: 'Clare Chambers', cover: 'https://images.unsplash.com/photo-1592453729249-0524673549a1?w=300&h=400&fit=crop', progress: 0.3 },
  { id: '3', title: 'Where the Crawdads Sing', author: 'Delia Owens', cover: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop', progress: 0.8 },
  { id: '4', title: 'The Midnight Library', author: 'Matt Haig', cover: 'https://images.unsplash.com/photo-15128207908_03-83ca734da794?w=300&h=400&fit=crop', progress: 0.4 },
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

  if (isLoaded && !isSignedIn) return <Redirect href="/sign-in" />;
  if (!isLoaded) return <View style={styles.loadingContainer}><Text style={{ color: 'white' }}>Loading...</Text></View>;

  const lastReadBook = mockBooks[0]; // For the hero component

  const renderBookCard = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.bookCard}>
      <Image source={{ uri: item.cover }} style={styles.bookCover} contentFit="cover" />
      <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.bookAuthor} numberOfLines={1}>{item.author}</Text>
    </TouchableOpacity>
  );

  const renderCategory = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.categoryChip}>
      <Ionicons name={item.icon as any} size={16} color={Colors.TEXT_SECONDARY} />
      <Text style={styles.chipText}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderAuthor = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.authorCard}>
      <Image source={{ uri: item.image }} style={styles.authorImage} />
      <Text style={styles.authorName}>{item.name}</Text>
      <Text style={styles.authorBooksCount}>{item.booksCount} books</Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={[Colors.GRADIENT_START, Colors.GRADIENT_MID, Colors.GRADIENT_END]}
      style={styles.container}
    >
      <SideNavbar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* --- Header --- */}
        <View style={styles.header}>
            <TouchableOpacity style={styles.menuButton} onPress={() => setIsSidebarOpen(true)}>
                <Ionicons name="menu" size={30} color={Colors.TEXT_PRIMARY} />
            </TouchableOpacity>
            <View>
                <Text style={styles.greeting}>Hello {user?.firstName || 'Reader'}</Text>
                <Text style={styles.subGreeting}>Ready to dive in?</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/profile')}>
                <Image source={{ uri: user?.imageUrl }} style={styles.profileImage} />
            </TouchableOpacity>
        </View>

        {/* --- Spotlight Hero Section --- */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Continue Reading</Text>
            <TouchableOpacity style={styles.spotlightCard}>
                <Image source={{ uri: lastReadBook.cover }} style={styles.spotlightCover} />
                <View style={styles.spotlightInfo}>
                    <Text style={styles.spotlightTitle} numberOfLines={2}>{lastReadBook.title}</Text>
                    <Text style={styles.spotlightAuthor} numberOfLines={1}>{lastReadBook.author}</Text>
                    <View style={styles.spotlightProgressWrapper}>
                        <View style={styles.progressBarContainer}>
                            <View style={[styles.progressBarFill, { width: `${lastReadBook.progress * 100}%` }]} />
                        </View>
                        <Text style={styles.progressText}>{Math.round(lastReadBook.progress * 100)}%</Text>
                    </View>
                </View>
            </TouchableOpacity>
        </View>

        {/* --- Categories Section --- */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Categories</Text><TouchableOpacity><Text style={styles.seeAllText}>See All</Text></TouchableOpacity></View>
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
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Popular Books</Text><TouchableOpacity><Text style={styles.seeAllText}>See All</Text></TouchableOpacity></View>
          <FlatList
            data={mockBooks.slice(1)} // Start from 2nd book since 1st is in hero
            renderItem={renderBookCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalListContainer}
          />
        </View>
        
        {/* --- Popular Authors Section --- */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Popular Authors</Text><TouchableOpacity><Text style={styles.seeAllText}>See All</Text></TouchableOpacity></View>
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

// --- New "Immersive Spotlight" Color Palette ---
const Colors = {
  GRADIENT_START: '#020024',
  GRADIENT_MID:   '#090979',
  GRADIENT_END:   '#00D4FF',
  TEXT_PRIMARY:   '#FFFFFF',
  TEXT_SECONDARY: '#B0B0C0',
  ACCENT_GLOW:    '#00D4FF', // Using the bright cyan for a unique feel
  PURPLE_ACCENT:  '#A855F7',
  SURFACE_GLASS:  'rgba(20, 20, 40, 0.75)',
  BORDER_GLASS:   'rgba(255, 255, 255, 0.15)',
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: Platform.OS === 'ios' ? 70 : 50, paddingBottom: 50 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.GRADIENT_START },
  
  // --- Header ---
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  greeting: { fontSize: 28, fontWeight: 'bold', color: Colors.TEXT_PRIMARY, fontFamily: Fonts.heading },
  subGreeting: { fontSize: 16, color: Colors.TEXT_SECONDARY, fontFamily: Fonts.rounded },
  profileImage: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: Colors.BORDER_GLASS },

  // --- General Section Styling ---
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 20 },
  sectionTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.TEXT_PRIMARY, fontFamily: Fonts.heading, paddingHorizontal: 24 },
  seeAllText: { fontSize: 16, color: Colors.ACCENT_GLOW, fontWeight: '600', fontFamily: Fonts.rounded },
  horizontalListContainer: { paddingHorizontal: 24, gap: 20 },

  // --- Spotlight Hero Card ---
  spotlightCard: {
    backgroundColor: Colors.SURFACE_GLASS,
    borderRadius: 32,
    marginHorizontal: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.BORDER_GLASS,
    shadowColor: Colors.ACCENT_GLOW,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 15,
  },
  spotlightCover: { width: 100, height: 150, borderRadius: 20, marginRight: 16 },
  spotlightInfo: { flex: 1, height: 150, justifyContent: 'space-between', paddingVertical: 4 },
  spotlightTitle: { fontSize: 22, fontWeight: 'bold', color: Colors.TEXT_PRIMARY, fontFamily: Fonts.heading, lineHeight: 28 },
  spotlightAuthor: { fontSize: 16, color: Colors.TEXT_SECONDARY, fontFamily: Fonts.rounded },
  spotlightProgressWrapper: {},
  progressBarContainer: { height: 8, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: Colors.ACCENT_GLOW },
  progressText: { fontSize: 12, color: Colors.TEXT_SECONDARY, fontFamily: Fonts.rounded, fontWeight: '600', alignSelf: 'flex-end', marginTop: 6 },
  
  // --- Category Chip ---
  categoryChip: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chipText: { fontSize: 15, color: Colors.TEXT_SECONDARY, fontWeight: '500', fontFamily: Fonts.rounded },

  // --- Popular Book Card ---
  bookCard: {
    backgroundColor: Colors.SURFACE_GLASS,
    borderRadius: 16,
    width: 150,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.BORDER_GLASS,
  },
  bookCover: { width: '100%', height: 180, borderRadius: 12, marginBottom: 12 },
  bookTitle: { fontSize: 15, fontWeight: '600', color: Colors.TEXT_PRIMARY, fontFamily: Fonts.heading, marginBottom: 4 },
  bookAuthor: { fontSize: 13, color: Colors.TEXT_SECONDARY, fontFamily: Fonts.rounded },
  
  // --- Popular Author Card ---
  authorCard: { alignItems: 'center', gap: 8 },
  authorImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: Colors.BORDER_GLASS },
  authorName: { fontSize: 15, fontWeight: '600', color: Colors.TEXT_PRIMARY, fontFamily: Fonts.heading, textAlign: 'center' },
  authorBooksCount: { fontSize: 13, color: Colors.TEXT_SECONDARY, fontFamily: Fonts.rounded },
});