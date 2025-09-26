import { useThemeColors } from '@/hooks/use-theme-color';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { BookmarkManager } from '../../utils/BookmarkManager';
import { ThemedText } from '../themed-text';

interface EpubReaderNavigationProps {
  currentChapter: number;
  totalChapters: number;
  displayChapter: number;
  isLoadingMore: boolean;
  onPrevious: () => void;
  onNext: () => void;
  hasBookmark: boolean;
  bookmarkPosition: number;
  bookmarkData: any;
  onMoveBookmarkNext: () => void;
  onMoveBookmarkPrevious: () => void;
  onRemoveBookmark: () => void;
  onGoToChapter: (chapterIndex: number) => void;
  webViewRef: React.RefObject<WebView>;
  bookData: any;
}

export const EpubReaderNavigation: React.FC<EpubReaderNavigationProps> = ({
  currentChapter,
  totalChapters,
  displayChapter,
  isLoadingMore,
  onPrevious,
  onNext,
  hasBookmark,
  bookmarkPosition,
  bookmarkData,
  onMoveBookmarkNext,
  onMoveBookmarkPrevious,
  onRemoveBookmark,
  onGoToChapter,
  webViewRef,
  bookData
}) => {
  const colors = useThemeColors();

  const handleViewAllBookmarks = async () => {
    try {
      const bookmarks = await BookmarkManager.getBookBookmarks(bookData?.title || 'Unknown Book');
      
      if (bookmarks.length === 0) {
        Alert.alert('No bookmarks found', 'Set a bookmark by long-pressing any word while reading.', [{ text: 'OK' }]);
        return;
      }

      // Sort bookmarks by chapter index for better organization
      const sortedBookmarks = bookmarks.sort((a, b) => a.chapterIndex - b.chapterIndex);
      
      // Create bookmark options for Alert
      const bookmarkOptions = sortedBookmarks.map((bookmark, index) => ({
        text: `Chapter ${bookmark.chapterIndex + 1}: "${bookmark.wordText || 'Bookmarked word'}"`,
        onPress: () => {
          console.log('🔖 Navigating to bookmark:', bookmark);
          onGoToChapter(bookmark.chapterIndex);
        }
      }));

      // Add cancel option
      bookmarkOptions.push({ text: 'Cancel', onPress: () => {} });

      Alert.alert(
        'All Bookmarks',
        `Choose a bookmark to navigate to (${bookmarks.length} available):`,
        bookmarkOptions
      );
    } catch (error) {
      console.error('❌ Error loading bookmarks:', error);
      Alert.alert('Error', 'Failed to load bookmarks. Please try again.', [{ text: 'OK' }]);
    }
  };

  const handleJumpToLastBookmark = async () => {
    try {
      const stats = await BookmarkManager.getBookmarkStats(bookData?.title || 'Unknown Book');
      if (stats.lastBookmark) {
        const lastBookmarkChapter = stats.lastBookmark.chapterIndex;
        console.log('🔖 Jumping to last bookmark at chapter:', lastBookmarkChapter);
        
        // Navigate to the last bookmark chapter
        onGoToChapter(lastBookmarkChapter);
        
        Alert.alert(
          'Jumped to Last Bookmark!', 
          `Chapter ${lastBookmarkChapter + 1}: "${stats.lastBookmark.wordText || 'Bookmarked word'}"`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('No bookmarks found', 'Set a bookmark by long-pressing any word while reading.', [{ text: 'OK' }]);
      }
    } catch (error) {
      console.error('❌ Error jumping to last bookmark:', error);
      Alert.alert('Error', 'Failed to jump to last bookmark. Please try again.', [{ text: 'OK' }]);
    }
  };

  const handleClearAllBookmarks = async () => {
    Alert.alert(
      'Clear All Bookmarks',
      'Are you sure you want to remove all bookmarks from this book?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            const bookmarks = await BookmarkManager.getBookBookmarks(bookData?.title || 'Unknown Book');
            for (const bookmark of bookmarks) {
              await BookmarkManager.removeBookmark(bookData?.title || 'Unknown Book', bookmark.chapterIndex);
            }
            Alert.alert('All bookmarks cleared!', '', [{ text: 'OK' }]);
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderTopColor: colors.tint }]}>
      {/* Bookmark Status Display - Made more prominent */}
      {/* <View style={[styles.bookmarkStatus, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.bookmarkInfo}>
          {hasBookmark ? (
            <>
              <Text style={styles.bookmarkIcon}>🔖</Text>
              <ThemedText style={[styles.bookmarkText, { color: colors.text }]}>
                Word {bookmarkPosition + 1}
                {bookmarkData && bookmarkData.wordText ? ` "${bookmarkData.wordText}"` : ''}
              </ThemedText>
              <TouchableOpacity
                style={[styles.removeBookmarkButton, { backgroundColor: colors.error }]}
                onPress={onRemoveBookmark}
              >
                <ThemedText style={[styles.removeBookmarkText, { color: colors.text }]}>✕</ThemedText>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.noBookmarkIcon}>📖</Text>
              <ThemedText style={[styles.noBookmarkText, { color: colors.text }]}>
                Tap any word to set bookmark
              </ThemedText>
            </>
          )}
        </View>
      </View>

      {/* Bookmark Navigation Controls */}
      {/* <View style={[styles.bookmarkControls, { backgroundColor: colors.surfaceSecondary }]}>
        <TouchableOpacity
          style={[styles.bookmarkNavButton, { backgroundColor: colors.tint }, !hasBookmark && styles.disabledButton]}
          onPress={onMoveBookmarkPrevious}
          disabled={!hasBookmark}
        >
          <ThemedText style={[styles.bookmarkNavText, { color: colors.text }, !hasBookmark && styles.disabledText]}>
            ⬅️ Prev Word
          </ThemedText>
        </TouchableOpacity>
        
        <View style={styles.bookmarkPositionContainer}>
          <TouchableOpacity
            style={[styles.bookmarkPositionButton, { backgroundColor: colors.tint, borderColor: colors.border }]}
            onPress={() => {
              if (webViewRef.current) {
                webViewRef.current.postMessage(JSON.stringify({
                  type: 'getBookmarkPosition'
                }));
              }
            }}
          >
            <ThemedText style={[styles.bookmarkPositionText, { color: colors.text }]}>
              {hasBookmark 
                ? `📍 ${bookmarkPosition + 1}/${bookmarkData?.totalWords || 0}` 
                : '📍 No Bookmark'
              }
            </ThemedText>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={[styles.bookmarkNavButton, { backgroundColor: colors.tint }, !hasBookmark && styles.disabledButton]}
          onPress={onMoveBookmarkNext}
          disabled={!hasBookmark}
        >
          <ThemedText style={[styles.bookmarkNavText, { color: colors.text }, !hasBookmark && styles.disabledText]}>
            Next Word ➡️
          </ThemedText>
        </TouchableOpacity>
      </View>  */}

      {/* Navigation Container */}
      <View style={[styles.navigationContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        {/* Page Number at Top */}
        <View style={[styles.pageIndicator, { backgroundColor: colors.surfaceSecondary, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16 }]}>
          <ThemedText style={[styles.pageIndicatorText, { color: colors.text }]}>
            Page {displayChapter + 1} of {totalChapters}
          </ThemedText>
        </View>
        
        {/* Navigation Buttons */}
        <View style={styles.navButtonsContainer}>
          <TouchableOpacity
            style={[
              styles.navButton, 
              { backgroundColor: colors.tint },
              currentChapter === 0 && styles.navButtonDisabled
            ]}
            onPress={onPrevious}
            disabled={currentChapter === 0}
          >
            <Text style={[
              styles.navButtonText, 
              currentChapter === 0 && styles.navButtonTextDisabled
            ]}>
              ← Previous
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.navButton, 
              { backgroundColor: colors.tint },
              currentChapter === totalChapters - 1 && styles.navButtonDisabled
            ]}
            onPress={onNext}
            disabled={currentChapter === totalChapters - 1}
          >
            <Text style={[
              styles.navButtonText, 
              currentChapter === totalChapters - 1 && styles.navButtonTextDisabled
            ]}>
              Next →
            </Text>
          </TouchableOpacity>
        </View>
        
        {isLoadingMore && (
          <View style={styles.loadingMoreIndicator}>
            <ThemedText variant="secondary" style={styles.loadingMoreText}>
              Loading more chapters...
            </ThemedText>
          </View>
        )}
      </View>

      {/* Quick Bookmark Actions */}
      <View style={[styles.quickActions, { backgroundColor: colors.surfaceSecondary }]}>
        <TouchableOpacity
          style={[styles.quickActionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={handleViewAllBookmarks}
        >
          <ThemedText style={[styles.quickActionText, { color: colors.tint }]}>📚 View All</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.quickActionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={handleJumpToLastBookmark}
        >
          <ThemedText style={[styles.quickActionText, { color: colors.tint }]}>🔄 Last Bookmark</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.quickActionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={handleClearAllBookmarks}
        >
          <ThemedText style={[styles.quickActionText, { color: colors.tint }]}>🗑️ Clear All</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Container
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderTopWidth: 2,
  },
  // Bookmark Status Styles
  bookmarkStatus: {
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  bookmarkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  bookmarkText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  removeBookmarkButton: {
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  removeBookmarkText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  noBookmarkIcon: {
    fontSize: 18,
    marginRight: 8,
    opacity: 0.6,
  },
  noBookmarkText: {
    fontSize: 14,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  
  // Bookmark Controls Styles
  bookmarkControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
  },
  bookmarkNavButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookmarkNavText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.5,
  },
  bookmarkPositionContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  bookmarkPositionButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 2,
  },
  bookmarkPositionText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  // Navigation Styles
  navigationContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    minHeight: 75,
  },
  navButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  navButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    minWidth: 100,
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  navButtonTextDisabled: {
    opacity: 0.5,
  },
  pageIndicator: {
    alignItems: 'center',
    marginBottom: 8,
    alignSelf: 'center',
  },
  pageIndicatorText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  loadingMoreIndicator: {
    marginTop: 8,
    alignItems: 'center',
  },
  loadingMoreText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  
  // Quick Actions Styles
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 15,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
  },
  quickActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});
