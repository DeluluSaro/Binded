import { useThemeColors } from '@/hooks/use-theme-color';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import React, { useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface EpubReaderControlsProps {
  currentChapter: number;
  totalChapters: number;
  displayChapter: number;
  progressBarWidth: number;
  isProgressBarPressed: boolean;
  progressBarPanResponder: any;
  fontSize: number;
  onFontSizeChange: (newSize: number) => void;
  onResetToBeginning: () => void;
  onClose: () => void;
  onViewAllBookmarks?: () => void;
  onGoToLastBookmark?: () => void;
  onClearAllBookmarks?: () => void;
  onBookmarkCurrentPage?: () => void;
}

export const EpubReaderControls: React.FC<EpubReaderControlsProps> = ({
  currentChapter,
  totalChapters,
  displayChapter,
  progressBarWidth,
  isProgressBarPressed,
  progressBarPanResponder,
  fontSize,
  onFontSizeChange,
  onResetToBeginning,
  onClose,
  onViewAllBookmarks,
  onGoToLastBookmark,
  onClearAllBookmarks,
  onBookmarkCurrentPage
}) => {
  const colors = useThemeColors();
  const [isBookmarkDropdownOpen, setIsBookmarkDropdownOpen] = useState(false);
  const [dropdownOpacity] = useState(new Animated.Value(0));
  const [dropdownScale] = useState(new Animated.Value(0.8));
  const [iconRotation] = useState(new Animated.Value(0));

  const handleFontSizeIncrease = () => {
    const newSize = Math.min(24, fontSize + 2);
    console.log(`📝 Increasing font size from ${fontSize}px to ${newSize}px`);
    onFontSizeChange(newSize);
  };

  const handleFontSizeDecrease = () => {
    const newSize = Math.max(12, fontSize - 2);
    console.log(`📝 Decreasing font size from ${fontSize}px to ${newSize}px`);
    onFontSizeChange(newSize);
  };

  const spinIcon = (direction: 'right' | 'left') => {
    // Reset rotation to 0
    iconRotation.setValue(0);
    
    // Animate rotation based on direction
    Animated.timing(iconRotation, {
      toValue: direction === 'right' ? 1 : -1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  };

  const toggleBookmarkDropdown = () => {
    const newState = !isBookmarkDropdownOpen;
    
    // Spin the icon based on action
    if (newState) {
      // Opening - spin right
      spinIcon('right');
    } else {
      // Closing - spin left
      spinIcon('left');
    }
    
    setIsBookmarkDropdownOpen(newState);
    
    if (newState) {
      Animated.parallel([
        Animated.timing(dropdownOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(dropdownScale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(dropdownOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(dropdownScale, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  return (
    <View style={[styles.header, { backgroundColor: 'rgba(183, 170, 153, 0.8)' }]}>
      {/* Back Button */}
      <TouchableOpacity
        style={[styles.headerButton, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
        onPress={onClose}
      >
        <Text style={[styles.headerButtonText, { color: '#3a2e24' }]}>←</Text>
      </TouchableOpacity>

      {/* Right Side Controls */}
      <View style={styles.headerRight}>
        {/* Bookmark Dropdown */}
        <View style={styles.bookmarkContainer}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
            onPress={toggleBookmarkDropdown}
          >
            <Animated.View
              style={{
                transform: [{
                  rotate: iconRotation.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: ['-360deg', '0deg', '360deg'],
                  }),
                }],
              }}
            >
              <Ionicons name="cog" size={20} color="#3a2e24" />
            </Animated.View>
          </TouchableOpacity>
          
          {/* Bookmark Dropdown */}
          {isBookmarkDropdownOpen && (
            <Animated.View
              style={[
                styles.bookmarkDropdown,
                {
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  opacity: dropdownOpacity,
                  transform: [{ scale: dropdownScale }],
                }
              ]}
            >
              
              <TouchableOpacity 
                style={[
                  styles.dropdownItem,
                  { backgroundColor: 'rgba(0, 0, 0, 0.03)' }
                ]}
                onPress={() => {
                  onViewAllBookmarks?.();
                  setIsBookmarkDropdownOpen(false);
                }}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="bookmark-outline" 
                  size={18} 
                  color="#3a2e24" 
                  style={{ marginRight: 12 }}
                />
                <Text style={[styles.dropdownText, { color: '#3a2e24' }]}>View Bookmarks</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.dropdownItem,
                  { backgroundColor: 'rgba(0, 0, 0, 0.03)' }
                ]}
                onPress={() => {
                  onGoToLastBookmark?.();
                  setIsBookmarkDropdownOpen(false);
                }}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="arrow-forward-circle-outline" 
                  size={18} 
                  color="#3a2e24" 
                  style={{ marginRight: 12 }}
                />
                <Text style={[styles.dropdownText, { color: '#3a2e24' }]}>Go to Last Bookmark</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.dropdownItem, 
                  styles.lastDropdownItem,
                  { backgroundColor: 'rgba(255, 59, 48, 0.08)' }
                ]}
                onPress={() => {
                  onClearAllBookmarks?.();
                  setIsBookmarkDropdownOpen(false);
                }}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="trash-outline" 
                  size={18} 
                  color="#ff3b30" 
                  style={{ marginRight: 12 }}
                />
                <Text style={[styles.dropdownText, { color: '#ff3b30' }]}>Clear Bookmarks</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        {/* Font Size Buttons */}
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
          onPress={handleFontSizeDecrease}
        >
          <MaterialCommunityIcons 
            name="format-font-size-decrease" 
            size={24} 
            color="#3a2e24" 
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
          onPress={handleFontSizeIncrease}
        >
          <MaterialCommunityIcons 
            name="format-font-size-increase" 
            size={24} 
            color="#3a2e24" 
          />
        </TouchableOpacity>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  headerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
  },
  headerButtonText: {
    fontSize: 18,
    fontWeight: '500',
    fontFamily: 'Outfit_400Regular',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookmarkContainer: {
    position: 'relative',
  },
  bookmarkDropdown: {
    position: 'absolute',
    top: 60,
    right: 0,
    width: 220,
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(20px)',
  },
  dropdownItem: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  lastDropdownItem: {
    marginBottom: 0,
  },
  dropdownText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'Outfit_400Regular',
    letterSpacing: 0.2,
  },
});
