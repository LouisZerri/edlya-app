import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WifiOff } from 'lucide-react-native';
import { useNetworkStore } from '../../stores/networkStore';

export function OfflineBanner() {
  const isConnected = useNetworkStore(state => state.isConnected);
  const insets = useSafeAreaInsets();

  if (isConnected) return null;

  return (
    <View className="bg-amber-500 px-4 pb-2 flex-row items-center justify-center" style={{ paddingTop: insets.top + 4 }}>
      <WifiOff size={14} color="#fff" />
      <Text className="text-white text-xs font-medium ml-2">
        Mode hors ligne — modifications synchronisées au retour du réseau
      </Text>
    </View>
  );
}
