import { useThemeColors } from '@/hooks/use-theme-color';
import { firestoreService } from '@/services/firestoreService';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { usePathname, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import ThemeToggle from './theme-toggle';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface SideNavbarProps {
  isOpen: boolean;
  onClose: () => void;
}

// --- Data (Unchanged) ---
const menuItems = [
  { id: '1', title: 'Home', icon: 'home-outline', route: '/(tabs)' },
  { id: '2', title: 'Explore', icon: 'compass-outline', route: '/(tabs)/explore' },
  { id: '3', title: 'Favorites', icon: 'heart-outline', route: '/(tabs)/favorites' },
  { id: '4', title: 'Profile', icon: 'person-outline', route: '/(tabs)/profile' },
];

const categories = [
  { id: 'all', title: 'All Books', route: '/category/all' },
  { id: 'fiction', title: 'Fiction', route: '/category/fiction' },
  { id: 'non-fiction', title: 'Non-Fiction', route: '/category/non-fiction' },
  { id: 'biography', title: 'Biography', route: '/category/biography' },
  { id: 'science-fiction', title: 'Science Fiction', route: '/category/science-fiction' },
  { id: 'motivation', title: 'Motivation', route: '/category/motivation' },
  { id: 'self-help', title: 'Self Help', route: '/category/self-help' },
];

const bottomMenuItems = [
  { id: '6', title: 'Settings', icon: 'settings-outline' },
  { id: '7', title: 'Help & Support', icon: 'help-circle-outline' },
  { id: '8', title: 'Sign Out', icon: 'log-out-outline' },
];

export default function SideNavbar({ isOpen, onClose }: SideNavbarProps) {
  // Always call hooks at the top level
  const userData = useUser();
  const auth = useAuth();
  
  // Safely get Clerk auth - might not be available if Clerk is not configured
  const user = userData?.user ?? null;
  const signOut = auth?.signOut ?? (() => {});
  const router = useRouter();
  const pathname = usePathname();
  const [activeRoute, setActiveRoute] = useState('/(tabs)');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const colors = useThemeColors();

  // --- Animation Setup ---
  const slideAnim = useRef(new Animated.Value(-screenWidth)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? 0 : -screenWidth,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [isOpen, slideAnim]);

  // Update active route based on current pathname
  useEffect(() => {
    console.log('📍 Current pathname:', pathname);
    
    // Map pathname to menu routes
    if (pathname === '/' || pathname === '/(tabs)') {
      setActiveRoute('/(tabs)');
    } else if (pathname === '/(tabs)/favorites') {
      setActiveRoute('/(tabs)/favorites');
    } else if (pathname === '/(tabs)/explore') {
      setActiveRoute('/(tabs)/explore');
    } else if (pathname === '/(tabs)/profile') {
      setActiveRoute('/(tabs)/profile');
    } else if (pathname.startsWith('/category/')) {
      // Handle category pages
      const categoryId = pathname.split('/category/')[1];
      setSelectedCategory(categoryId || 'all');
    } else {
      // For other routes, try to match with menu items
      const matchingItem = menuItems.find(item => 
        pathname === item.route || pathname.startsWith(item.route)
      );
      if (matchingItem) {
        setActiveRoute(matchingItem.route);
      }
    }
  }, [pathname]);

  // Load category counts from Firebase
  useEffect(() => {
    const loadCategoryCounts = async () => {
      try {
        setLoading(true);
        const books = await firestoreService.getAllBooks();
        
        const counts: Record<string, number> = {};
        
        // Count all books
        counts['all'] = books.length;
        
        // Count books by genre
        books.forEach(book => {
          if (book.genre) {
            const genre = book.genre.toLowerCase();
            counts[genre] = (counts[genre] || 0) + 1;
          }
        });
        
        setCategoryCounts(counts);
      } catch (error) {
        console.error('Error loading category counts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCategoryCounts();
  }, []);

  // Early exit if not even starting to open
  if (!isOpen) return null;

  const handleSignOut = () => {
    onClose();
    // Consider adding a confirmation modal here for better UX
    signOut();
  };

  const handleMenuItemPress = (item: any) => {
    console.log('🏠 Navigating to:', item.route, 'Title:', item.title);
    
    // Navigate to the route (activeRoute will be updated by useEffect)
    router.push(item.route as any);
    onClose();
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={isOpen ? 'auto' : 'none'}>
      <TouchableOpacity
        style={[styles.backdrop, { backgroundColor: colors.shadow }]}
        onPress={onClose}
        activeOpacity={1}
      />

      <Animated.View style={[
        styles.sidebar, 
        { 
          transform: [{ translateX: slideAnim }],
          borderRightColor: colors.borderAccent,
        }
      ]}>
        <BlurView
          intensity={100}
          tint={colors.background === '#010101' ? 'dark' : 'light'}
          style={StyleSheet.absoluteFillObject}
        />
        <LinearGradient
          colors={[
            `${colors.surface}40`,
            `${colors.surfaceSecondary}30`,
            `${colors.surface}50`,
          ]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.logoPlaceholder, { backgroundColor: colors.tint }]}>
                <Ionicons name="book" size={24} color={colors.text} />
              </View>
              <Text style={{ fontSize: 24, fontWeight: 'normal', color: colors.text, fontFamily: 'Outfit-Regular' }}>Kink</Text>
            </View>
            <ThemeToggle size="small" />
          </View>

          <TouchableOpacity
            style={[styles.profileSection, { backgroundColor: colors.surfaceSecondary }]}
            onPress={() => {
              router.push('/profile');
              onClose();
            }}
          >
            <Image
              source={{ uri: user?.imageUrl }}
              style={[styles.profileImage, { borderColor: colors.tint }]}
            />
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text, fontFamily: 'Outfit-Regular' }]} numberOfLines={1}>{user?.fullName}</Text>
              <Text style={[styles.profileEmail, { color: colors.textSecondary, fontFamily: 'Outfit-Regular' }]} numberOfLines={1}>{user?.primaryEmailAddress?.emailAddress}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.menuSection}>
            {menuItems.map((item) => {
              const isActive = activeRoute === item.route;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem, 
                    { backgroundColor: isActive ? colors.tint : 'transparent' },
                    isActive && styles.activeMenuItem
                  ]}
                  onPress={() => handleMenuItemPress(item)}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={22}
                    color={isActive ? colors.text : colors.icon}
                  />
                  <Text style={[
                    styles.menuText, 
                    { color: isActive ? colors.text : colors.textSecondary, fontFamily: 'Outfit-Regular' },
                    isActive && styles.activeMenuText
                  ]}>
                    {item.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[styles.separator, { backgroundColor: colors.border }]} />

          <View style={styles.categoriesSection}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontFamily: 'Outfit-Regular' }]}>Categories</Text>
            {categories.map((category) => {
               const isSelected = selectedCategory === category.id;
               const count = categoryCounts[category.id] || 0;
               return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryItem, 
                    { backgroundColor: isSelected ? colors.tint : 'transparent' },
                    isSelected && styles.selectedCategory
                  ]}
                  onPress={() => {
                    router.push(category.route as any);
                    onClose();
                  }}
                >
                  <Text style={[
                    styles.categoryText, 
                    { color: isSelected ? colors.text : colors.textSecondary, fontFamily: 'Outfit-Regular' },
                    isSelected && styles.selectedCategoryText
                  ]} numberOfLines={1}>
                    {category.title}
                  </Text>
                  <View style={[
                    styles.categoryCount, 
                    { backgroundColor: isSelected ? colors.surfaceSecondary : colors.surface },
                    isSelected && styles.selectedCategoryCount
                  ]}>
                    <Text style={[
                      styles.categoryCountText, 
                      { color: isSelected ? colors.text : colors.textSecondary, fontFamily: 'Outfit-Regular' },
                      isSelected && styles.selectedCategoryCountText
                    ]}>
                      {loading ? '...' : count}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            {bottomMenuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.footerItem}
                onPress={item.title === 'Sign Out' ? handleSignOut : () => {}}
              >
                <Ionicons
                  name={item.icon as any}
                  size={22}
                  color={item.title === 'Sign Out' ? colors.error : colors.icon}
                />
                <Text style={[
                  styles.footerText, 
                  { color: item.title === 'Sign Out' ? colors.error : colors.textSecondary, fontFamily: 'Outfit-Regular' },
                  item.title === 'Sign Out' && styles.signOutText
                ]}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

// Premium glass morphism sidebar with theme support

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: screenWidth * 0.8,
    maxWidth: 320,
    height: screenHeight,
    borderRightWidth: 1,
    zIndex: 1000,
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  content: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 40,
    minHeight: screenHeight - 100,
  },
  header: {
    paddingHorizontal: 25,
    marginBottom: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Outfit-Regular',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    marginBottom: 25,
    gap: 15,
    borderRadius: 16,
    paddingVertical: 15,
  },
  profileImage: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    borderWidth: 2,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Outfit-Regular',
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
  },
  separator: {
    height: 1,
    marginHorizontal: 25,
    marginVertical: 15,
  },
  menuSection: {
    paddingHorizontal: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginBottom: 5,
    gap: 20,
  },
  activeMenuItem: {
    // Active state handled dynamically
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Outfit-Regular',
  },
  activeMenuText: {
    fontWeight: '600',
  },
  categoriesSection: {
    paddingHorizontal: 25,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'Outfit-Regular',
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 8,
  },
  selectedCategory: {
    // Selected state handled dynamically
  },
  categoryText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    marginRight: 10,
    fontFamily: 'Outfit-Regular',
  },
  selectedCategoryText: {
    fontWeight: '700',
  },
  categoryCount: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  selectedCategoryCount: {
    // Selected state handled dynamically
  },
  categoryCountText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Outfit-Regular',
  },
  selectedCategoryCountText: {
    // Selected state handled dynamically
  },
  footer: {
    paddingHorizontal: 15,
    borderTopWidth: 1,
    paddingTop: 15,
    marginTop: 20,
    marginBottom: 20,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    gap: 20,
    borderRadius: 12,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Outfit-Regular',
  },
  signOutText: {
    fontWeight: '600',
  },
});