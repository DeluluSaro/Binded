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
  webViewRef,
  bookData
}) => {
  const colors = useThemeColors();

  const handleViewAllBookmarks = async () => {
    const bookmarks = await BookmarkManager.getBookBookmarks(bookData?.title || 'Unknown Book');
    Alert.alert(
      'Bookmarks',
      bookmarks.length > 0 
        ? `You have ${bookmarks.length} bookmark(s) in this book`
        : 'No bookmarks in this book',
      [{ text: 'OK' }]
    );
  };

  const handleJumpToLastBookmark = async () => {
    const stats = await BookmarkManager.getBookmarkStats(bookData?.title || 'Unknown Book');
    if (stats.lastBookmark) {
      Alert.alert('Jumped to last bookmark!', '', [{ text: 'OK' }]);
    } else {
      Alert.alert('No bookmarks found', '', [{ text: 'OK' }]);
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
    <>
      {/* Bookmark Status Display */}
      <View style={styles.bookmarkStatus}>
        <View style={styles.bookmarkInfo}>
          {hasBookmark ? (
            <>
              <Text style={styles.bookmarkIcon}>🔖</Text>
              <ThemedText style={styles.bookmarkText}>
                Word {bookmarkPosition + 1}
                {bookmarkData && bookmarkData.wordText ? ` "${bookmarkData.wordText}"` : ''}
              </ThemedText>
              <TouchableOpacity
                style={styles.removeBookmarkButton}
                onPress={onRemoveBookmark}
              >
                <ThemedText style={styles.removeBookmarkText}>✕</ThemedText>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.noBookmarkIcon}>📖</Text>
              <ThemedText style={styles.noBookmarkText}>
                Tap any word to set bookmark
              </ThemedText>
            </>
          )}
        </View>
      </View>

      {/* Bookmark Navigation Controls */}
      <View style={styles.bookmarkControls}>
        <TouchableOpacity
          style={[styles.bookmarkNavButton, !hasBookmark && styles.disabledButton]}
          onPress={onMoveBookmarkPrevious}
          disabled={!hasBookmark}
        >
          <ThemedText style={[styles.bookmarkNavText, !hasBookmark && styles.disabledText]}>
            ⬅️ Prev Word
          </ThemedText>
        </TouchableOpacity>
        
        <View style={styles.bookmarkPositionContainer}>
          <TouchableOpacity
            style={styles.bookmarkPositionButton}
            onPress={() => {
              if (webViewRef.current) {
                webViewRef.current.postMessage(JSON.stringify({
                  type: 'getBookmarkPosition'
                }));
              }
            }}
          >
            <ThemedText style={styles.bookmarkPositionText}>
              {hasBookmark 
                ? `📍 ${bookmarkPosition + 1}/${bookmarkData?.totalWords || 0}` 
                : '📍 No Bookmark'
              }
            </ThemedText>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={[styles.bookmarkNavButton, !hasBookmark && styles.disabledButton]}
          onPress={onMoveBookmarkNext}
          disabled={!hasBookmark}
        >
          <ThemedText style={[styles.bookmarkNavText, !hasBookmark && styles.disabledText]}>
            Next Word ➡️
          </ThemedText>
        </TouchableOpacity>
      </View>

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
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={handleViewAllBookmarks}
        >
          <ThemedText style={styles.quickActionText}>📚 View All</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={handleJumpToLastBookmark}
        >
          <ThemedText style={styles.quickActionText}>🔄 Last Bookmark</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={handleClearAllBookmarks}
        >
          <ThemedText style={styles.quickActionText}>🗑️ Clear All</ThemedText>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  // Bookmark Status Styles
  bookmarkStatus: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
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
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
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
    color: '#ff4444',
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
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 20,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  bookmarkNavButton: {
    backgroundColor: '#4CAF50',
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
    color: 'white',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0.5,
  },
  disabledText: {
    color: '#666666',
  },
  bookmarkPositionContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  bookmarkPositionButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FFA500',
  },
  bookmarkPositionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
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
    backgroundColor: '#bdc3c7',
  },
  navButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  navButtonTextDisabled: {
    color: '#95a5a6',
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
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  quickActionButton: {
    backgroundColor: 'rgba(100, 149, 237, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 149, 237, 0.3)',
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6495ED',
    textAlign: 'center',
  },
});
