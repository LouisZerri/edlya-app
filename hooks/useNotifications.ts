import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'edl_notification_ids';

// Durées des rappels
const BROUILLON_DELAY_SECONDS = 48 * 60 * 60; // 48h
const TERMINE_DELAY_SECONDS = 24 * 60 * 60; // 24h

// --- Stockage des identifiants de notifications ---

async function getStoredIds(): Promise<Record<string, string[]>> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : {};
}

async function storeNotificationId(edlId: string, notificationId: string): Promise<void> {
  const stored = await getStoredIds();
  const existing = stored[edlId] || [];
  stored[edlId] = [...existing, notificationId];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

async function removeStoredIds(edlId: string): Promise<string[]> {
  const stored = await getStoredIds();
  const ids = stored[edlId] || [];
  delete stored[edlId];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  return ids;
}

// --- Fonctions publiques ---

export async function initializeNotifications(): Promise<void> {
  // Configure le comportement quand une notif arrive en foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  // Demande la permission
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('edl-reminders', {
      name: 'Rappels EDL',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus !== 'granted') {
    await Notifications.requestPermissionsAsync();
  }
}

export async function scheduleBrouillonReminder(edlId: string, logementNom: string): Promise<void> {
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'EDL en attente',
      body: `N'oubliez pas de terminer l'EDL de ${logementNom}`,
      data: { edlId },
      ...(Platform.OS === 'android' && { channelId: 'edl-reminders' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: BROUILLON_DELAY_SECONDS,
    },
  });

  await storeNotificationId(edlId, notificationId);
}

export async function scheduleTermineReminder(edlId: string, logementNom: string): Promise<void> {
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Signature en attente',
      body: `L'EDL de ${logementNom} est prêt, pensez à le faire signer`,
      data: { edlId },
      ...(Platform.OS === 'android' && { channelId: 'edl-reminders' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: TERMINE_DELAY_SECONDS,
    },
  });

  await storeNotificationId(edlId, notificationId);
}

export async function cancelEdlReminders(edlId: string): Promise<void> {
  const ids = await removeStoredIds(edlId);
  for (const notifId of ids) {
    await Notifications.cancelScheduledNotificationAsync(notifId);
  }
}

// --- Hook pour la navigation au tap ---

export function useNotificationNavigation(): void {
  const router = useRouter();
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const edlId = response.notification.request.content.data?.edlId;
      if (edlId) {
        router.push(`/edl/${edlId}`);
      }
    });

    return () => {
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [router]);
}
