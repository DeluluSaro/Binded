import { useThemeColors } from '@/hooks/use-theme-color';
import { useFonts } from 'expo-font';
import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface WordPopupProps {
  visible: boolean;
  selectedWord: string;
  position: { x: number; y: number };
  onClose: () => void;
  onCopy: () => void;
  onHighlight: () => void;
  onBookmark: () => void;
  onSearch: () => void;
}

const WordPopup: React.FC<WordPopupProps> = ({
  visible,
  selectedWord,
  position,
  onClose,
  onCopy,
  onHighlight,
  onBookmark,
  onSearch,
}) => {
  const colors = useThemeColors();
  
  // Load Outfit font
  const [fontsLoaded] = useFonts({
    'Outfit-Regular': require('@/assets/fonts/Outfit-Regular.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.popupOverlay} 
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.wordPopup, { 
          backgroundColor: colors.surface,
          borderColor: colors.border,
          left: position.x - 100,
          top: position.y - 60
        }]}>
          <View style={styles.popupActions}>
            <TouchableOpacity 
              style={[styles.popupButton, { backgroundColor: colors.tint }]}
              onPress={onCopy}
            >
              <Text style={styles.popupButtonText}>Copy</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.popupButton, { backgroundColor: colors.tint }]}
              onPress={onHighlight}
            >
              <Text style={styles.popupButtonText}>Highlight</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.popupButton, { backgroundColor: colors.tint }]}
              onPress={onBookmark}
            >
              <Text style={styles.popupButtonText}>Bookmark</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.popupButton, { backgroundColor: colors.tint }]}
              onPress={onSearch}
            >
              <Text style={styles.popupButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wordPopup: {
    position: 'absolute',
    minWidth: 250,
    maxWidth: 300,
    borderRadius: 15,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  popupActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    justifyContent: 'space-between',
  },
  popupButton: {
    flex: 1,
    margin: 4,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 70,
    maxWidth: 80,
  },
  popupButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'Outfit-Regular',
    textAlign: 'center',
  },
});

export default WordPopup;
