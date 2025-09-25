import AsyncStorage from '@react-native-async-storage/async-storage';

export class SimpleBookmarkManager {
  static async saveBookmark(bookTitle, chapterIndex, wordIndex, wordText) {
    try {
      const key = `bookmark_${bookTitle}_${chapterIndex}`;
      const bookmark = {
        wordIndex,
        wordText,
        timestamp: new Date().toISOString()
      };
      await AsyncStorage.setItem(key, JSON.stringify(bookmark));
      console.log('✅ Bookmark saved');
      return true;
    } catch (error) {
      console.error('❌ Error saving bookmark:', error);
      return false;
    }
  }

  static async loadBookmark(bookTitle, chapterIndex) {
    try {
      const key = `bookmark_${bookTitle}_${chapterIndex}`;
      const saved = await AsyncStorage.getItem(key);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('❌ Error loading bookmark:', error);
      return null;
    }
  }

  static async removeBookmark(bookTitle, chapterIndex) {
    try {
      const key = `bookmark_${bookTitle}_${chapterIndex}`;
      await AsyncStorage.removeItem(key);
      console.log('🗑️ Bookmark removed');
      return true;
    } catch (error) {
      console.error('❌ Error removing bookmark:', error);
      return false;
    }
  }
}
