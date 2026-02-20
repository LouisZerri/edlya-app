import { View, Text, ActivityIndicator } from 'react-native';
import { Cloud, CloudOff } from 'lucide-react-native';
import { COLORS } from '../../utils/constants';
import { AutoSaveStatus } from '../../hooks/useEdlAutoSave';

interface AutoSaveIndicatorProps {
  status: AutoSaveStatus;
}

export function AutoSaveIndicator({ status }: AutoSaveIndicatorProps) {
  if (status === 'idle') return null;

  return (
    <View className="flex-row items-center justify-center mb-2">
      {status === 'saving' && (
        <View className="flex-row items-center">
          <ActivityIndicator size="small" color={COLORS.primary[500]} />
          <Text className="text-xs text-gray-500 ml-1">Sauvegarde...</Text>
        </View>
      )}
      {status === 'saved' && (
        <View className="flex-row items-center">
          <Cloud size={14} color={COLORS.green[600]} />
          <Text className="text-xs text-green-600 ml-1">Sauvegardé</Text>
        </View>
      )}
      {status === 'queued' && (
        <View className="flex-row items-center">
          <CloudOff size={14} color={COLORS.amber[500]} />
          <Text className="text-xs text-amber-600 ml-1">Sauvegardé localement</Text>
        </View>
      )}
      {status === 'syncing' && (
        <View className="flex-row items-center">
          <ActivityIndicator size="small" color={COLORS.amber[500]} />
          <Text className="text-xs text-amber-600 ml-1">Synchronisation...</Text>
        </View>
      )}
      {status === 'error' && (
        <View className="flex-row items-center">
          <CloudOff size={14} color={COLORS.red[500]} />
          <Text className="text-xs text-red-500 ml-1">Erreur de sauvegarde</Text>
        </View>
      )}
      {status === 'modified' && (
        <Text className="text-xs text-gray-400">Modifications non sauvegardées</Text>
      )}
    </View>
  );
}
