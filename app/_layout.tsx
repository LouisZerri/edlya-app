import { useEffect } from 'react';
import { View, ActivityIndicator, Image } from 'react-native';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ApolloProvider } from '@apollo/client/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { apolloClient } from '../graphql/client';
import { useAuthStore } from '../stores/authStore';
import { ToastContainer } from '../components/ui';
import { COLORS } from '../utils/constants';
import '../global.css';

function useProtectedRoute() {
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    // Attendre que la navigation soit prête
    if (!navigationState?.key) return;
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Pas connecté et pas sur une page auth → rediriger vers login
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Connecté mais sur une page auth → rediriger vers accueil
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments, navigationState?.key]);
}

function LoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
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

export default function RootLayout() {
  const initialize = useAuthStore(state => state.initialize);
  const isLoading = useAuthStore(state => state.isLoading);

  useEffect(() => {
    initialize();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <LoadingScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <ApolloProvider client={apolloClient}>
      <SafeAreaProvider>
        <View className="flex-1">
          <StatusBar style="dark" />
          <RootLayoutNav />
          <ToastContainer />
        </View>
      </SafeAreaProvider>
    </ApolloProvider>
  );
}
