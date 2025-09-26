import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Bookmark {
  chapterIndex: number;
  wordIndex: number;
  wordText: string;
  timestamp: number;
}

interface BookmarkListModalProps {
  visible: boolean;
  onClose: () => void;
  bookmarks: Bookmark[];
  onBookmarkSelect: (bookmark: Bookmark) => void;
}

export const BookmarkListModal: React.FC<BookmarkListModalProps> = ({
  visible,
  onClose,
  bookmarks,
  onBookmarkSelect
}) => {
  const { isDark } = useTheme();

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderBookmarkItem = ({ item, index }: { item: Bookmark; index: number }) => (
    <TouchableOpacity
      style={[
        styles.bookmarkItem,
        {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        }
      ]}
      onPress={() => {
        onBookmarkSelect(item);
        onClose();
      }}
      activeOpacity={0.7}
    >
      <View style={styles.bookmarkContent}>
        <View style={styles.bookmarkHeader}>
          <View style={[styles.chapterBadge, { backgroundColor: '#eb5838' }]}>
            <Text style={styles.chapterText}>Ch. {item.chapterIndex + 1}</Text>
          </View>
          <Text style={[styles.timestamp, { color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }]}>
            {formatDate(item.timestamp)}
          </Text>
        </View>
        
        <Text style={[styles.wordText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          "{item.wordText}"
        </Text>
        
        <View style={styles.bookmarkFooter}>
          <Ionicons 
            name="bookmark" 
            size={16} 
            color={isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'} 
          />
          <Text style={[styles.bookmarkNumber, { color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }]}>
            Bookmark #{index + 1}
          </Text>
        </View>
      </View>
      
      <Ionicons 
        name="chevron-forward" 
        size={20} 
        color={isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'} 
      />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[
          styles.modal,
          {
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
          }
        ]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#eb583820' }]}>
              <Ionicons name="bookmark" size={24} color="#eb5838" />
            </View>
              <View>
                <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                  All Bookmarks
                </Text>
                <Text style={[styles.subtitle, { color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }]}>
                  {bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''} found
                </Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]}
              onPress={onClose}
            >
              <Ionicons name="close" size={20} color={isDark ? '#FFFFFF' : '#000000'} />
            </TouchableOpacity>
          </View>

          {/* Bookmark List */}
          <FlatList
            data={bookmarks}
            renderItem={renderBookmarkItem}
            keyExtractor={(item, index) => `${item.chapterIndex}-${item.wordIndex}-${index}`}
            style={styles.bookmarkList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.bookmarkListContent}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    height: '80%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Outfit_700Bold',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookmarkList: {
    flex: 1,
  },
  bookmarkListContent: {
    padding: 24,
  },
  bookmarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  bookmarkContent: {
    flex: 1,
  },
  bookmarkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chapterBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chapterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Outfit_600SemiBold',
  },
  timestamp: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
  },
  wordText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Outfit_500Medium',
    marginBottom: 8,
    lineHeight: 22,
  },
  bookmarkFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookmarkNumber: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    marginLeft: 6,
  },
});
