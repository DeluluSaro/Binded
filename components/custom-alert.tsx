import { useThemeColors } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  buttons?: Array<{
    text: string;
    style?: 'default' | 'cancel' | 'destructive';
    onPress?: () => void;
  }>;
  onClose?: () => void;
}

export default function CustomAlert({
  visible,
  title,
  message,
  type = 'info',
  buttons = [{ text: 'OK', onPress: () => {} }],
  onClose,
}: CustomAlertProps) {
  const colors = useThemeColors();
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getIconName = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'warning':
        return 'warning';
      default:
        return 'information-circle';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#F44336';
      case 'warning':
        return '#FF9800';
      default:
        return colors.tint;
    }
  };

  const handleButtonPress = (button: any) => {
    if (button.onPress) {
      button.onPress();
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: opacityAnim,
          },
        ]}
      >
        <BlurView
          intensity={20}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
        />
        
        <Animated.View
          style={[
            styles.alertContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: getIconColor() + '20' }]}>
            <Ionicons
              name={getIconName() as any}
              size={32}
              color={getIconColor()}
            />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text, fontFamily: 'Outfit_700Bold' }]}>
            {title}
          </Text>

          {/* Message */}
          <Text style={[styles.message, { color: colors.textSecondary, fontFamily: 'Outfit_400Regular' }]}>
            {message}
          </Text>

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  button.style === 'destructive' && styles.destructiveButton,
                  button.style === 'cancel' && { backgroundColor: colors.surfaceSecondary },
                  button.style === 'default' && { backgroundColor: colors.tint },
                  buttons.length === 1 && styles.singleButton,
                ]}
                onPress={() => handleButtonPress(button)}
              >
                <Text
                  style={[
                    styles.buttonText,
                    { fontFamily: 'Outfit_700Bold' },
                    button.style === 'destructive' && styles.destructiveButtonText,
                    button.style === 'cancel' && { color: colors.text },
                    button.style === 'default' && { color: 'white' },
                  ]}
                >
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  alertContainer: {
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  buttonsContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  singleButton: {
    minWidth: 120,
  },
  destructiveButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    fontSize: 16,
  },
  destructiveButtonText: {
    color: 'white',
  },
});

