import { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, Image } from 'react-native';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { ApolloProvider } from '@apollo/client/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { apolloClient, initializeApollo } from '../graphql/client';
import { useAuthStore } from '../stores/authStore';
import { useNetworkStore } from '../stores/networkStore';
import { useToastStore } from '../stores/toastStore';
import { useThemeStore } from '../stores/themeStore';
import { ToastContainer, OfflineBanner } from '../components/ui';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { processQueue as processMutationQueue } from '../utils/offlineSyncManager';
import { processPhotoQueue } from '../utils/photoSyncManager';
import { getQueueLength } from '../utils/offlineMutationQueue';
import { usePhotoQueueStore } from '../stores/photoQueueStore';
import { COLORS, API_URL } from '../utils/constants';
import '../global.css';

function useProtectedRoute() {
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!navigationState?.key) return;
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments, navigationState?.key]);
}

function LoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-gray-950">
      <View className="items-center">
        <Image
          source={require('../assets/edlya-icon.png')}
          style={{ width: 100, height: 100 }}
          resizeMode="contain"
        />
        <View className="mt-6">
          <ActivityIndicator size="large" color={COLORS.primary[600]} />
        </View>
      </View>
    </View>
  );
}

function RootLayoutNav() {
  useProtectedRoute();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="edl/[id]" />
      <Stack.Screen name="edl/create" />
      <Stack.Screen name="logement/[id]" />
      <Stack.Screen name="logement/create" />
      <Stack.Screen name="import" />
    </Stack>
  );
}

function useOfflineSync() {
  const isConnected = useNetworkStore(state => state.isConnected);
  const wasOffline = useRef(false);

  useEffect(() => {
    if (isConnected && wasOffline.current) {
      // Wait for network to stabilize before syncing
      const timer = setTimeout(async () => {
        // Verify network is actually working before syncing
        try {
          await fetch(`${API_URL}/graphql`, { method: 'HEAD' });
        } catch {
          // Network not ready yet, wait longer
          await new Promise(r => setTimeout(r, 5000));
        }

        try {
          const mutationCount = await getQueueLength();
          const photoCount = usePhotoQueueStore.getState().getQueueLength();

          if (mutationCount > 0 || photoCount > 0) {
            useToastStore.getState().info(`Synchronisation : ${mutationCount} modification(s), ${photoCount} photo(s)...`);

            if (mutationCount > 0) {
              await processMutationQueue();
            }
            if (photoCount > 0) {
              await processPhotoQueue();
            }

            useToastStore.getState().success('Données synchronisées !');
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Erreur inconnue';
          useToastStore.getState().error(`Erreur sync : ${msg}`);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
    wasOffline.current = !isConnected;
  }, [isConnected]);
}

export default function RootLayout() {
  const initialize = useAuthStore(state => state.initialize);
  const isLoading = useAuthStore(state => state.isLoading);
  const [cacheReady, setCacheReady] = useState(false);
  const { colorScheme, setColorScheme } = useColorScheme();
  const themePreference = useThemeStore(state => state.preference);
  const initializeTheme = useThemeStore(state => state.initialize);

  useEffect(() => {
    Promise.all([
      initialize(),
      initializeApollo(),
      initializeTheme(),
    ]).then(() => {
      // Apply saved theme immediately on startup
      const pref = useThemeStore.getState().preference;
      setColorScheme(pref);
      setCacheReady(true);
    });
  }, []);

  // Sync theme preference → NativeWind
  useEffect(() => {
    setColorScheme(themePreference);
  }, [themePreference]);

  // Initialize network listener
  useEffect(() => {
    const unsubscribe = useNetworkStore.getState().initialize();
    return unsubscribe;
  }, []);

  // Sync on reconnect
  useOfflineSync();

  if (isLoading || !cacheReady) {
    return (
      <SafeAreaProvider>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <LoadingScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <ErrorBoundary>
      <ApolloProvider client={apolloClient}>
        <SafeAreaProvider>
          <View className="flex-1 dark:bg-gray-950">
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            <OfflineBanner />
            <RootLayoutNav />
            <ToastContainer />
          </View>
        </SafeAreaProvider>
      </ApolloProvider>
    </ErrorBoundary>
  );
}
