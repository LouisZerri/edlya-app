import AsyncStorage from '@react-native-async-storage/async-storage';
import type { InMemoryCache, NormalizedCacheObject } from '@apollo/client/core';

const CACHE_KEY = 'apollo_cache_persist';
let persistTimer: NodeJS.Timeout | null = null;

// Champs sensibles à ne pas persister sur disque
const SENSITIVE_FIELDS = [
  'signatureBailleur',
  'signatureLocataire',
  'locataireEmail',
  'locataireTelephone',
  'locataireNom',
];

function stripSensitiveData(data: NormalizedCacheObject): NormalizedCacheObject {
  const cleaned: NormalizedCacheObject = {};
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === 'object') {
      const entry = { ...value as object } as Record<string, unknown>;
      for (const field of SENSITIVE_FIELDS) {
        delete entry[field];
      }
      cleaned[key] = entry as typeof value;
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

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
      const sanitized = stripSensitiveData(data);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(sanitized));
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
