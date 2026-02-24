import AsyncStorage from '@react-native-async-storage/async-storage';
import type { InMemoryCache, NormalizedCacheObject } from '@apollo/client/core';

const CACHE_KEY = 'apollo_cache_persist';
let persistTimer: NodeJS.Timeout | null = null;

export async function restoreCache(cache: InMemoryCache): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(CACHE_KEY);
    if (data) {
      const parsed: NormalizedCacheObject = JSON.parse(data);
      cache.restore(parsed);
    }
  } catch (err) {
    if (__DEV__) console.warn('[CachePersistence] Failed to restore cache:', err);
  }
}

export function persistCacheOnWrite(cache: InMemoryCache): void {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(async () => {
    try {
      const data = cache.extract();
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (err) {
      if (__DEV__) console.warn('[CachePersistence] Failed to persist cache:', err);
    }
  }, 1000);
}

export async function clearPersistedCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
  } catch (err) {
    if (__DEV__) console.warn('[CachePersistence] Failed to clear cache:', err);
  }
}
