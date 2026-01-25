import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Upload } from 'lucide-react-native';
import { COLORS } from '../../utils/constants';

export function QuickActions() {
  const router = useRouter();

  return (
    <View className="px-4 mt-6">
      <Text className="text-lg font-semibold text-gray-800 mb-3">Actions rapides</Text>

      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={() => router.push('/edl/create')}
          className="flex-1 bg-primary-100 rounded-xl p-4 flex-row items-center"
          activeOpacity={0.7}
        >
          <View className="w-11 h-11 bg-primary-200 rounded-xl items-center justify-center mr-3">
            <Plus size={22} color={COLORS.primary[600]} />
          </View>
          <Text className="text-base text-primary-700 font-semibold">Nouvel EDL</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/import')}
          className="flex-1 bg-amber-100 rounded-xl p-4 flex-row items-center"
          activeOpacity={0.7}
        >
          <View className="w-11 h-11 bg-amber-200 rounded-xl items-center justify-center mr-3">
            <Upload size={22} color={COLORS.amber[600]} />
          </View>
          <Text className="text-base text-amber-700 font-semibold">Importer PDF</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
