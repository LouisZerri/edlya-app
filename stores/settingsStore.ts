import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GPS_ENABLED_KEY = 'gps_photos_enabled';

interface SettingsState {
  gpsEnabled: boolean;
  initialize: () => Promise<void>;
  setGpsEnabled: (enabled: boolean) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  gpsEnabled: true,

  initialize: async () => {
    try {
      const value = await AsyncStorage.getItem(GPS_ENABLED_KEY);
      if (value !== null) {
        set({ gpsEnabled: value === 'true' });
      }
    } catch {
      // Garder la valeur par défaut
    }
  },

  setGpsEnabled: async (enabled: boolean) => {
    set({ gpsEnabled: enabled });
    try {
      await AsyncStorage.setItem(GPS_ENABLED_KEY, enabled.toString());
    } catch {
      // Ignorer
    }
  },
}));
