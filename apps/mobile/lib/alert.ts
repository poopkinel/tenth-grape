import { Alert, Platform } from 'react-native';

/**
 * Cross-platform alert. React Native's Alert.alert() silently no-ops on web,
 * so we fall back to window.alert() / window.confirm() in the browser.
 */

type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

export function showAlert(title: string, message?: string, buttons?: AlertButton[]): void {
  if (Platform.OS === 'web') {
    const text = message ? `${title}\n\n${message}` : title;

    // Single OK button (or no buttons supplied): simple alert
    if (!buttons || buttons.length <= 1) {
      if (typeof window !== 'undefined') window.alert(text);
      buttons?.[0]?.onPress?.();
      return;
    }

    // 2+ buttons: use confirm (OK = first non-cancel action, Cancel = cancel action)
    const cancelBtn = buttons.find((b) => b.style === 'cancel');
    const actionBtn = buttons.find((b) => b.style !== 'cancel');
    if (typeof window !== 'undefined') {
      const ok = window.confirm(text);
      if (ok) actionBtn?.onPress?.();
      else cancelBtn?.onPress?.();
    }
    return;
  }

  // Native: delegate to the real Alert
  Alert.alert(title, message, buttons);
}
