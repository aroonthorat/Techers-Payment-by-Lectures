
/**
 * Utility to communicate with Android Native Features
 * Uses Capacitor plugins if available
 */

export const NativeBridge = {
  // Trigger physical vibration on Android
  hapticFeedback: async (type: 'impact' | 'notification' | 'selection' = 'selection') => {
    try {
      const { Haptics, ImpactStyle } = (window as any).Capacitor?.Plugins || {};
      if (Haptics) {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } else {
        // Web fallback
        window.navigator.vibrate?.(10);
      }
    } catch (e) {
      console.debug('Haptics not supported');
    }
  },

  // Store data securely on Android
  setSecureStorage: async (key: string, value: string) => {
    localStorage.setItem(key, value);
    // In a real Capacitor build, you would use @capacitor/preferences
  },

  // Show Native Toast
  showToast: async (text: string) => {
    try {
      const { Toast } = (window as any).Capacitor?.Plugins || {};
      if (Toast) {
        await Toast.show({ text });
      } else {
        console.log(`[Toast]: ${text}`);
      }
    } catch (e) {}
  }
};
