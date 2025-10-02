import { useState } from 'react';

interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

interface AlertOptions {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  buttons?: AlertButton[];
}

export const useCustomAlert = () => {
  const [alertConfig, setAlertConfig] = useState<AlertOptions & { visible: boolean }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    buttons: [],
  });

  const showAlert = (options: AlertOptions) => {
    setAlertConfig({
      ...options,
      visible: true,
      buttons: options.buttons || [{ text: 'OK', style: 'default' }],
    });
  };

  const hideAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };

  // Convenience methods
  const showSuccess = (title: string, message: string, buttons?: AlertButton[]) => {
    showAlert({ title, message, type: 'success', buttons });
  };

  const showError = (title: string, message: string, buttons?: AlertButton[]) => {
    showAlert({ title, message, type: 'error', buttons });
  };

  const showWarning = (title: string, message: string, buttons?: AlertButton[]) => {
    showAlert({ title, message, type: 'warning', buttons });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) => {
    showAlert({
      title,
      message,
      type: 'warning',
      buttons: [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: onCancel,
        },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: onConfirm,
        },
      ],
    });
  };

  return {
    alertConfig,
    showAlert,
    hideAlert,
    showSuccess,
    showError,
    showWarning,
    showConfirm,
  };
};

