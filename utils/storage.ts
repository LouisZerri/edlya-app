import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

// Token → SecureStore (chiffré)
export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (err) {
    if (__DEV__) console.warn('[Storage] Failed to get token:', err);
    return null;
  }
}

export async function setToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (err) {
    if (__DEV__) console.warn('[Storage] Failed to set token:', err);
  }
}

export async function removeToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (err) {
    if (__DEV__) console.warn('[Storage] Failed to remove token:', err);
  }
}

// User data → AsyncStorage (pas sensible)
export async function getUser<T>(): Promise<T | null> {
  try {
    const data = await AsyncStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    if (__DEV__) console.warn('[Storage] Failed to get user:', err);
    return null;
  }
}

export async function setUser<T>(user: T): Promise<void> {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (err) {
    if (__DEV__) console.warn('[Storage] Failed to set user:', err);
  }
}

export async function removeUser(): Promise<void> {
  try {
    await AsyncStorage.removeItem(USER_KEY);
  } catch (err) {
    if (__DEV__) console.warn('[Storage] Failed to remove user:', err);
  }
}

export async function clearAuth(): Promise<void> {
  await Promise.all([removeToken(), removeUser()]);
}
