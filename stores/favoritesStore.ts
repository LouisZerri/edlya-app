import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'pinned_logements';

interface FavoritesState {
  pinnedIds: Set<string>;
  isLoaded: boolean;
  initialize: () => Promise<void>;
  toggle: (id: string) => void;
  isPinned: (id: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  pinnedIds: new Set(),
  isLoaded: false,

  initialize: async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        set({ pinnedIds: new Set(JSON.parse(data)), isLoaded: true });
      } else {
        set({ isLoaded: true });
      }
    } catch {
      set({ isLoaded: true });
    }
  },

  toggle: (id: string) => {
    const { pinnedIds } = get();
    const next = new Set(pinnedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    set({ pinnedIds: next });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...next])).catch((err) => {
      if (__DEV__) console.warn('[FavoritesStore] Failed to persist pins:', err);
    });
  },

  isPinned: (id: string) => {
    return get().pinnedIds.has(id);
  },
}));
