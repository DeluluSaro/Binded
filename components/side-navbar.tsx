import { Fonts } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-color';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
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
  { id: '1', title: 'Home', icon: 'home-outline', route: '/home' },
  { id: '2', title: 'Library', icon: 'library-outline', route: '/library' },
  { id: '3', title: 'Favorites', icon: 'heart-outline', route: '/favorites' },
  { id: '4', title: 'History', icon: 'time-outline', route: '/history' },
];

const categories = [
  { id: '1', title: 'Fiction', count: 24 },
  { id: '2', title: 'Non-Fiction', count: 18 },
  { id: '3', title: 'Biography', count: 12 },
  { id: '4', title: 'Science Fiction', count: 8 },
];

const bottomMenuItems = [
  { id: '6', title: 'Settings', icon: 'settings-outline' },
  { id: '7', title: 'Help & Support', icon: 'help-circle-outline' },
  { id: '8', title: 'Sign Out', icon: 'log-out-outline' },
];

export default function SideNavbar({ isOpen, onClose }: SideNavbarProps) {
  const { user } = useUser();
  const { signOut } = useAuth(); // From Clerk
  const router = useRouter();
  const [activeRoute, setActiveRoute] = useState('/home');
  const [selectedCategory, setSelectedCategory] = useState('1');
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

  // Early exit if not even starting to open
  if (!isOpen && slideAnim._value === -screenWidth) return null;

  const handleSignOut = () => {
    onClose();
    // Consider adding a confirmation modal here for better UX
    signOut();
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
        
        <View style={styles.content}>
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={styles.headerLeft}>
                  <View style={[styles.logoPlaceholder, { backgroundColor: colors.tint }]}>
                    <Ionicons name="book" size={24} color={colors.text} />
                  </View>
                  <Text style={{ fontFamily: 'Silkscreen-Regular', fontSize: 24, fontWeight: 'normal', color: colors.text }}>Binded</Text>
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
              <Text style={[styles.profileName, { color: colors.text }]} numberOfLines={1}>{user?.fullName}</Text>
              <Text style={[styles.profileEmail, { color: colors.textSecondary }]} numberOfLines={1}>{user?.primaryEmailAddress?.emailAddress}</Text>
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
                  onPress={() => {
                    setActiveRoute(item.route);
                    router.push(item.route);
                    onClose();
                  }}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={22}
                    color={isActive ? colors.text : colors.icon}
                  />
                  <Text style={[
                    styles.menuText, 
                    { color: isActive ? colors.text : colors.textSecondary },
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
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Your Categories</Text>
            {categories.map((category) => {
               const isSelected = selectedCategory === category.id;
               return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryItem, 
                    { backgroundColor: isSelected ? colors.tint : 'transparent' },
                    isSelected && styles.selectedCategory
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Text style={[
                    styles.categoryText, 
                    { color: isSelected ? colors.text : colors.textSecondary },
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
                      { color: isSelected ? colors.text : colors.textSecondary },
                      isSelected && styles.selectedCategoryCountText
                    ]}>
                      {category.count}
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
                  { color: item.title === 'Sign Out' ? colors.error : colors.textSecondary },
                  item.title === 'Sign Out' && styles.signOutText
                ]}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
    paddingTop: 60,
    paddingBottom: 40,
    position: 'relative',
    zIndex: 1,
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
    fontFamily: Fonts.heading,
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
    fontFamily: Fonts.heading,
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: Fonts.sans,
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
    fontFamily: Fonts.sans,
    fontWeight: '500',
  },
  activeMenuText: {
    fontWeight: '600',
  },
  categoriesSection: {
    paddingHorizontal: 25,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Fonts.heading,
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    fontFamily: Fonts.sans,
    fontWeight: '500',
    flex: 1,
    marginRight: 10,
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
    fontFamily: Fonts.sans,
    fontWeight: '600',
  },
  selectedCategoryCountText: {
    // Selected state handled dynamically
  },
  footer: {
    paddingHorizontal: 15,
    borderTopWidth: 1,
    paddingTop: 15,
    marginTop: 15,
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
    fontFamily: Fonts.sans,
    fontWeight: '500',
  },
  signOutText: {
    fontWeight: '600',
  },
});