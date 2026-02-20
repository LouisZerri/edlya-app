import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme-preference';

interface ThemeState {
  preference: ThemePreference;
  initialize: () => Promise<void>;
  setPreference: (pref: ThemePreference) => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  preference: 'system',

  initialize: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        set({ preference: stored });
      }
    } catch {}
  },

  setPreference: async (pref: ThemePreference) => {
    set({ preference: pref });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, pref);
    } catch {}
  },
}));
