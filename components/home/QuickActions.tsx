import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Plus, Upload } from 'lucide-react-native';
import { COLORS } from '../../utils/constants';

export function QuickActions() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View className="px-4 mt-6">
      <Text className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Actions rapides</Text>

      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={() => router.push('/edl/create')}
          className="flex-1 bg-primary-100 dark:bg-primary-900/30 rounded-xl p-4 flex-row items-center"
          activeOpacity={0.7}
        >
          <View className="w-11 h-11 bg-primary-200 dark:bg-primary-800/50 rounded-xl items-center justify-center mr-3">
            <Plus size={22} color={isDark ? COLORS.gray[300] : COLORS.primary[600]} />
          </View>
          <Text className="text-base text-primary-700 dark:text-primary-300 font-semibold">Nouvel EDL</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/import')}
          className="flex-1 bg-amber-100 dark:bg-amber-900/20 rounded-xl p-4 flex-row items-center"
          activeOpacity={0.7}
        >
          <View className="w-11 h-11 bg-amber-200 dark:bg-amber-800/40 rounded-xl items-center justify-center mr-3">
            <Upload size={22} color={isDark ? COLORS.gray[300] : COLORS.amber[600]} />
          </View>
          <Text className="text-base text-amber-700 dark:text-amber-300 font-semibold">Importer PDF</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
