import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ModernModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  options?: Array<{
    text: string;
    onPress: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>;
}

export const ModernModal: React.FC<ModernModalProps> = ({
  visible,
  onClose,
  title,
  message,
  type = 'info',
  options = []
}) => {
  const { isDark } = useTheme();

  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return { icon: 'checkmark-circle', color: '#eb5838' };
      case 'warning':
        return { icon: 'warning', color: '#eb5838' };
      case 'error':
        return { icon: 'close-circle', color: '#ff3b30' };
      default:
        return { icon: 'information-circle', color: '#eb5838' };
    }
  };

  const { icon, color } = getIconAndColor();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[
          styles.modal,
          {
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
          }
        ]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
              <Ionicons name={icon} size={24} color={color} />
            </View>
            <Text style={[
              styles.title,
              { color: isDark ? '#FFFFFF' : '#000000' }
            ]}>
              {title}
            </Text>
          </View>

          {/* Message */}
          {message && (
            <Text style={[
              styles.message,
              { color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)' }
            ]}>
              {message}
            </Text>
          )}

          {/* Options */}
          <View style={styles.optionsContainer}>
            {options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                   {
                     backgroundColor: option.style === 'destructive' 
                       ? '#ff3b30' 
                       : option.style === 'cancel'
                       ? isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                       : isDark ? 'rgba(235, 88, 56, 0.2)' : 'rgba(235, 88, 56, 0.1)',
                     borderColor: option.style === 'destructive' 
                       ? '#ff3b30' 
                       : option.style === 'cancel'
                       ? isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
                       : isDark ? 'rgba(235, 88, 56, 0.3)' : 'rgba(235, 88, 56, 0.2)',
                   }
                ]}
                onPress={() => {
                  option.onPress();
                  onClose();
                }}
                activeOpacity={0.7}
              >
                 <Text style={[
                   styles.optionText,
                   {
                     color: option.style === 'destructive' 
                       ? '#FFFFFF' 
                       : option.style === 'cancel'
                       ? isDark ? '#FFFFFF' : '#000000'
                       : '#eb5838'
                   }
                 ]}>
                  {option.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
    flex: 1,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Outfit_400Regular',
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Outfit_600SemiBold',
  },
});
