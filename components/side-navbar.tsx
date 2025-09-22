import { Fonts } from '@/constants/theme';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
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
        style={styles.backdrop}
        onPress={onClose}
        activeOpacity={1}
      />

      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.header}>
          <View style={styles.logoPlaceholder}>
            <Ionicons name="book" size={24} color={Colors.ACCENT_GLOW} />
          </View>
          <Text style={styles.appName}>Binded</Text>
        </View>

        <TouchableOpacity
          style={styles.profileSection}
          onPress={() => {
            router.push('/profile');
            onClose();
          }}
        >
          <Image
            source={{ uri: user?.imageUrl }}
            style={styles.profileImage}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>{user?.fullName}</Text>
            <Text style={styles.profileEmail} numberOfLines={1}>{user?.primaryEmailAddress?.emailAddress}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.menuSection}>
          {menuItems.map((item) => {
            const isActive = activeRoute === item.route;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuItem, isActive && styles.activeMenuItem]}
                onPress={() => {
                  setActiveRoute(item.route);
                  router.push(item.route);
                  onClose();
                }}
              >
                <Ionicons
                  name={item.icon as any}
                  size={22}
                  color={isActive ? Colors.TEXT_PRIMARY : Colors.TEXT_SECONDARY}
                />
                <Text style={[styles.menuText, isActive && styles.activeMenuText]}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.separator} />

        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Your Categories</Text>
          {categories.map((category) => {
             const isSelected = selectedCategory === category.id;
             return (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryItem, isSelected && styles.selectedCategory]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text style={[styles.categoryText, isSelected && styles.selectedCategoryText]} numberOfLines={1}>
                  {category.title}
                </Text>
                <View style={[styles.categoryCount, isSelected && styles.selectedCategoryCount]}>
                  <Text style={[styles.categoryCountText, isSelected && styles.selectedCategoryCountText]}>
                    {category.count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.footer}>
          {bottomMenuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.footerItem}
              onPress={item.title === 'Sign Out' ? handleSignOut : () => {}}
            >
              <Ionicons
                name={item.icon as any}
                size={22}
                color={item.title === 'Sign Out' ? Colors.DANGER : Colors.TEXT_SECONDARY}
              />
              <Text style={[styles.footerText, item.title === 'Sign Out' && styles.signOutText]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

// --- "Midnight Glass" Color Palette ---
const Colors = {
  GRADIENT_START: '#110E1C',
  ACCENT_GLOW:    '#A855F7',
  TEXT_PRIMARY:   '#F0F0F5',
  TEXT_SECONDARY: '#A9A8B3',
  DANGER:         '#FF78B4',
  SURFACE_GLASS:  'rgba(30, 25, 45, 0.8)', // Darker, more saturated glass
  BORDER_GLASS:   'rgba(255, 255, 255, 0.15)',
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: screenWidth * 0.8,
    maxWidth: 320,
    height: screenHeight,
    backgroundColor: Colors.SURFACE_GLASS,
    borderRightWidth: 1,
    borderRightColor: Colors.BORDER_GLASS,
    zIndex: 1000,
    paddingTop: 60,
    paddingBottom: 40,
    // Note: For a true blur, use Expo's <BlurView> component as the background
    // backdropFilter: 'blur(20px)',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    paddingHorizontal: 25,
    marginBottom: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.TEXT_PRIMARY,
    fontFamily: Fonts.heading,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    marginBottom: 25,
    gap: 15,
  },
  profileImage: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    borderWidth: 2,
    borderColor: Colors.ACCENT_GLOW,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.TEXT_PRIMARY,
    fontFamily: Fonts.heading,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.TEXT_SECONDARY,
    fontFamily: Fonts.sans,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.BORDER_GLASS,
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
    backgroundColor: Colors.ACCENT_GLOW,
  },
  menuText: {
    fontSize: 16,
    color: Colors.TEXT_SECONDARY,
    fontFamily: Fonts.sans,
    fontWeight: '500',
  },
  activeMenuText: {
    color: Colors.TEXT_PRIMARY,
    fontWeight: '600',
  },
  categoriesSection: {
    paddingHorizontal: 25,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.TEXT_SECONDARY,
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
    backgroundColor: Colors.ACCENT_GLOW,
  },
  categoryText: {
    fontSize: 15,
    color: Colors.TEXT_SECONDARY,
    fontFamily: Fonts.sans,
    fontWeight: '500',
    flex: 1,
    marginRight: 10,
  },
  selectedCategoryText: {
    color: Colors.TEXT_PRIMARY,
    fontWeight: '700',
  },
  categoryCount: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  selectedCategoryCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  categoryCountText: {
    fontSize: 12,
    color: Colors.TEXT_SECONDARY,
    fontFamily: Fonts.sans,
    fontWeight: '600',
  },
  selectedCategoryCountText: {
    color: Colors.TEXT_PRIMARY,
  },
  footer: {
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderTopColor: Colors.BORDER_GLASS,
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
    color: Colors.TEXT_SECONDARY,
    fontFamily: Fonts.sans,
    fontWeight: '500',
  },
  signOutText: {
    color: Colors.DANGER,
    fontWeight: '600',
  },
});