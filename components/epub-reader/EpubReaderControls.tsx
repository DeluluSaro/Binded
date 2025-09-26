import { useTheme } from '@/contexts/ThemeContext';
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
  const { toggleTheme, isDark } = useTheme();
  const [isBookmarkDropdownOpen, setIsBookmarkDropdownOpen] = useState(false);
  const [dropdownOpacity] = useState(new Animated.Value(0));
  const [dropdownScale] = useState(new Animated.Value(0.8));

  const handleFontSizeIncrease = () => {
    const newSize = Math.min(24, fontSize + 2);
    console.log(`📝 Increasing font size from ${fontSize}px to ${newSize}px`);
    onFontSizeChange(newSize);
  };

  const toggleBookmarkDropdown = () => {
    const newState = !isBookmarkDropdownOpen;
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
    <View style={[styles.header, { backgroundColor: isDark ? 'rgba(1, 1, 1, 0.8)' : 'rgba(183, 170, 153, 0.8)' }]}>
      {/* Back Button */}
      <TouchableOpacity
        style={[styles.headerButton, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.1)' }]}
        onPress={onClose}
      >
        <Text style={[styles.headerButtonText, { color: isDark ? '#e0e0e0' : '#3a2e24' }]}>←</Text>
      </TouchableOpacity>

      {/* Right Side Controls */}
      <View style={styles.headerRight}>
        {/* Bookmark Dropdown */}
        <View style={styles.bookmarkContainer}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.1)' }]}
            onPress={toggleBookmarkDropdown}
          >
            <Text style={[styles.headerButtonText, { color: isDark ? '#e0e0e0' : '#3a2e24' }]}>🔖</Text>
          </TouchableOpacity>
          
          {/* Bookmark Dropdown */}
          {isBookmarkDropdownOpen && (
            <Animated.View
              style={[
                styles.bookmarkDropdown,
                {
                  backgroundColor: isDark ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)',
                  opacity: dropdownOpacity,
                  transform: [{ scale: dropdownScale }],
                }
              ]}
            >
              
              <TouchableOpacity 
                style={styles.dropdownItem}
                onPress={() => {
                  onViewAllBookmarks?.();
                  setIsBookmarkDropdownOpen(false);
                }}
              >
                <Text style={[styles.dropdownText, { color: isDark ? '#e0e0e0' : '#3a2e24' }]}>View Bookmarks</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.dropdownItem}
                onPress={() => {
                  onGoToLastBookmark?.();
                  setIsBookmarkDropdownOpen(false);
                }}
              >
                <Text style={[styles.dropdownText, { color: isDark ? '#e0e0e0' : '#3a2e24' }]}>Go to Last Bookmark</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.dropdownItem, styles.lastDropdownItem]}
                onPress={() => {
                  onClearAllBookmarks?.();
                  setIsBookmarkDropdownOpen(false);
                }}
              >
                <Text style={[styles.dropdownText, { color: 'red' }]}>Clear Bookmarks</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        {/* Font Size Button */}
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.1)' }]}
          onPress={handleFontSizeIncrease}
        >
          <Text style={[styles.headerButtonText, { color: isDark ? '#e0e0e0' : '#3a2e24' }]}>A+</Text>
        </TouchableOpacity>

        {/* Theme Toggle */}
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.1)' }]}
          onPress={toggleTheme}
        >
          <Text style={[styles.headerButtonText, { color: isDark ? '#e0e0e0' : '#3a2e24' }]}>
            {isDark ? '☀️' : '🌙'}
          </Text>
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
    width: 200,
    borderRadius: 16,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 15,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  lastDropdownItem: {
    borderBottomWidth: 0,
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: 'Outfit_400Regular',
  },
});
