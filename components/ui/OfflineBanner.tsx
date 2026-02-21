import { useEffect, useState, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WifiOff, RefreshCw, CheckCircle } from 'lucide-react-native';
import { useNetworkStore } from '../../stores/networkStore';
import { usePhotoQueueStore } from '../../stores/photoQueueStore';
import { getQueueLength } from '../../utils/offlineMutationQueue';
import { onSyncProgress } from '../../utils/offlineSyncManager';

type BannerState = 'offline' | 'syncing' | 'synced' | 'hidden';

export function OfflineBanner() {
  const isConnected = useNetworkStore(state => state.isConnected);
  const photoQueueLength = usePhotoQueueStore(state => state.queue.length);
  const insets = useSafeAreaInsets();
  const [mutationCount, setMutationCount] = useState(0);
  const [bannerState, setBannerState] = useState<BannerState>('hidden');
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const spinRef = useRef<Animated.CompositeAnimation | null>(null);

  // Poll mutation queue count when offline
  useEffect(() => {
    if (!isConnected) {
      const check = async () => {
        const count = await getQueueLength();
        setMutationCount(count);
      };
      check();
      const interval = setInterval(check, 5000);
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  // Listen to sync progress
  useEffect(() => {
    return onSyncProgress((remaining) => {
      setMutationCount(remaining);
    });
  }, []);

  // State machine
  useEffect(() => {
    if (!isConnected) {
      setBannerState('offline');
    } else if (bannerState === 'offline' && (mutationCount > 0 || photoQueueLength > 0)) {
      setBannerState('syncing');
    } else if (bannerState === 'syncing' && mutationCount === 0 && photoQueueLength === 0) {
      setBannerState('synced');
      const timer = setTimeout(() => setBannerState('hidden'), 2500);
      return () => clearTimeout(timer);
    } else if (bannerState === 'offline') {
      setBannerState('hidden');
    }
  }, [isConnected, mutationCount, photoQueueLength]);

  // Slide animation
  useEffect(() => {
    const show = bannerState !== 'hidden';
    Animated.spring(slideAnim, {
      toValue: show ? 0 : -80,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [bannerState]);

  // Spin animation for syncing
  useEffect(() => {
    if (bannerState === 'syncing') {
      spinAnim.setValue(0);
      spinRef.current = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        })
      );
      spinRef.current.start();
    } else {
      spinRef.current?.stop();
      spinAnim.setValue(0);
    }
  }, [bannerState]);

  const totalPending = mutationCount + photoQueueLength;

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const bgColor =
    bannerState === 'offline' ? '#F59E0B' :
    bannerState === 'syncing' ? '#3B82F6' :
    '#10B981';

  const message =
    bannerState === 'offline'
      ? totalPending > 0
        ? `Hors ligne — ${totalPending} modification${totalPending > 1 ? 's' : ''} en attente`
        : 'Hors ligne'
      : bannerState === 'syncing'
      ? `Synchronisation en cours... (${totalPending})`
      : 'Données synchronisées !';

  if (bannerState === 'hidden') return null;

  return (
    <Animated.View
      style={{
        backgroundColor: bgColor,
        paddingTop: insets.top + 4,
        paddingBottom: 8,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ translateY: slideAnim }],
      }}
    >
      {bannerState === 'offline' && <WifiOff size={14} color="#fff" />}
      {bannerState === 'syncing' && (
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <RefreshCw size={14} color="#fff" />
        </Animated.View>
      )}
      {bannerState === 'synced' && <CheckCircle size={14} color="#fff" />}
      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '500', marginLeft: 8 }}>
        {message}
      </Text>
    </Animated.View>
  );
}
